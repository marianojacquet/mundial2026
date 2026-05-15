import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0ea5e9 0%, transparent 60%), radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 60%)' }}
          />
          <div className="relative max-w-4xl mx-auto px-4 py-28 text-center">
            <div className="text-8xl mb-6">⚽</div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-sky-400 to-blue-300 bg-clip-text text-transparent">
              Mundial 2026
            </h1>
            <p className="text-2xl font-semibold text-slate-200 mb-3">Fixture & Predicciones</p>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Completá tu planilla, predecí los resultados y los extras de cada partido.
              ¡El que más acierte gana premios!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                Registrarse gratis
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-3">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '📋', step: '1', title: 'Registrate', desc: 'Creá tu cuenta gratis en segundos.' },
              { icon: '✅', step: '2', title: 'Solicitá tu planilla', desc: 'Pedí 1 o más fixtures y esperá la aprobación del admin.' },
              { icon: '⚽', step: '3', title: 'Completá el fixture', desc: 'Predecí los resultados de todos los partidos y los extras.' },
              { icon: '🏆', step: '4', title: 'Ganás premios', desc: 'El que más puntos acumule al final del Mundial gana.' },
            ].map(item => (
              <div key={item.step} className="card text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sistema de puntaje */}
        <section className="bg-slate-800/50 py-16">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Sistema de puntaje</h2>
            <div className="space-y-4">
              {[
                { pts: '+2', label: 'Resultado correcto', sub: 'Local gana / Empate / Visitante gana', color: 'text-emerald-400' },
                { pts: '+0.5', label: 'Goles en el primer tiempo', sub: 'Si acertás la cantidad exacta de goles en el 1er tiempo', color: 'text-sky-400' },
                { pts: '+0.5', label: 'Tarjetas acertadas', sub: 'Si acertás la cantidad de tarjetas amarillas o rojas', color: 'text-amber-400' },
                { pts: '0', label: 'Resultado incorrecto', sub: 'Si el resultado que predijiste no se da', color: 'text-slate-500' },
              ].map(item => (
                <div key={item.label} className="card flex items-center gap-4">
                  <span className={`text-3xl font-extrabold w-16 text-center ${item.color}`}>{item.pts}</span>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premios */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">🏆 Ranking & Premios</h2>
          <p className="text-slate-400 mb-10">
            Al finalizar el Mundial se otorgan premios a los 10 primeros del ranking general.
            ¡Podés tener más de una planilla para multiplicar tus chances!
          </p>
          <Link href="/ranking" className="btn-primary text-lg px-8 py-3">
            Ver ranking actual
          </Link>
        </section>

        <footer className="border-t border-slate-800 text-center py-6 text-slate-500 text-sm">
          Mundial 2026 · Fixture & Predicciones · USA · Canadá · México
        </footer>
      </main>
    </>
  )
}
