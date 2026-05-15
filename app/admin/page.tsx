import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, pendingRequests, totalMatches, playedMatches, totalFixtures] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.fixtureRequest.count({ where: { status: 'PENDING' } }),
    prisma.match.count(),
    prisma.match.count({ where: { played: true } }),
    prisma.fixture.count(),
  ])

  const stats = [
    { label: 'Usuarios registrados', value: totalUsers, icon: '👥', color: 'text-sky-400' },
    { label: 'Solicitudes pendientes', value: pendingRequests, icon: '⏳', color: pendingRequests > 0 ? 'text-amber-400' : 'text-slate-400' },
    { label: 'Partidos jugados', value: `${playedMatches}/${totalMatches}`, icon: '⚽', color: 'text-emerald-400' },
    { label: 'Planillas creadas', value: totalFixtures, icon: '📋', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="text-slate-400 mt-1">Gestioná el torneo desde acá</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/admin/fixtures', icon: '📋', title: 'Gestionar solicitudes', desc: 'Aprobá o rechazá las solicitudes de planillas' },
            { href: '/admin/matches', icon: '⚽', title: 'Cargar resultados', desc: 'Ingresá los resultados de los partidos jugados' },
            { href: '/admin/prizes', icon: '🏆', title: 'Configurar premios', desc: 'Definí los premios para el ranking final' },
            { href: '/admin/users', icon: '👥', title: 'Gestionar usuarios', desc: 'Veé todos los usuarios registrados' },
            { href: '/ranking', icon: '📊', title: 'Ver ranking', desc: 'Mirá el ranking público actual' },
          ].map(item => (
            <a key={item.href} href={item.href} className="card hover:border-sky-600 transition-colors group">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold group-hover:text-sky-400 transition-colors">{item.title}</h3>
              <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
