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
  teamColor?: string
  side: 'home' | 'away'
  onPlayerClick: (playerId: number) => void
}

export function FormationView({
  formation: _formation,
  lineup,
  teamColor: _teamColor,
  side,
  onPlayerClick,
}: FormationViewProps) {
  return (
    <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-800 to-green-700 rounded-lg overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 border-t border-white/20" />
      <div className="absolute inset-x-0 top-1/4 border-t border-white/10" />
      <div className="absolute inset-x-0 top-3/4 border-t border-white/10" />
      <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/20" />
      <div className="absolute inset-4 border-2 border-white/20 rounded-lg" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full" />

      <div
        className={`absolute ${side === 'home' ? 'top-2' : 'bottom-2'} left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-white/30 rounded-t ${side === 'home' ? 'rounded-b-none' : 'rounded-t-none'}`}
      />

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
