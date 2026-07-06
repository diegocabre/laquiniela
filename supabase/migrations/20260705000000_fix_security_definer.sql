-- 1. Redefinir la función de cálculo con SECURITY DEFINER para omitir las restricciones de RLS (Row Level Security)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ejecutar recálculo retrospectivo automático para partidos finalizados
DO $$
DECLARE
    match_record RECORD;
BEGIN
    FOR match_record IN SELECT * FROM public.matches WHERE status = 'finished' LOOP
        UPDATE public.matches
        SET status = 'finished'
        WHERE id = match_record.id;
    END LOOP;
END;
$$;
