import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'
import { calculatePredictionPoints } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

const resultSchema = z.object({
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
})

// PATCH /api/admin/matches/:id — cargar resultado y recalcular puntos
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = resultSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { homeScore, awayScore } = parsed.data

  const match = await prisma.match.findUnique({ where: { id: params.id } })
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  // Guardar resultado
  await prisma.match.update({
    where: { id: params.id },
    data:  { homeScore, awayScore, played: true },
  })

  // Recalcular puntos de todas las predicciones de este partido
  const predictions = await prisma.prediction.findMany({
    where: { matchId: params.id },
  })

  for (const pred of predictions) {
    const pts = calculatePredictionPoints({
      predictedHome: pred.homeScore,
      predictedAway: pred.awayScore,
      actualHome:    homeScore,
      actualAway:    awayScore,
    })
    await prisma.prediction.update({ where: { id: pred.id }, data: { points: pts } })
  }

  // Recalcular totalScore de cada fixture afectado
  const fixtureIds = [...new Set(predictions.map(p => p.fixtureId))]
  const allPlayed  = await prisma.match.count({ where: { played: false } }) === 0

  for (const fixtureId of fixtureIds) {
    const agg   = await prisma.prediction.aggregate({ where: { fixtureId }, _sum: { points: true } })
    const total = agg._sum.points ?? 0
    await prisma.fixture.update({
      where: { id: fixtureId },
      data:  { totalScore: total, status: allPlayed ? 'SCORED' : 'SUBMITTED' },
    })
  }

  return NextResponse.json({ ok: true, predictionsUpdated: predictions.length })
}

// GET /api/admin/matches/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const match = await prisma.match.findUnique({
    where:   { id: params.id },
    include: { homeTeam: true, awayTeam: true },
  })
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  return NextResponse.json({ match })
}
