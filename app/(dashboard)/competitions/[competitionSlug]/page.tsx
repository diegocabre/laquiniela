import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutButton from '@/components/predictions/CheckoutButton'
import { formatCurrency } from '@/lib/utils'

export const revalidate = 0

interface PageProps {
  params: Promise<{
    competitionSlug: string
  }>
}

export default async function CompetitionPhasesPage({ params }: PageProps) {
  const { competitionSlug } = await params
  const supabase = await createClient()

  // 1. Obtener la competición
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .eq('slug', competitionSlug)
    .single()

  if (compError || !competition) {
    return notFound()
  }

  // 2. Obtener las fases de la competición
  const { data: phases, error: phasesError } = await supabase
    .from('phases')
    .select('*')
    .eq('competition_id', competition.id)
    .order('created_at', { ascending: true })

  // 3. Obtener la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Obtener las inscripciones del usuario actual para estas fases
  const phaseIds = (phases || []).map(p => p.id)
  let userEntriesMap: Record<string, 'pending' | 'paid' | 'refunded'> = {}

  if (user && phaseIds.length > 0) {
    const { data: entries } = await supabase
      .from('entries')
      .select('phase_id, status')
      .eq('user_id', user.id)
      .in('phase_id', phaseIds)

    if (entries) {
      userEntriesMap = entries.reduce((acc, curr) => {
        acc[curr.phase_id] = curr.status as any
        return acc;
      }, {} as Record<string, 'pending' | 'paid' | 'refunded'>)
    }
  }

  const phaseList = phases || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-900 pb-6">
        <Link href="/competitions" className="text-zinc-500 hover:text-white transition text-sm">
          ← Volver
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {competition.name}
          </h1>
          <p className="text-zinc-400 mt-1">{competition.description}</p>
        </div>
      </div>

      {phasesError && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
          Error al cargar fases: {phasesError.message}
        </div>
      )}

      {phaseList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/10">
          <h3 className="text-lg font-semibold text-white">No hay fases creadas</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Esta competición aún no cuenta con fases programadas.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {phaseList.map((phase) => {
            const entryStatus = userEntriesMap[phase.id]
            const isPaid = entryStatus === 'paid'

            return (
              <div
                key={phase.id}
                className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        phase.status === 'open_registration'
                          ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
                          : phase.status === 'active'
                          ? 'bg-blue-950/40 border-blue-900/50 text-blue-400'
                          : phase.status === 'finished'
                          ? 'bg-zinc-850 border-zinc-800 text-zinc-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {phase.status === 'open_registration'
                        ? 'Registro Abierto'
                        : phase.status === 'active'
                        ? 'En Curso'
                        : phase.status === 'finished'
                        ? 'Finalizada'
                        : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">
                    Costo de Inscripción: <strong className="text-zinc-300">{formatCurrency(Number(phase.entry_fee))}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {isPaid || phase.status === 'finished' ? (
                    <Link
                      href={`/competitions/${competitionSlug}/${phase.slug}`}
                      className="w-full text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-semibold text-sm py-2 rounded-lg transition"
                    >
                      {isPaid ? 'Ver Partidos y Pronosticar' : 'Ver Resultados'}
                    </Link>
                  ) : (
                    <CheckoutButton
                      phaseId={phase.id}
                      entryFee={Number(phase.entry_fee)}
                      status={entryStatus}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
