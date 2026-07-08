'use client'

import { useState, useEffect } from 'react'
import { Phase, Match } from '@/types'
import { formatDate } from '@/lib/utils'

interface AdminMatchesTabProps {
  phases: Phase[]
  initialMatches: Match[]
}

export default function AdminMatchesTab({ phases, initialMatches }: AdminMatchesTabProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [selectedPhaseId, setSelectedPhaseId] = useState(phases[0]?.id || '')
  
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [startAt, setStartAt] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  // Pronósticos
  const [predictionsMap, setPredictionsMap] = useState<Record<string, any[]>>({})
  const [loadingPredictionsId, setLoadingPredictionsId] = useState<string | null>(null)
  const [showPredictionsId, setShowPredictionsId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  // Actualizar el tiempo cada 15 segundos para bloquear/desbloquear
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  // Marcadores en edición
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [scoreLoadingId, setScoreLoadingId] = useState<string | null>(null)

  // Filtrar partidos por la fase seleccionada
  const filteredMatches = matches.filter((m) => m.phase_id === selectedPhaseId)

  // Sincronizar marcadores locales cuando cambian los partidos
  useEffect(() => {
    const map: Record<string, { home: string; away: string }> = {}
    matches.forEach((m) => {
      map[m.id] = {
        home: m.home_score !== null ? String(m.home_score) : '',
        away: m.away_score !== null ? String(m.away_score) : '',
      }
    })
    setScores(map)
  }, [matches])

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setCreateError(null)
    setCreateSuccess(false)

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase_id: selectedPhaseId,
          home_team: homeTeam,
          away_team: awayTeam,
          start_at: new Date(startAt).toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear partido')

      setMatches((prev) => [...prev, data])
      setCreateSuccess(true)
      setHomeTeam('')
      setAwayTeam('')
      setStartAt('')
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateScore = async (matchId: string, finalize = false) => {
    const scoreObj = scores[matchId]
    if (!scoreObj || scoreObj.home === '' || scoreObj.away === '') {
      setListError('Debes ingresar ambos marcadores.')
      return
    }

    setScoreLoadingId(matchId)
    setListError(null)

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: matchId,
          home_score: parseInt(scoreObj.home, 10),
          away_score: parseInt(scoreObj.away, 10),
          status: finalize ? 'finished' : 'live',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar partido')

      setMatches((prev) => prev.map((m) => (m.id === matchId ? data : m)))
    } catch (err: any) {
      setListError(err.message)
    } finally {
      setScoreLoadingId(null)
    }
  }

  const handleScoreChange = (matchId: string, team: 'home' | 'away', val: string) => {
    const cleanVal = val.replace(/\D/g, '')
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: cleanVal,
      },
    }))
  }

  const handleLoadPredictions = async (matchId: string) => {
    if (showPredictionsId === matchId) {
      setShowPredictionsId(null)
      return
    }

    setShowPredictionsId(matchId)

    if (predictionsMap[matchId]) return

    setLoadingPredictionsId(matchId)
    setListError(null)

    try {
      const res = await fetch(`/api/admin/predictions?matchId=${matchId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al obtener pronósticos')

      setPredictionsMap((prev) => ({
        ...prev,
        [matchId]: data,
      }))
    } catch (err: any) {
      setListError(err.message)
      setShowPredictionsId(null)
    } finally {
      setLoadingPredictionsId(null)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Formulario */}
      <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-fit space-y-6">
        <h3 className="text-lg font-bold text-white">Crear Partido</h3>

        {createSuccess && (
          <p className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/30">
            ✓ Partido creado con éxito.
          </p>
        )}

        {createError && (
          <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900/30">
            {createError}
          </p>
        )}

        {phases.length === 0 ? (
          <p className="text-xs text-zinc-500">Debes crear al menos una fase primero.</p>
        ) : (
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Fase Seleccionada</label>
              <select
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Equipo Local</label>
              <input
                type="text"
                required
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Argentina"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Equipo Visitante</label>
              <input
                type="text"
                required
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Colombia"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Fecha y Hora de Inicio</label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition cursor-pointer"
            >
              {loading ? 'Creando...' : 'Crear Partido'}
            </button>
          </form>
        )}
      </div>

      {/* Listado de partidos en la fase */}
      <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden h-fit">
        <div className="p-5 border-b border-zinc-900 flex justify-between items-center gap-4">
          <h3 className="font-bold text-white">Partidos de la Fase</h3>
          
          <select
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {listError && (
          <div className="bg-red-950/40 border-b border-zinc-900 p-4 text-xs text-red-400">
            {listError}
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No hay partidos en esta fase.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {filteredMatches.map((match) => {
              const isFinished = match.status === 'finished'
              const homeVal = scores[match.id]?.home ?? ''
              const awayVal = scores[match.id]?.away ?? ''

              return (
                <div key={match.id} className="p-5 space-y-4 hover:bg-zinc-900/10 transition">
                  <div className="flex justify-between items-center text-xs text-zinc-500 border-b border-zinc-900 pb-2">
                    <span>{formatDate(match.start_at)}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold border ${
                        isFinished
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          : 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400 animate-pulse'
                      }`}
                    >
                      {isFinished ? 'Finalizado' : 'Programado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    {/* Equipos y Marcadores */}
                    <div className="flex-1 flex items-center justify-between gap-4 max-w-lg mx-auto">
                      <span className="font-bold text-white w-1/3 text-right">{match.home_team}</span>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={2}
                          disabled={isFinished}
                          value={homeVal}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          className="w-10 h-10 text-center font-bold bg-zinc-900 border border-zinc-850 rounded-lg text-white disabled:bg-zinc-950/40 disabled:text-zinc-400"
                          placeholder="-"
                        />
                        <span className="text-zinc-600 font-bold">:</span>
                        <input
                          type="text"
                          maxLength={2}
                          disabled={isFinished}
                          value={awayVal}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          className="w-10 h-10 text-center font-bold bg-zinc-900 border border-zinc-850 rounded-lg text-white disabled:bg-zinc-950/40 disabled:text-zinc-400"
                          placeholder="-"
                        />
                      </div>

                      <span className="font-bold text-white w-1/3 text-left">{match.away_team}</span>
                    </div>

                    {/* Acciones */}
                    {!isFinished && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateScore(match.id, true)}
                          disabled={scoreLoadingId === match.id}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
                        >
                          {scoreLoadingId === match.id ? 'Finalizando...' : 'Finalizar Partido'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visualización de Pronósticos de Usuarios (Solo si el partido comenzó o terminó) */}
                  {(new Date(match.start_at).getTime() <= now || isFinished) && (
                    <div className="border-t border-zinc-900 pt-3 mt-3">
                      <button
                        type="button"
                        onClick={() => handleLoadPredictions(match.id)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-350 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {showPredictionsId === match.id ? '✕ Ocultar Pronósticos' : '📋 Ver Pronósticos de Participantes'}
                      </button>

                      {showPredictionsId === match.id && (
                        <div className="mt-3 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 space-y-3">
                          <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pronósticos de los Jugadores</h5>
                          
                          {loadingPredictionsId === match.id ? (
                            <p className="text-xs text-zinc-500">Cargando pronósticos...</p>
                          ) : !predictionsMap[match.id] || predictionsMap[match.id].length === 0 ? (
                            <p className="text-xs text-zinc-500">No hay pronósticos registrados para este partido.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-zinc-900 text-zinc-500 font-semibold">
                                    <th className="py-2 px-1">Usuario</th>
                                    <th className="py-2 px-1 text-center">Predicción</th>
                                    <th className="py-2 px-1 text-right">Puntos Ganados</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900/30">
                                  {predictionsMap[match.id].map((p, idx) => (
                                    <tr key={idx} className="text-zinc-300">
                                      <td className="py-2 px-1 font-semibold">{p.username}</td>
                                      <td className="py-2 px-1 text-center font-bold">
                                        {p.home_prediction} - {p.away_prediction}
                                      </td>
                                      <td className="py-2 px-1 text-right">
                                        {p.points_earned !== null ? (
                                          <span className={`font-bold ${p.points_earned > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            +{p.points_earned} pts
                                          </span>
                                        ) : (
                                          <span className="text-zinc-650">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
