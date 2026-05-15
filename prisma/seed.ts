import { PrismaClient, Phase } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Equipos del Mundial 2026 ─────────────────────────────────────────────────
const TEAMS = [
  // Grupo A
  { name: 'Estados Unidos',   code: 'USA', group: 'A', flag: '🇺🇸' },
  { name: 'Marruecos',        code: 'MAR', group: 'A', flag: '🇲🇦' },
  { name: 'Polonia',          code: 'POL', group: 'A', flag: '🇵🇱' },
  { name: 'Nueva Zelanda',    code: 'NZL', group: 'A', flag: '🇳🇿' },
  // Grupo B
  { name: 'México',           code: 'MEX', group: 'B', flag: '🇲🇽' },
  { name: 'Japón',            code: 'JPN', group: 'B', flag: '🇯🇵' },
  { name: 'Rumania',          code: 'ROU', group: 'B', flag: '🇷🇴' },
  { name: 'Senegal',          code: 'SEN', group: 'B', flag: '🇸🇳' },
  // Grupo C
  { name: 'Canadá',           code: 'CAN', group: 'C', flag: '🇨🇦' },
  { name: 'Portugal',         code: 'POR', group: 'C', flag: '🇵🇹' },
  { name: 'Costa de Marfil',  code: 'CIV', group: 'C', flag: '🇨🇮' },
  { name: 'Jordania',         code: 'JOR', group: 'C', flag: '🇯🇴' },
  // Grupo D
  { name: 'Brasil',           code: 'BRA', group: 'D', flag: '🇧🇷' },
  { name: 'Alemania',         code: 'GER', group: 'D', flag: '🇩🇪' },
  { name: 'Egipto',           code: 'EGY', group: 'D', flag: '🇪🇬' },
  { name: 'Uzbekistán',       code: 'UZB', group: 'D', flag: '🇺🇿' },
  // Grupo E
  { name: 'Argentina',        code: 'ARG', group: 'E', flag: '🇦🇷' },
  { name: 'Francia',          code: 'FRA', group: 'E', flag: '🇫🇷' },
  { name: 'Nigeria',          code: 'NGA', group: 'E', flag: '🇳🇬' },
  { name: 'Australia',        code: 'AUS', group: 'E', flag: '🇦🇺' },
  // Grupo F
  { name: 'España',           code: 'ESP', group: 'F', flag: '🇪🇸' },
  { name: 'Corea del Sur',    code: 'KOR', group: 'F', flag: '🇰🇷' },
  { name: 'Rep. Dem. Congo',  code: 'COD', group: 'F', flag: '🇨🇩' },
  { name: 'Hungría',          code: 'HUN', group: 'F', flag: '🇭🇺' },
  // Grupo G
  { name: 'Inglaterra',       code: 'ENG', group: 'G', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Colombia',         code: 'COL', group: 'G', flag: '🇨🇴' },
  { name: 'Camerún',          code: 'CMR', group: 'G', flag: '🇨🇲' },
  { name: 'Irak',             code: 'IRQ', group: 'G', flag: '🇮🇶' },
  // Grupo H
  { name: 'Países Bajos',     code: 'NED', group: 'H', flag: '🇳🇱' },
  { name: 'Uruguay',          code: 'URU', group: 'H', flag: '🇺🇾' },
  { name: 'Arabia Saudita',   code: 'KSA', group: 'H', flag: '🇸🇦' },
  { name: 'Escocia',          code: 'SCO', group: 'H', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // Grupo I
  { name: 'Croacia',          code: 'CRO', group: 'I', flag: '🇭🇷' },
  { name: 'Ecuador',          code: 'ECU', group: 'I', flag: '🇪🇨' },
  { name: 'Mali',             code: 'MLI', group: 'I', flag: '🇲🇱' },
  { name: 'Turquía',          code: 'TUR', group: 'I', flag: '🇹🇷' },
  // Grupo J
  { name: 'Suiza',            code: 'SUI', group: 'J', flag: '🇨🇭' },
  { name: 'Venezuela',        code: 'VEN', group: 'J', flag: '🇻🇪' },
  { name: 'Sudáfrica',        code: 'RSA', group: 'J', flag: '🇿🇦' },
  { name: 'Serbia',           code: 'SRB', group: 'J', flag: '🇷🇸' },
  // Grupo K
  { name: 'Dinamarca',        code: 'DEN', group: 'K', flag: '🇩🇰' },
  { name: 'Panamá',           code: 'PAN', group: 'K', flag: '🇵🇦' },
  { name: 'Irán',             code: 'IRN', group: 'K', flag: '🇮🇷' },
  { name: 'Ucrania',          code: 'UKR', group: 'K', flag: '🇺🇦' },
  // Grupo L
  { name: 'Austria',          code: 'AUT', group: 'L', flag: '🇦🇹' },
  { name: 'Jamaica',          code: 'JAM', group: 'L', flag: '🇯🇲' },
  { name: 'Costa Rica',       code: 'CRC', group: 'L', flag: '🇨🇷' },
  { name: 'Bélgica',          code: 'BEL', group: 'L', flag: '🇧🇪' },
]

// Sedes del torneo (USA, Canadá, México)
const VENUES = {
  usa: [
    'MetLife Stadium, Nueva York/Nueva Jersey',
    'SoFi Stadium, Los Ángeles',
    'AT&T Stadium, Dallas/Fort Worth',
    'Levi\'s Stadium, San Francisco/Bay Area',
    'Hard Rock Stadium, Miami',
    'Gillette Stadium, Boston',
    'Arrowhead Stadium, Kansas City',
    'NRG Stadium, Houston',
    'Lincoln Financial Field, Philadelphia',
    'Lumen Field, Seattle',
    'State Farm Stadium, Phoenix',
  ],
  canada: [
    'BC Place, Vancouver',
    'BMO Field, Toronto',
  ],
  mexico: [
    'Estadio Azteca, Ciudad de México',
    'Estadio Akron, Guadalajara',
    'Estadio BBVA, Monterrey',
  ],
}

const ALL_VENUES = [...VENUES.usa, ...VENUES.canada, ...VENUES.mexico]

function randomVenue(i: number): string {
  return ALL_VENUES[i % ALL_VENUES.length]
}

// Genera fecha base para cada partido del grupo
// El mundial empieza el 11 de junio de 2026
function groupMatchDate(gameIndex: number): Date {
  const base = new Date('2026-06-11T18:00:00Z')
  // distribuir 72 partidos en ~22 días (3 partidos/día aprox)
  const daysOffset = Math.floor(gameIndex / 3)
  const hourOffset = (gameIndex % 3) * 3 * 3600 * 1000
  const d = new Date(base.getTime() + daysOffset * 86400000 + hourOffset)
  return d
}

// Genera partidos de grupos (round-robin dentro de cada grupo de 4)
function buildGroupMatches(teams: typeof TEAMS) {
  const matches: Array<{
    matchNumber: number
    phase: Phase
    groupName: string
    homeCode: string
    awayCode: string
    scheduledAt: Date
    venue: string
  }> = []

  let matchNumber = 1
  const GROUPS = 'ABCDEFGHIJKL'.split('')

  for (const group of GROUPS) {
    const groupTeams = teams.filter(t => t.group === group)
    // round-robin: [(0,1),(2,3),(0,2),(1,3),(0,3),(1,2)]
    const pairs = [
      [0, 1], [2, 3],
      [0, 2], [1, 3],
      [0, 3], [1, 2],
    ]
    for (const [a, b] of pairs) {
      const gIdx = (GROUPS.indexOf(group) * 6) + pairs.indexOf([a, b])
      matches.push({
        matchNumber,
        phase: Phase.GROUP,
        groupName: group,
        homeCode: groupTeams[a].code,
        awayCode: groupTeams[b].code,
        scheduledAt: groupMatchDate(matches.length),
        venue: randomVenue(matchNumber),
      })
      matchNumber++
    }
  }
  return matches
}

// Partidos de eliminación (con etiquetas, sin equipos fijos aún)
function buildKnockoutMatches(startNumber: number) {
  const matches: Array<{
    matchNumber: number
    phase: Phase
    homeLabel: string
    awayLabel: string
    scheduledAt: Date
    venue: string
  }> = []

  let n = startNumber

  // Ronda de 32 (16 partidos) - del 73 al 88
  const r32Pairs = [
    ['1° Grupo A', '2° Grupo B'],
    ['1° Grupo C', '2° Grupo D'],
    ['1° Grupo E', '2° Grupo F'],
    ['1° Grupo G', '2° Grupo H'],
    ['1° Grupo I', '2° Grupo J'],
    ['1° Grupo K', '2° Grupo L'],
    ['2° Grupo A', '1° Grupo B'],
    ['2° Grupo C', '1° Grupo D'],
    ['2° Grupo E', '1° Grupo F'],
    ['2° Grupo G', '1° Grupo H'],
    ['2° Grupo I', '1° Grupo J'],
    ['2° Grupo K', '1° Grupo L'],
    ['Mejor 3° (G1)', 'Mejor 3° (G2)'],
    ['Mejor 3° (G3)', 'Mejor 3° (G4)'],
    ['Mejor 3° (G5)', 'Mejor 3° (G6)'],
    ['Mejor 3° (G7)', 'Mejor 3° (G8)'],
  ]

  const r32Base = new Date('2026-07-04T18:00:00Z')
  for (let i = 0; i < r32Pairs.length; i++) {
    const d = new Date(r32Base.getTime() + Math.floor(i / 4) * 86400000 + (i % 4) * 4 * 3600000)
    matches.push({ matchNumber: n++, phase: Phase.ROUND_OF_32, homeLabel: r32Pairs[i][0], awayLabel: r32Pairs[i][1], scheduledAt: d, venue: randomVenue(n) })
  }

  // Octavos (8 partidos)
  const r16Base = new Date('2026-07-09T18:00:00Z')
  for (let i = 0; i < 8; i++) {
    const d = new Date(r16Base.getTime() + Math.floor(i / 2) * 86400000 + (i % 2) * 4 * 3600000)
    matches.push({ matchNumber: n++, phase: Phase.ROUND_OF_16, homeLabel: `Ganador R32-${i * 2 + 1}`, awayLabel: `Ganador R32-${i * 2 + 2}`, scheduledAt: d, venue: randomVenue(n) })
  }

  // Cuartos (4 partidos)
  const qfBase = new Date('2026-07-15T18:00:00Z')
  for (let i = 0; i < 4; i++) {
    const d = new Date(qfBase.getTime() + Math.floor(i / 2) * 86400000 + (i % 2) * 4 * 3600000)
    matches.push({ matchNumber: n++, phase: Phase.QUARTERFINAL, homeLabel: `Ganador R16-${i * 2 + 1}`, awayLabel: `Ganador R16-${i * 2 + 2}`, scheduledAt: d, venue: randomVenue(n) })
  }

  // Semis (2 partidos)
  const sfBase = new Date('2026-07-21T18:00:00Z')
  for (let i = 0; i < 2; i++) {
    const d = new Date(sfBase.getTime() + i * 86400000)
    matches.push({ matchNumber: n++, phase: Phase.SEMIFINAL, homeLabel: `Ganador QF-${i * 2 + 1}`, awayLabel: `Ganador QF-${i * 2 + 2}`, scheduledAt: d, venue: randomVenue(n) })
  }

  // 3er puesto
  matches.push({
    matchNumber: n++, phase: Phase.THIRD_PLACE,
    homeLabel: 'Perdedor SF-1', awayLabel: 'Perdedor SF-2',
    scheduledAt: new Date('2026-07-25T18:00:00Z'), venue: randomVenue(n),
  })

  // Final
  matches.push({
    matchNumber: n++, phase: Phase.FINAL,
    homeLabel: 'Ganador SF-1', awayLabel: 'Ganador SF-2',
    scheduledAt: new Date('2026-07-26T18:00:00Z'), venue: 'MetLife Stadium, Nueva York/Nueva Jersey',
  })

  return matches
}

// ─── Premios ──────────────────────────────────────────────────────────────────
const PRIZES = [
  { position: 1,  description: '1er Lugar - Premio mayor',        value: 'A definir por el organizador', emoji: '🥇' },
  { position: 2,  description: '2do Lugar',                       value: 'A definir por el organizador', emoji: '🥈' },
  { position: 3,  description: '3er Lugar',                       value: 'A definir por el organizador', emoji: '🥉' },
  { position: 4,  description: '4to Lugar',                       value: 'A definir por el organizador', emoji: '🏅' },
  { position: 5,  description: '5to Lugar',                       value: 'A definir por el organizador', emoji: '🏅' },
  { position: 6,  description: '6to Lugar',                       value: 'A definir por el organizador', emoji: '🏅' },
  { position: 7,  description: '7mo Lugar',                       value: 'A definir por el organizador', emoji: '🎖️' },
  { position: 8,  description: '8vo Lugar',                       value: 'A definir por el organizador', emoji: '🎖️' },
  { position: 9,  description: '9no Lugar',                       value: 'A definir por el organizador', emoji: '🎖️' },
  { position: 10, description: '10mo Lugar',                      value: 'A definir por el organizador', emoji: '🎖️' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌍 Iniciando seed del Mundial 2026...')

  // Limpiar datos existentes
  await prisma.prediction.deleteMany()
  await prisma.fixture.deleteMany()
  await prisma.fixtureRequest.deleteMany()
  await prisma.match.deleteMany()
  await prisma.team.deleteMany()
  await prisma.prize.deleteMany()
  await prisma.user.deleteMany()

  // ── Admin ──
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mundial2026.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`✅ Admin creado: ${admin.email} / admin123`)

  // ── Usuario demo ──
  const demoPassword = await bcrypt.hash('demo123', 12)
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@mundial2026.com',
      name: 'Usuario Demo',
      password: demoPassword,
      role: 'USER',
    },
  })
  console.log(`✅ Demo creado: ${demoUser.email} / demo123`)

  // ── Equipos ──
  const createdTeams = await Promise.all(
    TEAMS.map(t =>
      prisma.team.create({ data: { name: t.name, code: t.code, group: t.group, flag: t.flag } })
    )
  )
  const teamMap = new Map(createdTeams.map(t => [t.code, t.id]))
  console.log(`✅ ${createdTeams.length} equipos creados`)

  // ── Partidos de grupos ──
  const groupMatches = buildGroupMatches(TEAMS)
  let matchesCreated = 0
  for (const m of groupMatches) {
    await prisma.match.create({
      data: {
        matchNumber: m.matchNumber,
        phase: m.phase,
        groupName: m.groupName,
        homeTeamId: teamMap.get(m.homeCode)!,
        awayTeamId: teamMap.get(m.awayCode)!,
        scheduledAt: m.scheduledAt,
        venue: m.venue,
      },
    })
    matchesCreated++
  }
  console.log(`✅ ${matchesCreated} partidos de grupos creados`)

  // ── Partidos de eliminación ──
  const knockoutMatches = buildKnockoutMatches(73)
  for (const m of knockoutMatches) {
    await prisma.match.create({
      data: {
        matchNumber: m.matchNumber,
        phase: m.phase,
        homeLabel: m.homeLabel,
        awayLabel: m.awayLabel,
        scheduledAt: m.scheduledAt,
        venue: m.venue,
      },
    })
    matchesCreated++
  }
  console.log(`✅ ${knockoutMatches.length} partidos de eliminación creados`)
  console.log(`✅ Total: ${matchesCreated} partidos`)

  // ── Premios ──
  for (const p of PRIZES) {
    await prisma.prize.create({ data: p })
  }
  console.log(`✅ ${PRIZES.length} premios creados`)

  console.log('\n🏆 Seed completado exitosamente!')
  console.log('   Admin: admin@mundial2026.com / admin123')
  console.log('   Demo:  demo@mundial2026.com  / demo123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
