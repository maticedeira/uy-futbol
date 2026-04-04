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
  homeTeamName: _homeTeamName,
  awayTeamName: _awayTeamName,
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
