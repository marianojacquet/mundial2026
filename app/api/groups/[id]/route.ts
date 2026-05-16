import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/groups/:id — ranking del grupo
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  })

  if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })

  const isMember = group.members.some(m => m.userId === session.sub)
  if (!isMember && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No sos miembro de este grupo' }, { status: 403 })
  }

  const memberIds = group.members.map(m => m.userId)

  // Traemos TODOS los fixtures de los miembros, sin límite,
  // ordenados por puntaje desc para que el primero de cada usuario sea el mejor.
  const fixtures = await prisma.fixture.findMany({
    where: {
      userId: { in: memberIds },
      status: { in: ['SUBMITTED', 'SCORED'] },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { totalScore: 'desc' },
  })

  // Una entrada por usuario: su mejor planilla (primera al estar ordenado desc)
  const byUser = new Map<string, typeof fixtures[0]>()
  for (const f of fixtures) {
    if (!byUser.has(f.userId)) byUser.set(f.userId, f)
  }

  // Incluir miembros sin planilla enviada (0 puntos)
  for (const m of group.members) {
    if (!byUser.has(m.userId)) {
      byUser.set(m.userId, {
        id:        '',
        userId:    m.userId,
        user:      m.user,
        name:      '-',
        totalScore: 0,
        status:    'DRAFT',
        requestId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof fixtures[0])
    }
  }

  const ranking = Array.from(byUser.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((f, i) => ({
      position:      i + 1,
      userId:        f.userId,
      userName:      f.user.name,
      fixtureName:   f.name,
      fixtureId:     f.id || null,
      totalScore:    f.totalScore,
      isCurrentUser: f.userId === session.sub,
    }))

  return NextResponse.json({ group, ranking })
}
