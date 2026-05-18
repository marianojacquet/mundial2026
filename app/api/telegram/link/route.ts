import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST — genera un código de 6 dígitos para vincular Telegram
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Limpiar tokens vencidos del usuario
  await prisma.telegramLinkToken.deleteMany({
    where: { userId: session.sub, expiresAt: { lt: new Date() } },
  })

  // Generar código único de 6 dígitos (letras y números, legible)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O, 0, I, 1 para evitar confusiones
  let token = ''
  do {
    token = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (await prisma.telegramLinkToken.findUnique({ where: { token } }))

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

  await prisma.telegramLinkToken.create({
    data: { token, userId: session.sub, expiresAt },
  })

  return NextResponse.json({ token, expiresAt })
}

// DELETE — desvincular Telegram de la cuenta
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.sub },
    data:  { telegramChatId: null },
  })

  return NextResponse.json({ ok: true })
}
