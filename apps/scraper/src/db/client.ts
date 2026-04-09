import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema/index.js'

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''

  if (!url) return ''

  // On WSL/Linux, Docker ports are exposed via host.docker.internal
  if (process.platform === 'linux' && url.includes('localhost')) {
    return url.replace('localhost', 'host.docker.internal')
  }

  return url
}

const client = postgres(getDatabaseUrl(), { max: 1 })

export const db = drizzle(client, { schema })
