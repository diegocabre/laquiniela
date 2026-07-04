-- 1. Corregir función de bloqueo de predicción por tiempo de juego
CREATE OR REPLACE FUNCTION public.check_prediction_lock()
RETURNS TRIGGER AS $$
DECLARE
    match_start TIMESTAMP;
BEGIN
    -- Solo bloquear si se está insertando un nuevo pronóstico o modificando los goles del pronóstico existente.
    -- Permitir actualizaciones administrativas de points_earned sin validar el tiempo.
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.home_prediction IS DISTINCT FROM OLD.home_prediction OR NEW.away_prediction IS DISTINCT FROM OLD.away_prediction)) THEN
        SELECT start_at INTO match_start FROM public.matches WHERE id = NEW.match_id;
        IF match_start IS NULL OR match_start <= (now() + INTERVAL '1 minute') THEN
            RAISE EXCEPTION 'El partido ya comenzó o está por comenzar. No puedes modificar este pronóstico.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Corregir función de validación de pago de inscripción
CREATE OR REPLACE FUNCTION public.check_user_is_registered_and_paid()
RETURNS TRIGGER AS $$
DECLARE
    match_phase_id UUID;
    entry_status TEXT;
BEGIN
    -- Solo validar el pago de inscripción si se están insertando goles o modificando el pronóstico.
    -- Permitir la asignación administrativa de puntos (points_earned) sin arrojar excepción.
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.home_prediction IS DISTINCT FROM OLD.home_prediction OR NEW.away_prediction IS DISTINCT FROM OLD.away_prediction)) THEN
        SELECT phase_id INTO match_phase_id
        FROM public.matches
        WHERE id = NEW.match_id;

        SELECT status INTO entry_status
        FROM public.entries
        WHERE user_id = NEW.user_id AND phase_id = match_phase_id;

        IF entry_status IS NULL OR entry_status != 'paid' THEN
            RAISE EXCEPTION 'Debes completar el pago de la inscripción para esta fase antes de ingresar un pronóstico.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
