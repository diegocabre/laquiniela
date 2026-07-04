import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar sesión de usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener phaseId
    const { phaseId } = await request.json()
    if (!phaseId) {
      return NextResponse.json({ error: 'phaseId es requerido' }, { status: 400 })
    }

    // 3. Consultar datos de la fase
    const { data: phase, error: phaseError } = await supabase
      .from('phases')
      .select('id, status')
      .eq('id', phaseId)
      .single()

    if (phaseError || !phase) {
      return NextResponse.json({ error: 'Fase no encontrada' }, { status: 404 })
    }

    if (phase.status !== 'open_registration') {
      return NextResponse.json({ error: 'Las inscripciones no están abiertas' }, { status: 400 })
    }

    // 4. Verificar si ya existe una inscripción
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('phase_id', phaseId)
      .single()

    if (existingEntry && existingEntry.status === 'paid') {
      return NextResponse.json({ error: 'Ya estás inscrito y pagado' }, { status: 400 })
    }

    // 5. Registrar o actualizar inscripción en estado 'pending'
    if (existingEntry) {
      const { error: updateError } = await supabase
        .from('entries')
        .update({
          status: 'pending',
        })
        .eq('id', existingEntry.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          phase_id: phaseId,
          status: 'pending',
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al registrar inscripción pendiente:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
