-- 1. Tablas principales

-- Tabla de Perfiles de Usuario (se sincroniza con auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Competiciones / Torneos
CREATE TABLE public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Fases de una Competición
CREATE TABLE public.phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    entry_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open_registration', 'active', 'finished')),
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (competition_id, slug)
);

-- Tabla de Inscripciones
CREATE TABLE public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
    stripe_session_id TEXT UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    points_total INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, phase_id)
);

-- Tabla de Partidos
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID REFERENCES public.phases(id) ON DELETE CASCADE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INT,
    away_score INT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')),
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Pronósticos
CREATE TABLE public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    home_prediction INT NOT NULL CHECK (home_prediction >= 0),
    away_prediction INT NOT NULL CHECK (away_prediction >= 0),
    points_earned INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, match_id)
);


-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;


-- 3. Políticas RLS de Seguridad

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Competitions
CREATE POLICY "Competitions are viewable by everyone" ON public.competitions
    FOR SELECT USING (true);

-- Phases
CREATE POLICY "Phases are viewable by everyone" ON public.phases
    FOR SELECT USING (true);

-- Entries
CREATE POLICY "Entries are viewable by everyone" ON public.entries
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own entries" ON public.entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches
CREATE POLICY "Matches are viewable by everyone" ON public.matches
    FOR SELECT USING (true);

-- Predictions
CREATE POLICY "Predictions viewable only if own or match is locked/started" ON public.predictions
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.matches m 
            WHERE m.id = match_id 
            AND m.start_at - INTERVAL '1 minute' <= now()
        )
    );

CREATE POLICY "Users can insert their own predictions" ON public.predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON public.predictions
    FOR UPDATE USING (auth.uid() = user_id);


-- 4. Funciones y Triggers de Base de Datos

-- A. Crear perfil de usuario automáticamente al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- B. Bloqueo estricto de pronósticos 1 minuto antes del partido
CREATE OR REPLACE FUNCTION public.check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
    match_start TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT start_at INTO match_start
    FROM public.matches
    WHERE id = NEW.match_id;

    IF match_start - INTERVAL '1 minute' <= now() THEN
        RAISE EXCEPTION 'Las predicciones para este partido se bloquearon a partir de 1 minuto antes de su inicio.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_prediction_lock
    BEFORE INSERT OR UPDATE ON public.predictions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_prediction_lock();


-- C. Validar que el usuario tenga una inscripción pagada para la fase antes de ingresar/actualizar pronósticos
CREATE OR REPLACE FUNCTION public.check_user_is_registered_and_paid()
RETURNS TRIGGER AS $$
DECLARE
    match_phase_id UUID;
    entry_status TEXT;
BEGIN
    SELECT phase_id INTO match_phase_id
    FROM public.matches
    WHERE id = NEW.match_id;

    SELECT status INTO entry_status
    FROM public.entries
    WHERE user_id = NEW.user_id AND phase_id = match_phase_id;

    IF entry_status IS NULL OR entry_status != 'paid' THEN
        RAISE EXCEPTION 'Debes completar el pago de la inscripción para esta fase antes de ingresar un pronóstico.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_user_is_registered_and_paid
    BEFORE INSERT OR UPDATE ON public.predictions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_is_registered_and_paid();


-- D. Cálculo automático de puntos y actualización del acumulador en inscripciones
CREATE OR REPLACE FUNCTION public.calculate_match_predictions_points()
RETURNS TRIGGER AS $$
DECLARE
    prediction_record RECORD;
    calculated_points INT;
    actual_winner TEXT;
    pred_winner TEXT;
BEGIN
    IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        
        -- Determinar ganador real ('home', 'away', 'draw')
        IF NEW.home_score > NEW.away_score THEN actual_winner := 'home';
        ELSIF NEW.home_score < NEW.away_score THEN actual_winner := 'away';
        ELSE actual_winner := 'draw';
        END IF;

        -- Procesar pronósticos
        FOR prediction_record IN 
            SELECT id, user_id, home_prediction, away_prediction FROM public.predictions WHERE match_id = NEW.id
        LOOP
            calculated_points := 0;

            -- Determinar ganador pronosticado
            IF prediction_record.home_prediction > prediction_record.away_prediction THEN pred_winner := 'home';
            ELSIF prediction_record.home_prediction < prediction_record.away_prediction THEN pred_winner := 'away';
            ELSE pred_winner := 'draw';
            END IF;

            -- +1 punto por acertar resultado general (ganador o empate)
            IF actual_winner = pred_winner THEN
                calculated_points := calculated_points + 1;
                
                -- +3 puntos adicionales por marcador exacto (Total 4)
                IF prediction_record.home_prediction = NEW.home_score AND prediction_record.away_prediction = NEW.away_score THEN
                    calculated_points := calculated_points + 3;
                END IF;
            END IF;

            -- Guardar puntos obtenidos en el pronóstico
            UPDATE public.predictions 
            SET points_earned = calculated_points 
            WHERE id = prediction_record.id;

            -- Recalcular el total acumulado del usuario en la inscripción correspondiente a esta fase
            UPDATE public.entries
            SET points_total = (
                SELECT COALESCE(SUM(p.points_earned), 0)
                FROM public.predictions p
                JOIN public.matches m ON p.match_id = m.id
                WHERE p.user_id = prediction_record.user_id AND m.phase_id = NEW.phase_id
            )
            WHERE user_id = prediction_record.user_id AND phase_id = NEW.phase_id;

        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_match_predictions_points
    AFTER UPDATE OF status, home_score, away_score ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_match_predictions_points();
