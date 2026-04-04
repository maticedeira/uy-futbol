// src/components/DateSelector.tsx

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const dates = []
  const today = new Date()

  for (let i = -7; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map((date) => {
        const d = new Date(date)
        const isSelected = date === selectedDate
        const isToday = date === today.toISOString().split('T')[0]

        return (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={`flex flex-col items-center min-w-[48px] px-3 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : isToday
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className="text-xs">
              {d.toLocaleDateString('es-UY', { weekday: 'short' })}
            </span>
            <span className="font-bold">{d.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
