import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Devuelve la posicion actual en el ranking de cada planilla del usuario logueado
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Traer TODOS los fixtures enviados/puntuados, ordenados por puntaje
  const allFixtures = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    select: { id: true, userId: true, totalScore: true },
    orderBy: { totalScore: 'desc' },
  })

  const total = allFixtures.length

  // Calcular posicion de cada planilla (su indice + 1 en la lista ordenada)
  const positionMap: Record<string, number> = {}
  allFixtures.forEach((f, i) => { positionMap[f.id] = i + 1 })

  // Planillas del usuario que estan en el ranking
  const myFixtures = allFixtures.filter(f => f.userId === session.sub)

  const positions = myFixtures.map(f => ({
    fixtureId: f.id,
    position:  positionMap[f.id],
    total,
  }))

  return NextResponse.json({ positions, total })
}
