// src/components/FilterChips.tsx

interface FilterChipsProps {
  options: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}

export function FilterChips({ options, selected, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selected === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
