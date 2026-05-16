'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Solo permite números, espacios y guiones en el teléfono
  function handlePhone(value: string) {
    const cleaned = value.replace(/[^\d\s\-]/g, '')
    update('phone', cleaned)
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

    // Validar teléfono: mínimo 8 dígitos
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length < 8) {
      setError('Ingresá un número de teléfono válido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: `+54 ${form.phone.trim()}`,
          password: form.password,
        }),
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
                id="name" type="text" className="input"
                placeholder="Juan Pérez"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required minLength={2}
              />
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email" type="email" className="input"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            {/* Teléfono con prefijo +54 fijo */}
            <div>
              <label className="label" htmlFor="phone">
                Celular
                <span className="text-slate-500 font-normal ml-1">(para contacto en caso de ganar)</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center bg-slate-700 border border-slate-600 rounded-lg px-3 text-slate-300 font-mono text-sm shrink-0 select-none">
                  🇦🇷 +54
                </div>
                <input
                  id="phone" type="tel" className="input"
                  placeholder="11 1234-5678"
                  value={form.phone}
                  onChange={e => handlePhone(e.target.value)}
                  required
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ej: 11 1234-5678 · 351 234-5678 · 0221 15-123-4567
              </p>
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password" type="password" className="input"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required minLength={6}
              />
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirmar contraseña</label>
              <input
                id="confirm" type="password" className="input"
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
