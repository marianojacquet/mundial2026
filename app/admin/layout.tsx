import Navbar from '@/components/Navbar'
import Link from 'next/link'

const adminLinks = [
  { href: '/admin',          label: '📊 Dashboard' },
  { href: '/admin/fixtures', label: '📋 Solicitudes' },
  { href: '/admin/matches',  label: '⚽ Resultados' },
  { href: '/admin/groups',   label: '👥 Grupos' },
  { href: '/admin/prizes',   label: '🏆 Premios' },
  { href: '/admin/users',    label: '🧑 Usuarios' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="card p-2 space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Administración
            </p>
            {adminLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  )
}
