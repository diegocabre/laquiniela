'use client'

import { useState } from 'react'
import { Competition, Phase, PhaseStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface AdminPhasesTabProps {
  competitions: Competition[]
  initialPhases: Phase[]
}

export default function AdminPhasesTab({ competitions, initialPhases }: AdminPhasesTabProps) {
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id || '')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [entryFee, setEntryFee] = useState('')
  const [status, setStatus] = useState<PhaseStatus>('draft')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  const [loading, setLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleNameChange = (val: string) => {
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setSlug(generatedSlug)
  }

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: competitionId,
          name,
          slug,
          entry_fee: Number(entryFee || 0),
          status,
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear fase')

      setPhases((prev) => [data, ...prev])
      setSuccess(true)
      setName('')
      setSlug('')
      setEntryFee('')
      setStatus('draft')
      setStartAt('')
      setEndAt('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (phase: Phase, newStatus: PhaseStatus) => {
    setError(null)
    try {
      const res = await fetch('/api/admin/phases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: phase.id,
          status: newStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado')

      setPhases((prev) =>
        prev.map((p) => (p.id === phase.id ? { ...p, status: newStatus } : p))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeletePhase = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta fase? Se borrarán todos los partidos, inscripciones y pronósticos asociados.')) {
      return
    }

    setDeleteLoadingId(id)
    setError(null)

    try {
      const res = await fetch('/api/admin/phases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar fase')

      setPhases((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleToggleHeroHighlight = async (phase: Phase) => {
    setError(null)
    const newHighlightState = !phase.highlighted_in_hero

    try {
      const res = await fetch('/api/admin/phases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: phase.id,
          highlighted_in_hero: newHighlightState,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar destacado')

      // Como la base de datos desmarca todas las demás cuando una es verdadera,
      // actualizamos el estado local para reflejar esto.
      setPhases((prev) =>
        prev.map((p) => {
          if (p.id === phase.id) {
            return { ...p, highlighted_in_hero: newHighlightState }
          }
          if (newHighlightState === true) {
            return { ...p, highlighted_in_hero: false }
          }
          return p
        })
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Formulario */}
      <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-fit space-y-6">
        <h3 className="text-lg font-bold text-white">Crear Fase</h3>

        {success && (
          <p className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/30">
            ✓ Fase creada con éxito.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900/30">
            {error}
          </p>
        )}

        {competitions.length === 0 ? (
          <p className="text-xs text-zinc-500">Debes crear al menos una competición primero.</p>
        ) : (
          <form onSubmit={handleCreatePhase} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Competición</label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Nombre de la Fase</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ej. Octavos de Final"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Slug (URL)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="octavos-de-final"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Costo de Entrada (CLP)</label>
              <input
                type="number"
                step="1"
                required
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="10000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase">Estado de Registro</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PhaseStatus)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="draft">Borrador</option>
                <option value="open_registration">Registro Abierto (Cobro habilitado)</option>
                <option value="active">Activa / En Juego</option>
                <option value="finished">Finalizada</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Fecha Inicio</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Fecha Fin</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition cursor-pointer"
            >
              {loading ? 'Creando...' : 'Crear Fase'}
            </button>
          </form>
        )}
      </div>

      {/* Listado */}
      <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden h-fit">
        <div className="p-5 border-b border-zinc-900">
          <h3 className="font-bold text-white">Fases Registradas</h3>
        </div>

        {phases.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No hay fases registradas.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {phases.map((phase) => {
              const comp = competitions.find((c) => c.id === phase.competition_id)
              return (
                <div key={phase.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-zinc-900/10 transition gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-500">
                      {comp?.name || 'Competición'}
                    </span>
                    <h4 className="font-bold text-white text-lg">{phase.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                      <span>Costo: {formatCurrency(Number(phase.entry_fee))}</span>
                      <span>Slug: {phase.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-end">
                    <button
                      onClick={() => handleToggleHeroHighlight(phase)}
                      title="Destacar ganador de esta fase en el banner principal"
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        phase.highlighted_in_hero
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
                      }`}
                    >
                      {phase.highlighted_in_hero ? '★ Destacada' : '☆ Destacar Hero'}
                    </button>

                    <select
                      value={phase.status}
                      onChange={(e) => handleUpdateStatus(phase, e.target.value as PhaseStatus)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="draft">Borrador</option>
                      <option value="open_registration">Registro Abierto</option>
                      <option value="active">En Juego</option>
                      <option value="finished">Finalizada</option>
                    </select>

                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      disabled={deleteLoadingId === phase.id}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/30 transition cursor-pointer whitespace-nowrap"
                    >
                      {deleteLoadingId === phase.id ? 'Borrando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
