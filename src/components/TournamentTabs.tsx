interface TournamentTabsProps {
  tournaments: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}

export function TournamentTabs({
  tournaments,
  selected,
  onChange,
}: TournamentTabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tournaments.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors border-b-2 ${
            selected === t.value
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
