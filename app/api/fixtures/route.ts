import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/fixtures
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [fixtures, user] = await Promise.all([
    prisma.fixture.findMany({
      where: { userId: session.sub },
      include: {
        _count: { select: { predictions: true } },
        request: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { telegramChatId: true },
    }),
  ])

  return NextResponse.json({ fixtures, telegramLinked: !!user?.telegramChatId })
}

// POST /api/fixtures
const requestSchema = z.object({
  quantity: z.number().int().min(1).max(10),
  note: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const fixtureRequest = await prisma.fixtureRequest.create({
      data: {
        userId: session.sub,
        quantity: parsed.data.quantity,
        note: parsed.data.note,
      },
    })

    return NextResponse.json({ request: fixtureRequest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

