'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Spinner } from '@/components/ui/Spinner'

type Group = {
  id: string; name: string; description?: string
  joinedAt: string; _count: { members: number }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups ?? []); setLoading(false) })
  }, [])

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Grupos</h1>
          <p className="text-slate-400 mt-1">Los grupos en los que participas</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl font-medium mb-2">Todavia no estas en ningun grupo</p>
            <p className="text-sm">El administrador te agregara a un grupo de competencia.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {groups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}
                className="card hover:border-sky-600 transition-colors group">
                <div className="flex items-start gap-3">
                  <span className="text-3xl mt-0.5">👥</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg group-hover:text-sky-400 transition-colors">{g.name}</h2>
                    {g.description && <p className="text-slate-400 text-sm mt-0.5">{g.description}</p>}
                    <p className="text-sky-400 text-sm mt-2 font-medium">
                      {g._count.members} participante{g._count.members !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-slate-500 group-hover:text-sky-400 transition-colors text-xl">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
