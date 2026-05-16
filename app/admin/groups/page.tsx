'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

type Member = { id: string; userId: string; joinedAt: string; user: { id: string; name: string; email: string } }
type Group  = { id: string; name: string; description?: string; createdAt: string; _count: { members: number }; members: Member[] }

export default function AdminGroupsPage() {
  const [groups, setGroups]           = useState<Group[]>([])
  const [loading, setLoading]         = useState(true)
  const [msg, setMsg]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal crear/editar grupo
  const [groupModal, setGroupModal]   = useState(false)
  const [editGroup, setEditGroup]     = useState<Group | null>(null)
  const [gName, setGName]             = useState('')
  const [gDesc, setGDesc]             = useState('')
  const [saving, setSaving]           = useState(false)

  // Panel de miembros
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [addEmail, setAddEmail]       = useState('')
  const [addingMember, setAddingMember] = useState(false)

  // Confirmar eliminar
  const [deleteId, setDeleteId]       = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/groups')
    if (res.ok) {
      const data = await res.json()
      setGroups(data.groups)
      // Refrescar el grupo activo si existe
      if (activeGroup) {
        const refreshed = data.groups.find((g: Group) => g.id === activeGroup.id)
        setActiveGroup(refreshed ?? null)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditGroup(null); setGName(''); setGDesc(''); setGroupModal(true)
  }
  function openEdit(g: Group) {
    setEditGroup(g); setGName(g.name); setGDesc(g.description ?? ''); setGroupModal(true)
  }

  async function saveGroup() {
    setSaving(true); setMsg(null)
    const url    = editGroup ? `/api/admin/groups/${editGroup.id}` : '/api/admin/groups'
    const method = editGroup ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: gName, description: gDesc }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: editGroup ? 'Grupo actualizado.' : 'Grupo creado.' })
    setGroupModal(false)
    load()
  }

  async function deleteGroup(id: string) {
    const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMsg({ type: 'success', text: 'Grupo eliminado.' })
      if (activeGroup?.id === id) setActiveGroup(null)
    }
    setDeleteId(null)
    load()
  }

  async function addMember() {
    if (!activeGroup || !addEmail.trim()) return
    setAddingMember(true); setMsg(null)
    const res = await fetch(`/api/admin/groups/${activeGroup.id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail.trim() }),
    })
    const data = await res.json()
    setAddingMember(false)
    if (!res.ok) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: `${data.member.user.name} agregado al grupo.` })
    setAddEmail('')
    load()
  }

  async function removeMember(groupId: string, userId: string, name: string) {
    if (!confirm(`Quitar a ${name} del grupo?`)) return
    await fetch(`/api/admin/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos de competencia</h1>
          <p className="text-slate-400 text-sm mt-1">{groups.length} grupo{groups.length !== 1 ? 's' : ''} creado{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nuevo grupo</button>
      </div>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Lista de grupos */}
          <div className="space-y-3">
            {groups.length === 0 && (
              <div className="card text-center py-12 text-slate-400">
                <div className="text-5xl mb-3">👥</div>
                <p className="font-medium">No hay grupos todavia</p>
                <p className="text-sm mt-1">Crea un grupo y agregale participantes</p>
              </div>
            )}
            {groups.map(g => (
              <div
                key={g.id}
                className={`card cursor-pointer transition-colors hover:border-sky-600
                  ${activeGroup?.id === g.id ? 'border-sky-500 bg-sky-950/20' : ''}`}
                onClick={() => setActiveGroup(activeGroup?.id === g.id ? null : g)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">👥</span>
                      <h3 className="font-semibold text-lg">{g.name}</h3>
                    </div>
                    {g.description && <p className="text-slate-400 text-sm mb-2">{g.description}</p>}
                    <p className="text-sm text-sky-400">{g._count.members} participante{g._count.members !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(g)} className="btn-secondary text-xs py-1 px-2">Editar</button>
                    <button onClick={() => setDeleteId(g.id)} className="btn-danger text-xs py-1 px-2">Borrar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel de miembros */}
          {activeGroup && (
            <div className="card space-y-4">
              <div>
                <h2 className="font-bold text-lg">{activeGroup.name}</h2>
                <p className="text-slate-400 text-sm">{activeGroup._count.members} participantes</p>
              </div>

              {/* Agregar miembro */}
              <div>
                <label className="label text-xs">Agregar participante por email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input flex-1"
                    placeholder="email@ejemplo.com"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addMember()}
                  />
                  <button onClick={addMember} disabled={addingMember || !addEmail.trim()} className="btn-primary shrink-0">
                    {addingMember ? <Spinner /> : 'Agregar'}
                  </button>
                </div>
              </div>

              {/* Lista de miembros */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activeGroup.members.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-6">Sin participantes todavia</p>
                )}
                {activeGroup.members.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-sm w-6 text-center font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{m.user.name}</p>
                      <p className="text-slate-400 text-xs truncate">{m.user.email}</p>
                    </div>
                    <button
                      onClick={() => removeMember(activeGroup.id, m.userId, m.user.name)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {groupModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editGroup ? 'Editar grupo' : 'Nuevo grupo'}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nombre del grupo</label>
                <input className="input" placeholder="Ej: Los del trabajo" value={gName}
                  onChange={e => setGName(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label className="label">Descripcion (opcional)</label>
                <textarea className="input resize-none" rows={2} placeholder="Una descripcion corta..."
                  value={gDesc} onChange={e => setGDesc(e.target.value)} maxLength={200} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setGroupModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={saveGroup} disabled={saving || !gName.trim()} className="btn-primary flex-1">
                {saving ? <Spinner /> : editGroup ? 'Guardar cambios' : 'Crear grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-bold text-lg mb-2">Eliminar grupo</h2>
            <p className="text-slate-400 text-sm mb-5">Se elimina el grupo y todos sus miembros. Las planillas no se borran.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => deleteGroup(deleteId)} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
