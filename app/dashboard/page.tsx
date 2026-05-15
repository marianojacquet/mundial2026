'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { statusLabel, formatDate } from '@/lib/utils'

type FixtureRequest = {
  id: string; quantity: number; status: string; createdAt: string; adminNote?: string; note?: string
  fixtures: { id: string; name: string; status: string }[]
}
type Fixture = {
  id: string; name: string; status: string; totalScore: number; createdAt: string
  _count: { predictions: number }
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<FixtureRequest[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [reqModal, setReqModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function load() {
    setLoading(true)
    const fRes = await fetch('/api/fixtures')
    const fData = await fRes.json()
    setFixtures(fData.fixtures ?? [])

    const rRes = await fetch('/api/requests')
    if (rRes.ok) {
      const rData = await rRes.json()
      setRequests(rData.requests ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function sendRequest() {
    setSubmitting(true)
    setMsg(null)
    const res = await fetch('/api/fixtures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, note }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: '¡Solicitud enviada! El admin la revisará pronto.' })
    setReqModal(false)
    setQuantity(1)
    setNote('')
    load()
  }

  const statusBadge: Record<string, string> = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
    DRAFT: 'badge-draft', SUBMITTED: 'badge-submitted', SCORED: 'badge-scored',
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Fixtures</h1>
            <p className="text-slate-400 mt-1">Gestioná tus planillas del Mundial 2026</p>
          </div>
          <button onClick={() => setReqModal(true)} className="btn-primary gap-2">
            <span className="text-lg">+</span> Solicitar planilla
          </button>
        </div>

        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : (
          <>
            {/* Mis planillas */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Mis planillas</h2>
              {fixtures.length === 0 ? (
                <div className="card text-center py-12 text-slate-400">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="font-medium">No tenés planillas todavía</p>
                  <p className="text-sm mt-1">Solicitá una planilla y esperá la aprobación del admin</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fixtures.map(f => (
                    <Link key={f.id} href={`/dashboard/fixtures/${f.id}`}
                      className="card hover:border-sky-600 transition-colors group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold group-hover:text-sky-400 transition-colors">{f.name}</h3>
                        <span className={statusBadge[f.status] ?? 'badge'}>{statusLabel(f.status)}</span>
                      </div>
                      <div className="text-sm text-slate-400 space-y-1">
                        <p>Predicciones guardadas: <span className="text-white">{f._count.predictions}</span></p>
                        <p>Puntaje actual: <span className="text-sky-400 font-bold">{f.totalScore.toFixed(1)} pts</span></p>
                        <p>Creada: {formatDate(f.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Solicitudes */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Mis solicitudes</h2>
              {requests.length === 0 ? (
                <div className="card text-center py-8 text-slate-400">
                  <p>No hay solicitudes enviadas.</p>
                </div>
              ) : (
                <div className="card overflow-hidden p-0">
                  <table className="w-full">
                    <thead className="border-b border-slate-700">
                      <tr>
                        <th className="table-header text-left">Cantidad</th>
                        <th className="table-header text-left">Estado</th>
                        <th className="table-header text-left">Planillas</th>
                        <th className="table-header text-left">Fecha</th>
                        <th className="table-header text-left">Nota admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {requests.map(r => (
                        <tr key={r.id}>
                          <td className="table-cell">{r.quantity}</td>
                          <td className="table-cell">
                            <span className={statusBadge[r.status] ?? 'badge'}>{statusLabel(r.status)}</span>
                          </td>
                          <td className="table-cell">{r.fixtures?.length ?? 0} creadas</td>
                          <td className="table-cell text-slate-400">{formatDate(r.createdAt)}</td>
                          <td className="table-cell text-slate-400">{r.adminNote ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Modal solicitud */}
        {reqModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Solicitar planilla</h2>
              {msg?.type === 'error' && <Alert type="error" className="mb-4">{msg.text}</Alert>}

              <div className="space-y-4">
                <div>
                  <label className="label">¿Cuántas planillas querés?</label>
                  <input
                    type="number" min={1} max={10}
                    className="input"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Máximo 10 por solicitud</p>
                </div>
                <div>
                  <label className="label">Nota (opcional)</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Cualquier mensaje para el admin..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setReqModal(false); setMsg(null) }} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button onClick={sendRequest} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Spinner /> : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
