import { db } from '../db/client.js'
import { standings, teams, tournaments } from '../schema/index.js'

async function seedStandings() {
  console.log('Seeding test standings...')

  // Get Primera A Annual tournament
  const anualA = await db.query.tournaments.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.shortName, 'ANU'), eq(t.season, '2025')),
  })

  if (!anualA) {
    console.error('Anual A tournament not found')
    return
  }

  // Get all Division A teams
  const allTeams = await db.query.teams.findMany()

  // Create standings for Anual A
  const posiciones = [
    { pts: 30, gf: 25, ga: 10 }, // 1
    { pts: 28, gf: 22, ga: 12 }, // 2
    { pts: 26, gf: 20, ga: 14 }, // 3
    { pts: 24, gf: 18, ga: 15 }, // 4
    { pts: 22, gf: 16, ga: 14 }, // 5
    { pts: 20, gf: 15, ga: 14 }, // 6
    { pts: 18, gf: 14, ga: 15 }, // 7
    { pts: 16, gf: 13, ga: 14 }, // 8
    { pts: 15, gf: 12, ga: 15 }, // 9
    { pts: 14, gf: 11, ga: 14 }, // 10
    { pts: 13, gf: 10, ga: 14 }, // 11
    { pts: 12, gf: 9, ga: 14 }, // 12
    { pts: 10, gf: 8, ga: 16 }, // 13
    { pts: 8, gf: 7, ga: 18 }, // 14
    { pts: 6, gf: 6, ga: 20 }, // 15
    { pts: 4, gf: 5, ga: 22 }, // 16
  ]

  for (let i = 0; i < allTeams.length && i < posiciones.length; i++) {
    const team = allTeams[i]
    const data = posiciones[i]

    // Calculate W, D, L from points (rough estimate)
    const wins = Math.floor(data.pts / 3)
    const draws = data.pts % 3
    const losses = 15 - wins - draws

    await db
      .insert(standings)
      .values({
        tournamentId: anualA.id,
        teamId: team.id,
        position: i + 1,
        played: 15,
        won: wins,
        drawn: draws,
        lost: losses,
        goalsFor: data.gf,
        goalsAgainst: data.ga,
        goalDiff: data.gf - data.ga,
        points: data.pts,
      })
      .onConflictDoUpdate({
        target: [standings.tournamentId, standings.teamId],
        set: {
          position: i + 1,
          played: 15,
          won: wins,
          drawn: draws,
          lost: losses,
          goalsFor: data.gf,
          goalsAgainst: data.ga,
          goalDiff: data.gf - data.ga,
          points: data.pts,
        },
      })
  }

  console.log('Test standings seeded successfully')
}

seedStandings().catch(console.error)
