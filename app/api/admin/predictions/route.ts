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

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar si el usuario es administrador
    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    // 2. Obtener matchId
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json({ error: 'matchId es requerido' }, { status: 400 })
    }

    // 3. Consultar datos del partido para validar la fecha de inicio (seguridad anti-trampas)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, start_at, status')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
    }

    const startAtTime = new Date(match.start_at).getTime()
    const nowTime = Date.now()

    // Solo permitir consultar pronósticos si el partido ya comenzó o está finalizado
    if (match.status !== 'finished' && startAtTime > nowTime) {
      return NextResponse.json(
        { error: 'No autorizado: Los pronósticos solo son visibles una vez que el partido ha comenzado.' },
        { status: 403 }
      )
    }

    // 4. Obtener todos los pronósticos de los usuarios registrados para este partido
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select(`
        id,
        home_prediction,
        away_prediction,
        points_earned,
        profiles (
          username
        )
      `)
      .eq('match_id', matchId)

    if (predError) throw predError

    // Mapear los datos para una respuesta más limpia
    const results = (predictions || []).map((p: any) => ({
      username: p.profiles?.username || 'Usuario Invitado',
      home_prediction: p.home_prediction,
      away_prediction: p.away_prediction,
      points_earned: p.points_earned
    }))

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error al obtener pronósticos del partido (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}
