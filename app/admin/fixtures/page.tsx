'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, statusLabel } from '@/lib/utils'

type Request = {
  id: string; quantity: number; status: string; note?: string; adminNote?: string; createdAt: string
  user: { id: string; name: string; email: string }
  fixtures: { id: string; name: string; status: string }[]
}

export default function AdminFixturesPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'APPROVE' | 'REJECT' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  async function load() {
    const res = await fetch('/api/admin/fixtures')
    const data = await res.json()
    setRequests(data.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function processRequest(id: string, action: 'APPROVE' | 'REJECT') {
    setProcessing(id)
    setMsg(null)
    const res = await fetch('/api/admin/fixtures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, action, adminNote }),
    })
    const data = await res.json()
    setProcessing(null)
    setNoteModal(null)
    setAdminNote('')
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({
      type: 'success',
      text: action === 'APPROVE' ? 'Solicitud aprobada. Se crearon las planillas.' : 'Solicitud rechazada.',
    })
    load()
  }

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter)
  const pending = requests.filter(r => r.status === 'PENDING').length

  const badgeClass: Record<string, string> = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de planillas</h1>
          {pending > 0 && (
            <p className="text-amber-400 text-sm mt-1">⏳ {pending} solicitud{pending > 1 ? 'es' : ''} pendiente{pending > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-sky-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
              {f === 'ALL' ? 'Todas' : statusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No hay solicitudes {filter !== 'ALL' ? statusLabel(filter).toLowerCase() + 's' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={badgeClass[r.status] ?? 'badge'}>{statusLabel(r.status)}</span>
                    <span className="text-sm text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="font-semibold">{r.user.name}</p>
                  <p className="text-sm text-slate-400">{r.user.email}</p>
                  <p className="text-sm mt-1">
                    Solicita: <span className="font-semibold text-white">{r.quantity} planilla{r.quantity > 1 ? 's' : ''}</span>
                  </p>
                  {r.note && <p className="text-sm text-slate-400 mt-1">Nota: {r.note}</p>}
                  {r.adminNote && <p className="text-sm text-sky-400 mt-1">Respuesta: {r.adminNote}</p>}
                  {r.fixtures.length > 0 && (
                    <p className="text-sm text-emerald-400 mt-1">{r.fixtures.length} planilla{r.fixtures.length > 1 ? 's' : ''} creada{r.fixtures.length > 1 ? 's' : ''}</p>
                  )}
                </div>

                {r.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setNoteModal({ id: r.id, action: 'REJECT' }); setAdminNote('') }}
                      disabled={processing === r.id}
                      className="btn-danger text-sm"
                    >
                      ✗ Rechazar
                    </button>
                    <button
                      onClick={() => { setNoteModal({ id: r.id, action: 'APPROVE' }); setAdminNote('') }}
                      disabled={processing === r.id}
                      className="btn-success text-sm"
                    >
                      {processing === r.id ? <Spinner /> : '✓ Aprobar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nota */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {noteModal.action === 'APPROVE' ? '✓ Aprobar solicitud' : '✗ Rechazar solicitud'}
            </h2>
            <div className="mb-4">
              <label className="label">Nota para el usuario (opcional)</label>
              <textarea
                className="input resize-none" rows={3}
                placeholder="Ej: ¡Aprobado! Ya podés completar tus planillas."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => processRequest(noteModal.id, noteModal.action)}
                disabled={!!processing}
                className={noteModal.action === 'APPROVE' ? 'btn-success flex-1' : 'btn-danger flex-1'}
              >
                {processing ? <Spinner /> : noteModal.action === 'APPROVE' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
