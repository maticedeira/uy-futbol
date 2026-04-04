import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import { teams, divisions } from '../schema/index.js'
import { eq } from 'drizzle-orm'

export async function scrapeTeams() {
  console.log('Scraping teams from promiedos...')

  const divisionAResult = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, 'A'))
  const divisionA = divisionAResult[0]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!divisionA) throw new Error('Division A not found')

  const divisionBResult = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, 'B'))
  const divisionB = divisionBResult[0]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!divisionB) throw new Error('Division B not found')

  const html = await promiedosClient.get<string>('/')
  const $ = load(html)

  const teamSelectors = '.equipo, .team, [class*="team"]'

  interface TeamData {
    name: string
    shortName: string
    logoUrl: string
    divisionId: number
  }

  const divisionATeams: TeamData[] = []
  const divisionBTeams: TeamData[] = []

  $(teamSelectors).each((_, el) => {
    const name = $(el).find('.nombre, .name').text().trim()
    const shortName =
      $(el).find('.sigla, .short').text().trim() || name.substring(0, 3)
    const logoUrl = $(el).find('img').attr('src') || ''

    if (name) {
      if (divisionATeams.length < 16) {
        divisionATeams.push({
          name,
          shortName,
          logoUrl,
          divisionId: divisionA.id,
        })
      } else {
        divisionBTeams.push({
          name,
          shortName,
          logoUrl,
          divisionId: divisionB.id,
        })
      }
    }
  })

  for (const team of divisionATeams) {
    await db.insert(teams).values(team).onConflictDoNothing()
  }
  for (const team of divisionBTeams) {
    await db.insert(teams).values(team).onConflictDoNothing()
  }

  console.log(
    `Inserted ${divisionATeams.length} Division A teams and ${divisionBTeams.length} Division B teams`,
  )
}
