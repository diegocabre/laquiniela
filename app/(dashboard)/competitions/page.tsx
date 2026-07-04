import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Competition } from '@/types'

export const revalidate = 0 // Desactivar cache para datos en tiempo real

export default async function CompetitionsPage() {
  const supabase = await createClient()

  // Consultar competiciones activas
  const { data: competitions, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const list: Competition[] = competitions || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Competiciones Activas
        </h1>
        <p className="text-zinc-400 max-w-2xl">
          Selecciona una competición disponible para ver las fases de juego, inscribirte y realizar tus pronósticos.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
          Error al cargar competiciones: {error.message}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900">
            🏆
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">No hay competiciones activas</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Por el momento no hay torneos disponibles. Ejecuta las migraciones en Supabase e inserta competiciones y fases de prueba para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((competition) => (
            <Link
              key={competition.id}
              href={`/competitions/${competition.slug}`}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 hover:bg-zinc-900/40 hover:border-zinc-700 transition flex flex-col justify-between h-48"
            >
              <div>
                <span className="text-xs font-semibold tracking-wider text-emerald-500 uppercase bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-900/30">
                  Activa
                </span>
                <h3 className="mt-4 text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  {competition.name}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                  {competition.description || 'Sin descripción disponible.'}
                </p>
              </div>
              <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 mt-4">
                Ver fases de juego <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
