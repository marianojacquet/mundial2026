import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

// Telegram envía un POST por cada mensaje que recibe el bot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId  = message.chat?.id
    const text    = (message.text ?? '').trim()
    const [cmd, ...args] = text.split(/\s+/)

    if (!chatId) return NextResponse.json({ ok: true })

    switch (cmd.toLowerCase()) {

      // ── /start ─────────────────────────────────────────────────────────────
      case '/start': {
        await sendMessage(chatId, `⚽ <b>Bienvenido al bot de Mundial 2026!</b>

Podés consultar resultados, el ranking y tus planillas.

📋 <b>Comandos disponibles:</b>
/vincular <code>CODIGO</code> — Conectar tu cuenta
/ranking — Top 10 del ranking
/yo — Tus planillas y posición
/resultado <code>N</code> — Resultado del partido N
/proximos — Próximos partidos

Para conectar tu cuenta, ingresá a <b>${APP_URL}/dashboard</b> y seguí las instrucciones para vincular Telegram.`)
        break
      }

      // ── /vincular CODIGO ────────────────────────────────────────────────────
      case '/vincular': {
        const token = args[0]?.toUpperCase()
        if (!token) {
          await sendMessage(chatId, '❌ Usá: <code>/vincular CODIGO</code>\n\nEl código lo encontrás en tu dashboard.')
          break
        }

        const linkToken = await prisma.telegramLinkToken.findUnique({
          where: { token },
          include: { user: true },
        })

        if (!linkToken) {
          await sendMessage(chatId, '❌ Código inválido. Generá uno nuevo desde tu dashboard.')
          break
        }
        if (linkToken.expiresAt < new Date()) {
          await prisma.telegramLinkToken.delete({ where: { token } })
          await sendMessage(chatId, '⏱ El código expiró. Generá uno nuevo desde tu dashboard.')
          break
        }

        // Verificar que el chatId no esté ya vinculado a otra cuenta
        const existing = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } })
        if (existing && existing.id !== linkToken.userId) {
          await sendMessage(chatId, '⚠️ Este Telegram ya está vinculado a otra cuenta.')
          break
        }

        // Vincular
        await prisma.user.update({
          where: { id: linkToken.userId },
          data:  { telegramChatId: String(chatId) },
        })
        await prisma.telegramLinkToken.deleteMany({ where: { userId: linkToken.userId } })

        await sendMessage(chatId, `✅ <b>¡Cuenta vinculada!</b>

Hola, <b>${linkToken.user.name}</b>. Tu cuenta de Mundial 2026 está conectada a este chat.

Usá /yo para ver tus planillas o /ranking para el ranking general.`)
        break
      }

      // ── /ranking ────────────────────────────────────────────────────────────
      case '/ranking': {
        const fixtures = await prisma.fixture.findMany({
          where: { status: { in: ['SUBMITTED', 'SCORED'] } },
          include: { user: { select: { name: true } } },
          orderBy: { totalScore: 'desc' },
          take: 10,
        })

        if (fixtures.length === 0) {
          await sendMessage(chatId, '📊 El ranking aún está vacío. ¡Sé el primero en enviar tu planilla!')
          break
        }

        const MEDALS = ['🥇', '🥈', '🥉']
        const lines = fixtures.map((f, i) => {
          const medal = MEDALS[i] ?? `${i + 1}.`
          return `${medal} <b>${f.user.name}</b> — <b>${f.totalScore.toFixed(1)} pts</b>\n   📋 ${f.name}`
        })

        await sendMessage(chatId, `🏆 <b>Ranking Mundial 2026 — Top 10</b>\n\n${lines.join('\n\n')}\n\n<a href="${APP_URL}/ranking">Ver ranking completo</a>`)
        break
      }

      // ── /yo ─────────────────────────────────────────────────────────────────
      case '/yo': {
        const user = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } })
        if (!user) {
          await sendMessage(chatId, `❌ Tu Telegram no está vinculado a ninguna cuenta.\n\nIngresá a <b>${APP_URL}/dashboard</b> y vinculá tu cuenta.`)
          break
        }

        const userFixtures = await prisma.fixture.findMany({
          where: { userId: user.id, status: { in: ['SUBMITTED', 'SCORED'] } },
          orderBy: { totalScore: 'desc' },
        })

        if (userFixtures.length === 0) {
          await sendMessage(chatId, `📋 <b>${user.name}</b>, todavía no tenés planillas enviadas.\n\n<a href="${APP_URL}/dashboard">Ir al dashboard</a>`)
          break
        }

        // Obtener posicion de cada planilla
        const allFixtures = await prisma.fixture.findMany({
          where: { status: { in: ['SUBMITTED', 'SCORED'] } },
          select: { id: true },
          orderBy: { totalScore: 'desc' },
        })
        const posMap: Record<string, number> = {}
        allFixtures.forEach((f, i) => { posMap[f.id] = i + 1 })

        const lines = userFixtures.map(f => {
          const pos = posMap[f.id] ?? '—'
          return `📋 <b>${f.name}</b>\n   🏅 Puesto #${pos} de ${allFixtures.length}\n   ⭐ ${f.totalScore.toFixed(1)} pts`
        })

        await sendMessage(chatId, `👤 <b>${user.name}</b> — Tus planillas:\n\n${lines.join('\n\n')}\n\n<a href="${APP_URL}/ranking">Ver ranking completo</a>`)
        break
      }

      // ── /resultado N ────────────────────────────────────────────────────────
      case '/resultado': {
        const num = Number(args[0])
        if (!num || isNaN(num)) {
          await sendMessage(chatId, '❌ Usá: <code>/resultado 23</code> con el número de partido.')
          break
        }

        const match = await prisma.match.findUnique({
          where: { matchNumber: num },
          include: {
            homeTeam: { select: { name: true, flag: true } },
            awayTeam: { select: { name: true, flag: true } },
          },
        })

        if (!match) {
          await sendMessage(chatId, `❌ No encontré el partido #${num}.`)
          break
        }

        const home = match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : (match.homeLabel ?? '?')
        const away = match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : (match.awayLabel ?? '?')

        if (!match.played) {
          const date = new Date(match.scheduledAt).toLocaleDateString('es-AR', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
          })
          await sendMessage(chatId, `⏰ <b>Partido #${num} — Sin jugar</b>\n\n${home} vs ${away}\n📅 ${date}${match.venue ? `\n📍 ${match.venue}` : ''}`)
          break
        }

        await sendMessage(chatId, `⚽ <b>Partido #${num} — Resultado</b>\n\n<b>${home} ${match.homeScore} — ${match.awayScore} ${away}</b>`)
        break
      }

      // ── /proximos ───────────────────────────────────────────────────────────
      case '/proximos': {
        const upcoming = await prisma.match.findMany({
          where: { played: false, scheduledAt: { gte: new Date() } },
          include: {
            homeTeam: { select: { name: true, flag: true } },
            awayTeam: { select: { name: true, flag: true } },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
        })

        if (upcoming.length === 0) {
          await sendMessage(chatId, '✅ No hay más partidos programados.')
          break
        }

        const lines = upcoming.map(m => {
          const home = m.homeTeam ? `${m.homeTeam.flag} ${m.homeTeam.name}` : (m.homeLabel ?? '?')
          const away = m.awayTeam ? `${m.awayTeam.flag} ${m.awayTeam.name}` : (m.awayLabel ?? '?')
          const date = new Date(m.scheduledAt).toLocaleDateString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
          })
          return `#${m.matchNumber} <b>${home} vs ${away}</b>\n📅 ${date}`
        })

        await sendMessage(chatId, `📅 <b>Próximos partidos:</b>\n\n${lines.join('\n\n')}`)
        break
      }

      // ── Comando desconocido ─────────────────────────────────────────────────
      default: {
        if (text.startsWith('/')) {
          await sendMessage(chatId, `❓ Comando no reconocido. Usá /start para ver los comandos disponibles.`)
        }
      }
    }
  } catch (err) {
    console.error('Telegram webhook error:', err)
  }

  return NextResponse.json({ ok: true })
}
