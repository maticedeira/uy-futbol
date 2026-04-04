# Uruguayan Football Web App - Design Specification

**Date:** 2026-04-03
**Status:** Approved

---

## 1. Project Overview

A mobile-first web application providing comprehensive coverage of Uruguayan football across multiple divisions, featuring real-time match updates, detailed statistics, and interactive match visualizations.

**Core Value:** Clean data presentation with SofaScore-inspired mobile UX for Uruguayan football enthusiasts.

---

## 2. Architecture

### 2.1 Monorepo Structure

```
/apps
  /scraper     → Node.js scraping package
  /web          → Existing TanStack + PostgreSQL app
```

### 2.2 Data Flow

```
promiedos.com.ar ──┬──► Scraper ──► PostgreSQL ──► Web App
                   │
                   └──► flashcore.es (Phase 2 - live updates)

Transfermarkt ──► On-demand API ──► Player photos/stats ──► Web App
```

---

## 3. Database Schema (Drizzle)

### 3.1 Core Tables

**divisions**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar(50) | Primera A, Primera B |
| short_name | varchar(10) | A, B |
| team_count | integer | 16 for A, 14 for B |
| has_intermedio | boolean | A=true, B=false |
| created_at | timestamp | |

**teams**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar(100) | Full name |
| short_name | varchar(10) | 3-letter code |
| logo_url | text | Team logo URL |
| division_id | integer | FK to divisions |
| transfermarkt_id | text | External ID |
| created_at | timestamp | |

**players**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar(100) | Full name |
| photo_url | text | Player photo URL |
| team_id | integer | FK to teams |
| position | varchar(20) | GK, DEF, MED, DEL |
| transfermarkt_id | text | External ID |
| created_at | timestamp | |

**tournaments**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar(50) | Apertura, Clausura, etc. |
| short_name | varchar(10) | APR, CL, INT, ANU, DES |
| type | varchar(20) | league, intermedio, competencia |
| division_id | integer | FK to divisions |
| season | varchar(10) | 2025, 2026 |
| created_at | timestamp | |

**matches**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| date | timestamp | Match date/time |
| home_team_id | integer | FK to teams |
| away_team_id | integer | FK to teams |
| home_score | integer | Final home score |
| away_score | integer | Final away score |
| venue | varchar(100) | Stadium name |
| round | integer | Matchday number |
| status | varchar(20) | scheduled, live, finished |
| minute | integer | Current minute (for live) |
| tournament_id | integer | FK to tournaments |
| created_at | timestamp | |
| updated_at | timestamp | |

**match_events**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| match_id | integer | FK to matches |
| type | varchar(20) | goal, yellow_card, red_card, substitution |
| minute | integer | Event minute |
| player_id | integer | FK to players |
| assist_id | integer | Nullable, FK to players |
| description | text | Additional details |
| home_score | integer | Score after event |
| away_score | integer | Score after event |
| created_at | timestamp | |

**match_lineups**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| match_id | integer | FK to matches |
| team_id | integer | FK to teams |
| formation | varchar(10) | 4-4-2, 3-5-2, etc. |
| lineup | jsonb | Array of player positions |
| bench | jsonb | Array of bench players |
| created_at | timestamp | |

**standings**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| tournament_id | integer | FK to tournaments |
| team_id | integer | FK to teams |
| position | integer | Table position |
| played | integer | Matches played |
| won | integer | Wins |
| drawn | integer | Draws |
| lost | integer | Losses |
| goals_for | integer | Goals scored |
| goals_against | integer | Goals conceded |
| goal_diff | integer | GD |
| points | integer | Total points |
| created_at | timestamp | |
| updated_at | timestamp | |

**promedio**
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| tournament_id | integer | FK to tournaments (Anual) |
| team_id | integer | FK to teams |
| last_year_pts | integer | Points from previous season |
| current_pts | integer | Current season Anual points |
| total_matches | integer | Total matches played |
| promedio | decimal(6,4) | Calculated average |
| position | integer | Relegation table position |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 4. Uruguayan Football Rules

### 4.1 Primera División (División A)

**Teams:** 16

**Tournaments:**

- Apertura (1st semester): 15 matchdays, league format
- Clausura (2nd semester): 15 matchdays, league format
- Intermedio (mid-year): 2 groups of 8, 7 matchdays + final
  - Group A: Teams in even Apertura positions
  - Group B: Teams in odd Apertura positions
- Anual: Sum of Apertura + Clausura points
- Descenso: Promedio calculation

**Promedio Calculation:**

```
Promedio = (Last Year Anual Pts + Current Anual Pts) ÷ Total Matches Played
```

**Relegation:** Bottom 3 teams relegated to Primera B

**Champion Determination:**

1. Anual 1st → Direct to Final
2. Apertura winner vs Clausura winner → Semifinal
3. If Anual 1st won Apertura/Clausura → Only needs to beat other tournament winner

### 4.2 Primera B

**Teams:** 14

**Tournaments:**

- Competencia (start of year): League format
- Apertura (1st semester): League format
- Clausura (2nd semester): League format
- Anual: Sum of Apertura + Clausura points
- Descenso: Promedio calculation

**Promotion:** Top 2 in Anual → Direct promotion
**Playoff:** 3rd spot determined by playoff between Competencia winner + 5 others (or 3rd-8th if Competencia winner already qualified)

---

## 5. Data Sources

### 5.1 promiedos.com.ar (Primary)

- League standings for all tables
- Match fixtures and results
- Match events (goals, cards, substitutions)
- Team lineups and formations
- Update frequency: Daily

### 5.2 flashcore.es (Phase 2)

- Live match score updates
- Real-time minute tracking
- Update frequency: Every minute during matches

### 5.3 Transfermarkt (On-demand)

- Player photos
- Player statistics
- Team information
- Fetched on-demand when user views player

---

## 6. Frontend Specification

### 6.1 Design System

**Color Palette:**

- Primary: #1E40AF (Blue)
- Secondary: #DC2626 (Red)
- Success: #16A34A (Green - promotion zone)
- Danger: #DC2626 (Red - relegation zone)
- Background: #F8FAFC (Light gray)
- Card: #FFFFFF (White)
- Text Primary: #1E293B
- Text Secondary: #64748B

**Typography:**

- Font: Inter (Google Fonts)
- Headings: Bold, tight tracking
- Body: Regular, comfortable line height
- Numbers: Tabular figures for alignment

**Spacing:**

- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px

### 6.2 Mobile-First Layout

**Bottom Navigation:**

- Home (Matches)
- Standings
- Favorites
- Profile

**Responsive Breakpoints:**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 6.3 Pages

#### 6.3.1 Home / Matches Page (`/`)

**Layout:**

- Date selector at top (horizontal scroll)
- Division filter chips
- Tournament filter chips (Apertura, Clausura, etc.)
- Match cards list (newest first)

**Match Card:**

```
┌─────────────────────────────────────┐
│ [Home Logo]  HOME TEAM    2 - 1     │
│ [Away Logo]  AWAY TEAM       45'   │
│              Estadio Centenario    │
└─────────────────────────────────────┘
```

- Tap card → Navigate to Match Detail
- Live indicator (pulsing dot) for in-progress matches
- Completed: Final score
- Scheduled: Kickoff time

#### 6.3.2 Standings Page (`/standings`)

**Layout:**

- Division selector (A / B tabs)
- Tournament selector (Apertura, Clausura, Intermedio, Anual, Descenso)
- Standings table

**Table Columns:**
Pos | Team | P | W | D | L | GF | GA | GD | Pts

**Zone Highlights:**

- Promotion zone (green): Top positions
- Relegation zone (red): Bottom positions
- Current team row: Light blue background

**Tournament-Specific Tabs:**

- Division A: Apertura | Clausura | Intermedio | Anual | Descenso
- Division B: Competencia | Apertura | Clausura | Anual | Descenso

#### 6.3.3 Match Detail Page (`/matches/:id`)

**Header Section:**

```
┌─────────────────────────────────────┐
│     Estadio Centenario             │
│                                     │
│  [Logo]    HOME TEAM      2        │
│                                     │
│           vs                        │
│                                     │
│  [Logo]    AWAY TEAM      1        │
│                                     │
│           FT • 90'+3               │
└─────────────────────────────────────┘
```

**Formation View (TV-Style):**

```
           [GK]

   [DEF] [DEF] [DEF] [DEF]

   [MED] [MED] [MED] [MED]

   [DEL] [DEL]
```

- Player circles with photo (or placeholder)
- Tap player → Transfermarkt modal
- Color-coded: Home team (left), Away team (right)

**Event Timeline (SofaScore-style):**

```
     ⚽ Goal - Suarez (78')
           |
     🟨 Yellow - Perez (65')
           |
     ⚽ Goal - Rodriguez (45+2')
           |
     🔄 Substitution (HT)
           |
     ⚽ Goal - Martinez (32')
```

- Center-aligned events
- Icons with player name and minute
- Goal scorers with assist info

**Stats Comparison:**

```
Possession
████████████░░░░░░░░  58% - 42%
Shots
██████░░░░░░░░░░░░░  12 - 6
Shots on Target
███░░░░░░░░░░░░░░░░   5 - 3
Corners
███░░░░░░░░░░░░░░░░   4 - 2
Fouls
████████████░░░░░░░░  14 - 11
```

**Substitutes Section:**

- Collapsible list
- Shows on/off with minute

#### 6.3.4 Player Modal

**Content:**

- Large player photo
- Name and position
- Current team
- Key stats from Transfermarkt
- "View on Transfermarkt" link

### 6.4 Components

| Component         | Description                       |
| ----------------- | --------------------------------- |
| `BottomNav`       | Mobile navigation bar             |
| `DateSelector`    | Horizontal scrollable date picker |
| `FilterChips`     | Division/tournament filters       |
| `MatchCard`       | Match preview card                |
| `LiveIndicator`   | Pulsing dot for live matches      |
| `StandingsTable`  | Sortable standings table          |
| `TournamentTabs`  | Tab switcher for tournaments      |
| `FormationView`   | TV-style formation renderer       |
| `EventTimeline`   | Center-aligned event list         |
| `StatsComparison` | Side-by-side stat bars            |
| `PlayerAvatar`    | Player photo with tap handler     |
| `PlayerModal`     | Transfermarkt player info         |
| `LoadingSkeleton` | Content loading placeholder       |

### 6.5 States

**Loading:** Skeleton placeholders matching content shape
**Error:** Error message with retry button
**Empty:** "No matches found" with illustration
**Offline:** Banner with sync indicator

---

## 7. Scraper Specification

### 7.1 File Structure

```
apps/scraper/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry
│   ├── config.ts             # Configuration
│   ├── db/
│   │   └── client.ts         # Drizzle DB client
│   ├── scrapers/
│   │   ├── promiedos.ts      # Main promiedos scraper
│   │   ├── teams.ts          # Team scraping
│   │   ├── standings.ts      # Standings scraping
│   │   ├── matches.ts        # Match list scraping
│   │   └── match-detail.ts   # Match detail scraping
│   ├── services/
│   │   ├── transfermarkt.ts  # Transfermarkt API
│   │   └── storage.ts        # DB storage helpers
│   └── utils/
│       ├── http.ts           # HTTP client
│       └── parser.ts         # HTML parsing helpers
├── scripts/
│   ├── scrape-all.ts         # Full scrape
│   ├── scrape-standings.ts   # Standings only
│   └── scrape-daily.ts       # Daily updates
└── cron/
    └── schedule.ts           # Cron job definitions
```

### 7.2 Scraping Strategy

**promiedos.com.ar Structure:**

- Standings: `/posiciones.php?fecha={date}&torneo={tournament}`
- Matches: `/fixture.php?fecha={date}&torneo={tournament}`
- Match detail: `/partido.php?id={match_id}`

**Rate Limiting:**

- 2-second delay between requests
- Retry with exponential backoff on failure
- Max 3 retries per request

### 7.3 Cron Schedule

| Job           | Schedule                 | Description            |
| ------------- | ------------------------ | ---------------------- |
| Standings     | Daily 6:00 AM UYT        | Update all tables      |
| Fixtures      | Every 6 hours            | Fetch upcoming matches |
| Match Details | Every 15 min (match day) | Update live scores     |

---

## 8. API Endpoints (Web App)

### 8.1 Standings

**GET `/api/standings`**

```typescript
Query: { division: 'A' | 'B', tournament: string }
Response: {
  tournament: { id, name, type },
  standings: [{
    position, team: { id, name, logo },
    played, won, drawn, lost,
    goalsFor, goalsAgainst, goalDiff, points
  }]
}
```

**GET `/api/promedio`**

```typescript
Query: {
  division: 'A' | 'B'
}
Response: {
  rows: [
    {
      position,
      team: { id, name, logo },
      lastYearPts,
      currentPts,
      totalMatches,
      promedio,
    },
  ]
}
```

### 8.2 Matches

**GET `/api/matches`**

```typescript
Query: { date: string, division?: string, tournament?: string }
Response: {
  matches: [{
    id, date, status, minute,
    home: { id, name, logo, score },
    away: { id, name, logo, score },
    venue, tournament
  }]
}
```

**GET `/api/matches/:id`**

```typescript
Response: {
  match: {
    id, date, status, minute, venue,
    home: { id, name, logo, score },
    away: { id, name, logo, score },
    tournament,
    events: [{ type, minute, player, description }],
    lineups: {
      home: { formation, lineup, bench },
      away: { formation, lineup, bench }
    },
    stats: { possession, shots, corners, fouls, ... }
  }
}
```

### 8.3 Players

**GET `/api/players/:id`**

```typescript
Response: {
  player: {
    id, name, photo, position, team,
    transfermarkt: { id, url, stats }
  }
}
```

---

## 9. MVP Scope

### 9.1 Included

- ✅ Database schema for all entities
- ✅ promiedos.com.ar scraper (standings, matches, events)
- ✅ Transfermarkt integration (player photos)
- ✅ Standings page with all tournament tables
- ✅ Match list with filters
- ✅ Match detail with formation and events
- ✅ TV-style formation view
- ✅ Player tap → Transfermarkt info
- ✅ Mobile-first responsive design
- ✅ SofaScore-inspired UI

### 9.2 Excluded (Phase 2)

- ❌ Heat maps
- ❌ Live updates (flashcore.es)
- ❌ Curious/interesting facts
- ❌ Historical data
- ❌ Full team pages
- ❌ User favorites
- ❌ Push notifications

---

## 10. Acceptance Criteria

1. **Standings display correctly** for both divisions with all tournament tables
2. **Promedio calculation** matches Uruguayan football rules
3. **Match list** shows all matches with correct filtering
4. **Match detail** displays formation, events, and stats
5. **Formation view** shows player positions with photos
6. **Player modal** fetches and displays Transfermarkt data
7. **Mobile UI** is responsive and matches SofaScore quality
8. **Scraper** successfully extracts data from promiedos.com.ar
9. **No placeholder content** - all features work with real data

---

## 11. Technical Notes

- All dates stored in UTC, displayed in UYT (UTC-3)
- Match minute displays as `45+2` for added time
- Formation positions use standard pitch coordinates (0-100 x, 0-100 y)
- Player photos cached in DB for 24 hours
- Standings recalculated on every scrape
