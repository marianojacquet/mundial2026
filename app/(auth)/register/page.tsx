'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="text-slate-400 mt-1">Mundial 2026 · Fixture & Predicciones</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}

            <div>
              <label className="label" htmlFor="name">Nombre completo</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Juan Pérez"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirmar contraseña</label>
              <input
                id="confirm"
                type="password"
                className="input"
                placeholder="Repetí la contraseña"
                value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <Spinner /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
