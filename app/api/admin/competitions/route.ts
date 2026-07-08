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

    const { name, description, slug, logo_url, is_active = true } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y Slug son campos requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('competitions')
      .insert({
        name,
        description,
        slug,
        logo_url,
        is_active,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al crear competición (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    const { id, name, description, slug, logo_url, is_active } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 })
    }

    const updateFields: any = {}
    if (name !== undefined) updateFields.name = name
    if (description !== undefined) updateFields.description = description
    if (slug !== undefined) updateFields.slug = slug
    if (logo_url !== undefined) updateFields.logo_url = logo_url
    if (is_active !== undefined) updateFields.is_active = is_active

    const { data, error } = await supabase
      .from('competitions')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al actualizar competición (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para eliminar' }, { status: 400 })
    }

    const { error } = await supabase
      .from('competitions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar competición (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}
