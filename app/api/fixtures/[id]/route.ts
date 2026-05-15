import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

// GET /api/fixtures/:id — detalle de un fixture con predicciones
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const fixture = await prisma.fixture.findUnique({
    where: { id: params.id },
    include: {
      predictions: {
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
        orderBy: { match: { matchNumber: 'asc' } },
      },
    },
  })

  if (!fixture) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })
  if (fixture.userId !== session.sub && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  return NextResponse.json({ fixture })
}

// PATCH /api/fixtures/:id — actualizar nombre / enviar planilla
const patchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  submit: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const fixture = await prisma.fixture.findUnique({ where: { id: params.id } })
  if (!fixture) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })
  if (fixture.userId !== session.sub) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  if (fixture.status !== 'DRAFT') {
    return NextResponse.json({ error: 'La planilla ya no es editable' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const updated = await prisma.fixture.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.submit && { status: 'SUBMITTED' }),
    },
  })

  return NextResponse.json({ fixture: updated })
}
