import { Link, useLocation } from '@tanstack/react-router'
import { Calendar, Table, Star, User } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Matches', icon: Calendar },
  { path: '/standings', label: 'Standings', icon: Table },
  { path: '/favorites', label: 'Favorites', icon: Star },
  { path: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
