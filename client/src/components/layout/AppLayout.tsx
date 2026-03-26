import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell,
  Trophy,
  Skull,
  Swords,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { auth } from '../../lib/api'
import { cn, leagueBadgeEmoji, leagueBadgeClass } from '../../lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { to: '/workout', label: 'Workout', Icon: Dumbbell },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { to: '/monsters', label: 'Monsters', Icon: Skull },
  { to: '/tournament', label: 'Tournament', Icon: Swords },
  { to: '/profile', label: 'Profile', Icon: User },
]

// ─── Sidebar content ───────────────────────────────────────────────────────
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await auth.logout()
    } catch {
      // ignore
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-background-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-purple-glow-sm">
            <Swords size={16} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold gradient-text tracking-wide">
            GymRPG
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30 shadow-purple-glow-sm'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-background-card border border-transparent',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-purple-500 rounded-r-full" />
                )}
                <Icon
                  size={18}
                  className={cn(
                    'transition-colors shrink-0',
                    isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300',
                  )}
                />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-purple-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Hunter mini-card */}
      {user && (
        <div className="px-3 pb-3">
          <div className="card-glow rounded-xl p-3 bg-background-card">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-purple-700/40 border border-purple-600/40 flex items-center justify-center flex-shrink-0 shadow-purple-glow-sm">
                <span className="text-base font-bold text-purple-300">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-100 truncate">
                  {user.username}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">
                    Lv. {user.totalLevel}
                  </span>
                  <span
                    className={cn('rank-badge text-[10px] px-1.5 py-0', leagueBadgeClass(user.league))}
                  >
                    {leagueBadgeEmoji(user.league)} {user.league}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors w-full px-1"
            >
              <LogOut size={12} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AppLayout ─────────────────────────────────────────────────────────────
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-background-secondary border-r border-background-border">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-background-secondary border-r border-background-border transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background-secondary border-b border-background-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-400 hover:text-white p-1"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-base font-bold gradient-text">GymRPG</span>
          <div className="w-8" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
