import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.FROM_EMAIL ?? 'Mundial 2026 <noreply@mundial2026.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Aprobacion ───────────────────────────────────────────────────────────────

export async function sendApprovalEmail(opts: {
  to:           string
  userName:     string
  quantity:     number
  fixtureNames: string[]
  adminNote?:   string
}) {
  const { to, userName, quantity, fixtureNames, adminNote } = opts

  const planillasHtml = fixtureNames
    .map(n => `<li style="margin:4px 0">📋 <strong>${n}</strong></li>`)
    .join('')

  await resend.emails.send({
    from:    FROM,
    to,
    subject: `✅ Tu solicitud fue aprobada — Mundial 2026`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);padding:32px 24px;text-align:center">
          <div style="font-size:48px">⚽</div>
          <h1 style="color:#fff;margin:8px 0 4px;font-size:24px">¡Solicitud aprobada!</h1>
          <p style="color:#bae6fd;margin:0">Mundial 2026 · Fixture & Predicciones</p>
        </div>

        <div style="padding:28px 24px">
          <p style="margin:0 0 16px">Hola <strong>${userName}</strong>,</p>
          <p style="margin:0 0 16px;color:#94a3b8">
            Tu solicitud de <strong style="color:#e2e8f0">${quantity} planilla${quantity > 1 ? 's' : ''}</strong>
            fue <strong style="color:#34d399">aprobada</strong>.
            Ya podés ingresar y completar tus predicciones.
          </p>

          <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0 0 8px;font-size:14px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Tus planillas</p>
            <ul style="margin:0;padding-left:20px;color:#e2e8f0">
              ${planillasHtml}
            </ul>
          </div>

          ${adminNote ? `
          <div style="background:#1e3a5f;border-left:3px solid #38bdf8;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#7dd3fc">Nota del organizador: <em>${adminNote}</em></p>
          </div>` : ''}

          <a href="${APP_URL}/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#3b82f6);color:#fff;
                    text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;margin-top:8px">
            🚀 Ir a mis planillas
          </a>
        </div>

        <div style="padding:16px 24px;border-top:1px solid #1e293b;text-align:center;font-size:12px;color:#475569">
          Mundial 2026 · USA 🇺🇸 · Canadá 🇨🇦 · México 🇲🇽
        </div>
      </div>
    `,
  })
}

// ─── Rechazo ──────────────────────────────────────────────────────────────────

export async function sendRejectionEmail(opts: {
  to:          string
  userName:    string
  quantity:    number
  adminNote?:  string
}) {
  const { to, userName, quantity, adminNote } = opts

  await resend.emails.send({
    from:    FROM,
    to,
    subject: `❌ Tu solicitud fue rechazada — Mundial 2026`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#1e293b;padding:32px 24px;text-align:center;border-bottom:1px solid #334155">
          <div style="font-size:48px">⚽</div>
          <h1 style="color:#f1f5f9;margin:8px 0 4px;font-size:24px">Solicitud no aprobada</h1>
          <p style="color:#64748b;margin:0">Mundial 2026 · Fixture & Predicciones</p>
        </div>

        <div style="padding:28px 24px">
          <p style="margin:0 0 16px">Hola <strong>${userName}</strong>,</p>
          <p style="margin:0 0 16px;color:#94a3b8">
            Tu solicitud de <strong style="color:#e2e8f0">${quantity} planilla${quantity > 1 ? 's' : ''}</strong>
            no pudo ser aprobada en este momento.
          </p>

          ${adminNote ? `
          <div style="background:#2d1515;border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#fca5a5">Motivo: <em>${adminNote}</em></p>
          </div>` : ''}

          <p style="color:#94a3b8;font-size:14px">
            Si tenés alguna pregunta, contactá al organizador.
            Podés enviar una nueva solicitud desde tu dashboard.
          </p>

          <a href="${APP_URL}/dashboard"
             style="display:inline-block;background:#1e293b;border:1px solid #334155;color:#e2e8f0;
                    text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;margin-top:8px">
            Ir al dashboard
          </a>
        </div>

        <div style="padding:16px 24px;border-top:1px solid #1e293b;text-align:center;font-size:12px;color:#475569">
          Mundial 2026 · USA 🇺🇸 · Canadá 🇨🇦 · México 🇲🇽
        </div>
      </div>
    `,
  })
}
