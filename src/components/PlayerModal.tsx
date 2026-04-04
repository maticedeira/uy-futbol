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
