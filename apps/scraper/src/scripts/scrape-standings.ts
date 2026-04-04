import { scrapeStandings } from '../scrapers/standings.js'

async function main() {
  try {
    await scrapeStandings()
    console.log('Standings scraping completed successfully')
  } catch (error) {
    console.error('Standings scraping failed:', error)
    process.exit(1)
  }
}

main()
