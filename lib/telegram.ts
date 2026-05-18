const TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? ''
const API_URL = `https://api.telegram.org/bot${TOKEN}`

// ─── Enviar mensaje ───────────────────────────────────────────────────────────

export async function sendMessage(chatId: string | number, text: string, opts?: {
  parseMode?: 'HTML' | 'Markdown'
  disablePreview?: boolean
}) {
  if (!TOKEN) return
  await fetch(`${API_URL}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:                  chatId,
      text,
      parse_mode:               opts?.parseMode ?? 'HTML',
      disable_web_page_preview: opts?.disablePreview ?? true,
    }),
  })
}

// ─── Configurar webhook ───────────────────────────────────────────────────────

export async function setWebhook(url: string) {
  const res = await fetch(`${API_URL}/setWebhook`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return res.json()
}

// ─── Notificar a todos los usuarios con Telegram vinculado ────────────────────

export async function broadcastMessage(chatIds: string[], text: string) {
  await Promise.allSettled(chatIds.map(id => sendMessage(id, text)))
}
