import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: adminRecord } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  const isAdmin = !!adminRecord

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header / Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/competitions" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="bg-emerald-500 w-3 h-3 rounded-full animate-pulse"></span>
              Quiniela App
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link href="/competitions" className="hover:text-white transition">
                Competiciones
              </Link>
              <Link href="/profile" className="hover:text-white transition">
                Mi Perfil
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-emerald-400 hover:text-emerald-350 transition font-semibold">
                  ⚙️ Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 hidden sm:inline-block">
              {user.email}
            </span>
            <form action={async () => {
              'use server'
              const serverSupabase = await createClient()
              await serverSupabase.auth.signOut()
              redirect('/login')
            }}>
              <button
                type="submit"
                className="text-xs font-semibold text-zinc-400 hover:text-white transition bg-zinc-900 hover:bg-zinc-850 px-3 py-2 rounded-lg border border-zinc-850"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
