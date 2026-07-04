'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface CheckoutButtonProps {
  phaseId: string
  entryFee: number
  status?: 'pending' | 'paid' | 'refunded'
}

export default function CheckoutButton({ phaseId, entryFee, status }: CheckoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Obtener variables de entorno (con fallbacks específicos para Chile)
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Banco de Chile'
  const bankType = process.env.NEXT_PUBLIC_BANK_TYPE || 'Cuenta Corriente'
  const bankNumber = process.env.NEXT_PUBLIC_BANK_NUMBER || '1234567890'
  const bankRut = process.env.NEXT_PUBLIC_BANK_RUT || '12.345.678-9'
  const bankEmail = process.env.NEXT_PUBLIC_BANK_EMAIL || 'pagos@quiniela.com'

  const handleRegisterPending = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/entries/create-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar inscripción')
      
      // Mostrar modal de datos bancarios
      setShowModal(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'paid') {
    return (
      <span className="w-full text-center inline-block text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 py-2 rounded-lg">
        ✓ Inscrito y Pagado
      </span>
    )
  }

  return (
    <div className="w-full">
      {error && <p className="text-xs text-red-500 mb-2 text-center">{error}</p>}
      
      {status === 'pending' ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full text-center bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 text-yellow-450 font-semibold text-sm py-2 rounded-lg transition cursor-pointer"
        >
          ⌛ Pago Pendiente (Ver Datos)
        </button>
      ) : (
        <button
          onClick={handleRegisterPending}
          disabled={loading}
          className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Procesando...' : `Inscribirse (${formatCurrency(Number(entryFee))})`}
        </button>
      )}

      {/* Modal del Pago por Transferencia */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition text-lg"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <span className="text-3xl">🏦</span>
              <h3 className="text-xl font-bold text-white">Datos de Transferencia</h3>
              <p className="text-xs text-zinc-400">
                Realiza la transferencia e indica al administrador para que valide tu inscripción en el sistema.
              </p>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-850 space-y-3 text-sm">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Monto:</span>
                <strong className="text-emerald-400 font-bold text-base">
                  {formatCurrency(Number(entryFee))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Banco:</span>
                <span className="text-white font-semibold">{bankName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Tipo de Cuenta:</span>
                <span className="text-white font-semibold">{bankType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Nº de Cuenta:</span>
                <span className="text-white font-semibold">{bankNumber}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">RUT:</span>
                <span className="text-white font-semibold">{bankRut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email de destino:</span>
                <span className="text-white font-semibold">{bankEmail}</span>
              </div>
            </div>

            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-3 text-xs text-yellow-400">
              <strong>💡 Importante:</strong> Envía el comprobante de transferencia al correo o avisa a tu administrador para que apruebe tu acceso de inmediato.
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm py-2.5 rounded-lg transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
