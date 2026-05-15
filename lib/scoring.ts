// Reglas de puntaje:
// - Resultado correcto (local gana / empate / visitante gana): 2 puntos
// - Extra goles primer tiempo correctos: 0.5 puntos
// - Extra tarjetas correctas: 0.5 puntos

type MatchResult = 'HOME' | 'DRAW' | 'AWAY'

function getResult(home: number, away: number): MatchResult {
  if (home > away) return 'HOME'
  if (home === away) return 'DRAW'
  return 'AWAY'
}

export function calculatePredictionPoints(params: {
  predictedHome: number
  predictedAway: number
  actualHome: number
  actualAway: number
  // Extras
  extraFirstHalfGoals?: number | null
  actualFirstHalfGoals?: number | null
  extraCardsType?: 'YELLOW' | 'RED' | null
  extraCardsValue?: number | null
  actualYellowCards?: number | null
  actualRedCards?: number | null
}): number {
  let points = 0

  const predictedResult = getResult(params.predictedHome, params.predictedAway)
  const actualResult = getResult(params.actualHome, params.actualAway)

  if (predictedResult === actualResult) {
    points += 2
  }

  if (
    params.extraFirstHalfGoals != null &&
    params.actualFirstHalfGoals != null &&
    params.extraFirstHalfGoals === params.actualFirstHalfGoals
  ) {
    points += 0.5
  }

  if (params.extraCardsType != null && params.extraCardsValue != null) {
    const actualCards =
      params.extraCardsType === 'YELLOW'
        ? params.actualYellowCards
        : params.actualRedCards

    if (actualCards != null && params.extraCardsValue === actualCards) {
      points += 0.5
    }
  }

  return points
}

export function getResultLabel(home: number, away: number): string {
  const r = getResult(home, away)
  if (r === 'HOME') return 'Local'
  if (r === 'DRAW') return 'Empate'
  return 'Visitante'
}
