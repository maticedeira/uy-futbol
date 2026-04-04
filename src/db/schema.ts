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
import { relations } from 'drizzle-orm'

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
  position: varchar('position', { length: 20 }),
  transfermarktId: text('transfermarkt_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  shortName: varchar('short_name', { length: 10 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
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
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
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
  type: varchar('type', { length: 20 }).notNull(),
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
  lineup: jsonb('lineup'),
  bench: jsonb('bench'),
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

export const divisionsRelations = relations(divisions, ({ many }) => ({
  teams: many(teams),
  tournaments: many(tournaments),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  division: one(divisions, {
    fields: [teams.divisionId],
    references: [divisions.id],
  }),
  homeMatches: many(matches, { relationName: 'homeTeam' }),
  awayMatches: many(matches, { relationName: 'awayTeam' }),
  players: many(players),
}))

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  division: one(divisions, {
    fields: [tournaments.divisionId],
    references: [divisions.id],
  }),
  matches: many(matches),
  standings: many(standings),
}))

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  events: many(matchEvents),
  lineups: many(matchLineups),
}))

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, {
    fields: [matchEvents.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchEvents.playerId],
    references: [players.id],
    relationName: 'eventPlayer',
  }),
  assist: one(players, {
    fields: [matchEvents.assistId],
    references: [players.id],
    relationName: 'assistPlayer',
  }),
}))

export const matchLineupsRelations = relations(matchLineups, ({ one }) => ({
  match: one(matches, {
    fields: [matchLineups.matchId],
    references: [matches.id],
  }),
  team: one(teams, {
    fields: [matchLineups.teamId],
    references: [teams.id],
  }),
}))

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
}))

export const standingsRelations = relations(standings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [standings.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [standings.teamId],
    references: [teams.id],
  }),
}))

export const promedioRelations = relations(promedio, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [promedio.tournamentId],
    references: [tournaments.id],
  }),
  team: one(teams, {
    fields: [promedio.teamId],
    references: [teams.id],
  }),
}))

export type Division = typeof divisions.$inferSelect
export type Team = typeof teams.$inferSelect
export type Player = typeof players.$inferSelect
export type Tournament = typeof tournaments.$inferSelect
export type Match = typeof matches.$inferSelect
export type MatchEvent = typeof matchEvents.$inferSelect
export type MatchLineup = typeof matchLineups.$inferSelect
export type Standing = typeof standings.$inferSelect
export type Promedio = typeof promedio.$inferSelect
