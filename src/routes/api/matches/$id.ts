import { db } from '#/db'
import { matches, matchEvents, matchLineups } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/matches/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const matchId = parseInt(params.id)

        const match = await db.query.matches.findFirst({
          where: (matches, { eq }) => eq(matches.id, matchId),
          with: {
            homeTeam: true,
            awayTeam: true,
            tournament: true,
          },
        })

        if (!match) {
          return Response.json({ error: 'Match not found' }, { status: 404 })
        }

        const events = await db.query.matchEvents.findMany({
          where: (matchEvents, { eq }) => eq(matchEvents.matchId, matchId),
          with: {
            player: true,
            assist: true,
          },
          orderBy: (matchEvents, { asc }) => asc(matchEvents.minute),
        })

        const lineups = await db.query.matchLineups.findMany({
          where: (matchLineups, { eq }) => eq(matchLineups.matchId, matchId),
        })

        const homeLineup = lineups.find((l) => l.teamId === match.homeTeam?.id)
        const awayLineup = lineups.find((l) => l.teamId === match.awayTeam?.id)

        const stats = {
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 },
        }

        return Response.json({
          match,
          events,
          lineups: {
            home: homeLineup,
            away: awayLineup,
          },
          stats,
        })
      },
    },
  },
})
