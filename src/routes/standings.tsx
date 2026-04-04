import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BottomNav } from '../components/ui/BottomNav'
import { StandingsTable } from '../components/StandingsTable'
import { TournamentTabs } from '../components/TournamentTabs'
import { StandingsRowSkeleton } from '../components/ui/LoadingSkeleton'

export const Route = createFileRoute('/standings')({
  component: StandingsPage,
})

const TOURNAMENTS_A = [
  { value: 'APR', label: 'Apertura' },
  { value: 'CL', label: 'Clausura' },
  { value: 'INT', label: 'Intermedio' },
  { value: 'ANU', label: 'Anual' },
  { value: 'DES', label: 'Descenso' },
]

const TOURNAMENTS_B = [
  { value: 'COM', label: 'Competencia' },
  { value: 'APR', label: 'Apertura' },
  { value: 'CL', label: 'Clausura' },
  { value: 'ANU', label: 'Anual' },
  { value: 'DES', label: 'Descenso' },
]

function StandingsPage() {
  const [selectedDivision, setSelectedDivision] = useState('A')
  const [selectedTournament, setSelectedTournament] = useState('ANU')

  const tournaments = selectedDivision === 'A' ? TOURNAMENTS_A : TOURNAMENTS_B

  const { data, isLoading } = useQuery({
    queryKey: ['standings', selectedDivision, selectedTournament],
    queryFn: async () => {
      const res = await fetch(
        `/api/standings?division=${selectedDivision}&tournament=${selectedTournament}`,
      )
      return res.json()
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold mb-4">Standings</h1>

        <div className="flex gap-2 mb-4">
          {['A', 'B'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDivision(d)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                selectedDivision === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {d === 'A' ? 'Primera A' : 'Primera B'}
            </button>
          ))}
        </div>

        <TournamentTabs
          tournaments={tournaments}
          selected={selectedTournament}
          onChange={setSelectedTournament}
        />
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="bg-white rounded-lg">
            {[...Array(16)].map((_, i) => (
              <StandingsRowSkeleton key={i} />
            ))}
          </div>
        ) : data?.standings?.length > 0 ? (
          <StandingsTable
            standings={data.standings}
            promotionZone={selectedTournament === 'ANU' ? 2 : undefined}
            relegationZone={selectedTournament === 'DES' ? 3 : undefined}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No standings available
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
