import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const phase = searchParams.get('phase')

  const matches = await prisma.match.findMany({
    where: phase ? { phase: phase as never } : undefined,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  return NextResponse.json({ matches })
}

