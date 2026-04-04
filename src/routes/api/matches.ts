import { db } from '#/db'
import { matches, teams, tournaments } from '#/db/schema'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/matches')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const date = url.searchParams.get('date')

        const allMatches = await db.query.matches.findMany({
          orderBy: (matches, { desc }) => [desc(matches.date)],
          with: {
            homeTeam: true,
            awayTeam: true,
            tournament: true,
          },
        })

        let filtered = allMatches
        if (date) {
          const targetDate = new Date(date)
          filtered = filtered.filter((m) => {
            const matchDate = new Date(m.date)
            return (
              matchDate.toISOString().split('T')[0] ===
              targetDate.toISOString().split('T')[0]
            )
          })
        }

        return Response.json({ matches: filtered })
      },
    },
  },
})
