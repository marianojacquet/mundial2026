import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

const predictionSchema = z.object({
  matchId:   z.string(),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
})

const bulkSchema = z.object({
  predictions: z.array(predictionSchema).min(1),
})

// PUT /api/fixtures/:id/predictions — guardar/actualizar predicciones en bulk
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const fixture = await prisma.fixture.findUnique({ where: { id: params.id } })
  if (!fixture) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })
  if (fixture.userId !== session.sub) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  if (fixture.status !== 'DRAFT') {
    return NextResponse.json({ error: 'La planilla ya no es editable' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { predictions } = parsed.data

  const matchIds = predictions.map(p => p.matchId)
  const matches  = await prisma.match.findMany({ where: { id: { in: matchIds } } })
  if (matches.length !== matchIds.length) {
    return NextResponse.json({ error: 'Uno o más partidos no existen' }, { status: 400 })
  }

  const upserted = await Promise.all(
    predictions.map(p =>
      prisma.prediction.upsert({
        where:  { fixtureId_matchId: { fixtureId: params.id, matchId: p.matchId } },
        create: { fixtureId: params.id, matchId: p.matchId, homeScore: p.homeScore, awayScore: p.awayScore },
        update: { homeScore: p.homeScore, awayScore: p.awayScore, points: 0 },
      })
    )
  )

  return NextResponse.json({ saved: upserted.length })
}
