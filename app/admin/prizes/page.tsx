'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

type Prize = { position: number; description: string; value: string; emoji: string }

const POSITION_ICONS = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🎖️', '🎖️', '🎖️', '🎖️']

export default function AdminPrizesPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function load() {
    const res = await fetch('/api/admin/prizes')
    if (res.ok) {
      const data = await res.json()
      // Ensure all 10 positions exist
      const base = Array.from({ length: 10 }, (_, i) => ({
        position: i + 1,
        description: '',
        value: '',
        emoji: POSITION_ICONS[i],
      }))
      const map = new Map((data.prizes as Prize[]).map((p: Prize) => [p.position, p]))
      setPrizes(base.map(b => map.get(b.position) ?? b))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function updatePrize(pos: number, field: keyof Prize, value: string) {
    setPrizes(prev => prev.map(p => p.position === pos ? { ...p, [field]: value } : p))
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/admin/prizes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes }),
    })
    setSaving(false)
    if (res.ok) setMsg({ type: 'success', text: 'Premios guardados correctamente.' })
    else setMsg({ type: 'error', text: 'Error al guardar.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurar premios</h1>
          <p className="text-slate-400 text-sm mt-1">Definí los premios para los 10 primeros del ranking</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner /> : '💾 Guardar premios'}
        </button>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="space-y-3">
          {prizes.map(p => (
            <div key={p.position} className="card flex items-center gap-4">
              <div className="text-3xl w-10 text-center shrink-0">{p.emoji}</div>
              <div className="w-6 shrink-0">
                <span className="text-slate-400 font-bold text-sm">#{p.position}</span>
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Descripción del premio</label>
                  <input
                    type="text"
                    className="input"
                    placeholder={`Premio para el ${p.position}° puesto`}
                    value={p.description}
                    onChange={e => updatePrize(p.position, 'description', e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="label text-xs">Valor / detalle</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: $5.000, Camiseta, etc."
                    value={p.value}
                    onChange={e => updatePrize(p.position, 'value', e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
