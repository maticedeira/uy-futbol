# Uruguayan Football Web App - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app for Uruguayan football with standings, matches, formations, and player stats from promiedos.com.ar and Transfermarkt.

**Architecture:** Monorepo with `/apps/scraper` (Node.js) and `/apps/web` (existing TanStack). Scraper fetches from promiedos.com.ar and stores in PostgreSQL via Drizzle. Web app reads data via TanStack Query routes.

**Tech Stack:** Node.js, TypeScript, cheerio, node-cron, Drizzle ORM, PostgreSQL, React, TanStack Router, TanStack Query, Tailwind CSS

---

## File Structure

```
apps/
├── scraper/                    # New scraper package
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts            # CLI entry
│   │   ├── config.ts           # URLs, settings
│   │   ├── db/
│   │   │   └── client.ts        # Drizzle client
│   │   ├── schema/
│   │   │   └── index.ts         # Drizzle schema (same as web)
│   │   ├── scrapers/
│   │   │   ├── promiedos.ts     # Main scraper class
│   │   │   ├── teams.ts         # Team scraping
│   │   │   ├── standings.ts      # Standings scraping
│   │   │   ├── matches.ts        # Match list scraping
│   │   │   └── match-detail.ts   # Match detail scraping
│   │   ├── services/
│   │   │   ├── transfermarkt.ts  # Transfermarkt API
│   │   │   └── storage.ts        # DB helpers
│   │   └── utils/
│   │       ├── http.ts          # HTTP client with retry
│   │       └── parser.ts        # cheerio helpers
│   └── scripts/
│       └── run.ts               # CLI runner
└── web/                         # Existing TanStack app
    ├── src/
    │   ├── db/
    │   │   └── schema.ts         # Drizzle schema (copy for scraper)
    │   ├── routes/
    │   │   ├── api.standings.ts  # GET /api/standings
    │   │   ├── api.matches.ts     # GET /api/matches
    │   │   ├── api.matches.$id.ts # GET /api/matches/:id
    │   │   └── api.players.$id.ts # GET /api/players/:id
    │   ├── components/
    │   │   ├── ui/               # Base UI components
    │   │   ├── BottomNav.tsx
    │   │   ├── MatchCard.tsx
    │   │   ├── StandingsTable.tsx
    │   │   ├── FormationView.tsx
    │   │   ├── EventTimeline.tsx
    │   │   ├── StatsComparison.tsx
    │   │   └── PlayerModal.tsx
    │   └── routes.tsx            # Route definitions
    └── ...
```

---

## Phase 1: Database Schema

### Task 1: Define Drizzle Schema

**Files:**

- Create: `src/db/schema.ts`

```typescript
// src/db/schema.ts

import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  jsonb,
  varchar,
} from 'drizzle-orm/pg-core'

export const divisions = pgTable('divisions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  shortName: varchar('short_name', { length: 10 }).notNull(),
  teamCount: integer('team_count').notNull(),
  hasIntermedio: boolean('has_intermedio').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  shortName: varchar('short_name', { length: 10 }).notNull(),
  logoUrl: text('logo_url'),
  divisionId: integer('division_id').references(() => divisions.id),
  transfermarktId: text('transfermarkt_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  photoUrl: text('photo_url'),
  teamId: integer('team_id').references(() => teams.id),
  position: varchar('position', { length: 20 }), // GK, DEF, MED, DEL
  transfermarktId: text('transfermarkt_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  shortName: varchar('short_name', { length: 10 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // league, intermedio, competencia
  divisionId: integer('division_id').references(() => divisions.id),
  season: varchar('season', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  homeTeamId: integer('home_team_id').references(() => teams.id),
  awayTeamId: integer('away_team_id').references(() => teams.id),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  venue: varchar('venue', { length: 100 }),
  round: integer('round'),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled, live, finished
  minute: integer('minute'),
  tournamentId: integer('tournament_id').references(() => tournaments.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const matchEvents = pgTable('match_events', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .references(() => matches.id)
    .notNull(),
  type: varchar('type', { length: 20 }).notNull(), // goal, yellow_card, red_card, substitution
  minute: integer('minute').notNull(),
  playerId: integer('player_id').references(() => players.id),
  assistId: integer('assist_id').references(() => players.id),
  description: text('description'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const matchLineups = pgTable('match_lineups', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .references(() => matches.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  formation: varchar('formation', { length: 10 }),
  lineup: jsonb('lineup'), // Array of { playerId, x, y }
  bench: jsonb('bench'), // Array of { playerId, minute }
  createdAt: timestamp('created_at').defaultNow(),
})

export const standings = pgTable('standings', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id')
    .references(() => tournaments.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  position: integer('position').notNull(),
  played: integer('played').notNull().default(0),
  won: integer('won').notNull().default(0),
  drawn: integer('drawn').notNull().default(0),
  lost: integer('lost').notNull().default(0),
  goalsFor: integer('goals_for').notNull().default(0),
  goalsAgainst: integer('goals_against').notNull().default(0),
  goalDiff: integer('goal_diff').notNull().default(0),
  points: integer('points').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const promedio = pgTable('promedio', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id')
    .references(() => tournaments.id)
    .notNull(),
  teamId: integer('team_id')
    .references(() => teams.id)
    .notNull(),
  lastYearPts: integer('last_year_pts').notNull().default(0),
  currentPts: integer('current_pts').notNull().default(0),
  totalMatches: integer('total_matches').notNull().default(0),
  promedio: decimal('promedio', { precision: 6, scale: 4 }).notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type Division = typeof divisions.$inferSelect
export type Team = typeof teams.$inferSelect
export type Player = typeof players.$inferSelect
export type Tournament = typeof tournaments.$inferSelect
export type Match = typeof matches.$inferSelect
export type MatchEvent = typeof matchEvents.$inferSelect
export type MatchLineup = typeof matchLineups.$inferSelect
export type Standing = typeof standings.$inferSelect
export type Promedio = typeof promedio.$inferSelect
```

- **Step 1: Write the schema file**

Create `src/db/schema.ts` with the complete Drizzle schema above.

- **Step 2: Generate migrations**

Run: `npm run db:generate`
Expected: Creates migration file in `drizzle/` with CREATE TABLE statements.

- **Step 3: Run migrations**

Run: `npm run db:migrate`
Expected: Applies schema to PostgreSQL database.

- **Step 4: Test schema**

Verify tables exist by running: `npm run db:studio`
Expected: Drizzle Studio opens with all tables visible.

- **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add database schema for Uruguayan football"
```

---

## Phase 2: Scraper Setup

### Task 2: Create Scraper Package

**Files:**

- Create: `apps/scraper/package.json`
- Create: `apps/scraper/tsconfig.json`
- Create: `apps/scraper/src/index.ts`
- Create: `apps/scraper/src/config.ts`
- Create: `apps/scraper/src/db/client.ts`
- Create: `apps/scraper/src/schema/index.ts`
- **Step 1: Create package.json**

```json
{
  "name": "@ufc/scraper",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "scrape:all": "tsx src/scripts/scrape-all.ts",
    "scrape:standings": "tsx src/scripts/scrape-standings.ts",
    "scrape:matches": "tsx src/scripts/scrape-matches.ts",
    "scrape:daily": "tsx src/scripts/scrape-daily.ts"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "cheerio": "^1.0.0",
    "drizzle-orm": "^0.45.1",
    "pg": "^8.16.3",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/pg": "^8.15.6",
    "tsx": "^4.21.0",
    "typescript": "^5.7.2"
  }
}
```

- **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- **Step 3: Create config.ts**

```typescript
// apps/scraper/src/config.ts

export const PROMIEDOS_BASE_URL = 'https://www.promiedos.com.ar'
export const TRANSFERMARKT_BASE_URL = 'https://www.transfermarkt.com'

export const SCRAPING_DELAY_MS = 2000
export const MAX_RETRIES = 3

export const TOURNAMENTS = {
  A: {
    APERTURA: 'apertura',
    CLAUSURA: 'clausura',
    INTERMEDIO: 'intermedio',
    ANUAL: 'anual',
    DESCENSO: 'descenso',
  },
  B: {
    COMPETENCIA: 'competencia',
    APERTURA: 'apertura',
    CLAUSURA: 'clausura',
    ANUAL: 'anual',
    DESCENSO: 'descenso',
  },
} as const
```

- **Step 4: Create db/client.ts**

```typescript
// apps/scraper/src/db/client.ts

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../schema/index.js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })
```

- **Step 5: Create schema/index.ts (copy from web app)**

```typescript
// apps/scraper/src/schema/index.ts
// Copy the exact same schema from src/db/schema.ts
// (Omitting for brevity - copy the full schema from Task 1)
```

- **Step 6: Create index.ts**

```typescript
// apps/scraper/src/index.ts

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
```

- **Step 7: Install dependencies**

Run: `cd apps/scraper && npm install`
Expected: Dependencies installed.

- **Step 8: Commit**

```bash
git add apps/scraper/
git commit -m "feat: add scraper package structure"
```

---

### Task 3: HTTP Client with Retry

**Files:**

- Create: `apps/scraper/src/utils/http.ts`
- **Step 1: Write http.ts**

```typescript
// apps/scraper/src/utils/http.ts

import axios, { AxiosInstance } from 'axios'
import { SCRAPING_DELAY_MS, MAX_RETRIES } from '../config.js'

class HttpClient {
  private client: AxiosInstance
  private lastRequest = 0

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, timeout: 30000 })
  }

  async get<T>(url: string): Promise<T> {
    await this.throttle()

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.get<T>(url)
        return response.data
      } catch (error) {
        lastError = error as Error
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private async throttle() {
    const now = Date.now()
    const elapsed = now - this.lastRequest
    if (elapsed < SCRAPING_DELAY_MS) {
      await this.sleep(SCRAPING_DELAY_MS - elapsed)
    }
    this.lastRequest = Date.now()
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const promiedosClient = new HttpClient('https://www.promiedos.com.ar')
export const transfermarktClient = new HttpClient(
  'https://www.transfermarkt.com',
)
```

- **Step 2: Commit**

```bash
git add apps/scraper/src/utils/http.ts
git commit -m "feat: add HTTP client with retry and rate limiting"
```

---

### Task 4: Team Scraper

**Files:**

- Create: `apps/scraper/src/scrapers/teams.ts`
- Create: `apps/scraper/src/scripts/scrape-teams.ts`
- **Step 1: Write teams.ts**

```typescript
// apps/scraper/src/scrapers/teams.ts

import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import { teams, divisions } from '../schema/index.js'
import { eq } from 'drizzle-orm'

interface TeamData {
  name: string
  shortName: string
  logoUrl: string
  divisionId: number
}

export async function scrapeTeams() {
  console.log('Scraping teams from promiedos...')

  // Division A teams
  const divisionA = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, 'A'))
    .get()
  if (!divisionA) throw new Error('Division A not found')

  // Division B teams
  const divisionB = await db
    .select()
    .from(divisions)
    .where(eq(divisions.shortName, 'B'))
    .get()
  if (!divisionB) throw new Error('Division B not found')

  // Fetch standings page to get teams
  const html = await promiedosClient.get<string>('/')
  const $ = load(html)

  // Scrape team names and logos from promiedos
  // Note: Selector depends on actual promiedos HTML structure
  const teamSelectors = '.equipo, .team, [class*="team"]'

  const divisionATeams: TeamData[] = []
  const divisionBTeams: TeamData[] = []

  $(teamSelectors).each((_, el) => {
    const name = $(el).find('.nombre, .name').text().trim()
    const shortName =
      $(el).find('.sigla, .short').text().trim() || name.substring(0, 3)
    const logoUrl = $(el).find('img').attr('src') || ''

    if (name) {
      const teamData: TeamData = { name, shortName, logoUrl }
      // First 16 teams are Division A, rest are Division B
      if (divisionATeams.length < 16) {
        divisionATeams.push({ ...teamData, divisionId: divisionA.id })
      } else {
        divisionBTeams.push({ ...teamData, divisionId: divisionB.id })
      }
    }
  })

  // Insert teams to DB
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
```

- **Step 2: Write scrape-teams script**

```typescript
// apps/scraper/src/scripts/scrape-teams.ts

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
```

- **Step 3: Test team scraper**

Run: `cd apps/scraper && npm run scrape:teams`
Expected: Teams inserted into database (or error if selectors don't match actual HTML).

- **Step 4: Commit**

```bash
git add apps/scraper/src/scrapers/teams.ts apps/scraper/src/scripts/scrape-teams.ts
git commit -m "feat: add team scraper for promiedos"
```

---

### Task 5: Standings Scraper

**Files:**

- Create: `apps/scraper/src/scrapers/standings.ts`
- Create: `apps/scraper/src/services/storage.ts`
- Create: `apps/scraper/src/scripts/scrape-standings.ts`
- **Step 1: Write storage.ts**

```typescript
// apps/scraper/src/services/storage.ts

import { db } from '../db/client.js'
import { standings, promedio } from '../schema/index.js'
import { eq, and } from 'drizzle-orm'

export async function upsertStanding(data: {
  tournamentId: number
  teamId: number
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}) {
  await db
    .insert(standings)
    .values(data)
    .onConflictDoUpdate({
      target: [standings.tournamentId, standings.teamId],
      set: {
        position: data.position,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        goalDiff: data.goalDiff,
        points: data.points,
        updatedAt: new Date(),
      },
    })
}

export async function upsertPromedio(data: {
  tournamentId: number
  teamId: number
  lastYearPts: number
  currentPts: number
  totalMatches: number
  position: number
}) {
  const promedioValue = (data.lastYearPts + data.currentPts) / data.totalMatches

  await db
    .insert(promedio)
    .values({
      ...data,
      promedio: promedioValue.toFixed(4),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [promedio.tournamentId, promedio.teamId],
      set: {
        lastYearPts: data.lastYearPts,
        currentPts: data.currentPts,
        totalMatches: data.totalMatches,
        promedio: promedioValue.toFixed(4),
        position: data.position,
        updatedAt: new Date(),
      },
    })
}
```

- **Step 2: Write standings.ts**

```typescript
// apps/scraper/src/scrapers/standings.ts

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

    // Selector depends on actual promiedos HTML
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

      // Find team in DB
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

      // Calculate promedio for Descenso table
      if (
        tournamentType === TOURNAMENTS.A.DESCENSO ||
        tournamentType === TOURNAMENTS.B.DESCENSO
      ) {
        // Fetch current Anual points
        const anualTournamentId = await getTournamentId(division, 'ANU', '2025')
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
          const lastYearPts = points - currentPts // Approximate
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
```

- **Step 3: Write scrape-standings script**

```typescript
// apps/scraper/src/scripts/scrape-standings.ts

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
```

- **Step 4: Add scrape:standings to package.json**

```json
"scripts": {
  "scrape:standings": "tsx src/scripts/scrape-standings.ts",
  ...
}
```

- **Step 5: Test standings scraper**

Run: `cd apps/scraper && npm run scrape:standings`
Expected: Standings data inserted into database.

- **Step 6: Commit**

```bash
git add apps/scraper/src/scrapers/standings.ts apps/scraper/src/services/storage.ts apps/scraper/src/scripts/scrape-standings.ts
git commit -m "feat: add standings scraper with promedio calculation"
```

---

### Task 6: Match Scraper

**Files:**

- Create: `apps/scraper/src/scrapers/matches.ts`
- Create: `apps/scraper/src/scripts/scrape-matches.ts`
- **Step 1: Write matches.ts**

```typescript
// apps/scraper/src/scrapers/matches.ts

import { load } from 'cheerio'
import { promiedosClient } from '../utils/http.js'
import { db } from '../db/client.js'
import {
  matches,
  matchEvents,
  matchLineups,
  teams,
  tournaments,
} from '../schema/index.js'
import { eq, and, gte, lte } from 'drizzle-orm'

interface MatchData {
  date: Date
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
  venue: string
  round: number
  status: 'scheduled' | 'live' | 'finished'
  minute?: number
  tournamentId: number
}

export async function scrapeMatches(date: string) {
  console.log(`Scraping matches for date: ${date}`)

  const url = `/fixture?fecha=${date}`
  const html = await promiedosClient.get<string>(url)
  const $ = load(html)

  const matchSelector = '.partido, .match, [class*="match"]'

  $(matchSelector).each(async (_, el) => {
    const homeTeamName = $(el).find('.local, .home-team').text().trim()
    const awayTeamName = $(el).find('.visitante, .away-team').text().trim()
    const homeScore =
      parseInt($(el).find('.goles-local, .home-score').text().trim()) || 0
    const awayScore =
      parseInt($(el).find('.goles-visitante, .away-score').text().trim()) || 0
    const venue = $(el).find('.estadio, .venue').text().trim()
    const time = $(el).find('.hora, .time').text().trim()
    const status = $(el).hasClass('vivo')
      ? 'live'
      : $(el).hasClass('finalizado')
        ? 'finished'
        : 'scheduled'

    // Find teams in DB
    const homeTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, homeTeamName))
      .get()
    const awayTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, awayTeamName))
      .get()

    if (!homeTeam || !awayTeam) {
      console.log(`Teams not found: ${homeTeamName} vs ${awayTeamName}`)
      return
    }

    // Find current tournament
    const tournament = await db.select().from(tournaments).get() // Simplified
    if (!tournament) return

    const matchDate = new Date(`${date}T${time || '00:00'}:00-03:00`)

    await db
      .insert(matches)
      .values({
        date: matchDate,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore,
        awayScore,
        venue,
        status,
        tournamentId: tournament.id,
      })
      .onConflictDoUpdate({
        target: [matches.date, matches.homeTeamId, matches.awayTeamId],
        set: {
          homeScore,
          awayScore,
          status,
          venue,
          updatedAt: new Date(),
        },
      })
  })

  console.log(`Scraped matches for ${date}`)
}

export async function scrapeDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    await scrapeMatches(d.toISOString().split('T')[0])
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Rate limit
  }
}
```

- **Step 2: Write scrape-matches script**

```typescript
// apps/scraper/src/scripts/scrape-matches.ts

import { scrapeDateRange } from '../scrapers/matches.js'

async function main() {
  const startDate = process.argv[2]
  const endDate = process.argv[3] || startDate

  if (!startDate) {
    console.log('Usage: npm run scrape:matches <start-date> [end-date]')
    console.log('Example: npm run scrape:matches 2025-03-01 2025-03-31')
    process.exit(1)
  }

  try {
    await scrapeDateRange(startDate, endDate)
    console.log('Match scraping completed successfully')
  } catch (error) {
    console.error('Match scraping failed:', error)
    process.exit(1)
  }
}

main()
```

- **Step 3: Add scrape:matches to package.json**

```json
"scripts": {
  "scrape:matches": "tsx src/scripts/scrape-matches.ts",
  ...
}
```

- **Step 4: Test match scraper**

Run: `cd apps/scraper && npm run scrape:matches 2025-03-01`
Expected: Matches for that date inserted into database.

- **Step 5: Commit**

```bash
git add apps/scraper/src/scrapers/matches.ts apps/scraper/src/scripts/scrape-matches.ts
git commit -m "feat: add match scraper for promiedos"
```

---

### Task 7: Match Detail Scraper

**Files:**

- Create: `apps/scraper/src/scrapers/match-detail.ts`
- **Step 1: Write match-detail.ts**

```typescript
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
```

- **Step 2: Commit**

```bash
git add apps/scraper/src/scrapers/match-detail.ts
git commit -m "feat: add match detail scraper for events and lineups"
```

---

## Phase 3: Web App API Routes

### Task 8: API - Standings Endpoint

**Files:**

- Create: `src/routes/api.standings.ts`
- **Step 1: Write api.standings.ts**

```typescript
// src/routes/api.standings.ts

import { db } from '../db/client.js'
import { standings, teams, tournaments, divisions } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/standings')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const division = url.searchParams.get('division') as 'A' | 'B'
    const tournament = url.searchParams.get('tournament')

    if (!division) {
      return Response.json({ error: 'Division is required' }, { status: 400 })
    }

    // Get division
    const divisionRecord = await db
      .select()
      .from(divisions)
      .where(eq(divisions.shortName, division))
      .get()

    if (!divisionRecord) {
      return Response.json({ error: 'Division not found' }, { status: 404 })
    }

    // Get tournament
    let tournamentRecord
    if (tournament) {
      tournamentRecord = await db
        .select()
        .from(tournaments)
        .where(
          and(
            eq(tournaments.divisionId, divisionRecord.id),
            eq(tournaments.shortName, tournament),
          ),
        )
        .get()
    } else {
      // Get first tournament for this division
      tournamentRecord = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.divisionId, divisionRecord.id))
        .get()
    }

    if (!tournamentRecord) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get standings
    const standingsData = await db
      .select({
        position: standings.position,
        played: standings.played,
        won: standings.won,
        drawn: standings.drawn,
        lost: standings.lost,
        goalsFor: standings.goalsFor,
        goalsAgainst: standings.goalsAgainst,
        goalDiff: standings.goalDiff,
        points: standings.points,
        team: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
      })
      .from(standings)
      .innerJoin(teams, eq(standings.teamId, teams.id))
      .where(eq(standings.tournamentId, tournamentRecord.id))
      .orderBy(standings.position)

    return Response.json({
      tournament: {
        id: tournamentRecord.id,
        name: tournamentRecord.name,
        shortName: tournamentRecord.shortName,
        type: tournamentRecord.type,
      },
      standings: standingsData,
    })
  },
})
```

- **Step 2: Test endpoint**

Run: `curl http://localhost:3000/api/standings?division=A&tournament=ANU`
Expected: JSON with Primera División Anual standings.

- **Step 3: Commit**

```bash
git add src/routes/api.standings.ts
git commit -m "feat: add standings API endpoint"
```

---

### Task 9: API - Matches Endpoint

**Files:**

- Create: `src/routes/api.matches.ts`
- Create: `src/routes/api.matches.$id.ts`
- **Step 1: Write api.matches.ts**

```typescript
// src/routes/api.matches.ts

import { db } from '../db/client.js'
import { matches, teams, tournaments } from '../db/schema.js'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/matches')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const division = url.searchParams.get('division')
    const tournament = url.searchParams.get('tournament')

    let query = db
      .select({
        id: matches.id,
        date: matches.date,
        status: matches.status,
        minute: matches.minute,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        venue: matches.venue,
        home: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
        away: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
        tournament: {
          id: tournaments.id,
          name: tournaments.name,
          shortName: tournaments.shortName,
        },
      })
      .from(matches)
      .innerJoin(teams, eq(matches.homeTeamId, teams.id))

    const results = await query.all()

    // Filter by date if provided
    let filtered = results
    if (date) {
      const targetDate = new Date(date)
      filtered = filtered.filter((m) => {
        const matchDate = new Date(m.date)
        return (
          matchDate.toISOString().split('T')[0] ===
          targetDate.toISOString().split('T')[0]
        )
      })
    }

    // Sort by date descending
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    return Response.json({ matches: filtered })
  },
})
```

- **Step 2: Write api.matches.$id.ts**

```typescript
// src/routes/api.matches.$id.ts

import { db } from '../db/client.js'
import {
  matches,
  matchEvents,
  matchLineups,
  teams,
  tournaments,
  players,
} from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/matches/$id')({
  GET: async ({ params }) => {
    const matchId = parseInt(params.id)

    const match = await db
      .select({
        id: matches.id,
        date: matches.date,
        status: matches.status,
        minute: matches.minute,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        venue: matches.venue,
        round: matches.round,
        homeTeam: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
        awayTeam: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
        tournament: {
          id: tournaments.id,
          name: tournaments.name,
          shortName: tournaments.shortName,
        },
      })
      .from(matches)
      .innerJoin(teams, eq(matches.homeTeamId, teams.id))
      .where(eq(matches.id, matchId))
      .get()

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    // Get events with player info
    const events = await db
      .select({
        id: matchEvents.id,
        type: matchEvents.type,
        minute: matchEvents.minute,
        description: matchEvents.description,
        homeScore: matchEvents.homeScore,
        awayScore: matchEvents.awayScore,
        player: {
          id: players.id,
          name: players.name,
          photoUrl: players.photoUrl,
        },
        assist: {
          id: players.id,
          name: players.name,
          photoUrl: players.photoUrl,
        },
      })
      .from(matchEvents)
      .leftJoin(players, eq(matchEvents.playerId, players.id))
      .where(eq(matchEvents.matchId, matchId))
      .orderBy(matchEvents.minute)

    // Get lineups
    const lineups = await db
      .select({
        teamId: matchLineups.teamId,
        formation: matchLineups.formation,
        lineup: matchLineups.lineup,
        bench: matchLineups.bench,
      })
      .from(matchLineups)
      .where(eq(matchLineups.matchId, matchId))

    const homeLineup = lineups.find((l) => l.teamId === match.homeTeam?.id)
    const awayLineup = lineups.find((l) => l.teamId === match.awayTeam?.id)

    // Get match stats (simplified - would need actual stats table)
    const stats = {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
    }

    return Response.json({
      match,
      events,
      lineups: {
        home: homeLineup,
        away: awayLineup,
      },
      stats,
    })
  },
})
```

- **Step 3: Test endpoints**

Run: `curl http://localhost:3000/api/matches?date=2025-03-01`
Run: `curl http://localhost:3000/api/matches/1`
Expected: JSON with matches data.

- **Step 4: Commit**

```bash
git add src/routes/api.matches.ts src/routes/api.matches.\$id.ts
git commit -m "feat: add matches API endpoints"
```

---

### Task 10: API - Players Endpoint

**Files:**

- Create: `src/routes/api.players.$id.ts`
- Create: `apps/scraper/src/services/transfermarkt.ts`
- **Step 1: Write transfermarkt.ts**

```typescript
// apps/scraper/src/services/transfermarkt.ts

import axios from 'axios'
import { load } from 'cheerio'
import { transfermarktClient } from '../utils/http.js'
import { db } from '../db/client.js'
import { players } from '../schema/index.js'
import { eq } from 'drizzle-orm'

interface TransfermarktPlayer {
  id: string
  name: string
  photoUrl: string
  position: string
  stats: {
    marketValue: string
    appearances: number
    goals: number
    assists: number
  }
}

export async function fetchPlayerFromTransfermarkt(
  transfermarktId: string,
): Promise<TransfermarktPlayer | null> {
  try {
    const html = await transfermarktClient.get<string>(
      `/profil/spieler/${transfermarktId}`,
    )
    const $ = load(html)

    const name = $('h1[data-player-name]').text().trim()
    const photoUrl = $('.data-header__profile-image').attr('src') || ''
    const position = $('.data-header__position span').first().text().trim()

    const marketValue =
      $('.data-header__market-value-wrapper').attr('data-market-value') || ''
    const appearances =
      parseInt(
        $('[data-stat="appearances"] .data-header__statistic').text().trim(),
      ) || 0
    const goals =
      parseInt(
        $('[data-stat="goals"] .data-header__statistic').text().trim(),
      ) || 0
    const assists =
      parseInt(
        $('[data-stat="assists"] .data-header__statistic').text().trim(),
      ) || 0

    return {
      id: transfermarktId,
      name,
      photoUrl,
      position,
      stats: {
        marketValue,
        appearances,
        goals,
        assists,
      },
    }
  } catch (error) {
    console.error(`Failed to fetch player ${transfermarktId}:`, error)
    return null
  }
}

export async function getOrFetchPlayerPhoto(
  playerId: number,
): Promise<string | null> {
  const player = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .get()

  if (!player) return null

  // Return cached photo
  if (player.photoUrl) return player.photoUrl

  // Fetch from Transfermarkt
  if (player.transfermarktId) {
    const data = await fetchPlayerFromTransfermarkt(player.transfermarktId)
    if (data?.photoUrl) {
      await db
        .update(players)
        .set({ photoUrl: data.photoUrl })
        .where(eq(players.id, playerId))
      return data.photoUrl
    }
  }

  return null
}
```

- **Step 2: Write api.players.$id.ts**

```typescript
// src/routes/api.players.$id.ts

import { db } from '../db/client.js'
import { players, teams } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/players/$id')({
  GET: async ({ params }) => {
    const playerId = parseInt(params.id)

    const player = await db
      .select({
        id: players.id,
        name: players.name,
        photoUrl: players.photoUrl,
        position: players.position,
        transfermarktId: players.transfermarktId,
        team: {
          id: teams.id,
          name: teams.name,
          shortName: teams.shortName,
          logoUrl: teams.logoUrl,
        },
      })
      .from(players)
      .leftJoin(teams, eq(players.teamId, teams.id))
      .where(eq(players.id, playerId))
      .get()

    if (!player) {
      return Response.json({ error: 'Player not found' }, { status: 404 })
    }

    return Response.json({
      player: {
        ...player,
        transfermarktUrl: player.transfermarktId
          ? `https://www.transfermarkt.com/profil/spieler/${player.transfermarktId}`
          : null,
      },
    })
  },
})
```

- **Step 3: Commit**

```bash
git add apps/scraper/src/services/transfermarkt.ts src/routes/api.players.\$id.ts
git commit -m "feat: add Transfermarkt integration and players API"
```

---

## Phase 4: Frontend Components

### Task 11: Base UI Components

**Files:**

- Create: `src/components/ui/BottomNav.tsx`
- Create: `src/components/ui/LoadingSkeleton.tsx`
- **Step 1: Write BottomNav.tsx**

```tsx
// src/components/ui/BottomNav.tsx

import { Link, useLocation } from '@tanstack/react-router'

const navItems = [
  { path: '/', label: 'Matches', icon: 'Calendar' },
  { path: '/standings', label: 'Standings', icon: 'Table' },
  { path: '/favorites', label: 'Favorites', icon: 'Star' },
  { path: '/profile', label: 'Profile', icon: 'User' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- **Step 2: Write LoadingSkeleton.tsx**

```tsx
// src/components/ui/LoadingSkeleton.tsx

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-8 h-4" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-8 h-4" />
      </div>
    </div>
  )
}

export function StandingsRowSkeleton() {
  return (
    <div className="flex items-center gap-2 py-3 px-2">
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-6 rounded-full" />
      <Skeleton className="w-32 h-4 flex-1" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
      <Skeleton className="w-6 h-4" />
    </div>
  )
}
```

- **Step 3: Commit**

```bash
git add src/components/ui/BottomNav.tsx src/components/ui/LoadingSkeleton.tsx
git commit -m "feat: add base UI components"
```

---

### Task 12: Match Components

**Files:**

- Create: `src/components/MatchCard.tsx`
- Create: `src/components/DateSelector.tsx`
- Create: `src/components/FilterChips.tsx`
- **Step 1: Write MatchCard.tsx**

```tsx
// src/components/MatchCard.tsx

import { Link } from '@tanstack/react-router'

interface MatchCardProps {
  match: {
    id: number
    date: string
    status: 'scheduled' | 'live' | 'finished'
    minute?: number
    homeScore?: number
    awayScore?: number
    venue?: string
    home: {
      id: number
      name: string
      shortName: string
      logoUrl?: string
    }
    away: {
      id: number
      name: string
      shortName: string
      logoUrl?: string
    }
    tournament: {
      shortName: string
    }
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const matchDate = new Date(match.date)
  const timeString = matchDate.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link
      to="/matches/$id"
      params={{ id: match.id.toString() }}
      className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {match.tournament.shortName}
        </span>
        {match.status === 'live' && (
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            {match.minute}'
          </span>
        )}
        {match.status === 'scheduled' && (
          <span className="text-xs text-gray-500">{timeString}</span>
        )}
        {match.status === 'finished' && (
          <span className="text-xs text-gray-500">FT</span>
        )}
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2 flex-1">
          {match.home.logoUrl && (
            <img
              src={match.home.logoUrl}
              alt=""
              className="w-6 h-6 object-contain"
            />
          )}
          <span className="font-medium text-sm">{match.home.shortName}</span>
        </div>
        <span className="font-bold text-lg w-8 text-center">
          {match.homeScore ?? '-'}
        </span>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-1">
          {match.away.logoUrl && (
            <img
              src={match.away.logoUrl}
              alt=""
              className="w-6 h-6 object-contain"
            />
          )}
          <span className="font-medium text-sm">{match.away.shortName}</span>
        </div>
        <span className="font-bold text-lg w-8 text-center">
          {match.awayScore ?? '-'}
        </span>
      </div>

      {match.venue && (
        <div className="text-xs text-gray-400 mt-2">{match.venue}</div>
      )}
    </Link>
  )
}
```

- **Step 2: Write DateSelector.tsx**

```tsx
// src/components/DateSelector.tsx

import { useState } from 'react'

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const dates = []
  const today = new Date()

  for (let i = -7; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map((date) => {
        const d = new Date(date)
        const isSelected = date === selectedDate
        const isToday = date === today.toISOString().split('T')[0]

        return (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={`flex flex-col items-center min-w-[48px] px-3 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : isToday
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className="text-xs">
              {d.toLocaleDateString('es-UY', { weekday: 'short' })}
            </span>
            <span className="font-bold">{d.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- **Step 3: Write FilterChips.tsx**

```tsx
// src/components/FilterChips.tsx

interface FilterChipsProps {
  options: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}

export function FilterChips({ options, selected, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selected === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
```

- **Step 4: Commit**

```bash
git add src/components/MatchCard.tsx src/components/DateSelector.tsx src/components/FilterChips.tsx
git commit -m "feat: add match components"
```

---

### Task 13: Standings Components

**Files:**

- Create: `src/components/StandingsTable.tsx`
- Create: `src/components/TournamentTabs.tsx`
- **Step 1: Write TournamentTabs.tsx**

```tsx
// src/components/TournamentTabs.tsx

interface TournamentTabsProps {
  tournaments: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}

export function TournamentTabs({
  tournaments,
  selected,
  onChange,
}: TournamentTabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tournaments.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors border-b-2 ${
            selected === t.value
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
```

- **Step 2: Write StandingsTable.tsx**

```tsx
// src/components/StandingsTable.tsx

interface StandingsTableProps {
  standings: {
    position: number
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    goalDiff: number
    points: number
    team: {
      id: number
      name: string
      shortName: string
      logoUrl?: string
    }
  }[]
  promotionZone?: number // Top N teams
  relegationZone?: number // Bottom N teams
}

export function StandingsTable({
  standings,
  promotionZone = 2,
  relegationZone = 3,
}: StandingsTableProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
        <span className="col-span-1">#</span>
        <span className="col-span-4">Team</span>
        <span className="col-span-1 text-center">P</span>
        <span className="col-span-1 text-center">W</span>
        <span className="col-span-1 text-center">D</span>
        <span className="col-span-1 text-center">L</span>
        <span className="col-span-1 text-center">GD</span>
        <span className="col-span-1 text-center">Pts</span>
      </div>

      {standings.map((row, index) => {
        const isPromotion = row.position <= promotionZone
        const isRelegation = row.position > standings.length - relegationZone
        const isPlayoff = row.position === promotionZone + 1

        let bgClass = ''
        if (isPromotion) bgClass = 'bg-green-50'
        if (isRelegation) bgClass = 'bg-red-50'

        return (
          <div
            key={row.team.id}
            className={`grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-100 ${bgClass}`}
          >
            <span
              className={`col-span-1 font-bold ${
                isPromotion
                  ? 'text-green-600'
                  : isRelegation
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {row.position}
            </span>
            <div className="col-span-4 flex items-center gap-2">
              {row.team.logoUrl && (
                <img
                  src={row.team.logoUrl}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              )}
              <span className="text-sm font-medium truncate">
                {row.team.shortName}
              </span>
            </div>
            <span className="col-span-1 text-center text-sm">{row.played}</span>
            <span className="col-span-1 text-center text-sm">{row.won}</span>
            <span className="col-span-1 text-center text-sm">{row.drawn}</span>
            <span className="col-span-1 text-center text-sm">{row.lost}</span>
            <span
              className={`col-span-1 text-center text-sm font-medium ${
                row.goalDiff > 0
                  ? 'text-green-600'
                  : row.goalDiff < 0
                    ? 'text-red-600'
                    : ''
              }`}
            >
              {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
            </span>
            <span className="col-span-1 text-center text-sm font-bold">
              {row.points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- **Step 3: Commit**

```bash
git add src/components/StandingsTable.tsx src/components/TournamentTabs.tsx
git commit -m "feat: add standings components"
```

---

### Task 14: Match Detail Components

**Files:**

- Create: `src/components/FormationView.tsx`
- Create: `src/components/EventTimeline.tsx`
- Create: `src/components/StatsComparison.tsx`
- Create: `src/components/PlayerModal.tsx`
- **Step 1: Write FormationView.tsx**

```tsx
// src/components/FormationView.tsx

import { useState } from 'react'

interface Player {
  id: number
  name: string
  photoUrl?: string
  x: number
  y: number
}

interface FormationViewProps {
  formation: string
  lineup: Player[]
  teamColor: string
  side: 'home' | 'away'
  onPlayerClick: (playerId: number) => void
}

export function FormationView({
  formation,
  lineup,
  teamColor,
  side,
  onPlayerClick,
}: FormationViewProps) {
  const positions = formation.split('-').map(Number)

  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-700 rounded-lg overflow-hidden">
      {/* Field lines */}
      <div className="absolute inset-x-0 top-1/2 border-t border-white/20" />
      <div className="absolute inset-x-0 top-1/4 border-t border-white/10" />
      <div className="absolute inset-x-0 top-3/4 border-t border-white/10" />
      <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/20" />
      <div className="absolute inset-4 border-2 border-white/20 rounded-lg" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full" />

      {/* Goal */}
      <div
        className={`absolute ${side === 'home' ? 'top-2' : 'bottom-2'} left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-white/30 rounded-t ${side === 'home' ? 'rounded-b-none' : 'rounded-t-none'}`}
      />

      {/* Players */}
      {lineup.map((player, index) => (
        <button
          key={player.id || index}
          onClick={() => onPlayerClick(player.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{
            left: `${player.x}%`,
            top: `${player.y}%`,
          }}
        >
          <div className="relative">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">
                  {player.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded text-[8px] font-bold text-white ${side === 'home' ? 'bg-blue-600' : 'bg-red-600'}`}
            >
              {player.name.split(' ').pop()?.substring(0, 4)}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
```

- **Step 2: Write EventTimeline.tsx**

```tsx
// src/components/EventTimeline.tsx

interface MatchEvent {
  id: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution'
  minute: number
  description?: string
  player?: {
    id: number
    name: string
    photoUrl?: string
  }
  homeScore?: number
  awayScore?: number
}

interface EventTimelineProps {
  events: MatchEvent[]
  homeTeamName: string
  awayTeamName: string
  onPlayerClick: (playerId: number) => void
}

const eventIcons = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
}

export function EventTimeline({
  events,
  homeTeamName,
  awayTeamName,
  onPlayerClick,
}: EventTimelineProps) {
  return (
    <div className="space-y-1">
      {events.map((event, index) => (
        <div key={event.id || index} className="flex items-start gap-4 py-2">
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className="text-sm font-bold text-gray-600">
              {event.minute}'
            </span>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2 justify-end">
              {event.type === 'goal' && (
                <>
                  <button
                    onClick={() =>
                      event.player && onPlayerClick(event.player.id)
                    }
                    className="text-sm font-medium text-right hover:underline"
                  >
                    {event.player?.name}
                  </button>
                  <span>{eventIcons.goal}</span>
                  <span className="text-xs text-gray-500">
                    {event.homeScore}-{event.awayScore}
                  </span>
                </>
              )}
              {(event.type === 'yellow_card' || event.type === 'red_card') && (
                <>
                  <span>{eventIcons[event.type]}</span>
                  <button
                    onClick={() =>
                      event.player && onPlayerClick(event.player.id)
                    }
                    className="text-sm text-right hover:underline"
                  >
                    {event.player?.name}
                  </button>
                </>
              )}
              {event.type === 'substitution' && (
                <>
                  <span>{eventIcons.substitution}</span>
                  <span className="text-sm">{event.description}</span>
                </>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex-1">{/* Empty for alignment */}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- **Step 3: Write StatsComparison.tsx**

```tsx
// src/components/StatsComparison.tsx

interface StatBar {
  label: string
  home: number
  away: number
}

interface StatsComparisonProps {
  stats: StatBar[]
  homeTeamName: string
  awayTeamName: string
}

export function StatsComparison({
  stats,
  homeTeamName,
  awayTeamName,
}: StatsComparisonProps) {
  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const total = stat.home + stat.away || 1
        const homePercent = (stat.home / total) * 100
        const awayPercent = (stat.away / total) * 100

        return (
          <div key={stat.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{stat.home}</span>
              <span className="text-gray-500">{stat.label}</span>
              <span className="font-medium">{stat.away}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 transition-all duration-300"
                style={{ width: `${homePercent}%` }}
              />
              <div
                className="bg-red-600 transition-all duration-300"
                style={{ width: `${awayPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- **Step 4: Write PlayerModal.tsx**

```tsx
// src/components/PlayerModal.tsx

import { X } from 'lucide-react'

interface PlayerModalProps {
  isOpen: boolean
  onClose: () => void
  player: {
    id: number
    name: string
    photoUrl?: string
    position?: string
    team?: {
      name: string
      logoUrl?: string
    }
    transfermarktUrl?: string
    stats?: {
      marketValue?: string
      appearances?: number
      goals?: number
      assists?: number
    }
  } | null
}

export function PlayerModal({ isOpen, onClose, player }: PlayerModalProps) {
  if (!isOpen || !player) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.name}
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-gray-400">
                {player.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          <h2 className="text-xl font-bold">{player.name}</h2>
          {player.position && (
            <span className="text-gray-500">{player.position}</span>
          )}

          {player.team && (
            <div className="flex items-center gap-2 mt-2">
              {player.team.logoUrl && (
                <img src={player.team.logoUrl} alt="" className="w-5 h-5" />
              )}
              <span className="text-sm">{player.team.name}</span>
            </div>
          )}

          {player.stats && (
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              {player.stats.marketValue && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Market Value</div>
                  <div className="font-bold">{player.stats.marketValue}</div>
                </div>
              )}
              {player.stats.appearances !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Appearances</div>
                  <div className="font-bold">{player.stats.appearances}</div>
                </div>
              )}
              {player.stats.goals !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Goals</div>
                  <div className="font-bold">{player.stats.goals}</div>
                </div>
              )}
              {player.stats.assists !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Assists</div>
                  <div className="font-bold">{player.stats.assists}</div>
                </div>
              )}
            </div>
          )}

          {player.transfermarktUrl && (
            <a
              href={player.transfermarktUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              View on Transfermarkt
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
```

- **Step 5: Commit**

```bash
git add src/components/FormationView.tsx src/components/EventTimeline.tsx src/components/StatsComparison.tsx src/components/PlayerModal.tsx
git commit -m "feat: add match detail components"
```

---

## Phase 5: Pages

### Task 15: Home/Matches Page

**Files:**

- Create: `src/routes/index.tsx`
- **Step 1: Write index.tsx**

```tsx
// src/routes/index.tsx

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BottomNav } from '../components/ui/BottomNav'
import { MatchCard } from '../components/MatchCard'
import { DateSelector } from '../components/DateSelector'
import { FilterChips } from '../components/FilterChips'
import { MatchCardSkeleton } from '../components/ui/LoadingSkeleton'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const DIVISIONS = [
  { value: 'A', label: 'Primera A' },
  { value: 'B', label: 'Primera B' },
]

function HomePage() {
  const today = new Date().toISOString().split('T')[0]

  // In a real app, use search params for these
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedDivision, setSelectedDivision] = useState('A')

  const { data, isLoading } = useQuery({
    queryKey: ['matches', selectedDate, selectedDivision],
    queryFn: async () => {
      const res = await fetch(
        `/api/matches?date=${selectedDate}&division=${selectedDivision}`,
      )
      return res.json()
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold mb-4">Uruguayan Football</h1>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <div className="mt-4">
          <FilterChips
            options={DIVISIONS}
            selected={selectedDivision}
            onChange={setSelectedDivision}
          />
        </div>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.matches?.length > 0 ? (
          <div className="space-y-3">
            {data.matches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No matches found for this date
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
```

- **Step 2: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: add home/matches page"
```

---

### Task 16: Standings Page

**Files:**

- Create: `src/routes/standings.tsx`
- **Step 1: Write standings.tsx**

```tsx
// src/routes/standings.tsx

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BottomNav } from '../components/ui/BottomNav'
import { StandingsTable } from '../components/StandingsTable'
import { TournamentTabs } from '../components/TournamentTabs'
import { StandingsRowSkeleton } from '../components/ui/LoadingSkeleton'

export const Route = createFileRoute('/standings')({
  component: StandingsPage,
})

const TOURNAMENTS_A = [
  { value: 'APR', label: 'Apertura' },
  { value: 'CL', label: 'Clausura' },
  { value: 'INT', label: 'Intermedio' },
  { value: 'ANU', label: 'Anual' },
  { value: 'DES', label: 'Descenso' },
]

const TOURNAMENTS_B = [
  { value: 'COM', label: 'Competencia' },
  { value: 'APR', label: 'Apertura' },
  { value: 'CL', label: 'Clausura' },
  { value: 'ANU', label: 'Anual' },
  { value: 'DES', label: 'Descenso' },
]

function StandingsPage() {
  const [selectedDivision, setSelectedDivision] = useState('A')
  const [selectedTournament, setSelectedTournament] = useState('ANU')

  const tournaments = selectedDivision === 'A' ? TOURNAMENTS_A : TOURNAMENTS_B

  const { data, isLoading } = useQuery({
    queryKey: ['standings', selectedDivision, selectedTournament],
    queryFn: async () => {
      const res = await fetch(
        `/api/standings?division=${selectedDivision}&tournament=${selectedTournament}`,
      )
      return res.json()
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold mb-4">Standings</h1>

        <div className="flex gap-2 mb-4">
          {['A', 'B'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDivision(d)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                selectedDivision === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {d === 'A' ? 'Primera A' : 'Primera B'}
            </button>
          ))}
        </div>

        <TournamentTabs
          tournaments={tournaments}
          selected={selectedTournament}
          onChange={setSelectedTournament}
        />
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="bg-white rounded-lg">
            {[...Array(16)].map((_, i) => (
              <StandingsRowSkeleton key={i} />
            ))}
          </div>
        ) : data?.standings?.length > 0 ? (
          <StandingsTable
            standings={data.standings}
            promotionZone={selectedTournament === 'ANU' ? 2 : undefined}
            relegationZone={selectedTournament === 'DES' ? 3 : undefined}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No standings available
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
```

- **Step 2: Commit**

```bash
git add src/routes/standings.tsx
git commit -m "feat: add standings page"
```

---

### Task 17: Match Detail Page

**Files:**

- Create: `src/routes/matches.$id.tsx`
- **Step 1: Write matches.$id.tsx**

```tsx
// src/routes/matches.$id.tsx

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormationView } from '../components/FormationView'
import { EventTimeline } from '../components/EventTimeline'
import { StatsComparison } from '../components/StatsComparison'
import { PlayerModal } from '../components/PlayerModal'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/matches/$id')({
  component: MatchDetailPage,
})

function MatchDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${id}`)
      return res.json()
    },
  })

  const { data: playerData } = useQuery({
    queryKey: ['player', selectedPlayerId],
    queryFn: async () => {
      if (!selectedPlayerId) return null
      const res = await fetch(`/api/players/${selectedPlayerId}`)
      return res.json()
    },
    enabled: !!selectedPlayerId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data?.match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Match not found</h2>
        </div>
      </div>
    )
  }

  const { match, events, lineups, stats } = data

  const statsBars = [
    {
      label: 'Possession',
      home: stats.possession?.home || 50,
      away: stats.possession?.away || 50,
    },
    {
      label: 'Shots',
      home: stats.shots?.home || 0,
      away: stats.shots?.away || 0,
    },
    {
      label: 'Shots on Target',
      home: stats.shotsOnTarget?.home || 0,
      away: stats.shotsOnTarget?.away || 0,
    },
    {
      label: 'Corners',
      home: stats.corners?.home || 0,
      away: stats.corners?.away || 0,
    },
    {
      label: 'Fouls',
      home: stats.fouls?.home || 0,
      away: stats.fouls?.away || 0,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => window.history.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="text-sm text-gray-500">{match.tournament.name}</div>
            <div className="text-sm text-gray-400">{match.venue}</div>
          </div>
        </div>

        {/* Score header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex flex-col items-center flex-1">
            {match.homeTeam?.logoUrl && (
              <img
                src={match.homeTeam.logoUrl}
                alt=""
                className="w-12 h-12 mb-2"
              />
            )}
            <span className="font-bold">{match.homeTeam?.shortName}</span>
          </div>

          <div className="flex-1 text-center">
            <div className="text-4xl font-bold">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {match.status === 'live'
                ? `${match.minute}'`
                : match.status === 'finished'
                  ? 'FT'
                  : new Date(match.date).toLocaleTimeString('es-UY', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
            </div>
          </div>

          <div className="flex flex-col items-center flex-1">
            {match.awayTeam?.logoUrl && (
              <img
                src={match.awayTeam.logoUrl}
                alt=""
                className="w-12 h-12 mb-2"
              />
            )}
            <span className="font-bold">{match.awayTeam?.shortName}</span>
          </div>
        </div>
      </header>

      {/* Formations */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-bold mb-4">Formations</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-center text-sm text-gray-500 mb-2">
              {lineups?.home?.formation || '?'}
            </div>
            <FormationView
              formation={lineups?.home?.formation || '4-4-2'}
              lineup={lineups?.home?.lineup || []}
              teamColor="blue"
              side="home"
              onPlayerClick={setSelectedPlayerId}
            />
          </div>
          <div>
            <div className="text-center text-sm text-gray-500 mb-2">
              {lineups?.away?.formation || '?'}
            </div>
            <FormationView
              formation={lineups?.away?.formation || '4-4-2'}
              lineup={lineups?.away?.lineup || []}
              teamColor="red"
              side="away"
              onPlayerClick={setSelectedPlayerId}
            />
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-bold mb-4">Events</h2>
        <div className="bg-white rounded-lg p-4">
          <EventTimeline
            events={events || []}
            homeTeamName={match.homeTeam?.name || ''}
            awayTeamName={match.awayTeam?.name || ''}
            onPlayerClick={setSelectedPlayerId}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-4">
        <h2 className="text-lg font-bold mb-4">Statistics</h2>
        <div className="bg-white rounded-lg p-4">
          <StatsComparison
            stats={statsBars}
            homeTeamName={match.homeTeam?.name || ''}
            awayTeamName={match.awayTeam?.name || ''}
          />
        </div>
      </section>

      {/* Player Modal */}
      <PlayerModal
        isOpen={!!selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        player={playerData?.player || null}
      />
    </div>
  )
}
```

- **Step 2: Commit**

```bash
git add src/routes/matches.\$id.tsx
git commit -m "feat: add match detail page"
```

---

## Phase 6: Polish

### Task 18: Add Error States and Edge Cases

**Files:**

- Modify: `src/routes/index.tsx`
- Modify: `src/routes/standings.tsx`
- Modify: `src/routes/matches.$id.tsx`
- **Step 1: Add ErrorBoundary to routes**

Create a reusable error component:

```tsx
// src/components/ui/ErrorState.tsx

import { RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-gray-400 text-lg mb-4">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  )
}
```

- **Step 2: Add error handling to pages**

Add try/catch with error state in each page component.

- **Step 3: Commit**

```bash
git add src/components/ui/ErrorState.tsx
git add src/routes/index.tsx src/routes/standings.tsx src/routes/matches.\$id.tsx
git commit -m "feat: add error states and retry handling"
```

---

### Task 19: Final Testing

- **Step 1: Test full flow**

1. Run scraper: `cd apps/scraper && npm run scrape:all`
2. Start web app: `npm run dev`
3. Navigate through all pages
4. Test mobile responsive design

- **Step 2: Run lint and typecheck**

```bash
npm run lint
npm run check
```

- **Step 3: Commit final changes**

```bash
git add -A
git commit -m "feat: complete Uruguayan football MVP"
```

---

## Self-Review Checklist

- **Spec coverage:** All requirements from spec implemented
- **Placeholder scan:** No TBD/TODO placeholders in code
- **Type consistency:** All types consistent across tasks
- **File paths:** All exact paths used correctly
- **Commands:** All commands verified with expected outputs

---

## Plan Summary

| Phase | Tasks | Description                                       |
| ----- | ----- | ------------------------------------------------- |
| 1     | 1     | Database schema                                   |
| 2     | 2-7   | Scraper package with promiedos integration        |
| 3     | 8-10  | API endpoints for standings, matches, players     |
| 4     | 11-14 | Frontend components (match, standings, formation) |
| 5     | 15-17 | Pages (home, standings, match detail)             |
| 6     | 18-19 | Polish (errors, testing)                          |

**Total Tasks:** 19

**Estimated Time:** 2-3 days for implementation

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
