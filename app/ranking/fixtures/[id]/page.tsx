import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatDate, phaseLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getFixtureDetail(id: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      predictions: {
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true, flag: true, code: true } },
              awayTeam: { select: { name: true, flag: true, code: true } },
            },
          },
        },
        orderBy: { match: { matchNumber: 'asc' } },
      },
    },
  })
  return fixture
}

async function getRankingPosition(fixtureId: string) {
  const all = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    select: { id: true },
    orderBy: { totalScore: 'desc' },
  })
  const pos = all.findIndex(f => f.id === fixtureId)
  return pos === -1 ? null : { position: pos + 1, total: all.length }
}

const PHASE_ORDER = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL']

function ResultBadge({ pts, max }: { pts: number; max: number }) {
  if (max === 0) return <span className="text-slate-600 text-xs">—</span>
  if (pts === max) return <span className="text-emerald-400 font-bold text-sm">+{pts}</span>
  if (pts > 0)    return <span className="text-sky-400 font-bold text-sm">+{pts}</span>
  return              <span className="text-slate-600 text-sm">0</span>
}

export default async function FixtureDetailPage({ params }: { params: { id: string } }) {
  const [fixture, rankPos] = await Promise.all([
    getFixtureDetail(params.id),
    getRankingPosition(params.id),
  ])

  if (!fixture || !['SUBMITTED', 'SCORED'].includes(fixture.status)) notFound()

  // Agrupar predicciones por fase
  const byPhase = PHASE_ORDER.reduce<Record<string, typeof fixture.predictions>>((acc, ph) => {
    const preds = fixture.predictions.filter(p => p.match.phase === ph)
    if (preds.length > 0) acc[ph] = preds
    return acc
  }, {})

  // Totales
  const totalPredictions = fixture.predictions.length
  const playedPredictions = fixture.predictions.filter(p => p.match.played)
  const correctResults = playedPredictions.filter(p => p.points >= 2).length
  const withExtras = playedPredictions.filter(p => p.points > 2).length

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <Link href="/ranking" className="text-sm text-slate-400 hover:text-sky-400 mb-4 inline-block">
          ← Volver al ranking
        </Link>

        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{fixture.name}</h1>
              <p className="text-slate-400 mt-1">
                👤 {fixture.user.name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-sky-400">{fixture.totalScore.toFixed(1)} pts</div>
              {rankPos && (
                <div className={`text-lg font-bold mt-1
                  ${rankPos.position === 1 ? 'text-yellow-400'
                  : rankPos.position === 2 ? 'text-slate-300'
                  : rankPos.position === 3 ? 'text-amber-500'
                  : 'text-slate-300'}`}>
                  {rankPos.position === 1 ? '🥇' : rankPos.position === 2 ? '🥈' : rankPos.position === 3 ? '🥉' : '🏅'}
                  {' '}#{rankPos.position} de {rankPos.total}
                </div>
              )}
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-700">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{totalPredictions}</p>
              <p className="text-xs text-slate-400 mt-1">Partidos predichos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-emerald-400">{correctResults}</p>
              <p className="text-xs text-slate-400 mt-1">Resultados correctos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-sky-400">{withExtras}</p>
              <p className="text-xs text-slate-400 mt-1">Con extras acertados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-slate-300">{playedPredictions.length}</p>
              <p className="text-xs text-slate-400 mt-1">Partidos jugados</p>
            </div>
          </div>
        </div>

        {/* Detalle por fase */}
        {Object.entries(byPhase).map(([phase, preds]) => {
          const phaseScore = preds.reduce((sum, p) => sum + p.points, 0)
          const phaseMax   = preds.filter(p => p.match.played).length * 3 // max 3pts por partido

          // Agrupar por grupo si es fase de grupos
          const groups = phase === 'GROUP'
            ? preds.reduce<Record<string, typeof preds>>((acc, p) => {
                const g = p.match.groupName ?? 'X'
                if (!acc[g]) acc[g] = []
                acc[g].push(p)
                return acc
              }, {})
            : null

          return (
            <div key={phase} className="mb-8">
              {/* Encabezado de fase */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-sky-300">{phaseLabel(phase)}</h2>
                <span className="text-sm text-slate-400">
                  {phaseScore.toFixed(1)} pts
                </span>
              </div>

              {groups ? (
                Object.entries(groups).sort().map(([g, gPreds]) => (
                  <div key={g} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-slate-800 text-slate-300 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold border border-slate-600">
                        {g}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">Grupo {g}</span>
                    </div>
                    <div className="space-y-2">
                      {gPreds.map(p => <PredRow key={p.id} pred={p} />)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {preds.map(p => <PredRow key={p.id} pred={p} />)}
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(byPhase).length === 0 && (
          <div className="card text-center py-12 text-slate-400">
            <p>Esta planilla no tiene predicciones cargadas.</p>
          </div>
        )}
      </main>
    </>
  )
}

// ─── Fila de prediccion ───────────────────────────────────────────────────────

function PredRow({ pred }: { pred: any }) {
  const m = pred.match
  const played = m.played

  const homeLabel = m.homeTeam ? `${m.homeTeam.flag} ${m.homeTeam.name}` : (m.homeLabel ?? '?')
  const awayLabel = m.awayTeam ? `${m.awayTeam.flag} ${m.awayTeam.name}` : (m.awayLabel ?? '?')

  // Resultado predicho
  const predResult = pred.homeScore > pred.awayScore ? 'home'
    : pred.awayScore > pred.homeScore ? 'away' : 'draw'
  // Resultado real
  const realResult = played && m.homeScore != null && m.awayScore != null
    ? (m.homeScore > m.awayScore ? 'home' : m.awayScore > m.homeScore ? 'away' : 'draw')
    : null

  const resultOk = played && realResult !== null && predResult === realResult

  return (
    <div className={`rounded-xl border p-3 transition-colors
      ${!played ? 'bg-slate-900/40 border-slate-700/50'
      : resultOk ? 'bg-emerald-950/20 border-emerald-800/50'
      : 'bg-slate-900/40 border-slate-700/50'}`}>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <span>#{m.matchNumber}</span>
        <span>·</span>
        <span>{formatDate(m.scheduledAt)}</span>
        {!played && <span className="text-amber-500 ml-auto">Sin jugar</span>}
        {played && (
          <span className="ml-auto font-bold text-sm">
            <ResultBadge pts={pred.points} max={played ? 3 : 0} />
          </span>
        )}
      </div>

      {/* Teams + scores */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 text-right text-sm font-medium truncate">{homeLabel}</span>

        {/* Prediccion */}
        <div className="flex items-center gap-1 shrink-0">
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-bold
            ${resultOk ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-white'}`}>
            {pred.homeScore}
          </div>
          <span className="text-slate-500 text-xs">vs</span>
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-bold
            ${resultOk ? 'bg-emerald-800/50 text-emerald-300' : 'bg-slate-700 text-white'}`}>
            {pred.awayScore}
          </div>
        </div>

        <span className="flex-1 text-sm font-medium truncate">{awayLabel}</span>

        {/* Resultado real */}
        {played && m.homeScore != null && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 text-xs">Real:</span>
            <span className={`font-bold text-sm ${resultOk ? 'text-emerald-400' : 'text-slate-300'}`}>
              {m.homeScore}–{m.awayScore}
            </span>
            {resultOk && <span className="text-emerald-400">✓</span>}
          </div>
        )}
      </div>

      {/* Extras */}
      {(pred.extraFirstHalfGoals != null || pred.extraCardsType) && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-4 text-xs">
          {pred.extraFirstHalfGoals != null && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">⚽ Goles 1°T:</span>
              <span className="font-bold text-white">{pred.extraFirstHalfGoals}</span>
              {played && m.firstHalfGoals != null && (
                pred.extraFirstHalfGoals === m.firstHalfGoals
                  ? <span className="text-emerald-400">✓ +0.5</span>
                  : <span className="text-slate-500">(real: {m.firstHalfGoals})</span>
              )}
            </div>
          )}
          {pred.extraCardsType && pred.extraCardsValue != null && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">
                {pred.extraCardsType === 'YELLOW' ? '🟨 Amarillas:' : '🟥 Rojas:'}
              </span>
              <span className="font-bold text-white">{pred.extraCardsValue}</span>
              {played && (
                (() => {
                  const real = pred.extraCardsType === 'YELLOW' ? m.yellowCards : m.redCards
                  return real != null
                    ? (pred.extraCardsValue === real
                        ? <span className="text-emerald-400">✓ +0.5</span>
                        : <span className="text-slate-500">(real: {real})</span>)
                    : null
                })()
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
