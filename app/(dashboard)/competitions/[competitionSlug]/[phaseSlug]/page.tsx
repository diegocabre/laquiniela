import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PredictionForm from '@/components/predictions/PredictionForm'
import { Match, Prediction } from '@/types'

export const revalidate = 0

interface PageProps {
  params: Promise<{
    competitionSlug: string
    phaseSlug: string
  }>
}

export default async function PhaseMatchesPage({ params }: PageProps) {
  const { competitionSlug, phaseSlug } = await params
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

  // 2. Obtener la fase actual
  const { data: phase, error: phaseError } = await supabase
    .from('phases')
    .select('*')
    .eq('competition_id', competition.id)
    .eq('slug', phaseSlug)
    .single()

  if (phaseError || !phase) {
    return notFound()
  }

  // 3. Verificar usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 4. Verificar estado de la inscripción del usuario
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('phase_id', phase.id)
    .single()

  const isPaid = entry && entry.status === 'paid'

  // 5. Obtener partidos de la fase
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('phase_id', phase.id)
    .order('start_at', { ascending: true })

  // 6. Obtener predicciones guardadas del usuario para estos partidos
  let userPredictions: Prediction[] = []
  if (isPaid && matches && matches.length > 0) {
    const matchIds = matches.map((m) => m.id)
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .in('match_id', matchIds)

    userPredictions = predictions || []
  }

  const matchList: Match[] = matches || []

  return (
    <div className="space-y-8">
      {/* Header y navegación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/competitions/${competitionSlug}`}
            className="text-zinc-500 hover:text-white transition text-sm"
          >
            ← Volver a Fases
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Pronósticos: {phase.name}
            </h1>
            <p className="text-zinc-400 mt-1">{competition.name}</p>
          </div>
        </div>

        <Link
          href={`/leaderboard/${phase.id}`}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
        >
          📊 Ver Tabla de Posiciones
        </Link>
      </div>

      {matchesError && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
          Error al cargar partidos: {matchesError.message}
        </div>
      )}

      {/* Validar inscripción pagada */}
      {!isPaid ? (
        <div className="rounded-2xl border border-dashed border-zinc-850 p-12 text-center bg-zinc-900/10 max-w-xl mx-auto space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-950 text-orange-400 border border-orange-900">
            🔒
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Inscripción requerida</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Debes realizar el pago de inscripción para esta fase para poder ingresar tus pronósticos y competir en el pozo general.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/competitions/${competitionSlug}`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-lg transition whitespace-nowrap"
            >
              Completar Inscripción
            </Link>
            <Link
              href={`/leaderboard/${phase.id}`}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm px-6 py-3 rounded-lg border border-zinc-800 transition whitespace-nowrap"
            >
              📊 Ver Tabla y Pozo
            </Link>
          </div>
        </div>
      ) : matchList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/10">
          <h3 className="text-lg font-semibold text-white">No hay partidos en esta fase</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Aún no se han programado partidos para esta fase del torneo.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <PredictionForm
            matches={matchList}
            initialPredictions={userPredictions}
            userId={user.id}
          />
        </div>
      )}
    </div>
  )
}
