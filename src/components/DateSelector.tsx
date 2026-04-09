// src/components/DateSelector.tsx

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const dates = []
  const today = new Date()

  for (let i = -3; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dates.map((date) => {
        const dateStr = date.toISOString().split('T')[0]
        const isSelected = dateStr === selectedDate
        const isToday = dateStr === today.toISOString().split('T')[0]
        const dayOfWeek = WEEKDAYS_ES[date.getDay()]
        const dayNum = date.getDate()
        const month = date.toLocaleDateString('es-UY', { month: 'short' })

        return (
          <button
            key={dateStr}
            onClick={() => onDateChange(dateStr)}
            className={`flex flex-col items-center min-w-[52px] px-2 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : isToday
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span
              className={`text-xs ${isToday && !isSelected ? 'text-green-600' : ''}`}
            >
              {isToday ? 'Hoy' : dayOfWeek}
            </span>
            <span
              className={`font-bold ${isToday && !isSelected ? 'text-green-700' : ''}`}
            >
              {dayNum}
            </span>
            <span
              className={`text-xs ${isToday && !isSelected ? 'text-green-600' : 'text-gray-400'}`}
            >
              {month}
            </span>
          </button>
        )
      })}
    </div>
  )
}
