import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }
  const prizes = await prisma.prize.findMany({ orderBy: { position: 'asc' } })
  return NextResponse.json({ prizes })
}

const prizeSchema = z.object({
  position:    z.number().int().min(1).max(10),
  description: z.string().min(1).max(200),
  value:       z.string().max(100).optional(),
  emoji:       z.string().max(10).optional(),
})

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const schema = z.object({ prizes: z.array(prizeSchema) })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  for (const p of parsed.data.prizes) {
    await prisma.prize.upsert({
      where: { position: p.position },
      update: { description: p.description, value: p.value, emoji: p.emoji },
      create: { position: p.position, description: p.description, value: p.value, emoji: p.emoji ?? 'trophy' },
    })
  }

  return NextResponse.json({ ok: true })
}
