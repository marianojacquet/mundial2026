import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/admin/groups/:id/members — agregar usuario al grupo (por email)
const addSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) {
    return NextResponse.json({ error: 'No existe un usuario con ese email' }, { status: 404 })
  }

  // Verificar que el grupo existe
  const group = await prisma.group.findUnique({ where: { id: params.id } })
  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  }

  // Verificar si ya es miembro
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: 'El usuario ya es miembro de este grupo' }, { status: 409 })
  }

  const member = await prisma.groupMember.create({
    data: { groupId: params.id, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ member }, { status: 201 })
}
