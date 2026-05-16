'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

type RankingEntry = {
  position: number
  userId: string
  userName: string
  fixtureName: string
  fixtureId: string | null
  totalScore: number
  isCurrentUser: boolean
}

type Group = {
  id: string
  name: string
  description?: string
}

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_COLORS = [
  'from-yellow-700 to-yellow-500',
  'from-slate-600 to-slate-400',
  'from-amber-800 to-amber-600',
]
const SCORE_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-500']

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup]     = useState<Group | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setGroup(d.group)
        setRanking(d.ranking)
        setLoading(false)
      })
  }, [id])

  const top3 = ranking.slice(0, 3)

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/groups" className="text-sm text-slate-400 hover:text-sky-400 mb-4 inline-block">
          ← Mis Grupos
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="w-10 h-10" /></div>
        ) : error ? (
          <Alert type="error">{error}</Alert>
        ) : (
          <>
            {/* Header del grupo */}
            <div className="mb-8 text-center">
              <div className="text-5xl mb-3">👥</div>
              <h1 className="text-3xl font-extrabold">{group?.name}</h1>
              {group?.description && <p className="text-slate-400 mt-2">{group.description}</p>}
              <p className="text-slate-500 text-sm mt-1">{ranking.length} participantes</p>
            </div>

            {/* Podio Top 3 */}
            {top3.length >= 2 && (
              <div className="flex justify-center items-end gap-3 mb-10">
                {[1, 0, 2].map(idx => {
                  const entry = top3[idx]
                  if (!entry) return null
                  const rank    = idx + 1
                  const heights = ['h-28', 'h-36', 'h-20']
                  return (
                    <div key={entry.userId}
                      className={`flex flex-col items-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                      <div className="text-3xl mb-1">{MEDALS[rank - 1]}</div>
                      <p className={`font-bold text-sm text-center max-w-[80px] truncate
                        ${entry.isCurrentUser ? 'text-sky-400' : 'text-white'}`}>
                        {entry.isCurrentUser ? 'Vos' : entry.userName}
                      </p>
                      <p className="text-xs text-slate-400 mb-2">{entry.totalScore.toFixed(1)} pts</p>
                      <div className={`${heights[rank - 1]} w-20 bg-gradient-to-t ${PODIUM_COLORS[rank - 1]}
                        rounded-t-lg flex items-start justify-center pt-2`}>
                        <span className={`text-xl font-extrabold ${SCORE_COLORS[rank - 1]}`}>#{rank}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tabla completa */}
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-4 border-b border-slate-700">
                <h2 className="font-bold text-lg">Ranking del grupo</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="table-header text-center w-12">#</th>
                    <th className="table-header text-left">Participante</th>
                    <th className="table-header text-left hidden sm:table-cell">Mejor planilla</th>
                    <th className="table-header text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {ranking.map(entry => (
                    <tr key={entry.userId}
                      className={`transition-colors
                        ${entry.isCurrentUser ? 'bg-sky-950/30' : 'hover:bg-slate-700/20'}`}>
                      <td className="table-cell text-center">
                        {entry.position <= 3
                          ? <span className="text-lg">{MEDALS[entry.position - 1]}</span>
                          : <span className="text-slate-400 font-mono">#{entry.position}</span>}
                      </td>
                      <td className="table-cell">
                        <span className={`font-medium ${entry.isCurrentUser ? 'text-sky-400' : ''}`}>
                          {entry.userName}
                          {entry.isCurrentUser && <span className="ml-2 text-xs text-sky-500">(vos)</span>}
                        </span>
                      </td>
                      <td className="table-cell text-slate-400 text-sm hidden sm:table-cell">
                        {entry.fixtureId
                          ? <Link href={`/dashboard/fixtures/${entry.fixtureId}`}
                              className="hover:text-sky-400 transition-colors">
                              {entry.fixtureName}
                            </Link>
                          : <span className="text-slate-600">Sin planilla enviada</span>}
                      </td>
                      <td className="table-cell text-right">
                        <span className={`font-bold text-lg
                          ${entry.position === 1 ? 'text-yellow-400'
                          : entry.position === 2 ? 'text-slate-300'
                          : entry.position === 3 ? 'text-amber-500'
                          : 'text-sky-400'}`}>
                          {entry.totalScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leyenda Top 3 */}
            {ranking.length >= 3 && (
              <div className="mt-6 card">
                <h3 className="font-semibold mb-3">🏆 Top 3 del grupo</h3>
                <div className="space-y-2">
                  {ranking.slice(0, 3).map((e, i) => (
                    <div key={e.userId} className="flex items-center gap-3">
                      <span className="text-xl">{MEDALS[i]}</span>
                      <span className={`font-medium ${e.isCurrentUser ? 'text-sky-400' : 'text-white'}`}>
                        {e.userName}
                      </span>
                      <span className="text-slate-400 text-sm ml-auto">{e.totalScore.toFixed(1)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
