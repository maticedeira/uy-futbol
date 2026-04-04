import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import {
  standings,
  promedio,
  tournaments,
  teams,
  divisions,
} from '../schema/index.js'
import { eq, and } from 'drizzle-orm'
import { upsertStanding, upsertPromedio } from '../services/storage.js'
import { TOURNAMENTS } from '../config.js'

interface StandingRow {
  position: number
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

async function getTournamentId(
  division: 'A' | 'B',
  tournamentType: string,
  season: string,
): Promise<number | null> {
  const divisionRecord = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, division))
    .get()
  if (!divisionRecord) return null

  const tournament = await db
    .select()
    .from(tournaments)
    .where(
      and(
        eq(tournaments.divisionId, divisionRecord.id),
        eq(tournaments.shortName, tournamentType),
        eq(tournaments.season, season),
      ),
    )
    .get()

  return tournament?.id || null
}

async function scrapeDivisionStandings(division: 'A' | 'B') {
  console.log(
    `Scraping ${division === 'A' ? 'Primera División' : 'Primera B'} standings...`,
  )

  const tournamentTypes =
    division === 'A'
      ? Object.values(TOURNAMENTS.A)
      : Object.values(TOURNAMENTS.B)

  for (const tournamentType of tournamentTypes) {
    const tournamentId = await getTournamentId(division, tournamentType, '2025')
    if (!tournamentId) {
      console.log(`Tournament ${tournamentType} not found, skipping...`)
      continue
    }

    const url = `/posiciones?torneo=${tournamentType}`
    const html = await promiedosClient.get<string>(url)
    const $ = load(html)

    const rowSelector = '.fila-posicion, tr[class*="position"], .standing-row'

    $(rowSelector).each(async (_, row) => {
      const position = parseInt(
        $(row).find('.posicion, .position').text().trim(),
      )
      const teamName = $(row).find('.equipo, .team-name').text().trim()
      const played = parseInt($(row).find('.pj, .played').text().trim()) || 0
      const won = parseInt($(row).find('.pg, .won').text().trim()) || 0
      const drawn = parseInt($(row).find('.pe, .drawn').text().trim()) || 0
      const lost = parseInt($(row).find('.pp, .lost').text().trim()) || 0
      const goalsFor =
        parseInt($(row).find('.gf, .goals-for').text().trim()) || 0
      const goalsAgainst =
        parseInt($(row).find('.gc, .goals-against').text().trim()) || 0
      const points = parseInt($(row).find('.pts, .points').text().trim()) || 0

      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.name, teamName))
        .get()
      if (!team) {
        console.log(`Team not found: ${teamName}`)
        return
      }

      const goalDiff = goalsFor - goalsAgainst

      await upsertStanding({
        tournamentId,
        teamId: team.id,
        position,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDiff,
        points,
      })

      if (
        tournamentType === TOURNAMENTS.A.DESCENSO ||
        tournamentType === TOURNAMENTS.B.DESCENSO
      ) {
        const anualTournamentId = await getTournamentId(
          division,
          'anual',
          '2025',
        )
        if (anualTournamentId) {
          const AnualStanding = await db
            .select()
            .from(standings)
            .where(
              and(
                eq(standings.tournamentId, anualTournamentId),
                eq(standings.teamId, team.id),
              ),
            )
            .get()

          const currentPts = AnualStanding?.points || 0
          const lastYearPts = points - currentPts
          const totalMatches = played

          await upsertPromedio({
            tournamentId,
            teamId: team.id,
            lastYearPts,
            currentPts,
            totalMatches,
            position,
          })
        }
      }
    })

    console.log(`Scraped ${tournamentType} standings`)
  }
}

export async function scrapeStandings() {
  await scrapeDivisionStandings('A')
  await scrapeDivisionStandings('B')
  console.log('All standings scraped successfully')
}
