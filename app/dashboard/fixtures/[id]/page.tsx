'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, phaseLabel, statusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Team = { id: string; name: string; code: string; flag: string }
type Match = {
  id: string; matchNumber: number; phase: string; groupName: string | null
  homeTeam: Team | null; awayTeam: Team | null
  homeLabel: string | null; awayLabel: string | null
  scheduledAt: string; venue: string | null
  homeScore: number | null; awayScore: number | null
  firstHalfGoals: number | null; yellowCards: number | null; redCards: number | null
  played: boolean
}
type Prediction = {
  id?: string; matchId: string; homeScore: number; awayScore: number
  extraFirstHalfGoals: number | null
  extraCardsType: 'YELLOW' | 'RED' | null
  extraCardsValue: number | null
  points?: number
}
type Fixture = {
  id: string; name: string; status: string; totalScore: number
  predictions: (Prediction & { match: Match })[]
}

type PredMap = Record<string, Prediction>

export default function FixturePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [preds, setPreds] = useState<PredMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activePhase, setActivePhase] = useState('GROUP')
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    const [fRes, mRes] = await Promise.all([
      fetch(`/api/fixtures/${id}`),
      fetch('/api/matches'),
    ])
    if (!fRes.ok) { router.push('/dashboard'); return }
    const fData = await fRes.json()
    const mData = await mRes.json()

    setFixture(fData.fixture)
    setMatches(mData.matches ?? [])

    // Build prediction map
    const map: PredMap = {}
    for (const p of fData.fixture.predictions ?? []) {
      map[p.matchId] = {
        matchId: p.matchId,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        extraFirstHalfGoals: p.extraFirstHalfGoals,
        extraCardsType: p.extraCardsType,
        extraCardsValue: p.extraCardsValue,
        points: p.points,
      }
    }
    setPreds(map)
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  function setPred(matchId: string, field: keyof Prediction, value: unknown) {
    setPreds(prev => {
      const existing = prev[matchId]
      const base: Prediction = existing ?? {
        matchId, homeScore: 0, awayScore: 0,
        extraFirstHalfGoals: null, extraCardsType: null, extraCardsValue: null,
      }
      return { ...prev, [matchId]: { ...base, [field]: value } }
    })
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const predictions = Object.values(preds).filter(p => p.matchId)
    const res = await fetch(`/api/fixtures/${id}/predictions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: `${data.saved} predicciones guardadas correctamente.` })
    setDirty(false)
  }

  async function submitFixture() {
    if (!confirm('¿Estás seguro? Una vez enviada la planilla no podrás editarla.')) return
    setSubmitting(true)
    // Primero guardar
    const predictions = Object.values(preds).filter(p => p.matchId)
    await fetch(`/api/fixtures/${id}/predictions`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions }),
    })
    // Luego enviar
    const res = await fetch(`/api/fixtures/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submit: true }),
    })
    setSubmitting(false)
    if (res.ok) { load() } else { setMsg({ type: 'error', text: 'Error al enviar la planilla' }) }
  }

  const phases = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL']
  const phaseMatches = matches.filter(m => m.phase === activePhase)
  const isEditable = fixture?.status === 'DRAFT'

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]"><Spinner className="w-10 h-10" /></div>
      </>
    )
  }

  if (!fixture) return null

  // Agrupar por grupo si estamos en fase de grupos
  const groupedMatches = activePhase === 'GROUP'
    ? phaseMatches.reduce<Record<string, Match[]>>((acc, m) => {
        const g = m.groupName ?? 'X'
        if (!acc[g]) acc[g] = []
        acc[g].push(m)
        return acc
      }, {})
    : null

  const predCount = Object.keys(preds).length
  const totalMatches = matches.length

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-sky-400 mb-2 inline-block">
              ← Volver al dashboard
            </Link>
            <h1 className="text-2xl font-bold">{fixture.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`badge ${
                fixture.status === 'DRAFT' ? 'badge-draft' :
                fixture.status === 'SUBMITTED' ? 'badge-submitted' : 'badge-scored'
              }`}>{statusLabel(fixture.status)}</span>
              <span className="text-sky-400 font-bold">{fixture.totalScore.toFixed(1)} pts</span>
              <span className="text-slate-400 text-sm">{predCount}/{totalMatches} partidos completados</span>
            </div>
          </div>
          {isEditable && (
            <div className="flex gap-3">
              <button onClick={save} disabled={saving || !dirty} className="btn-secondary">
                {saving ? <Spinner /> : '💾 Guardar'}
              </button>
              <button onClick={submitFixture} disabled={submitting} className="btn-primary">
                {submitting ? <Spinner /> : '✅ Enviar planilla'}
              </button>
            </div>
          )}
        </div>

        {msg && <Alert type={msg.type} className="mb-5">{msg.text}</Alert>}

        {!isEditable && (
          <Alert type="info" className="mb-5">
            Esta planilla está {statusLabel(fixture.status).toLowerCase()} y ya no es editable.
            Los puntos se actualizan automáticamente cuando el admin carga los resultados.
          </Alert>
        )}

        {/* Tabs de fase */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
          {phases.map(ph => {
            const count = matches.filter(m => m.phase === ph).length
            if (count === 0) return null
            return (
              <button
                key={ph}
                onClick={() => setActivePhase(ph)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activePhase === ph
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {phaseLabel(ph)} ({count})
              </button>
            )
          })}
        </div>

        {/* Partidos */}
        {groupedMatches ? (
          // Fase de grupos: mostrar por grupo
          Object.entries(groupedMatches).sort().map(([group, gMatches]) => (
            <div key={group} className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-sky-300 flex items-center gap-2">
                <span className="bg-sky-800 text-sky-200 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">{group}</span>
                Grupo {group}
              </h3>
              <div className="space-y-3">
                {gMatches.map(m => (
                  <MatchRow key={m.id} match={m} pred={preds[m.id]} onPred={setPred} editable={isEditable} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            {phaseMatches.map(m => (
              <MatchRow key={m.id} match={m} pred={preds[m.id]} onPred={setPred} editable={isEditable} />
            ))}
          </div>
        )}

        {/* Sticky save bar */}
        {isEditable && dirty && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-4 py-3 flex justify-between items-center z-40">
            <span className="text-sm text-amber-300">⚠ Tenés cambios sin guardar</span>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <Spinner /> : '💾 Guardar cambios'}
            </button>
          </div>
        )}
        {isEditable && dirty && <div className="h-16" />}
      </main>
    </>
  )
}

// ─── Componente de fila de partido ────────────────────────────────────────────

function ScoreInput({
  value, onChange, disabled
}: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <input
      type="number" min={0} max={30}
      className="w-14 text-center bg-slate-700 border border-slate-600 rounded-lg py-2 text-lg font-bold
                 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
      value={value}
      onChange={e => onChange(Math.max(0, Math.min(30, Number(e.target.value))))}
      disabled={disabled}
    />
  )
}

function MatchRow({
  match, pred, onPred, editable
}: {
  match: Match
  pred: Prediction | undefined
  onPred: (matchId: string, field: keyof Prediction, value: unknown) => void
  editable: boolean
}) {
  const home = pred?.homeScore ?? 0
  const away = pred?.awayScore ?? 0

  const homeLabel = match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : (match.homeLabel ?? '?')
  const awayLabel = match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : (match.awayLabel ?? '?')

  const showExtras = pred != null

  // Determinar resultado real si el partido ya se jugó
  const played = match.played
  const resultText = played && match.homeScore != null && match.awayScore != null
    ? `${match.homeScore} - ${match.awayScore}`
    : null

  const points = pred?.points ?? 0

  return (
    <div className={cn(
      'card p-4',
      played && 'border-l-4',
      played && points > 0 ? 'border-l-emerald-500' : played ? 'border-l-red-600' : ''
    )}>
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        <span>#{match.matchNumber}</span>
        <span>·</span>
        <span>{formatDate(match.scheduledAt)}</span>
        {match.venue && <><span>·</span><span className="truncate max-w-xs">{match.venue}</span></>}
        {played && resultText && (
          <>
            <span>·</span>
            <span className="text-white font-semibold">Resultado: {resultText}</span>
            {points > 0 && <span className="text-emerald-400 font-bold">+{points}pts</span>}
          </>
        )}
      </div>

      {/* Score row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex-1 text-right font-medium text-sm">{homeLabel}</span>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreInput value={home} onChange={v => onPred(match.id, 'homeScore', v)} disabled={!editable} />
          <span className="text-slate-500 font-bold">-</span>
          <ScoreInput value={away} onChange={v => onPred(match.id, 'awayScore', v)} disabled={!editable} />
        </div>
        <span className="flex-1 font-medium text-sm">{awayLabel}</span>
      </div>

      {/* Extras */}
      {editable && (
        <div className="mt-3 pt-3 border-t border-slate-700 grid sm:grid-cols-2 gap-3">
          {/* Extra 1: goles 1er tiempo */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">⚽ Goles 1° tiempo:</label>
            <input
              type="number" min={0} max={20}
              className="w-16 text-center bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={pred?.extraFirstHalfGoals ?? ''}
              placeholder="-"
              onChange={e => onPred(match.id, 'extraFirstHalfGoals', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>

          {/* Extra 2: tarjetas */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">🟨 Tarjetas:</label>
            <select
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              value={pred?.extraCardsType ?? ''}
              onChange={e => onPred(match.id, 'extraCardsType', e.target.value === '' ? null : e.target.value)}
            >
              <option value="">No predecir</option>
              <option value="YELLOW">Amarillas</option>
              <option value="RED">Rojas</option>
            </select>
            {pred?.extraCardsType && (
              <input
                type="number" min={0} max={30}
                className="w-16 text-center bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm
                           focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={pred?.extraCardsValue ?? ''}
                placeholder="0"
                onChange={e => onPred(match.id, 'extraCardsValue', e.target.value === '' ? null : Number(e.target.value))}
              />
            )}
          </div>
        </div>
      )}

      {/* Ver extras guardados (modo no editable) */}
      {!editable && pred && (pred.extraFirstHalfGoals != null || pred.extraCardsType) && (
        <div className="mt-2 pt-2 border-t border-slate-700 flex gap-4 text-xs text-slate-400">
          {pred.extraFirstHalfGoals != null && (
            <span>⚽ 1°T: <strong className="text-white">{pred.extraFirstHalfGoals}</strong></span>
          )}
          {pred.extraCardsType && pred.extraCardsValue != null && (
            <span>
              {pred.extraCardsType === 'YELLOW' ? '🟨' : '🟥'} Tarjetas:{' '}
              <strong className="text-white">{pred.extraCardsValue}</strong>
            </span>
          )}
          {played && (
            <span className="ml-auto text-sky-400">
              {pred.extraFirstHalfGoals != null && match.firstHalfGoals === pred.extraFirstHalfGoals && '✅ 1°T '}
              {pred.extraCardsType && (
                pred.extraCardsType === 'YELLOW'
                  ? match.yellowCards === pred.extraCardsValue ? '✅ Amarillas' : ''
                  : match.redCards === pred.extraCardsValue ? '✅ Rojas' : ''
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
