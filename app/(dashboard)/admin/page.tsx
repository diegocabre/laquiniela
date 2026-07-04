import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AdminTabsContainer from '@/components/dashboard/AdminTabsContainer'

export const revalidate = 0

// Inicializar cliente administrativo de Supabase
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Verificar sesión del usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Verificar si el usuario es administrador consultando la tabla 'admins'
  const { data: adminRecord, error: adminError } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminRecord) {
    redirect('/competitions')
  }

  // 3. Consultar todos los datos requeridos para el panel administrativo
  // A. Inscripciones
  const { data: entries } = await supabaseAdmin
    .from('entries')
    .select('*, profiles(username), phases(*, competitions(*))')
    .order('created_at', { ascending: false })

  // B. Competiciones (todas)
  const { data: competitions } = await supabaseAdmin
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false })

  // C. Fases (todas)
  const { data: phases } = await supabaseAdmin
    .from('phases')
    .select('*')
    .order('created_at', { ascending: false })

  // D. Partidos (todos)
  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('*')
    .order('start_at', { ascending: true })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Panel de Administración
        </h1>
        <p className="text-zinc-400">
          Gestiona competiciones, fases, partidos y aprueba inscripciones de forma centralizada y segura.
        </p>
      </div>

      <AdminTabsContainer
        entries={entries || []}
        competitions={competitions || []}
        phases={phases || []}
        matches={matches || []}
      />
    </div>
  )
}
