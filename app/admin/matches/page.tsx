'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, phaseLabel } from '@/lib/utils'
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

type ResultForm = {
  homeScore: number; awayScore: number
  firstHalfGoals: number; yellowCards: number; redCards: number
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState('GROUP')
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [form, setForm] = useState<ResultForm>({ homeScore: 0, awayScore: 0, firstHalfGoals: 0, yellowCards: 0, redCards: 0 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showOnlyPending, setShowOnlyPending] = useState(false)

  async function load() {
    const res = await fetch('/api/matches')
    const data = await res.json()
    setMatches(data.matches ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openEdit(m: Match) {
    setEditingMatch(m)
    setForm({
      homeScore:      m.homeScore      ?? 0,
      awayScore:      m.awayScore      ?? 0,
      firstHalfGoals: m.firstHalfGoals ?? 0,
      yellowCards:    m.yellowCards    ?? 0,
      redCards:       m.redCards       ?? 0,
    })
  }

  async function saveResult() {
    if (!editingMatch) return
    setSaving(true)
    setMsg(null)
    const res = await fetch(`/api/admin/matches/${editingMatch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: `Resultado guardado. ${data.predictionsUpdated} predicciones actualizadas.` })
    setEditingMatch(null)
    load()
  }

  const phases = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE', 'FINAL']
  const phaseMatches = matches.filter(m => m.phase === activePhase && (!showOnlyPending || !m.played))

  const homeLabel = (m: Match) => m.homeTeam ? `${m.homeTeam.flag} ${m.homeTeam.name}` : (m.homeLabel ?? '?')
  const awayLabel = (m: Match) => m.awayTeam ? `${m.awayTeam.flag} ${m.awayTeam.name}` : (m.awayLabel ?? '?')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cargar resultados</h1>
          <p className="text-slate-400 text-sm mt-1">
            {matches.filter(m => m.played).length}/{matches.length} partidos jugados
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={showOnlyPending} onChange={e => setShowOnlyPending(e.target.checked)} />
          Mostrar solo pendientes
        </label>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {/* Tabs de fase */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {phases.map(ph => {
          const count = matches.filter(m => m.phase === ph).length
          if (count === 0) return null
          const played = matches.filter(m => m.phase === ph && m.played).length
          return (
            <button key={ph} onClick={() => setActivePhase(ph)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activePhase === ph ? 'bg-sky-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}>
              {phaseLabel(ph)} ({played}/{count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="space-y-3">
          {phaseMatches.length === 0 && (
            <div className="card text-center py-10 text-slate-400">
              <p>No hay partidos en esta fase{showOnlyPending ? ' pendientes' : ''}.</p>
            </div>
          )}
          {phaseMatches.map(m => (
            <div key={m.id} className={cn('card flex items-center gap-4 flex-wrap', m.played && 'border-l-4 border-l-emerald-600')}>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 mb-1">
                  #{m.matchNumber} · {formatDate(m.scheduledAt)} · {m.groupName ? `Grupo ${m.groupName}` : phaseLabel(m.phase)}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{homeLabel(m)}</span>
                  <span className={cn('px-2 py-0.5 rounded font-mono text-sm', m.played ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-700 text-slate-300')}>
                    {m.played ? `${m.homeScore} - ${m.awayScore}` : '? - ?'}
                  </span>
                  <span>{awayLabel(m)}</span>
                </div>
                {m.played && (
                  <div className="text-xs text-slate-400 mt-1 flex gap-3">
                    <span>⚽ 1°T: {m.firstHalfGoals}</span>
                    <span>🟨 Amarillas: {m.yellowCards}</span>
                    <span>🟥 Rojas: {m.redCards}</span>
                  </div>
                )}
              </div>
              <button onClick={() => openEdit(m)} className={m.played ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
                {m.played ? '✏️ Editar' : '+ Cargar resultado'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal cargar resultado */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Cargar resultado</h2>
            <p className="text-slate-400 text-sm mb-5">
              {homeLabel(editingMatch)} vs {awayLabel(editingMatch)}
            </p>

            {msg?.type === 'error' && <Alert type="error" className="mb-4">{msg.text}</Alert>}

            <div className="space-y-4">
              {/* Resultado final */}
              <div>
                <label className="label">Resultado final</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1 truncate">{homeLabel(editingMatch)}</p>
                    <input type="number" min={0} max={30} className="input text-center text-2xl font-bold"
                      value={form.homeScore} onChange={e => setForm(f => ({ ...f, homeScore: Number(e.target.value) }))} />
                  </div>
                  <span className="text-2xl text-slate-500 font-bold pt-5">-</span>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1 truncate">{awayLabel(editingMatch)}</p>
                    <input type="number" min={0} max={30} className="input text-center text-2xl font-bold"
                      value={form.awayScore} onChange={e => setForm(f => ({ ...f, awayScore: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              {/* Extras */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Goles 1° tiempo</label>
                  <input type="number" min={0} max={20} className="input text-center"
                    value={form.firstHalfGoals} onChange={e => setForm(f => ({ ...f, firstHalfGoals: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label text-xs">🟨 Amarillas</label>
                  <input type="number" min={0} max={30} className="input text-center"
                    value={form.yellowCards} onChange={e => setForm(f => ({ ...f, yellowCards: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label text-xs">🟥 Rojas</label>
                  <input type="number" min={0} max={20} className="input text-center"
                    value={form.redCards} onChange={e => setForm(f => ({ ...f, redCards: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditingMatch(null); setMsg(null) }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={saveResult} disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner /> : '💾 Guardar resultado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
