import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Top 10 planillas con mayor puntaje
  const topFixtures = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { totalScore: 'desc' },
    take: 50,
  })

  // Un ranking por usuario (mejor planilla de cada uno) para el podio
  const byUser = new Map<string, typeof topFixtures[0]>()
  for (const f of topFixtures) {
    if (!byUser.has(f.userId)) byUser.set(f.userId, f)
  }

  const rankingByUser = Array.from(byUser.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)

  const prizes = await prisma.prize.findMany({ orderBy: { position: 'asc' } })

  const ranking = rankingByUser.map((f, i) => ({
    position: i + 1,
    userId: f.userId,
    userName: f.user.name,
    fixtureName: f.name,
    fixtureId: f.id,
    totalScore: f.totalScore,
    prize: prizes.find(p => p.position === i + 1) ?? null,
  }))

  // Ranking completo de todas las planillas
  const allFixtures = topFixtures
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 50)
    .map((f, i) => ({
      position: i + 1,
      userId: f.userId,
      userName: f.user.name,
      fixtureName: f.name,
      fixtureId: f.id,
      totalScore: f.totalScore,
    }))

  return NextResponse.json({ rankingByUser: ranking, allFixtures })
}
