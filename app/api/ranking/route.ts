import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Cada planilla compite individualmente — sin deduplicar por usuario
  const fixtures = await prisma.fixture.findMany({
    where: { status: { in: ['SUBMITTED', 'SCORED'] } },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { totalScore: 'desc' },
  })

  const prizes = await prisma.prize.findMany({ orderBy: { position: 'asc' } })

  const ranking = fixtures.map((f, i) => ({
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
