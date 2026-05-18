'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'

type RankingEntry = {
  position:      number
  userId:        string
  userName:      string
  fixtureName:   string
  fixtureId:     string | null
  totalScore:    number
  isCurrentUser: boolean
}

type Group = { id: string; name: string; description?: string }

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const [group,             setGroup]             = useState<Group | null>(null)
  const [ranking,           setRanking]           = useState<RankingEntry[]>([])
  const [pozoGrupo,         setPozoGrupo]         = useState(0)
  const [incentivoFormador, setIncentivoFormador] = useState(0)
  const [totalFixtures,     setTotalFixtures]     = useState(0)
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState('')

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setGroup(d.group)
        setRanking(d.ranking)
        setPozoGrupo(d.pozoGrupo ?? 0)
        setIncentivoFormador(d.incentivoFormador ?? 0)
        setTotalFixtures(d.totalFixturesInGroup ?? 0)
        setLoading(false)
      })
  }, [id])

  const winner = ranking[0] ?? null
  const MIN_FIXTURES = 10

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
            <div className="mb-6 text-center">
              <div className="text-5xl mb-3">👥</div>
              <h1 className="text-3xl font-extrabold">{group?.name}</h1>
              {group?.description && <p className="text-slate-400 mt-2">{group.description}</p>}
              <p className="text-slate-500 text-sm mt-1">
                {totalFixtures} planilla{totalFixtures !== 1 ? 's' : ''} · 1 solo ganador
              </p>
            </div>

            {/* Pozo del grupo */}
            {totalFixtures >= MIN_FIXTURES ? (
              <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20
                              border-2 border-yellow-500/50 rounded-2xl p-5 mb-6 text-center">
                <p className="text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-1">
                  🏆 Hay un pozo en juego
                </p>
                <p className="text-2xl font-black text-white">El ganador se lleva todo</p>
                <p className="text-yellow-700 text-sm mt-1">
                  {totalFixtures} planilla{totalFixtures !== 1 ? 's' : ''} · cuantas más entren, más grande el pozo
                </p>
              </div>
            ) : (
              <div className="card border-amber-800/50 bg-amber-900/10 mb-6 text-center py-4">
                <p className="text-amber-400 font-semibold">
                  Faltan {MIN_FIXTURES - totalFixtures} planilla{MIN_FIXTURES - totalFixtures !== 1 ? 's' : ''} para activar el premio
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Mínimo {MIN_FIXTURES} planillas · cuantas más entren, más grande el pozo
                </p>
              </div>
            )}

            {/* Ganador actual */}
            {winner && totalFixtures >= MIN_FIXTURES && (
              <div className="card border-yellow-600/40 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 mb-6 p-5">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🥇</div>
                  <div className="flex-1">
                    <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider mb-1">
                      Líder del grupo
                    </p>
                    <p className="text-xl font-extrabold text-white">
                      {winner.isCurrentUser ? 'Vos' : winner.userName}
                    </p>
                    <p className="text-slate-400 text-sm">{winner.fixtureName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-yellow-400">{winner.totalScore.toFixed(1)}</p>
                    <p className="text-yellow-600 text-xs">puntos</p>
                  </div>
                </div>
              </div>
            )}

            {/* Incentivo formador */}
            {totalFixtures > 0 && (
              <div className="card border-emerald-800/40 bg-emerald-900/10 mb-6 flex items-center gap-4 py-4">
                <div className="text-3xl">🎁</div>
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold text-sm">Incentivo del formador</p>
                  <p className="text-slate-400 text-xs">
                    El formador cobra un incentivo por cada planilla del grupo, independientemente de quién gane
                  </p>
                </div>
              </div>
            )}

            {/* Tabla completa */}
            <div className="card overflow-hidden p-0">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
                <h2 className="font-bold text-lg flex-1">Ranking del grupo</h2>
                <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                  cada planilla compite por separado
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="table-header text-center w-12">#</th>
                    <th className="table-header text-left">Participante</th>
                    <th className="table-header text-left hidden sm:table-cell">Planilla</th>
                    <th className="table-header text-right">Puntaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-cell text-center text-slate-400 py-10">
                        Ningún miembro ha enviado planillas todavía.
                      </td>
                    </tr>
                  ) : ranking.map((entry, i) => {
                    const isWinner = i === 0 && totalFixtures >= MIN_FIXTURES
                    return (
                      <tr key={`${entry.fixtureId ?? entry.userId}-${i}`}
                        className={`transition-colors
                          ${isWinner ? 'bg-yellow-900/20'
                          : entry.isCurrentUser ? 'bg-sky-950/30'
                          : 'hover:bg-slate-700/20'}`}>
                        <td className="table-cell text-center">
                          {isWinner
                            ? <span className="text-xl">🥇</span>
                            : <span className={`font-mono text-sm ${entry.isCurrentUser ? 'text-sky-400' : 'text-slate-500'}`}>
                                #{entry.position}
                              </span>}
                        </td>
                        <td className="table-cell">
                          <span className={`font-medium
                            ${isWinner ? 'text-yellow-400'
                            : entry.isCurrentUser ? 'text-sky-400'
                            : 'text-white'}`}>
                            {entry.userName}
                            {entry.isCurrentUser && <span className="ml-2 text-xs opacity-60">(vos)</span>}
                            {isWinner && <span className="ml-2 text-xs text-yellow-500">líder</span>}
                          </span>
                        </td>
                        <td className="table-cell text-slate-400 text-sm hidden sm:table-cell">
                          {entry.fixtureId
                            ? <Link href={`/dashboard/fixtures/${entry.fixtureId}`}
                                className="hover:text-sky-400 transition-colors">
                                {entry.fixtureName}
                              </Link>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="table-cell text-right">
                          <span className={`font-bold text-lg
                            ${isWinner ? 'text-yellow-400'
                            : entry.isCurrentUser ? 'text-sky-400'
                            : 'text-slate-300'}`}>
                            {entry.totalScore.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-center text-slate-600 text-xs mt-4">
              Cada planilla compite por separado. Al finalizar el torneo, el puesto #1 se lleva el pozo del grupo.
            </p>
          </>
        )}
      </main>
    </>
  )
}
