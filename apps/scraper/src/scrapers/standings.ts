import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import { matches, teams, tournaments, divisions } from '../schema/index.js'
import { eq } from 'drizzle-orm'
import { upsertMatch } from '../services/storage.js'

interface PromiedosGame {
  id: string
  stage_round_name: string
  teams: {
    name: string
    short_name: string
    url_name: string
    id: string
    colors: { color: string; text_color: string }
    red_cards: number
    goals?: { player_name: string; time: number }[]
  }[]
  scores: number[]
  status: { enum: number; name: string; short_name: string }
  start_time: string
  game_time: number
}

interface PromiedosFilter {
  name: string
  key: string
  selected?: boolean
  games?: PromiedosGame[]
}

interface PromiedosGamesData {
  filters: PromiedosFilter[]
}

export async function scrapeMatches(date?: string) {
  console.log('Scraping matches from promiedos...')

  const html = await promiedosClient.get<string>(
    '/league/uruguayan-championship/gbh',
  )

  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/,
  )
  if (!nextDataMatch) {
    throw new Error('Could not find __NEXT_DATA__ in page')
  }

  const pageData = JSON.parse(nextDataMatch[1])
  const gamesData: PromiedosGamesData = pageData.props.pageProps.data.games

  // Get Division A
  const [divisionA] = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, 'A'))
  if (!divisionA) {
    console.log('Division A not found, skipping')
    return
  }

  // Get Apertura tournament
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.shortName, 'APR'))

  if (!tournament) {
    console.log('Tournament not found, skipping')
    return
  }

  // Collect all games from all filters
  let gamesToProcess: PromiedosGame[] = []
  for (const filter of gamesData.filters) {
    if (filter.games) {
      gamesToProcess.push(...filter.games)
    }
  }

  // Filter by date if provided
  if (date) {
    const targetDate = new Date(date).toISOString().split('T')[0]
    gamesToProcess = gamesToProcess.filter((game) => {
      const gameDate = game.start_time.split(' ')[0] // Format: "04-04-2026 10:00"
      const [day, month, year] = gameDate.split('-')
      return `${year}-${month}-${day}` === targetDate
    })
  }

  console.log(`Processing ${gamesToProcess.length} games`)

  for (const game of gamesToProcess) {
    if (game.teams.length < 2) continue

    const homeTeamData = game.teams[0]
    const awayTeamData = game.teams[1]

    // Find or create home team
    let [homeTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, homeTeamData.name))
    if (!homeTeam) {
      const [created] = await db
        .insert(teams)
        .values({
          name: homeTeamData.name,
          shortName: homeTeamData.short_name,
          logoUrl: `https://api.promiedos.com.ar/images/team/${homeTeamData.id}`,
          divisionId: divisionA.id,
        })
        .returning()
      homeTeam = created
    }

    // Find or create away team
    let [awayTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, awayTeamData.name))
    if (!awayTeam) {
      const [created] = await db
        .insert(teams)
        .values({
          name: awayTeamData.name,
          shortName: awayTeamData.short_name,
          logoUrl: `https://api.promiedos.com.ar/images/team/${awayTeamData.id}`,
          divisionId: divisionA.id,
        })
        .returning()
      awayTeam = created
    }

    // Parse date
    const [datePart, timePart] = game.start_time.split(' ')
    const [day, month, year] = datePart.split('-')
    const matchDate = new Date(`${year}-${month}-${day}T${timePart}:00`)

    // Determine status
    let status: 'scheduled' | 'live' | 'finished' = 'scheduled'
    if (game.status.enum === 3 || game.status.name === 'Finalizado') {
      status = 'finished'
    } else if (game.status.enum === 2 || game.status.name === 'Vivo') {
      status = 'live'
    }

    await upsertMatch({
      externalId: game.id,
      date: matchDate,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeScore: game.scores?.[0] ?? null,
      awayScore: game.scores?.[1] ?? null,
      status,
      minute: game.game_time > 0 ? game.game_time : null,
      tournamentId: tournament.id,
    })

    console.log(
      `Processed: ${homeTeamData.name} vs ${awayTeamData.name} (${game.scores?.join('-') || 'TBD'})`,
    )
  }

  console.log('Matches scraping completed')
}
