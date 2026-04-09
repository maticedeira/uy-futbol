import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
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

const WEEKDAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]
const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const dayName = WEEKDAYS_ES[date.getDay()]
  const dayNum = date.getDate()
  const month = MONTHS_ES[date.getMonth()]
  return `${dayName} ${dayNum} de ${month}`
}

function HomePage() {
  const today = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedDivision, setSelectedDivision] = useState('A')

  const { data, isLoading } = useQuery({
    queryKey: ['matches', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/matches?date=${selectedDate}`)
      return res.json()
    },
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })

  const fechaLabel = useMemo(() => {
    if (data?.matches?.length > 0 && data.matches[0]?.tournament?.shortName) {
      const tournament = data.matches[0].tournament.shortName
      return `Fecha ${tournament}`
    }
    return null
  }, [data])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold mb-4">Fechas</h1>
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
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {formatDateLong(selectedDate)}
          </h2>
          {fechaLabel && (
            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {fechaLabel}
            </span>
          )}
        </div>

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
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⚽</div>
            <p className="text-gray-500">No hay partidos para esta fecha</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
