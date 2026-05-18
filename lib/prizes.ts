// ─── Modelo de monetización ───────────────────────────────────────────────────
// Precio por planilla: $3.500
// Admin:              $2.000 (57%)
// Premio general:     $  800 (23%) → 1 solo ganador, todo el pozo acumulado
// Premio de grupo:    $  400 (11%) → 1 solo ganador por grupo
// Incentivo formador: $  300 ( 9%) → por cada planilla de su grupo

export const PRECIO_PLANILLA        = 3_500
export const ADMIN_POR_PLANILLA     = 2_000
export const GENERAL_POR_PLANILLA   =   800
export const GRUPO_POR_PLANILLA     =   400
export const FORMADOR_POR_PLANILLA  =   300

/** Pozo acumulado del ranking general */
export function calcPozoGeneral(totalFixtures: number) {
  return totalFixtures * GENERAL_POR_PLANILLA
}

/** Pozo del premio de un grupo específico */
export function calcPozoGrupo(fixturesEnGrupo: number) {
  return fixturesEnGrupo * GRUPO_POR_PLANILLA
}

/** Incentivo acumulado para el formador de un grupo */
export function calcIncentivosFormador(fixturesEnGrupo: number) {
  return fixturesEnGrupo * FORMADOR_POR_PLANILLA
}

/** Formatear como pesos argentinos: $12.400 */
export function formatPesos(n: number) {
  return '$' + n.toLocaleString('es-AR')
}
