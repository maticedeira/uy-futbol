import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FormationView } from '../../components/FormationView'
import { EventTimeline } from '../../components/EventTimeline'
import { StatsComparison } from '../../components/StatsComparison'
import { PlayerModal } from '../../components/PlayerModal'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/matches/$id')({
  component: MatchDetailPage,
})

function MatchDetailPage() {
  const { id } = Route.useParams()
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
