'use client'

import { useState } from 'react'
import { Competition } from '@/types'

interface AdminCompetitionsTabProps {
  initialCompetitions: Competition[]
}

export default function AdminCompetitionsTab({ initialCompetitions }: AdminCompetitionsTabProps) {
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Autogenerar slug del nombre
  const handleNameChange = (val: string) => {
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s-]/g, '')     // Quitar caracteres especiales
      .trim()
      .replace(/\s+/g, '-')             // Reemplazar espacios por guiones
    setSlug(generatedSlug)
  }

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          slug,
          logo_url: logoUrl || null,
          is_active: isActive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear competición')

      setCompetitions((prev) => [data, ...prev])
      setSuccess(true)
      setName('')
      setDescription('')
      setSlug('')
      setLogoUrl('')
      setIsActive(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (comp: Competition) => {
    setToggleLoadingId(comp.id)
    setError(null)
    const newActiveState = !comp.is_active

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: comp.id,
          is_active: newActiveState,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado')

      setCompetitions((prev) =>
        prev.map((c) => (c.id === comp.id ? { ...c, is_active: newActiveState } : c))
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setToggleLoadingId(null)
    }
  }

  const handleDeleteCompetition = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta competición? Se borrarán todas las fases, partidos, inscripciones y pronósticos asociados.')) {
      return
    }

    setDeleteLoadingId(id)
    setError(null)

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar competición')

      setCompetitions((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Formulario */}
      <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-fit space-y-6">
        <h3 className="text-lg font-bold text-white">Crear Competición</h3>
        
        {success && (
          <p className="text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/30">
            ✓ Competición creada con éxito.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-900/30">
            {error}
          </p>
        )}

        <form onSubmit={handleCreateCompetition} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold uppercase">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ej. Copa Mundial FIFA 2026"
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
              placeholder="copa-mundial-fifa-2026"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold uppercase">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 h-20 resize-none"
              placeholder="Descripción breve..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-semibold uppercase">URL del Logo (Opcional)</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="https://images.com/logo.png"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-zinc-900 mt-4">
            <span className="text-sm font-semibold text-zinc-300">Activar Inmediatamente</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition cursor-pointer"
          >
            {loading ? 'Creando...' : 'Crear Competición'}
          </button>
        </form>
      </div>

      {/* Listado */}
      <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden h-fit">
        <div className="p-5 border-b border-zinc-900">
          <h3 className="font-bold text-white">Competiciones Existentes</h3>
        </div>

        {competitions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            No hay competiciones en el sistema.
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {competitions.map((comp) => (
              <div key={comp.id} className="p-5 flex items-center justify-between hover:bg-zinc-900/10 transition gap-4">
                <div>
                  <h4 className="font-bold text-white">{comp.name}</h4>
                  <p className="text-xs text-zinc-500 mt-1">Slug: {comp.slug}</p>
                  {comp.description && (
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{comp.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(comp)}
                    disabled={toggleLoadingId === comp.id || deleteLoadingId === comp.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      comp.is_active
                        ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/30'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {toggleLoadingId === comp.id
                      ? 'Procesando...'
                      : comp.is_active
                      ? 'Desactivar'
                      : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDeleteCompetition(comp.id)}
                    disabled={deleteLoadingId === comp.id || toggleLoadingId === comp.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/30 transition cursor-pointer"
                  >
                    {deleteLoadingId === comp.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
