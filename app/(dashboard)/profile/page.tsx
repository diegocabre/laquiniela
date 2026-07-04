'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setEmail(user.email || '')

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        if (profileData) {
          setProfile(profileData)
          setUsername(profileData.username)
        }
      } catch (err: any) {
        console.error('Error al cargar perfil:', err)
        setError('No se pudo cargar el perfil.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setMessage('Perfil actualizado con éxito.')
      setProfile((prev) => prev ? { ...prev, username } : null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al actualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-zinc-500 py-12 text-center">Cargando perfil...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Mi Perfil
        </h1>
        <p className="text-zinc-400">
          Administra la información de tu cuenta pública y de autenticación.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 space-y-6">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {message && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-sm text-emerald-400">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-400">
              Correo Electrónico (No editable)
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="block w-full rounded-lg border border-zinc-900 bg-zinc-950/30 px-3.5 py-2.5 text-zinc-500 cursor-not-allowed sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-zinc-400">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 sm:text-sm"
              placeholder="Ej. diego_quiniela"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
