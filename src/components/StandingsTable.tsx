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
  promotionZone?: number
  relegationZone?: number
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

      {standings.map((row) => {
        const isPromotion = row.position <= promotionZone
        const isRelegation = row.position > standings.length - relegationZone

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
