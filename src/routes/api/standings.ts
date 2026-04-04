import { db } from '#/db'
import { standings, teams, tournaments, divisions } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/standings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const division = url.searchParams.get('division') as 'A' | 'B'
        const tournament = url.searchParams.get('tournament')

        if (!division) {
          return Response.json(
            { error: 'Division is required' },
            { status: 400 },
          )
        }

        const divisionRecord = await db
          .select()
          .from(divisions)
          .where(eq(divisions.shortName, division))
          .get()

        if (!divisionRecord) {
          return Response.json({ error: 'Division not found' }, { status: 404 })
        }

        let tournamentRecord
        if (tournament) {
          tournamentRecord = await db
            .select()
            .from(tournaments)
            .where(
              and(
                eq(tournaments.divisionId, divisionRecord.id),
                eq(tournaments.shortName, tournament),
              ),
            )
            .get()
        } else {
          tournamentRecord = await db
            .select()
            .from(tournaments)
            .where(eq(tournaments.divisionId, divisionRecord.id))
            .get()
        }

        if (!tournamentRecord) {
          return Response.json(
            { error: 'Tournament not found' },
            { status: 404 },
          )
        }

        const standingsData = await db
          .select({
            position: standings.position,
            played: standings.played,
            won: standings.won,
            drawn: standings.drawn,
            lost: standings.lost,
            goalsFor: standings.goalsFor,
            goalsAgainst: standings.goalsAgainst,
            goalDiff: standings.goalDiff,
            points: standings.points,
            team: {
              id: teams.id,
              name: teams.name,
              shortName: teams.shortName,
              logoUrl: teams.logoUrl,
            },
          })
          .from(standings)
          .innerJoin(teams, eq(standings.teamId, teams.id))
          .where(eq(standings.tournamentId, tournamentRecord.id))
          .orderBy(standings.position)

        return Response.json({
          tournament: {
            id: tournamentRecord.id,
            name: tournamentRecord.name,
            shortName: tournamentRecord.shortName,
            type: tournamentRecord.type,
          },
          standings: standingsData,
        })
      },
    },
  },
})
