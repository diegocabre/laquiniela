import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const revalidate = 0

export default async function Home() {
  const supabase = await createClient()

  // Calcular el pozo real acumulado de todas las inscripciones pagadas
  const { data: paidEntries } = await supabase
    .from('entries')
    .select('id, phases(entry_fee)')
    .eq('status', 'paid')

  const totalPool = (paidEntries || []).reduce((sum, entry: any) => {
    const fee = Number(entry.phases?.entry_fee || 0)
    return sum + fee
  }, 0)

  const formattedPool = formatCurrency(totalPool)

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Luces de fondo (Efecto Gradiente Premium) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 select-none">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500 blur-[150px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-500 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between border-b border-zinc-900/50 relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="bg-emerald-500 w-2.5 h-2.5 rounded-full animate-ping"></span>
          <span className="text-base sm:text-xl font-black tracking-tight text-white uppercase whitespace-nowrap">La Quiniela</span>
          <span className="hidden sm:inline-flex text-[10px] sm:text-xs text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase whitespace-nowrap">
            by Soluciones DyS
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg whitespace-nowrap"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-350 transition px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.3)] whitespace-nowrap"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-16 py-16 relative z-10">
        
        {/* Fila superior: Texto Hero + Mockup de Octavos */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Texto Hero */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/50 border border-emerald-900/30 text-emerald-400">
              ✨ Apuestas deportivas por fases al estilo Pool/Prode
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              Demuestra tu instinto.<br />
              Conquista el <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pozo Total</span>.
            </h1>
            <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0">
              Regístrate en **La Quiniela**, ingresa a la fase del torneo, haz tus pronósticos de marcador exacto y llévate el 95% del acumulado total si eres el mejor.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto text-center bg-emerald-500 hover:bg-emerald-450 text-zinc-950 font-extrabold px-8 py-4 rounded-xl transition shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] cursor-pointer"
              >
                Comenzar a Jugar
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto text-center border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 text-white font-semibold px-8 py-4 rounded-xl transition hover:border-zinc-700 cursor-pointer"
              >
                Ver Competiciones
              </Link>
            </div>
          </div>

          {/* Mockup de Visualización (Fase en Juego) */}
          <div className="flex-1 w-full max-w-md relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-2xl"></div>
            <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              
              {/* Cabecera del mockup */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Fase Reciente</span>
                  <h3 className="font-extrabold text-white text-lg">Eliminatoria de 32</h3>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900 font-bold">
                  Pozo: {formattedPool}
                </span>
              </div>

              {/* Partido de prueba */}
              <div className="space-y-4">
                <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-900/50 flex flex-col gap-1.5 hover:border-zinc-800 transition">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>ELIMINATORIA DE 32</span>
                    <span className="text-orange-400 font-bold">T. Extra</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Argentina</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 flex items-center justify-center font-black bg-zinc-900 text-white rounded-lg border border-zinc-800">3</span>
                      <span className="text-zinc-650 font-bold">:</span>
                      <span className="w-8 h-8 flex items-center justify-center font-black bg-zinc-900 text-white rounded-lg border border-zinc-800">2</span>
                    </div>
                    <span className="font-bold text-sm text-right">Cabo Verde</span>
                  </div>
                </div>
                
                <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-900/50 flex flex-col gap-1.5 opacity-90 hover:border-zinc-800 transition">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>ELIMINATORIA DE 32</span>
                    <span className="text-zinc-400">Fin</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Colombia</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 flex items-center justify-center font-black bg-zinc-900 text-white rounded-lg border border-zinc-850">1</span>
                      <span className="text-zinc-650 font-bold">:</span>
                      <span className="w-8 h-8 flex items-center justify-center font-black bg-zinc-900 text-white rounded-lg border border-zinc-850">0</span>
                    </div>
                    <span className="font-bold text-sm text-right">Ghana</span>
                  </div>
                </div>
              </div>

              {/* Sistema de puntos explicativo */}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 font-semibold block">Acierto Simple</span>
                  <span className="text-white font-bold block text-sm">+1 Punto</span>
                </div>
                <div className="space-y-1">
                  <span className="text-emerald-500 font-semibold block">Marcador Exacto</span>
                  <span className="text-emerald-400 font-bold block text-sm">+4 Puntos</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Fila Inferior: Resultados Oficiales Eliminatoria de 32 (Solicitado) */}
        <div className="w-full max-w-5xl space-y-6 pt-8 border-t border-zinc-900">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
              🏆 Resultados Oficiales
            </h2>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Eliminatoria de 32 - Partidos Anteriores
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-12 items-stretch">
            {/* Lado Izquierdo: Lista de 4 Partidos */}
            <div className="md:col-span-8 grid gap-4 sm:grid-cols-2">
              
              {/* Partido 1 */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-800 transition">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>⚽ ELIMINATORIA DE 32</span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">Fin Ayer</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-white flex items-center gap-2">🇧🇪 Bélgica</span>
                    <strong className="text-base font-black text-emerald-400">3</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-400 flex items-center gap-2">🇸🇳 Senegal</span>
                    <strong className="text-base font-black text-zinc-500">2</strong>
                  </div>
                </div>
              </div>

              {/* Partido 2 */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-800 transition">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>⚽ ELIMINATORIA DE 32</span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">Fin Mié, 1/7</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-white flex items-center gap-2">🇺🇸 USA</span>
                    <strong className="text-base font-black text-emerald-400">2</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-400 flex items-center gap-2">🇧🇦 Bosnia</span>
                    <strong className="text-base font-black text-zinc-500">0</strong>
                  </div>
                </div>
              </div>

              {/* Partido 3 */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-800 transition">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>⚽ ELIMINATORIA DE 32</span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">Fin Ayer</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-white flex items-center gap-2">🇪🇸 España</span>
                    <strong className="text-base font-black text-emerald-400">3</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-400 flex items-center gap-2">🇦🇹 Austria</span>
                    <strong className="text-base font-black text-zinc-500">0</strong>
                  </div>
                </div>
              </div>

              {/* Partido 4 */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-zinc-800 transition">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                  <span>⚽ ELIMINATORIA DE 32</span>
                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">Fin Ayer</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-white flex items-center gap-2">🇨🇭 Suiza</span>
                    <strong className="text-base font-black text-emerald-400">2</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-400 flex items-center gap-2">🇩🇿 Argelia</span>
                    <strong className="text-base font-black text-zinc-500">0</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Lado Derecho: Logo Banner Premium Soluciones DyS */}
            <div className="md:col-span-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-600/5 p-6 flex flex-col justify-between items-center text-center gap-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Desarrollado Por</span>
                <div className="text-2xl font-black text-white italic tracking-wider flex flex-col">
                  <span>SOLUCIONES</span>
                  <span className="text-amber-400 text-3xl font-black not-italic bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">DyS</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-300">PRODUCTOS ONLINE</p>
                <p>CONSULTORÍAS • SITIOS WEB</p>
              </div>

              <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs py-2 rounded-lg">
                ¡PARTICIPA YA Y DEMUESTRA TU CONOCIMIENTO!
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 border-t border-zinc-900/50 text-center text-xs text-zinc-650 relative z-10 space-y-1">
        <p>UNA PLATAFORMA DE **Soluciones DyS** • TODOS LOS DERECHOS RESERVADOS • 2026</p>
        <p className="text-zinc-700">Juega con responsabilidad. Solo para mayores de 18 años.</p>
      </footer>

    </div>
  )
}
