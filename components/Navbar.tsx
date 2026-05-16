'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type User = { id: string; name: string; email: string; role: string }

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
  }, [pathname])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  const navLinks = user
    ? [
        { href: '/dashboard', label: 'Mis Fixtures' },
        { href: '/groups',    label: 'Mis Grupos' },
        { href: '/ranking',   label: 'Ranking' },
        ...(user.role === 'ADMIN'
          ? [{ href: '/admin', label: 'Administración' }]
          : []),
      ]
    : [
        { href: '/ranking', label: 'Ranking' },
        { href: '/login', label: 'Iniciar sesión' },
        { href: '/register', label: 'Registrarse' },
      ]

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="text-2xl">⚽</span>
          <span className="hidden sm:inline text-sky-400">Mundial</span>
          <span className="hidden sm:inline">2026</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(l.href) && l.href !== '/'
                  ? 'bg-sky-900/50 text-sky-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              )}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <div className="ml-4 flex items-center gap-3 border-l border-slate-700 pl-4">
              <span className="text-sm text-slate-400">
                Hola, <span className="text-white font-medium">{user.name.split(' ')[0]}</span>
              </span>
              <button onClick={logout} className="btn-secondary text-sm py-1.5">
                Salir
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setMenuOpen(v => !v)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { logout(); setMenuOpen(false) }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800"
            >
              Cerrar sesión ({user.name})
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
