'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Match, Prediction } from '@/types'
import { formatDate } from '@/lib/utils'

interface PredictionFormProps {
  matches: Match[]
  initialPredictions: Prediction[]
  userId: string
}

export default function PredictionForm({ matches, initialPredictions, userId }: PredictionFormProps) {
  const supabase = createClient()
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({})
  const [errorMap, setErrorMap] = useState<Record<string, string>>({})
  const [now, setNow] = useState(Date.now())

  // Actualizar el tiempo cada 15 segundos para mantener sincronizado el bloqueo de partidos
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  // Inicializar predicciones existentes
  useEffect(() => {
    const map: Record<string, { home: string; away: string }> = {}
    initialPredictions.forEach((p) => {
      map[p.match_id] = {
        home: String(p.home_prediction),
        away: String(p.away_prediction),
      }
    })
    setPredictions(map)
  }, [initialPredictions])

  const handleInputChange = (matchId: string, team: 'home' | 'away', value: string) => {
    // Validar que solo se ingresen números
    const cleanValue = value.replace(/\D/g, '')
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: cleanValue,
      },
    }))
  }

  const handleSavePrediction = async (matchId: string) => {
    const pred = predictions[matchId]
    if (!pred || pred.home === '' || pred.away === '') {
      setErrorMap((prev) => ({ ...prev, [matchId]: 'Debes ingresar ambos marcadores.' }))
      return
    }

    setLoadingMap((prev) => ({ ...prev, [matchId]: true }))
    setErrorMap((prev) => ({ ...prev, [matchId]: '' }))
    setSuccessMap((prev) => ({ ...prev, [matchId]: false }))

    try {
      // Buscar si ya existe la predicción
      const existing = initialPredictions.find((p) => p.match_id === matchId)

      const homePred = parseInt(pred.home, 10)
      const awayPred = parseInt(pred.away, 10)

      let error = null

      if (existing) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('predictions')
          .update({
            home_prediction: homePred,
            away_prediction: awayPred,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        error = updateError
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('predictions')
          .insert({
            user_id: userId,
            match_id: matchId,
            home_prediction: homePred,
            away_prediction: awayPred,
          })
        error = insertError
      }

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMap((prev) => ({ ...prev, [matchId]: true }))
      // Quitar mensaje de éxito tras 2 segundos
      setTimeout(() => {
        setSuccessMap((prev) => ({ ...prev, [matchId]: false }))
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setErrorMap((prev) => ({ ...prev, [matchId]: err.message || 'Error de servidor' }))
    } finally {
      setLoadingMap((prev) => ({ ...prev, [matchId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {matches.map((match) => {
        // Un partido se bloquea exactamente 1 minuto antes de su inicio
        const startTime = new Date(match.start_at).getTime()
        const isLocked = startTime - 60000 <= now
        const isFinished = match.status === 'finished'

        const homePredVal = predictions[match.id]?.home ?? ''
        const awayPredVal = predictions[match.id]?.away ?? ''

        const initialPredObj = initialPredictions.find((p) => p.match_id === match.id)
        const earnedPoints = initialPredObj?.points_earned

        return (
          <div
            key={match.id}
            className={`rounded-2xl border p-6 transition-all duration-300 ${
              isFinished
                ? 'border-zinc-850 bg-zinc-950/40 opacity-90'
                : isLocked
                ? 'border-orange-900/30 bg-orange-950/5'
                : 'border-zinc-900 bg-zinc-950 hover:border-zinc-850'
            }`}
          >
            {/* Cabecera del Partido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/50 pb-4 mb-4">
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                {formatDate(match.start_at)}
              </div>
              <div className="flex items-center gap-2">
                {isFinished ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                    Finalizado
                  </span>
                ) : isLocked ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-950/40 border border-orange-900/30 text-orange-400 flex items-center gap-1.5 animate-pulse">
                    🔒 Bloqueado
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">
                    Abierto para Pronósticos
                  </span>
                )}

                {/* Mostrar Puntos Obtenidos */}
                {earnedPoints !== undefined && earnedPoints !== null && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      earnedPoints === 4
                        ? 'bg-yellow-950/50 border-yellow-900/50 text-yellow-400'
                        : earnedPoints === 1
                        ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {earnedPoints === 4 ? '+4 Pts (Exacto)' : earnedPoints === 1 ? '+1 Pt (Ganador)' : '0 Pts'}
                  </span>
                )}
              </div>
            </div>

            {/* Marcadores y Inputs de Predicción */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              {/* Equipo Local */}
              <div className="md:col-span-4 flex items-center gap-4 justify-end">
                <span className="text-lg font-bold text-white text-right">{match.home_team}</span>
                {isFinished && (
                  <span className="text-2xl font-black text-zinc-400 bg-zinc-900 w-10 h-10 flex items-center justify-center rounded-lg border border-zinc-800">
                    {match.home_score}
                  </span>
                )}
              </div>

              {/* Contenedor de Predicción (Inputs) */}
              <div className="md:col-span-4 flex items-center justify-center gap-3">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={2}
                    disabled={isLocked || isFinished}
                    value={homePredVal}
                    onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-black rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-zinc-950/30 disabled:border-zinc-900"
                    placeholder="-"
                  />
                  <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-semibold">Local</span>
                </div>

                <span className="text-zinc-600 font-bold text-lg select-none">:</span>

                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={2}
                    disabled={isLocked || isFinished}
                    value={awayPredVal}
                    onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-black rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-zinc-950/30 disabled:border-zinc-900"
                    placeholder="-"
                  />
                  <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-semibold">Visita</span>
                </div>
              </div>

              {/* Equipo Visitante */}
              <div className="md:col-span-4 flex items-center gap-4 justify-start">
                {isFinished && (
                  <span className="text-2xl font-black text-zinc-400 bg-zinc-900 w-10 h-10 flex items-center justify-center rounded-lg border border-zinc-800">
                    {match.away_score}
                  </span>
                )}
                <span className="text-lg font-bold text-white text-left">{match.away_team}</span>
              </div>
            </div>

            {/* Mensajes de feedback e inserción */}
            {!isLocked && !isFinished && (
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-900/50 pt-4">
                <div className="text-xs">
                  {errorMap[match.id] && <span className="text-red-500">{errorMap[match.id]}</span>}
                  {successMap[match.id] && <span className="text-emerald-500 font-semibold">✓ Guardado</span>}
                </div>
                <button
                  onClick={() => handleSavePrediction(match.id)}
                  disabled={loadingMap[match.id]}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {loadingMap[match.id] ? 'Guardando...' : 'Guardar Pronóstico'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
