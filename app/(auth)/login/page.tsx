'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
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
          <h1 className="text-3xl font-bold text-white">Iniciar sesión</h1>
          <p className="text-slate-400 mt-1">Mundial 2026 · Fixture & Predicciones</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="error">{error}</Alert>}

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner /> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 font-medium">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
