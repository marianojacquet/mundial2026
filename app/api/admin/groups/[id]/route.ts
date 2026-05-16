import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/groups/:id — editar nombre/descripcion
const patchSchema = z.object({
  name:        z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const group = await prisma.group.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json({ group })
}

// DELETE /api/admin/groups/:id — eliminar grupo
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  await prisma.group.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
