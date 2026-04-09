import { db } from '../db/client.js'
import { teams, tournaments } from '../schema/index.js'

async function seedTestData() {
  console.log('Seeding test teams...')

  const divisionA = await db.query.divisions.findFirst({
    where: (d, { eq }) => eq(d.shortName, 'A'),
  })

  const divisionB = await db.query.divisions.findFirst({
    where: (d, { eq }) => eq(d.shortName, 'B'),
  })

  if (!divisionA || !divisionB) {
    console.error('Divisions not found')
    return
  }

  // Teams Division A
  const teamsA = [
    { name: 'Nacional', shortName: 'NAC' },
    { name: 'Peñarol', shortName: 'PEN' },
    { name: 'Liverpool', shortName: 'LIV' },
    { name: 'Cerro Largo', shortName: 'CER' },
    { name: 'Defensor Sporting', shortName: 'DEF' },
    { name: 'Wanderers', shortName: 'WAN' },
    { name: 'Danubio', shortName: 'DAN' },
    { name: 'River Plate', shortName: 'RIV' },
    { name: 'Boston River', shortName: 'BOS' },
    { name: 'La Luz', shortName: 'LUZ' },
    { name: 'Progreso', shortName: 'PRO' },
    { name: 'Racing', shortName: 'RAC' },
    { name: 'Rentistas', shortName: 'REN' },
    { name: 'Fénix', shortName: 'FEN' },
    { name: 'Plaza Colonia', shortName: 'PLA' },
    { name: 'Deportivo Maldonado', shortName: 'MAL' },
  ]

  for (const team of teamsA) {
    await db
      .insert(teams)
      .values({
        name: team.name,
        shortName: team.shortName,
        divisionId: divisionA.id,
      })
      .onConflictDoNothing()
  }

  // Teams Division B
  const teamsB = [
    { name: 'Albion', shortName: 'ALB' },
    { name: 'Artigas', shortName: 'ART' },
    { name: 'Cerro', shortName: 'CER' },
    { name: 'Colombia', shortName: 'COL' },
    { name: 'Huracán', shortName: 'HUR' },
    { name: 'Juventud', shortName: 'JUV' },
    { name: 'Miramar', shortName: 'MIR' },
    { name: 'Oriental', shortName: 'ORI' },
    { name: 'Paysandú', shortName: 'PAY' },
    { name: ' Rocha', shortName: 'ROC' },
    { name: 'Salus', shortName: 'SAL' },
    { name: 'Tacuarembó', shortName: 'TAC' },
    { name: 'Uruguay Montevideo', shortName: 'URU' },
    { name: 'Villa Española', shortName: 'VIL' },
  ]

  for (const team of teamsB) {
    await db
      .insert(teams)
      .values({
        name: team.name,
        shortName: team.shortName,
        divisionId: divisionB.id,
      })
      .onConflictDoNothing()
  }

  // Tournaments Division A
  const tournamentsA = [
    { name: 'Apertura', shortName: 'APR', type: 'league' },
    { name: 'Clausura', shortName: 'CL', type: 'league' },
    { name: 'Intermedio', shortName: 'INT', type: 'intermedio' },
    { name: 'Anual', shortName: 'ANU', type: 'league' },
    { name: 'Descenso', shortName: 'DES', type: 'descenso' },
  ]

  for (const t of tournamentsA) {
    await db
      .insert(tournaments)
      .values({
        ...t,
        divisionId: divisionA.id,
        season: '2025',
      })
      .onConflictDoNothing()
  }

  // Tournaments Division B
  const tournamentsB = [
    { name: 'Competencia', shortName: 'COM', type: 'competencia' },
    { name: 'Apertura', shortName: 'APR', type: 'league' },
    { name: 'Clausura', shortName: 'CL', type: 'league' },
    { name: 'Anual', shortName: 'ANU', type: 'league' },
    { name: 'Descenso', shortName: 'DES', type: 'descenso' },
  ]

  for (const t of tournamentsB) {
    await db
      .insert(tournaments)
      .values({
        ...t,
        divisionId: divisionB.id,
        season: '2025',
      })
      .onConflictDoNothing()
  }

  console.log('Test data seeded successfully')
}

seedTestData().catch(console.error)
