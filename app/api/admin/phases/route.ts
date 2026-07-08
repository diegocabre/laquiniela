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

    const { competition_id, name, slug, entry_fee, status = 'draft', start_at, end_at } = await request.json()

    if (!competition_id || !name || !slug) {
      return NextResponse.json({ error: 'Competición, Nombre y Slug son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('phases')
      .insert({
        competition_id,
        name,
        slug,
        entry_fee: Number(entry_fee || 0),
        status,
        start_at: start_at || null,
        end_at: end_at || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al crear fase (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    if (!(await isAdminUser(supabase))) {
      return NextResponse.json({ error: 'No autorizado: Se requiere rol de administrador' }, { status: 403 })
    }

    const { id, name, slug, entry_fee, status, start_at, end_at, highlighted_in_hero } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 })
    }

    const updateFields: any = {}
    if (name !== undefined) updateFields.name = name
    if (slug !== undefined) updateFields.slug = slug
    if (entry_fee !== undefined) updateFields.entry_fee = Number(entry_fee)
    if (status !== undefined) updateFields.status = status
    if (start_at !== undefined) updateFields.start_at = start_at || null
    if (end_at !== undefined) updateFields.end_at = end_at || null
    if (highlighted_in_hero !== undefined) updateFields.highlighted_in_hero = highlighted_in_hero

    const { data, error } = await supabase
      .from('phases')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error al actualizar fase (Admin):', error)
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
      .from('phases')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar fase (Admin):', error)
    return NextResponse.json({ error: error.message || 'Error de servidor' }, { status: 500 })
  }
}
