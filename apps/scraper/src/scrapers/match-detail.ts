// apps/scraper/src/scrapers/match-detail.ts

import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import {
  matches,
  matchEvents,
  matchLineups,
  players,
  teams,
} from '../schema/index.js'
import { eq } from 'drizzle-orm'

interface LineupPlayer {
  playerId: number
  name: string
  x: number
  y: number
}

export async function scrapeMatchDetail(
  matchId: number,
  promiedosMatchUrl: string,
) {
  console.log(`Scraping match detail: ${matchId}`)

  const html = await promiedosClient.get<string>(promiedosMatchUrl)
  const $ = load(html)

  // Scrape events
  const eventSelector = '.evento, .event, [class*="event"]'
  $(eventSelector).each(async (_, el) => {
    const eventType = $(el).hasClass('gol')
      ? 'goal'
      : $(el).hasClass('tarjeta-amarilla')
        ? 'yellow_card'
        : $(el).hasClass('tarjeta-roja')
          ? 'red_card'
          : $(el).hasClass('cambio')
            ? 'substitution'
            : null

    if (!eventType) return

    const minuteText = $(el).find('.minuto, .minute').text().trim()
    const minute = parseInt(minuteText.replace('+', ' ').split(' ')[0]) || 0
    const playerName = $(el).find('.jugador, .player').text().trim()
    const description = $(el).find('.descripcion, .description').text().trim()

    // Find player in DB
    const player = await db
      .select()
      .from(players)
      .where(eq(players.name, playerName))
      .get()

    let homeScore: number | null = null
    let awayScore: number | null = null

    await db.insert(matchEvents).values({
      matchId,
      type: eventType,
      minute,
      playerId: player?.id,
      description,
      homeScore,
      awayScore,
    })
  })

  // Scrape lineups
  const homeLineupSelector = '.formacion-local, .home-lineup'
  const awayLineupSelector = '.formacion-visitante, .away-lineup'

  async function scrapeLineup(teamSide: 'home' | 'away', selector: string) {
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .get()
    if (!match) return

    const teamId = teamSide === 'home' ? match.homeTeamId : match.awayTeamId
    const formation = $(selector).find('.esquema, .formation').text().trim()

    const lineupPlayers: LineupPlayer[] = []
    $(selector)
      .find('.jugador-posicion, .player-position')
      .each((_, el) => {
        const name = $(el).find('.nombre, .name').text().trim()
        const x = parseFloat($(el).attr('data-x') || '50')
        const y = parseFloat($(el).attr('data-y') || '50')

        lineupPlayers.push({ playerId: 0, name, x, y })
      })

    await db
      .insert(matchLineups)
      .values({
        matchId,
        teamId,
        formation,
        lineup: lineupPlayers,
        bench: [],
      })
      .onConflictDoUpdate({
        target: [matchLineups.matchId, matchLineups.teamId],
        set: {
          formation,
          lineup: lineupPlayers,
          updatedAt: new Date(),
        },
      })
  }

  await scrapeLineup('home', homeLineupSelector)
  await scrapeLineup('away', awayLineupSelector)

  console.log(`Match detail scraped: ${matchId}`)
}

export async function scrapeMatchDetailByDate(date: string) {
  const dateMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.date, new Date(date)))
    .all()

  for (const match of dateMatches) {
    // Construct promiedos URL from match ID
    const url = `/partido?id=${match.id}`
    await scrapeMatchDetail(match.id, url)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}
