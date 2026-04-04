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
