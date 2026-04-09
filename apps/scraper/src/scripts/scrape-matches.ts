import { scrapeMatches } from '../scrapers/standings.js'

async function main() {
  const startDate = process.argv[2]
  const endDate = process.argv[3] || startDate

  if (!startDate) {
    console.log('Usage: npm run scrape:matches <start-date> [end-date]')
    console.log('Example: npm run scrape:matches 2025-03-01 2025-03-31')
    process.exit(1)
  }

  try {
    await scrapeMatches(startDate)
    console.log('Match scraping completed successfully')
  } catch (error) {
    console.error('Match scraping failed:', error)
    process.exit(1)
  }
}

main()
