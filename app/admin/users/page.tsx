import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true, name: true, email: true, phone: true, createdAt: true,
      _count: { select: { fixtures: true, fixtureRequests: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios registrados</h1>
        <p className="text-slate-400 text-sm mt-1">{users.length} usuarios en total</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-slate-700 bg-slate-900/50">
            <tr>
              <th className="table-header text-left">Usuario</th>
              <th className="table-header text-left">Email</th>
              <th className="table-header text-left">Teléfono</th>
              <th className="table-header text-center">Planillas</th>
              <th className="table-header text-center">Solicitudes</th>
              <th className="table-header text-left">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="table-cell font-medium">{u.name}</td>
                <td className="table-cell text-slate-400">{u.email}</td>
                <td className="table-cell text-slate-400 text-sm">{u.phone ?? <span className="text-slate-600">—</span>}</td>
                <td className="table-cell text-center">
                  <span className="badge bg-sky-900/50 text-sky-300 border border-sky-700">{u._count.fixtures}</span>
                </td>
                <td className="table-cell text-center">
                  <span className="badge badge-draft">{u._count.fixtureRequests}</span>
                </td>
                <td className="table-cell text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="table-cell text-center text-slate-400 py-10">
                  No hay usuarios registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
