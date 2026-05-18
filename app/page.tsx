import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/db'
import { calcPozoGeneral, calcPozoGrupo, formatPesos, PRECIO_PLANILLA } from '@/lib/prizes'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const [users, fixtures] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.fixture.count({ where: { status: { in: ['SUBMITTED', 'SCORED'] } } }),
    ])
    return { users, fixtures }
  } catch {
    return { users: 0, fixtures: 0 }
  }
}

export default async function Home() {
  const { users, fixtures } = await getStats()
  const pozoGeneral = calcPozoGeneral(fixtures)

  return (
    <>
      <Navbar />
      <main className="min-h-screen">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at 20% 60%, rgba(14,165,233,0.15) 0%, transparent 60%),
                                radial-gradient(ellipse at 80% 40%, rgba(99,102,241,0.15) 0%, transparent 60%)`,
            }}
          />
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px),
                                repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.3) 60px, rgba(255,255,255,0.3) 61px)`,
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-36 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-900/50 border border-sky-700 rounded-full px-4 py-1.5 text-sky-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </span>
              Inscripciones abiertas · USA · Canada · Mexico 2026
            </div>

            {/* Titulo */}
            <h1 className="text-5xl md:text-8xl font-black mb-4 leading-none">
              <span className="bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent">
                MUNDIAL
              </span>
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                2026
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-bold text-white mb-3">
              ⚽ Fixture & Predicciones
            </p>
            <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Predecí los resultados de los <strong className="text-white">104 partidos</strong>,
              competí con amigos y ganá premios reales.
              <strong className="text-yellow-400"> El que más acierte se lleva todo.</strong>
            </p>

            {/* Pozo acumulado — el gran atractivo */}
            {fixtures > 0 && (
              <div className="inline-block mb-10">
                <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20
                                border-2 border-yellow-500/50 rounded-2xl px-8 py-5
                                shadow-lg shadow-yellow-900/30">
                  <p className="text-yellow-300 text-sm font-semibold uppercase tracking-widest mb-1">
                    🏆 Premio acumulado
                  </p>
                  <p className="text-5xl md:text-6xl font-black text-yellow-400 leading-none">
                    {formatPesos(pozoGeneral)}
                  </p>
                  <p className="text-yellow-600 text-xs mt-2">
                    {fixtures} planilla{fixtures !== 1 ? 's' : ''} × {formatPesos(800)} c/u · crece con cada nueva inscripción
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register"
                className="group relative overflow-hidden btn bg-gradient-to-r from-sky-500 to-blue-600
                           hover:from-sky-400 hover:to-blue-500 text-white text-lg font-bold px-10 py-4
                           shadow-lg shadow-sky-900/50 hover:shadow-sky-700/50 transition-all duration-200">
                <span className="relative z-10">🚀 Anotarme ahora</span>
              </Link>
              <Link href="/ranking"
                className="btn bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg px-10 py-4 backdrop-blur">
                📊 Ver ranking
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-center flex-wrap">
              <div>
                <p className="text-3xl font-extrabold text-sky-400">{users}</p>
                <p className="text-slate-400 text-sm">participante{users !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-3xl font-extrabold text-emerald-400">{fixtures}</p>
                <p className="text-slate-400 text-sm">planilla{fixtures !== 1 ? 's' : ''} inscripta{fixtures !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-3xl font-extrabold text-yellow-400">104</p>
                <p className="text-slate-400 text-sm">partidos</p>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <p className="text-3xl font-extrabold text-white">{formatPesos(PRECIO_PLANILLA)}</p>
                <p className="text-slate-400 text-sm">por planilla</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PREMIO ────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-yellow-950/50 to-amber-950/50 border-y border-yellow-800/30 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold mb-2">🏆 Un solo ganador. Todo el pozo.</h2>
            <p className="text-slate-400 mb-10">El que más puntos acumule al terminar el Mundial se lleva todo</p>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="card border-yellow-800/50 bg-yellow-900/10">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="font-bold text-lg text-yellow-400 mb-1">Ranking general</h3>
                <p className="text-slate-400 text-sm mb-3">1 ganador entre todas las planillas</p>
                <p className="text-2xl font-extrabold text-yellow-400">
                  {fixtures > 0 ? formatPesos(pozoGeneral) : formatPesos(800) + ' por planilla'}
                </p>
                {fixtures > 0 && <p className="text-yellow-700 text-xs mt-1">y sigue creciendo</p>}
              </div>

              <div className="card border-sky-800/50 bg-sky-900/10">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="font-bold text-lg text-sky-400 mb-1">Premio de grupo</h3>
                <p className="text-slate-400 text-sm mb-3">1 ganador por grupo · mín. 10 planillas</p>
                <p className="text-2xl font-extrabold text-sky-400">{formatPesos(400)}</p>
                <p className="text-sky-700 text-xs mt-1">por cada planilla del grupo</p>
              </div>

              <div className="card border-emerald-800/50 bg-emerald-900/10">
                <div className="text-4xl mb-3">🎁</div>
                <h3 className="font-bold text-lg text-emerald-400 mb-1">Formador de grupo</h3>
                <p className="text-slate-400 text-sm mb-3">Armá un grupo y ganás por cada miembro</p>
                <p className="text-2xl font-extrabold text-emerald-400">{formatPesos(300)}</p>
                <p className="text-emerald-700 text-xs mt-1">por cada planilla de tu grupo</p>
              </div>
            </div>

            <p className="text-slate-500 text-sm mt-8">
              Cada planilla compite individualmente. Comprando más tenés más chances, pero hay que acertar.
            </p>
          </div>
        </section>

        {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-extrabold text-center mb-2">¿Cómo funciona?</h2>
          <p className="text-slate-400 text-center mb-12">En 4 pasos simples</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📝', step: '1', title: 'Te anotás', desc: 'Creás tu cuenta gratis con email y contraseña.' },
              { icon: '✅', step: '2', title: 'Pedís tu planilla', desc: `Solicitás 1 o más planillas a ${formatPesos(PRECIO_PLANILLA)} c/u.` },
              { icon: '⚽', step: '3', title: 'Completás el fixture', desc: 'Predecís el resultado de los 104 partidos y los extras.' },
              { icon: '🏆', step: '4', title: 'Ganás el pozo', desc: 'El que más puntos acumule al final del Mundial gana todo.' },
            ].map(item => (
              <div key={item.step} className="card text-center hover:border-sky-600 transition-colors">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600
                                text-white text-sm font-extrabold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PUNTAJE ───────────────────────────────────────────────────── */}
        <section className="bg-slate-800/40 border-y border-slate-700/50 py-16">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-center mb-2">Sistema de puntaje</h2>
            <p className="text-slate-400 text-center mb-10">Cada partido vale puntos. Los extras te dan ventaja</p>
            <div className="space-y-3">
              {[
                { pts: '+2',   color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800', label: 'Resultado correcto',    sub: 'Adivinás si gana el local, hay empate o gana el visitante' },
                { pts: '+0.5', color: 'text-sky-400',     bg: 'bg-sky-900/30 border-sky-800',         label: 'Goles en el 1° tiempo', sub: 'Extra opcional: cuántos goles se hacen en el primer tiempo' },
                { pts: '+0.5', color: 'text-amber-400',   bg: 'bg-amber-900/30 border-amber-800',     label: 'Tarjetas acertadas',     sub: 'Extra opcional: cuántas tarjetas amarillas o rojas habrá' },
                { pts: '0',    color: 'text-slate-500',   bg: 'bg-slate-800 border-slate-700',        label: 'Resultado incorrecto',   sub: 'Si te equivocás en el resultado no sumás puntos' },
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-5 rounded-xl p-4 border ${item.bg}`}>
                  <span className={`text-3xl font-black w-16 text-center shrink-0 ${item.color}`}>{item.pts}</span>
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-slate-400 text-sm">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-6">
              Máximo posible: <span className="text-white font-semibold">312 puntos</span> con los 104 partidos perfectos
            </p>
          </div>
        </section>

        {/* ── GRUPOS ────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 py-20">
          <div className="card bg-gradient-to-br from-slate-800 to-slate-800/50 border-sky-800/50 text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-3xl font-extrabold mb-3">Armá tu grupo y ganás doble</h2>
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-4">
              Competís en el ranking general <strong className="text-white">y</strong> en tu grupo privado.
              El ganador del grupo se lleva el pozo del grupo. El formador cobra <strong className="text-emerald-400">{formatPesos(300)} por cada planilla</strong> de su grupo.
            </p>
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              {[
                { icon: '👨‍👩‍👧‍👦', label: 'Familia' },
                { icon: '💼', label: 'Trabajo' },
                { icon: '🎓', label: 'Amigos' },
              ].map(g => (
                <div key={g.label} className="text-center">
                  <div className="text-4xl mb-1">{g.icon}</div>
                  <p className="text-slate-400 text-sm">{g.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 max-w-sm mx-auto mb-6 text-sm">
              <p className="text-slate-400">Ejemplo: grupo de <strong className="text-white">20 personas</strong></p>
              <p className="text-emerald-400 font-bold mt-1">→ Premio del ganador: {formatPesos(calcPozoGrupo(20))}</p>
              <p className="text-sky-400 font-bold">→ Formador cobra: {formatPesos(300 * 20)}</p>
            </div>
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              Quiero participar
            </Link>
          </div>
        </section>

        {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-sky-600 to-blue-700 py-20">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 0%, transparent 70%)' }} />
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <div className="text-6xl mb-4">⚽</div>
            <h2 className="text-4xl font-extrabold text-white mb-3">
              ¡Las inscripciones están abiertas!
            </h2>
            <p className="text-sky-100 text-lg mb-2">
              El Mundial empieza el <strong>11 de junio de 2026</strong>.
            </p>
            {fixtures > 0 && (
              <p className="text-yellow-300 text-2xl font-extrabold mb-6">
                Premio acumulado: {formatPesos(pozoGeneral)} 🏆
              </p>
            )}
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-extrabold
                         text-xl px-10 py-4 rounded-xl hover:bg-sky-50 transition-colors shadow-xl">
              🚀 Registrarme — {formatPesos(PRECIO_PLANILLA)}
            </Link>
            <p className="text-sky-200 text-sm mt-4">El pozo crece con cada nueva planilla inscripta.</p>
          </div>
        </section>

        <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
          <p className="mb-1">⚽ Mundial 2026 — Fixture & Predicciones</p>
          <p>USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽 · 11 Junio – 19 Julio 2026</p>
        </footer>

      </main>
    </>
  )
}
