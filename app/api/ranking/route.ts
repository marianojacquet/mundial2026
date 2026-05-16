import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Traemos TODOS los fixtures enviados/puntuados, sin límite,
  // ordenados por puntaje desc. Así el primero de cada usuario = el mejor.
  const allFixtures = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { totalScore: 'desc' },
  })

  // Una entrada por usuario: su mejor planilla (la primera al estar ordenado desc)
  const byUser = new Map<string, typeof allFixtures[0]>()
  for (const f of allFixtures) {
    if (!byUser.has(f.userId)) byUser.set(f.userId, f)
  }

  // Ordenar usuarios por mejor puntaje
  const rankingByUser = Array.from(byUser.values())
    .sort((a, b) => b.totalScore - a.totalScore)

  const prizes = await prisma.prize.findMany({ orderBy: { position: 'asc' } })

  const ranking = rankingByUser.map((f, i) => ({
    position:    i + 1,
    userId:      f.userId,
    userName:    f.user.name,
    fixtureName: f.name,
    fixtureId:   f.id,
    totalScore:  f.totalScore,
    prize:       prizes.find(p => p.position === i + 1) ?? null,
  }))

  return NextResponse.json({ ranking })
}
