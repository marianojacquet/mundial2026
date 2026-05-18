import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { setWebhook } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

// GET /api/telegram/setup — registra el webhook de Telegram (solo admin)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL no configurado' }, { status: 500 })

  const webhookUrl = `${appUrl}/api/telegram/webhook`
  const result = await setWebhook(webhookUrl)

  return NextResponse.json({ webhookUrl, result })
}
