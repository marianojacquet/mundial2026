import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const requests = await prisma.fixtureRequest.findMany({
    where: { userId: session.sub },
    include: {
      fixtures: { select: { id: true, name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}

