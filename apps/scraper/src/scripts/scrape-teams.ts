import { scrapeTeams } from '../scrapers/teams.js'

async function main() {
  try {
    await scrapeTeams()
    console.log('Team scraping completed successfully')
  } catch (error) {
    console.error('Team scraping failed:', error)
    process.exit(1)
  }
}

main()
