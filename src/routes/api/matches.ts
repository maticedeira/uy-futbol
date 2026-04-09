import { db } from '#/db'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/matches')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const date = url.searchParams.get('date')

        let sql = `
          SELECT 
            m.id, m.date, m.home_score, m.away_score, m.venue, m.round,
            m.status, m.minute,
            ht.id as home_team_id, ht.name as home_team_name, ht.short_name as home_team_short_name, ht.logo_url as home_team_logo_url,
            at.id as away_team_id, at.name as away_team_name, at.short_name as away_team_short_name, at.logo_url as away_team_logo_url,
            t.id as tournament_id, t.name as tournament_name, t.short_name as tournament_short_name
          FROM matches m
          JOIN teams ht ON m.home_team_id = ht.id
          JOIN teams at ON m.away_team_id = at.id
          JOIN tournaments t ON m.tournament_id = t.id
        `

        if (date) {
          sql += ` WHERE DATE(m.date) = '${date}'`
        }

        sql += ` ORDER BY m.date`

        const allMatches = await db.execute(sql)

        const matches = (allMatches as any[]).map((row) => ({
          id: row.id,
          date: row.date,
          homeScore: row.home_score,
          awayScore: row.away_score,
          venue: row.venue,
          round: row.round,
          status: row.status,
          minute: row.minute,
          home: {
            id: row.home_team_id,
            name: row.home_team_name,
            shortName: row.home_team_short_name,
            logoUrl: row.home_team_logo_url,
          },
          away: {
            id: row.away_team_id,
            name: row.away_team_name,
            shortName: row.away_team_short_name,
            logoUrl: row.away_team_logo_url,
          },
          tournament: {
            id: row.tournament_id,
            name: row.tournament_name,
            shortName: row.tournament_short_name,
          },
        }))

        return Response.json({ matches })
      },
    },
  },
})
