import { scrapeStandings } from './scrapers/standings.js'
import { scrapeMatches } from './scrapers/matches.js'

const command = process.argv[2]

async function main() {
  switch (command) {
    case 'standings':
      await scrapeStandings()
      break
    case 'matches':
      await scrapeMatches()
      break
    case 'all':
      await scrapeStandings()
      await scrapeMatches()
      break
    default:
      console.log('Usage: npm run scrape <standings|matches|all>')
  }
}

main().catch(console.error)
