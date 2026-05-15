import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { signToken, setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Email o contrasena incorrectos' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Email o contrasena incorrectos' }, { status: 401 })
    }

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role })
    setAuthCookie(token)

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
