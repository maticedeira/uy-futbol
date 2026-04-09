import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL || ''
  console.log('DATABASE_URL:', url)
  console.log('Platform:', process.platform)

  try {
    // Try direct postgres connection first
    const sql = postgres(url, { max: 1 })
    const result = await sql`SELECT 1 as test`
    console.log('Direct result:', result)
    await sql.end()
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
