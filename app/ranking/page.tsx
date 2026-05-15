import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 60

async function getRanking() {
  const topFixtures = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { totalScore: 'desc' },
    take: 100,
  })

  // Mejor planilla por usuario (top 10 usuarios)
  const byUser = new Map<string, typeof topFixtures[0]>()
  for (const f of topFixtures) {
    if (!byUser.has(f.userId)) byUser.set(f.userId, f)
  }
  const rankingByUser = Array.from(byUser.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)

  // Todas las planillas (top 50)
  const allFixtures = [...topFixtures]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 50)

  const prizes = await prisma.prize.findMany({ orderBy: { position: 'asc' } })
  const totalMatches = await prisma.match.count()
  const playedMatches = await prisma.match.count({ where: { played: true } })

  return { rankingByUser, allFixtures, prizes, totalMatches, playedMatches }
}

const MEDALS = ['🥇', '🥈', '🥉']
const POSITION_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export default async function RankingPage() {
  const { rankingByUser, allFixtures, prizes, totalMatches, playedMatches } = await getRanking()

  const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2">🏆 Ranking Mundial 2026</h1>
          <p className="text-slate-400">
            Progreso del torneo: {playedMatches}/{totalMatches} partidos jugados ({progress}%)
          </p>
          <div className="mt-3 mx-auto max-w-xs bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {rankingByUser.length === 0 ? (
          <div className="card text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-xl font-medium mb-2">El ranking aún está vacío</p>
            <p className="text-sm">Los puntajes aparecen cuando los usuarios envían sus planillas y el torneo avanza.</p>
          </div>
        ) : (
          <>
            {/* Podio Top 3 */}
            {rankingByUser.length >= 3 && (
              <div className="flex justify-center items-end gap-4 mb-10">
                {[1, 0, 2].map(idx => {
                  const entry = rankingByUser[idx]
                  if (!entry) return null
                  const rank = idx + 1
                  const heights = ['h-28', 'h-36', 'h-20']
                  const prize = prizes.find(p => p.position === rank)
                  return (
                    <div key={entry.id} className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                      <div className="text-3xl mb-1">{MEDALS[rank - 1]}</div>
                      <p className="font-bold text-sm">{entry.user.name}</p>
                      <p className="text-xs text-slate-400 mb-2">{entry.totalScore.toFixed(1)} pts</p>
                      <div className={`${heights[rank - 1]} w-24 bg-gradient-to-t
                        ${rank === 1 ? 'from-yellow-700 to-yellow-500' : rank === 2 ? 'from-slate-600 to-slate-400' : 'from-amber-800 to-amber-600'}
                        rounded-t-lg flex items-start justify-center pt-2`}>
                        <span className={`text-2xl font-extrabold ${POSITION_COLORS[rank - 1]}`}>#{rank}</span>
                      </div>
                      {prize && <p className="text-xs text-center text-sky-400 mt-1 max-w-[7rem]">{prize.description}</p>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tabla Top 10 */}
            <div className="card overflow-hidden p-0 mb-8">
              <div className="px-5 py-4 border-b border-slate-700">
                <h2 className="font-bold text-lg">Top 10 - Mejor planilla por usuario</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="table-header text-center w-12">#</th>
                    <th className="table-header text-left">Participante</th>
                    <th className="table-header text-left">Planilla</th>
                    <th className="table-header text-right">Puntaje</th>
                    <th className="table-header text-left">Premio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {rankingByUser.map((f, i) => {
                    const rank = i + 1
                    const prize = prizes.find(p => p.position === rank)
                    return (
                      <tr key={f.id} className={`hover:bg-slate-700/30 transition-colors ${rank <= 3 ? 'bg-slate-800/50' : ''}`}>
                        <td className="table-cell text-center">
                          <span className={`font-extrabold ${POSITION_COLORS[i] ?? 'text-slate-400'}`}>
                            {rank <= 3 ? MEDALS[i] : `#${rank}`}
                          </span>
                        </td>
                        <td className="table-cell font-medium">{f.user.name}</td>
                        <td className="table-cell text-slate-400 text-sm">{f.name}</td>
                        <td className="table-cell text-right font-bold text-sky-400">{f.totalScore.toFixed(1)}</td>
                        <td className="table-cell text-sm">
                          {prize
                            ? <span className="text-emerald-400">{prize.emoji} {prize.description}</span>
                            : <span className="text-slate-500">-</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Ranking completo de planillas */}
            {allFixtures.length > 0 && (
              <div className="card overflow-hidden p-0">
                <div className="px-5 py-4 border-b border-slate-700">
                  <h2 className="font-bold text-lg">Ranking completo de planillas</h2>
                  <p className="text-slate-400 text-sm">Top {allFixtures.length} planillas</p>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="table-header text-center w-12">#</th>
                      <th className="table-header text-left">Participante</th>
                      <th className="table-header text-left">Planilla</th>
                      <th className="table-header text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {allFixtures.map((f, i) => (
                      <tr key={f.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="table-cell text-center text-slate-400 font-mono">#{i + 1}</td>
                        <td className="table-cell font-medium">{f.user.name}</td>
                        <td className="table-cell text-slate-400 text-sm">{f.name}</td>
                        <td className="table-cell text-right font-bold text-sky-400">{f.totalScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
