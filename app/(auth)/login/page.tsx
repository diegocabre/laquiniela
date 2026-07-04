'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      router.push('/competitions')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oAuthError) {
      setError(oAuthError.message)
    }
  }

  return (
    <div>
      <div className="flex justify-start mb-6">
        <Link href="/" className="text-xs font-semibold text-zinc-500 hover:text-zinc-355 transition">
          ← Volver al inicio
        </Link>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-medium text-emerald-500 hover:text-emerald-400">
            Regístrate aquí
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {error && (
          <div className="rounded-lg bg-red-950/50 p-4 text-sm text-red-400 border border-red-800/50">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              placeholder="Correo electrónico"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:z-10 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              placeholder="Contraseña"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative flex justify-center text-xs uppercase my-4">
          <span className="bg-zinc-900 px-2 text-zinc-500">O continuar con</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-900 transition focus:outline-none cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.56,11.41 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.19l-3.3,-2.57c-0.9,0.6 -2.08,0.97 -3.26,0.97 -2.34,0 -4.33,-1.58 -5.04,-3.71H2.94v2.66C4.43,18.71 8.01,20.6 12,20.6z" fill="#34A853" />
              <path d="M6.96,13.1c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7s0.1,-1.16 0.28,-1.7V7.04H2.94C2.33,8.25 2,9.6 2,11.4s0.33,3.15 0.94,4.36L6.96,13.1z" fill="#FBBC05" />
              <path d="M12,5.2c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.42,1.6 12,1.6 8.01,1.6 4.43,3.49 2.94,6.54l4.02,3.12C7.67,6.78 9.66,5.2 12,5.2z" fill="#EA4335" />
            </g>
          </svg>
          Google
        </button>
      </div>
    </div>
  )
}
