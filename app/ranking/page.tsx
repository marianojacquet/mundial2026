import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { calcPozoGeneral, formatPesos } from '@/lib/prizes'

export const dynamic = 'force-dynamic'
export const revalidate = 60

async function getRanking() {
  const ranking = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { totalScore: 'desc' },
  })

  const totalMatches  = await prisma.match.count()
  const playedMatches = await prisma.match.count({ where: { played: true } })

  return { ranking, totalMatches, playedMatches }
}

export default async function RankingPage() {
  const { ranking, totalMatches, playedMatches } = await getRanking()

  const progress    = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0
  const pozoGeneral = calcPozoGeneral(ranking.length)
  const winner      = ranking[0] ?? null

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2">🏆 Ranking Mundial 2026</h1>
          <p className="text-slate-400 mb-1">
            {ranking.length} planilla{ranking.length !== 1 ? 's' : ''} en competencia · 1 solo ganador
          </p>
          <p className="text-slate-500 text-sm mb-3">
            Progreso: {playedMatches}/{totalMatches} partidos jugados ({progress}%)
          </p>
          <div className="mx-auto max-w-xs bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="card text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-xl font-medium mb-2">El ranking aún está vacío</p>
            <p className="text-sm">Los puntajes aparecen cuando los usuarios envían sus planillas.</p>
          </div>
        ) : (
          <>
            {/* Pozo acumulado */}
            <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20
                            border-2 border-yellow-500/50 rounded-2xl p-6 mb-8 text-center
                            shadow-lg shadow-yellow-900/20">
              <p className="text-yellow-300 text-sm font-semibold uppercase tracking-widest mb-1">
                Premio acumulado — 1 solo ganador
              </p>
              <p className="text-6xl font-black text-yellow-400">{formatPesos(pozoGeneral)}</p>
              <p className="text-yellow-700 text-sm mt-2">
                {ranking.length} planillas × {formatPesos(800)} · crece con cada nueva inscripción
              </p>
            </div>

            {/* Ganador actual */}
            {winner && (
              <div className="card border-yellow-600/50 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 mb-6 p-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-5xl">🥇</div>
                  <div className="flex-1">
                    <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider mb-1">
                      Líder actual — {progress < 100 ? 'el torneo sigue en juego' : '¡Ganador del torneo!'}
                    </p>
                    <p className="text-2xl font-extrabold text-white">{winner.user.name}</p>
                    <p className="text-slate-400 text-sm">
                      <Link href={`/ranking/fixtures/${winner.id}`} className="hover:text-sky-400 transition-colors">
                        {winner.name}
                      </Link>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold text-yellow-400">{winner.totalScore.toFixed(1)}</p>
                    <p className="text-yellow-600 text-sm">puntos</p>
                    {progress === 100 && (
                      <p className="text-emerald-400 font-bold text-sm mt-1">
                        Gana {formatPesos(pozoGeneral)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla completa */}
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
                <h2 className="font-bold text-lg flex-1">Ranking completo</h2>
                <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                  cada planilla compite por separado
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="table-header text-center w-14">#</th>
                    <th className="table-header text-left">Participante</th>
                    <th className="table-header text-left hidden sm:table-cell">Planilla</th>
                    <th className="table-header text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {ranking.map((f, i) => {
                    const isWinner = i === 0
                    return (
                      <tr key={f.id} className={`transition-colors
                        ${isWinner ? 'bg-yellow-900/20' : 'hover:bg-slate-700/20'}`}>
                        <td className="table-cell text-center">
                          {isWinner
                            ? <span className="text-xl">🥇</span>
                            : <span className="text-slate-500 font-mono text-sm">#{i + 1}</span>}
                        </td>
                        <td className="table-cell font-medium">
                          {f.user.name}
                          {isWinner && (
                            <span className="ml-2 text-xs text-yellow-500 font-semibold">líder</span>
                          )}
                        </td>
                        <td className="table-cell text-slate-400 text-sm hidden sm:table-cell">
                          <Link href={`/ranking/fixtures/${f.id}`} className="hover:text-sky-400 transition-colors">
                            {f.name}
                          </Link>
                        </td>
                        <td className="table-cell text-right">
                          <span className={`font-bold text-lg ${isWinner ? 'text-yellow-400' : 'text-slate-300'}`}>
                            {f.totalScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-center text-slate-600 text-xs mt-4">
              El ranking se actualiza automáticamente con cada resultado cargado.
              Al finalizar el torneo, el puesto #1 gana {formatPesos(pozoGeneral)}.
            </p>
          </>
        )}
      </main>
    </>
  )
}
