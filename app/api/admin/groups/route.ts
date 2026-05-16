import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/groups — listar todos los grupos
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ groups })
}

// POST /api/admin/groups — crear grupo
const createSchema = z.object({
  name:        z.string().min(2).max(60),
  description: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const group = await prisma.group.create({
    data: { name: parsed.data.name, description: parsed.data.description },
  })

  return NextResponse.json({ group }, { status: 201 })
}
