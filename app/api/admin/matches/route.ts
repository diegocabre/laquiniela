import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function isAdminUser(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  return !!data && !error
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    const { phase_id, home_team, away_team, status = 'scheduled', start_at } = await request.json()

    if (!phase_id || !home_team || !away_team || !start_at) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('matches')
      .insert({
        phase_id,
        home_team,
        away_team,
        status,
        start_at,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al crear partido (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    const { id, home_score, away_score, status, start_at, home_team, away_team } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 })
    }

    const updateFields: any = {}
    if (home_score !== undefined) updateFields.home_score = home_score === '' || home_score === null ? null : Number(home_score)
    if (away_score !== undefined) updateFields.away_score = away_score === '' || away_score === null ? null : Number(away_score)
    if (status !== undefined) updateFields.status = status
    if (start_at !== undefined) updateFields.start_at = start_at
    if (home_team !== undefined) updateFields.home_team = home_team
    if (away_team !== undefined) updateFields.away_team = away_team

    const { data, error } = await supabase
      .from('matches')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al actualizar partido (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}
