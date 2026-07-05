import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const revalidate = 0

interface PageProps {
  params: Promise<{
    phaseId: string
  }>
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { phaseId } = await params
  const supabase = await createClient()

  // 1. Obtener la fase y competición asociada
  const { data: phase, error: phaseError } = await supabase
    .from('phases')
    .select('*, competitions(name, slug)')
    .eq('id', phaseId)
    .single()

  if (phaseError || !phase) {
    return notFound()
  }

  // 2. Obtener las inscripciones pagadas con el nombre de usuario ordenados por puntos total descendente
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, points_total, status, profiles(username, avatar_url)')
    .eq('phase_id', phaseId)
    .eq('status', 'paid')
    .order('points_total', { ascending: false })

  const entriesList = entries || []

  // Calcular pozo acumulado
  const entryFeeObj = Number(phase.entry_fee)
  const totalEntriesPaid = entriesList.length
  const totalPool = totalEntriesPaid * entryFeeObj
  const platformCut = totalPool * 0.05
  const prizePool = totalPool * 0.95

  return (
    <div className="space-y-8">
      {/* Botón de regreso */}
      <div className="flex items-center gap-4">
        <Link
          href={`/competitions/${phase.competitions?.slug}/${phase.slug}`}
          className="text-zinc-500 hover:text-white transition text-sm"
        >
          ← Volver a Pronósticos
        </Link>
      </div>

      {/* Título de la sección */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Tabla de Clasificación
        </h1>
        <p className="text-zinc-400">
          Fase: <span className="text-white font-semibold">{phase.name}</span> - Competición:{' '}
          <span className="text-white font-semibold">{phase.competitions?.name}</span>
        </p>
      </div>

      {/* Ganadores destacados (si la fase está finalizada) */}
      {phase.status === 'finished' && entriesList.length > 0 && (
        <div className="rounded-2xl border border-amber-500 bg-amber-500/10 p-6 text-center space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 pointer-events-none"></div>
          <span className="text-4xl">👑</span>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-amber-400 uppercase tracking-widest">
              🏆 ¡Fase Finalizada! 🏆
            </h2>
            <p className="text-sm text-zinc-300">
              Felicidades al ganador(es) de la fase **{phase.name}**:
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {entriesList.filter((e: any) => e.points_total === entriesList[0].points_total).map((winner: any) => (
              <span key={winner.id} className="text-lg font-black text-white bg-zinc-950/80 px-4 py-2 rounded-xl border border-amber-500/30 flex items-center gap-2">
                👤 {winner.profiles?.username || 'Usuario'} 
                <span className="text-amber-400 font-extrabold text-sm">({winner.points_total} pts)</span>
              </span>
            ))}
          </div>
          <div className="text-xs text-zinc-450">
            Premio Acumulado: <strong className="text-emerald-400 text-sm font-black">{formatCurrency(prizePool)}</strong>
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas del Pozo de Premios */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Participantes Pagados</span>
          <p className="text-3xl font-black text-white">{totalEntriesPaid}</p>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-2">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Pozo Total Acumulado</span>
          <p className="text-3xl font-black text-white">{formatCurrency(totalPool)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/5 p-6 space-y-2 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-xl select-none">🏆</div>
          <span className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">Premio Ganador (95%)</span>
          <p className="text-3xl font-black text-emerald-400">{formatCurrency(prizePool)}</p>
          <span className="text-[10px] text-zinc-500 block mt-1">La plataforma retiene el 5% ({formatCurrency(platformCut)})</span>
        </div>
      </div>

      {entriesError && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
          Error al cargar la tabla: {entriesError.message}
        </div>
      )}

      {/* Listado / Tabla de posiciones */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Posiciones de Jugadores</h3>
          <span className="text-xs text-zinc-500 font-medium">Ordenado por puntaje total de pronósticos</span>
        </div>

        {entriesList.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No hay jugadores inscritos en esta fase actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/10">
                  <th className="py-4 px-6 w-20 text-center">Posición</th>
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6 text-right">Puntos Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {entriesList.map((entry: any, index) => {
                  const rank = index + 1
                  const isTopOne = rank === 1

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-zinc-900/20 transition ${
                        isTopOne ? 'bg-emerald-950/5' : ''
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-bold">
                        {isTopOne ? (
                          <span className="inline-flex items-center justify-center bg-yellow-500/10 text-yellow-500 w-8 h-8 rounded-full border border-yellow-500/20">
                            1º 👑
                          </span>
                        ) : (
                          <span className="text-zinc-400">{rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {entry.profiles?.username || 'Usuario Invitado'}
                      </td>
                      <td className="py-4 px-6 text-right text-lg font-black text-emerald-400">
                        {entry.points_total} <span className="text-xs text-zinc-500 font-medium">pts</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
