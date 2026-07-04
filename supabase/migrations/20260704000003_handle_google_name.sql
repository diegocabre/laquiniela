-- Actualizar la función trigger para obtener el nombre completo desde Google Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear el perfil de usuario público
    -- Intenta obtener primero el nombre completo de Google (full_name o name),
    -- si no existen usa el username del registro clásico,
    -- y si no usa el prefijo del correo como último recurso.
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        ),
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
