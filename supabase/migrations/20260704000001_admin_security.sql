-- 1. Tabla de Administradores
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Habilitar RLS en la tabla de admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas por si ya existen
DROP POLICY IF EXISTS "Admins are viewable by everyone" ON public.admins;

-- Crear políticas de RLS para public.admins
CREATE POLICY "Admins are viewable by everyone" ON public.admins
    FOR SELECT USING (true);


-- 2. Función para comprobar si un usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Actualizar la función de registro para autodefinir admin al correo principal
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear el perfil de usuario público
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Hacer administrador automáticamente a diegocabre@gmail.com
    IF NEW.email = 'diegocabre@gmail.com' THEN
        INSERT INTO public.admins (user_id)
        VALUES (NEW.id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Registrar de inmediato a diegocabre@gmail.com como administrador si ya se encuentra registrado
INSERT INTO public.admins (user_id)
SELECT id FROM auth.users WHERE email = 'diegocabre@gmail.com'
ON CONFLICT DO NOTHING;


-- 5. Políticas de seguridad RLS para competiciones (Limpiar y crear)
DROP POLICY IF EXISTS "Admins can insert competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can update competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can delete competitions" ON public.competitions;

CREATE POLICY "Admins can insert competitions" ON public.competitions
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update competitions" ON public.competitions
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete competitions" ON public.competitions
    FOR DELETE USING (public.is_admin(auth.uid()));


-- 6. Políticas de seguridad RLS para fases (Limpiar y crear)
DROP POLICY IF EXISTS "Admins can insert phases" ON public.phases;
DROP POLICY IF EXISTS "Admins can update phases" ON public.phases;
DROP POLICY IF EXISTS "Admins can delete phases" ON public.phases;

CREATE POLICY "Admins can insert phases" ON public.phases
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update phases" ON public.phases
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete phases" ON public.phases
    FOR DELETE USING (public.is_admin(auth.uid()));


-- 7. Políticas de seguridad RLS para partidos (Limpiar y crear)
DROP POLICY IF EXISTS "Admins can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can update matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON public.matches;

CREATE POLICY "Admins can insert matches" ON public.matches
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update matches" ON public.matches
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete matches" ON public.matches
    FOR DELETE USING (public.is_admin(auth.uid()));
