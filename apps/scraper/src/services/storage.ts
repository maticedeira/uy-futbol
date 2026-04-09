import { db } from '../db/client.js'
import { standings, promedio, matches } from '../schema/index.js'
import { eq } from 'drizzle-orm'

export async function upsertStanding(data: {
  tournamentId: number
  teamId: number
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}) {
  await db
    .insert(standings)
    .values(data)
    .onConflictDoUpdate({
      target: [standings.tournamentId, standings.teamId],
      set: {
        position: data.position,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        goalDiff: data.goalDiff,
        points: data.points,
        updatedAt: new Date(),
      },
    })
}

export async function upsertPromedio(data: {
  tournamentId: number
  teamId: number
  lastYearPts: number
  currentPts: number
  totalMatches: number
  position: number
}) {
  const promedioValue = (data.lastYearPts + data.currentPts) / data.totalMatches

  await db
    .insert(promedio)
    .values({
      ...data,
      promedio: promedioValue.toFixed(4),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [promedio.tournamentId, promedio.teamId],
      set: {
        lastYearPts: data.lastYearPts,
        currentPts: data.currentPts,
        totalMatches: data.totalMatches,
        promedio: promedioValue.toFixed(4),
        position: data.position,
        updatedAt: new Date(),
      },
    })
}

export async function upsertMatch(data: {
  externalId: string
  date: Date
  homeTeamId: number
  awayTeamId: number
  homeScore: number | null
  awayScore: number | null
  status: 'scheduled' | 'live' | 'finished'
  minute: number | null
  tournamentId: number
}) {
  // Check if match exists by externalId
  const [existing] = await db.execute(
    `SELECT id FROM matches WHERE external_id = '${data.externalId}'`,
  )

  if (existing && (existing as any).id) {
    // Update existing match
    await db.execute(`
      UPDATE matches SET
        date = '${data.date.toISOString()}',
        home_score = ${data.homeScore ?? 'NULL'},
        away_score = ${data.awayScore ?? 'NULL'},
        status = '${data.status}',
        minute = ${data.minute ?? 'NULL'},
        updated_at = NOW()
      WHERE external_id = '${data.externalId}'
    `)
  } else {
    // Insert new match
    await db.execute(`
      INSERT INTO matches (external_id, date, home_team_id, away_team_id, home_score, away_score, status, minute, tournament_id, created_at, updated_at)
      VALUES (
        '${data.externalId}',
        '${data.date.toISOString()}',
        ${data.homeTeamId},
        ${data.awayTeamId},
        ${data.homeScore ?? 'NULL'},
        ${data.awayScore ?? 'NULL'},
        '${data.status}',
        ${data.minute ?? 'NULL'},
        ${data.tournamentId},
        NOW(),
        NOW()
      )
    `)
  }
}
