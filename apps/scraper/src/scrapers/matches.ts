import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import {
  matches,
  matchEvents,
  matchLineups,
  teams,
  tournaments,
} from '../schema/index.js'
import { eq, and, gte, lte } from 'drizzle-orm'

interface MatchData {
  date: Date
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
  venue: string
  round: number
  status: 'scheduled' | 'live' | 'finished'
  minute?: number
  tournamentId: number
}

export async function scrapeMatches(date: string) {
  console.log(`Scraping matches for date: ${date}`)

  const url = `/fixture?fecha=${date}`
  const html = await promiedosClient.get<string>(url)
  const $ = load(html)

  const matchSelector = '.partido, .match, [class*="match"]'

  $(matchSelector).each(async (_, el) => {
    const homeTeamName = $(el).find('.local, .home-team').text().trim()
    const awayTeamName = $(el).find('.visitante, .away-team').text().trim()
    const homeScore =
      parseInt($(el).find('.goles-local, .home-score').text().trim()) || 0
    const awayScore =
      parseInt($(el).find('.goles-visitante, .away-score').text().trim()) || 0
    const venue = $(el).find('.estadio, .venue').text().trim()
    const time = $(el).find('.hora, .time').text().trim()
    const status = $(el).hasClass('vivo')
      ? 'live'
      : $(el).hasClass('finalizado')
        ? 'finished'
        : 'scheduled'

    const [homeTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, homeTeamName))
    const [awayTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, awayTeamName))

    if (!homeTeam || !awayTeam) {
      console.log(`Teams not found: ${homeTeamName} vs ${awayTeamName}`)
      return
    }

    const [tournament] = await db.select().from(tournaments)
    if (!tournament) return

    const matchDate = new Date(`${date}T${time || '00:00'}:00-03:00`)

    await db
      .insert(matches)
      .values({
        date: matchDate,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore,
        awayScore,
        venue,
        status,
        tournamentId: tournament.id,
      })
      .onConflictDoUpdate({
        target: [matches.date, matches.homeTeamId, matches.awayTeamId],
        set: {
          homeScore,
          awayScore,
          status,
          venue,
          updatedAt: new Date(),
        },
      })
  })

  console.log(`Scraped matches for ${date}`)
}

export async function scrapeDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    await scrapeMatches(d.toISOString().split('T')[0])
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}
