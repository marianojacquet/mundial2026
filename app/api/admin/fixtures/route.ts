import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const requests = await prisma.fixtureRequest.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      fixtures: { select: { id: true, name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}

const patchSchema = z.object({
  requestId: z.string(),
  action:    z.enum(['APPROVE', 'REJECT']),
  adminNote: z.string().max(300).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { requestId, action, adminNote } = parsed.data

  const fixtureRequest = await prisma.fixtureRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!fixtureRequest) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  if (fixtureRequest.status !== 'PENDING') {
    return NextResponse.json({ error: 'La solicitud ya fue procesada' }, { status: 400 })
  }

  const updated = await prisma.fixtureRequest.update({
    where: { id: requestId },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      adminNote: adminNote ?? null,
    },
  })

  if (action === 'APPROVE') {
    const fixtures = Array.from({ length: fixtureRequest.quantity }, (_, i) => ({
      userId:    fixtureRequest.userId,
      requestId: fixtureRequest.id,
      name:      `Planilla ${i + 1}`,
    }))
    await prisma.fixture.createMany({ data: fixtures })

    // Enviar email de aprobacion (sin bloquear la respuesta)
    sendApprovalEmail({
      to:           fixtureRequest.user.email,
      userName:     fixtureRequest.user.name,
      quantity:     fixtureRequest.quantity,
      fixtureNames: fixtures.map(f => f.name),
      adminNote:    adminNote,
    }).catch(err => console.error('Email aprobacion error:', err))
  } else {
    // Enviar email de rechazo (sin bloquear la respuesta)
    sendRejectionEmail({
      to:        fixtureRequest.user.email,
      userName:  fixtureRequest.user.name,
      quantity:  fixtureRequest.quantity,
      adminNote: adminNote,
    }).catch(err => console.error('Email rechazo error:', err))
  }

  return NextResponse.json({ request: updated })
}
