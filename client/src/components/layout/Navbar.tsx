import { useState } from 'react'
import { Menu, X, Swords, Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn, leagueBadgeClass } from '../../lib/utils'

interface NavbarProps {
  onMenuClick: () => void
  mobileOpen: boolean
}

export default function Navbar({ onMenuClick, mobileOpen }: NavbarProps) {
  const { user } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background-secondary border-b border-background-border lg:hidden">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-background-card"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shadow-purple-glow-sm">
          <Swords size={14} className="text-white" />
        </div>
        <span className="font-display text-base font-bold gradient-text tracking-wide">
          GymRPG
        </span>
      </div>

      {/* Right side: notifications + avatar */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <button
          onClick={() => setShowNotifications((v) => !v)}
          className="relative text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-background-card"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Unread dot */}
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-purple-500 rounded-full ring-1 ring-background-secondary" />
        </button>

        {/* Avatar */}
        {user && (
          <div
            className={cn(
              'w-8 h-8 rounded-full bg-purple-700/40 border flex items-center justify-center cursor-pointer',
              leagueBadgeClass(user.league).includes('gold')
                ? 'border-gold-500/50'
                : 'border-purple-600/40',
            )}
          >
            <span className="text-sm font-bold text-purple-300">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Notifications dropdown (minimal) */}
      {showNotifications && (
        <div className="absolute top-14 right-4 w-72 bg-background-card border border-background-border rounded-xl shadow-card-glow z-50 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Notifications
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex gap-2 p-2 rounded-lg bg-background-secondary">
              <span className="text-purple-400">⚡</span>
              <span>Daily quests reset — complete them for bonus XP</span>
            </div>
            <div className="flex gap-2 p-2 rounded-lg bg-background-secondary">
              <span className="text-gold-400">🏆</span>
              <span>Tournament rankings updated</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
