import { db } from '#/db'
import { tournaments, divisions } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/standings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const rawDivision = url.searchParams.get('division')
        const tournament = url.searchParams.get('tournament')
        if (!rawDivision) {
          return Response.json(
            { error: 'Division is required' },
            { status: 400 },
          )
        }
        const division = rawDivision as 'A' | 'B'

        const [divisionRecord] = await db
          .select()
          .from(divisions)
          .where(eq(divisions.shortName, division))

        if (!divisionRecord) {
          return Response.json({ error: 'Division not found' }, { status: 404 })
        }

        let tournamentRecord
        if (tournament) {
          const [record] = await db
            .select()
            .from(tournaments)
            .where(
              and(
                eq(tournaments.divisionId, divisionRecord.id),
                eq(tournaments.shortName, tournament),
              ),
            )
          tournamentRecord = record
        } else {
          const [record] = await db
            .select()
            .from(tournaments)
            .where(eq(tournaments.divisionId, divisionRecord.id))
          tournamentRecord = record
        }

        if (!tournamentRecord) {
          return Response.json(
            { error: 'Tournament not found' },
            { status: 404 },
          )
        }

        const allData = await db.execute(`
          SELECT 
            s.position, s.played, s.won, s.drawn, s.lost,
            s.goals_for, s.goals_against, s.goal_diff, s.points,
            t.id as team_id, t.name as team_name, t.short_name as team_short_name, t.logo_url as team_logo_url
          FROM standings s
          JOIN teams t ON s.team_id = t.id
          WHERE s.tournament_id = ${tournamentRecord.id}
          ORDER BY s.position
        `)

        const standingsData = (allData as any[]).map((row) => ({
          position: row.position,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goals_for,
          goalsAgainst: row.goals_against,
          goalDiff: row.goal_diff,
          points: row.points,
          team: {
            id: row.team_id,
            name: row.team_name,
            shortName: row.team_short_name,
            logoUrl: row.team_logo_url,
          },
        }))

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
