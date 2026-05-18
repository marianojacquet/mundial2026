// ─── Reglas de puntaje ───────────────────────────────────────────────────────
// +2 resultado correcto (local gana / empate / visitante gana)
// +2 marcador exacto (cantidad de goles exacta)
// Máximo 4 puntos por partido · 104 partidos · máximo total: 416 puntos

type MatchResult = 'HOME' | 'DRAW' | 'AWAY'

function getResult(home: number, away: number): MatchResult {
  if (home > away) return 'HOME'
  if (home === away) return 'DRAW'
  return 'AWAY'
}

export function calculatePredictionPoints(params: {
  predictedHome: number
  predictedAway: number
  actualHome:    number
  actualAway:    number
}): number {
  let points = 0

  const predictedResult = getResult(params.predictedHome, params.predictedAway)
  const actualResult    = getResult(params.actualHome,    params.actualAway)

  // +2 por resultado correcto
  if (predictedResult === actualResult) points += 2

  // +2 por marcador exacto
  if (params.predictedHome === params.actualHome &&
      params.predictedAway === params.actualAway) {
    points += 2
  }

  return points
}

export function getResultLabel(home: number, away: number): string {
  const r = getResult(home, away)
  if (r === 'HOME') return 'Local'
  if (r === 'DRAW') return 'Empate'
  return 'Visitante'
}
