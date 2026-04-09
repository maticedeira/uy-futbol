// src/components/MatchCard.tsx

import { Link } from '@tanstack/react-router'
import { getTeamLogo } from '../utils/team-logos'

interface MatchCardProps {
  match: {
    id: number
    date: string
    status: 'scheduled' | 'live' | 'finished'
    minute?: number | null
    homeScore?: number | null
    awayScore?: number | null
    venue?: string | null
    home: {
      id: number
      name: string
      shortName: string
      logoUrl?: string | null
    }
    away: {
      id: number
      name: string
      shortName: string
      logoUrl?: string | null
    }
    tournament?: {
      shortName?: string
    }
  }
}

const STATUS_TEXT: Record<string, string> = {
  scheduled: 'Prog.',
  live: 'VIVO',
  finished: 'Final',
}

export function MatchCard({ match }: MatchCardProps) {
  const matchDate = new Date(match.date + 'T12:00:00')
  const timeString = matchDate.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const homeLogo = getTeamLogo(match.home.name) || match.home.logoUrl
  const awayLogo = getTeamLogo(match.away.name) || match.away.logoUrl

  const getStatusBadge = () => {
    if (match.status === 'live') {
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
          {match.minute}'
        </span>
      )
    }
    if (match.status === 'finished') {
      return (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {STATUS_TEXT[match.status]}
        </span>
      )
    }
    return (
      <span className="text-xs text-gray-500 font-medium">{timeString}</span>
    )
  }

  return (
    <Link
      to="/matches/$id"
      params={{ id: match.id.toString() }}
      className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        {match.tournament?.shortName && (
          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
            {match.tournament.shortName}
          </span>
        )}
        <div className="ml-auto">{getStatusBadge()}</div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {homeLogo ? (
            <img
              src={homeLogo}
              alt=""
              className="w-8 h-8 object-contain flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
              {match.home.shortName.substring(0, 2)}
            </div>
          )}
          <span className="font-medium text-sm truncate">
            {match.home.shortName}
          </span>
        </div>
        <span
          className={`font-bold text-xl w-10 text-center ${
            match.status === 'finished' && match.homeScore != null
              ? (match.homeScore ?? 0) > (match.awayScore ?? 0)
                ? 'text-green-600'
                : ''
              : ''
          }`}
        >
          {match.homeScore ?? '-'}
        </span>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {awayLogo ? (
            <img
              src={awayLogo}
              alt=""
              className="w-8 h-8 object-contain flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
              {match.away.shortName.substring(0, 2)}
            </div>
          )}
          <span className="font-medium text-sm truncate">
            {match.away.shortName}
          </span>
        </div>
        <span
          className={`font-bold text-xl w-10 text-center ${
            match.status === 'finished' && match.awayScore != null
              ? (match.awayScore ?? 0) > (match.homeScore ?? 0)
                ? 'text-green-600'
                : ''
              : ''
          }`}
        >
          {match.awayScore ?? '-'}
        </span>
      </div>

      {match.venue && (
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {match.venue}
        </div>
      )}
    </Link>
  )
}
