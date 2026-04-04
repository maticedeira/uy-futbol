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
  homeTeamName: _homeTeamName,
  awayTeamName: _awayTeamName,
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
                  <span>{eventIcons.goal}</span>
                  <button
                    onClick={() =>
                      event.player && onPlayerClick(event.player.id)
                    }
                    className="text-sm font-medium text-right hover:underline"
                  >
                    {event.player?.name}
                  </button>
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

            <div className="flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
