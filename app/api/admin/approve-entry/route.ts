import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar sesión del usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar si el usuario es administrador por su correo
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Prohibido: No tienes permisos de administrador' }, { status: 403 })
    }

    // 3. Obtener el entryId y el nuevo estado (paid o pending)
    const { entryId, status = 'paid' } = await request.json()
    if (!entryId) {
      return NextResponse.json({ error: 'entryId es requerido' }, { status: 400 })
    }

    if (status !== 'paid' && status !== 'pending') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // 4. Actualizar la inscripción con privilegios administrativos
    const updateData: any = {
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
    }

    const { error: updateError } = await supabaseAdmin
      .from('entries')
      .update(updateData)
      .eq('id', entryId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al actualizar inscripción en API de Admin:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar sesión del usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar si el usuario es administrador por base de datos
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminRecord) {
      return NextResponse.json({ error: 'Prohibido: No tienes permisos de administrador' }, { status: 403 })
    }

    // 3. Obtener el entryId de los parámetros de consulta (query params)
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    if (!entryId) {
      return NextResponse.json({ error: 'entryId es requerido' }, { status: 400 })
    }

    // 4. Eliminar la inscripción con privilegios administrativos
    const { error: deleteError } = await supabaseAdmin
      .from('entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar inscripción en API de Admin:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
