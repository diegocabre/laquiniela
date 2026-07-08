-- 1. Añadir la columna highlighted_in_hero a la tabla public.phases
ALTER TABLE public.phases ADD COLUMN IF NOT EXISTS highlighted_in_hero BOOLEAN DEFAULT false NOT NULL;

-- 2. Crear función trigger para asegurar exclusividad del destacado en el hero
CREATE OR REPLACE FUNCTION public.handle_phase_hero_highlight()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la fase está siendo marcada como destacada en el hero, desmarcar todas las otras
    IF NEW.highlighted_in_hero = true AND (OLD.highlighted_in_hero = false OR OLD.highlighted_in_hero IS NULL) THEN
        UPDATE public.phases
        SET highlighted_in_hero = false
        WHERE id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el trigger sobre la tabla phases
DROP TRIGGER IF EXISTS trg_phase_hero_highlight ON public.phases;
CREATE TRIGGER trg_phase_hero_highlight
    BEFORE UPDATE OF highlighted_in_hero ON public.phases
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_phase_hero_highlight();
