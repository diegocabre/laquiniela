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

    // 3. Consultar datos de la fase (incluyendo el nombre para la notificación)
    const { data: phase, error: phaseError } = await supabase
      .from('phases')
      .select('id, name, status')
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

    // 6. Enviar notificaciones asíncronas al administrador en segundo plano
    const phaseName = phase.name
    const userEmail = user.email || 'Un usuario'
    
    ;(async () => {
      // Notificación A: Email usando Resend (gratuito)
      if (process.env.RESEND_API_KEY) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'La Quiniela <onboarding@resend.dev>',
              to: process.env.ADMIN_EMAILS || 'diegocabre@gmail.com',
              subject: '⚽ Nueva Inscripción Pendiente de Aprobación',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
                  <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-top: 0;">⚽ ¡Nueva Inscripción Registrada!</h2>
                  <p style="font-size: 14px; color: #333; line-height: 1.5;">El usuario <strong>${userEmail}</strong> acaba de registrar su comprobante de pago para la fase <strong>${phaseName}</strong>.</p>
                  <p style="font-size: 14px; color: #333; line-height: 1.5;">Revisa tu cuenta bancaria y aprueba la inscripción desde tu panel de administración móvil:</p>
                  <div style="margin: 25px 0; text-align: center;">
                    <a href="https://laquiniela-gamma.vercel.app/admin" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Ir al Panel de Administración
                    </a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="font-size: 11px; color: #888; text-align: center;">Este es un mensaje automático enviado por La Quiniela App.</p>
                </div>
              `
            })
          })
          if (!res.ok) {
            console.error('Error enviando email vía Resend:', await res.text())
          }
        } catch (emailErr) {
          console.error('Error de red enviando email vía Resend:', emailErr)
        }
      }

      // Notificación B: Mensaje de Telegram a tu celular (100% gratuito e instantáneo)
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: `⚽ *Nueva Inscripción Pendiente*\n\n👤 Usuario: \`${userEmail}\`\n📅 Fase: *${phaseName}*\n\nRevisa tu cuenta y aprueba la inscripción en el panel:\nhttps://laquiniela-gamma.vercel.app/admin`,
              parse_mode: 'Markdown'
            })
          })
          if (!res.ok) {
            console.error('Error enviando mensaje a Telegram:', await res.text())
          }
        } catch (tgErr) {
          console.error('Error de red enviando a Telegram:', tgErr)
        }
      }
    })().catch(err => console.error('Error en notificaciones en segundo plano:', err))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al registrar inscripción pendiente:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
