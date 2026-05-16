import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 60

async function getRanking() {
  // Cada planilla compite individualmente, ordenadas por puntaje
  const ranking = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { totalScore: 'desc' },
  })

  const prizes        = await prisma.prize.findMany({ orderBy: { position: 'asc' } })
  const totalMatches  = await prisma.match.count()
  const playedMatches = await prisma.match.count({ where: { played: true } })

  return { ranking, prizes, totalMatches, playedMatches }
}

const MEDALS          = ['🥇', '🥈', '🥉']
const POSITION_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']
const PODIUM_HEIGHTS  = ['h-36', 'h-28', 'h-20'] // 1°, 2°, 3°

export default async function RankingPage() {
  const { ranking, prizes, totalMatches, playedMatches } = await getRanking()

  const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0
  const top3     = ranking.slice(0, 3)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2">🏆 Ranking Mundial 2026</h1>
          <p className="text-slate-400 mb-1">
            {ranking.length} planilla{ranking.length !== 1 ? 's' : ''} en competencia
          </p>
          <p className="text-slate-500 text-sm mb-3">
            Progreso del torneo: {playedMatches}/{totalMatches} partidos jugados ({progress}%)
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
            <p className="text-sm">Los puntajes aparecen cuando los usuarios envían sus planillas y el torneo avanza.</p>
          </div>
        ) : (
          <>
            {/* ── Podio Top 3 ─────────────────────────────────────────────── */}
            {top3.length >= 2 && (
              <div className="flex justify-center items-end gap-4 mb-10">
                {[1, 0, 2].map(idx => {
                  const entry = top3[idx]
                  if (!entry) return null
                  const rank  = idx + 1
                  const prize = prizes.find(p => p.position === rank)
                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}
                    >
                      <div className="text-3xl mb-1">{MEDALS[rank - 1]}</div>
                      <p className="font-bold text-sm text-center max-w-[90px] truncate">{entry.user.name}</p>
                      <p className="text-xs text-slate-400 mb-1 max-w-[90px] truncate">{entry.name}</p>
                      <p className={`text-lg font-extrabold mb-2 ${POSITION_COLORS[rank - 1]}`}>
                        {entry.totalScore.toFixed(1)} pts
                      </p>
                      <div className={`${PODIUM_HEIGHTS[rank - 1]} w-24 rounded-t-lg flex items-start justify-center pt-2
                        ${rank === 1
                          ? 'bg-gradient-to-t from-yellow-700 to-yellow-500'
                          : rank === 2
                          ? 'bg-gradient-to-t from-slate-600 to-slate-400'
                          : 'bg-gradient-to-t from-amber-800 to-amber-600'}`}>
                        <span className={`text-2xl font-extrabold ${POSITION_COLORS[rank - 1]}`}>#{rank}</span>
                      </div>
                      {prize && (
                        <p className="text-xs text-center text-sky-400 mt-2 max-w-[90px]">
                          {prize.emoji} {prize.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Tabla completa ───────────────────────────────────────────── */}
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
                <h2 className="font-bold text-lg flex-1">Ranking general</h2>
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
                    <th className="table-header text-left hidden md:table-cell">Premio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {ranking.map((f, i) => {
                    const rank  = i + 1
                    const prize = prizes.find(p => p.position === rank)
                    return (
                      <tr
                        key={f.id}
                        className={`transition-colors ${rank <= 3 ? 'bg-slate-800/40' : 'hover:bg-slate-700/20'}`}
                      >
                        <td className="table-cell text-center">
                          {rank <= 3
                            ? <span className="text-xl">{MEDALS[rank - 1]}</span>
                            : <span className={`font-mono font-bold ${rank <= 10 ? 'text-sky-400' : 'text-slate-500'}`}>
                                #{rank}
                              </span>}
                        </td>
                        <td className="table-cell font-medium">{f.user.name}</td>
                        <td className="table-cell text-slate-400 text-sm hidden sm:table-cell">
                          <Link
                            href={`/dashboard/fixtures/${f.id}`}
                            className="hover:text-sky-400 transition-colors"
                          >
                            {f.name}
                          </Link>
                        </td>
                        <td className="table-cell text-right">
                          <span className={`font-bold text-lg
                            ${rank === 1 ? 'text-yellow-400'
                            : rank === 2 ? 'text-slate-300'
                            : rank === 3 ? 'text-amber-500'
                            : rank <= 10 ? 'text-sky-400'
                            : 'text-slate-300'}`}>
                            {f.totalScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="table-cell text-sm hidden md:table-cell">
                          {prize
                            ? <span className="text-emerald-400">{prize.emoji} {prize.description}</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-center text-slate-600 text-xs mt-4">
              Cada planilla compite de forma independiente. Un mismo participante puede tener
              varias planillas en distintas posiciones del ranking.
            </p>
          </>
        )}
      </main>
    </>
  )
}
