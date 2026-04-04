import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BottomNav } from '../components/ui/BottomNav'
import { MatchCard } from '../components/MatchCard'
import { DateSelector } from '../components/DateSelector'
import { FilterChips } from '../components/FilterChips'
import { MatchCardSkeleton } from '../components/ui/LoadingSkeleton'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const DIVISIONS = [
  { value: 'A', label: 'Primera A' },
  { value: 'B', label: 'Primera B' },
]

function HomePage() {
  const today = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedDivision, setSelectedDivision] = useState('A')

  const { data, isLoading } = useQuery({
    queryKey: ['matches', selectedDate, selectedDivision],
    queryFn: async () => {
      const res = await fetch(`/api/matches?date=${selectedDate}`)
      return res.json()
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold mb-4">Uruguayan Football</h1>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <div className="mt-4">
          <FilterChips
            options={DIVISIONS}
            selected={selectedDivision}
            onChange={setSelectedDivision}
          />
        </div>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.matches?.length > 0 ? (
          <div className="space-y-3">
            {data.matches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No matches found for this date
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
