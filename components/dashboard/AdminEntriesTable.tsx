'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface AdminEntriesTableProps {
  initialEntries: any[]
}

export default function AdminEntriesTable({ initialEntries }: AdminEntriesTableProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateStatus = async (entryId: string, newStatus: 'paid' | 'pending') => {
    setLoadingId(entryId)
    setError(null)
    try {
      const res = await fetch('/api/admin/approve-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ocurrió un error al actualizar el estado')

      // Actualizar estado local
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null }
            : e
        )
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta inscripción?')) return

    setLoadingId(entryId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/approve-entry?entryId=${entryId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ocurrió un error al eliminar')

      // Remover de la tabla local
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-900/50 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No se encontraron inscripciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/10">
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Competición / Fase</th>
                  <th className="py-4 px-6">Costo</th>
                  <th className="py-4 px-6">Fecha Registro</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {entries.map((entry) => {
                  const isPending = entry.status === 'pending'
                  const isPaid = entry.status === 'paid'

                  return (
                    <tr key={entry.id} className="hover:bg-zinc-900/10 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">
                          {entry.profiles?.username || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-zinc-500">{entry.profiles?.id}</div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-zinc-300 font-medium">
                          {entry.phases?.competitions?.name || 'Torneo'}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {entry.phases?.name || 'Fase'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-zinc-300 font-bold">
                        {formatCurrency(Number(entry.phases?.entry_fee || 0))}
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-500">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            isPaid
                              ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400'
                              : isPending
                              ? 'bg-yellow-950/40 border-yellow-900/50 text-yellow-400 animate-pulse'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isPaid ? 'Pagado' : isPending ? 'Pendiente' : entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                        {isPending ? (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, 'paid')}
                            disabled={loadingId === entry.id}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            {loadingId === entry.id ? 'Aprobando...' : 'Aprobar Pago'}
                          </button>
                        ) : isPaid ? (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, 'pending')}
                            disabled={loadingId === entry.id}
                            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            {loadingId === entry.id ? 'Cambiando...' : 'Marcar Pendiente'}
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={loadingId === entry.id}
                          className="border border-red-900/30 hover:border-red-900 bg-red-950/10 hover:bg-red-950/40 text-red-400 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {loadingId === entry.id ? 'Eliminando...' : '🗑️ Eliminar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
