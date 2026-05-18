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
  const exactScores   = playedPredictions.filter(p => p.points === 4).length

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
              <p className="text-2xl font-extrabold text-yellow-400">{exactScores}</p>
              <p className="text-xs text-slate-400 mt-1">Marcador exacto</p>
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
          const phaseMax   = preds.filter(p => p.match.played).length * 4 // max 4pts por partido

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

  const hasResult = played && m.homeScore != null && m.awayScore != null

  // Resultado predicho
  const predResult = pred.homeScore > pred.awayScore ? 'home'
    : pred.awayScore > pred.homeScore ? 'away' : 'draw'
  // Resultado real
  const realResult = hasResult
    ? (m.homeScore > m.awayScore ? 'home' : m.awayScore > m.homeScore ? 'away' : 'draw')
    : null

  const resultOk = hasResult && predResult === realResult
  const exactOk  = hasResult && pred.homeScore === m.homeScore && pred.awayScore === m.awayScore

  // Color del borde izquierdo según resultado
  const borderColor = !played ? ''
    : exactOk   ? 'border-l-4 border-l-yellow-400'
    : resultOk  ? 'border-l-4 border-l-emerald-500'
    : 'border-l-4 border-l-red-700'

  // Color de fondo de los scores predichos
  const scoreBoxClass = exactOk
    ? 'bg-yellow-800/40 text-yellow-200'
    : resultOk
    ? 'bg-emerald-800/50 text-emerald-300'
    : 'bg-slate-700 text-white'

  return (
    <div className={`rounded-xl border border-slate-700/50 p-3 transition-colors
      ${!played ? 'bg-slate-900/40' : exactOk ? 'bg-yellow-950/10' : resultOk ? 'bg-emerald-950/20' : 'bg-slate-900/40'}
      ${borderColor}`}>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <span>#{m.matchNumber}</span>
        <span>·</span>
        <span>{formatDate(m.scheduledAt)}</span>
        {!played && <span className="text-amber-500 ml-auto">Sin jugar</span>}
        {played && (
          <span className="ml-auto font-bold text-sm">
            <ResultBadge pts={pred.points} max={4} />
          </span>
        )}
      </div>

      {/* Equipos + marcador predicho */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 text-right text-sm font-medium truncate">{homeLabel}</span>

        <div className="flex items-center gap-1 shrink-0">
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-bold ${scoreBoxClass}`}>
            {pred.homeScore}
          </div>
          <span className="text-slate-500 text-xs">-</span>
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg text-base font-bold ${scoreBoxClass}`}>
            {pred.awayScore}
          </div>
        </div>

        <span className="flex-1 text-sm font-medium truncate">{awayLabel}</span>

        {/* Resultado real */}
        {hasResult && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 text-xs">Real:</span>
            <span className={`font-bold text-sm ${exactOk ? 'text-yellow-400' : resultOk ? 'text-emerald-400' : 'text-slate-300'}`}>
              {m.homeScore}–{m.awayScore}
            </span>
          </div>
        )}
      </div>

      {/* Indicadores resultado/exacto */}
      {played && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex gap-4 text-xs">
          <span className={resultOk ? 'text-emerald-400' : 'text-slate-600'}>
            {resultOk ? '✓' : '✗'} Resultado
          </span>
          <span className={exactOk ? 'text-yellow-400' : 'text-slate-600'}>
            {exactOk ? '✓' : '✗'} Marcador exacto
          </span>
          {pred.points > 0 && (
            <span className={`ml-auto font-bold ${exactOk ? 'text-yellow-400' : 'text-emerald-400'}`}>
              +{pred.points} pts {exactOk ? '🎯' : '✓'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
