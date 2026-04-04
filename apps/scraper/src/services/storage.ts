import { db } from '../db/client.js'
import { standings, promedio } from '../schema/index.js'

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
