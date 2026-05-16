import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/groups/:id/members/:userId — quitar usuario del grupo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  await prisma.groupMember.deleteMany({
    where: { groupId: params.id, userId: params.userId },
  })

  return NextResponse.json({ ok: true })
}
