import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { auth } from './lib/api'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import TournamentPage from './pages/TournamentPage'
import MonstersPage from './pages/MonstersPage'
import InstallBanner from './components/ui/InstallBanner'

// ─── Private Route Guard ───────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { accessToken, setAuth, clearAuth, setLoading } = useAuthStore()

  // Hydrate full user profile whenever the access token changes.
  // This covers: initial page load with saved token, and post-registration
  // where setAuth is called with a partial user from the register response.
  useEffect(() => {
    if (!accessToken) return

    setLoading(true)
    auth
      .me()
      .then((user) => {
        setAuth(user, accessToken)
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  return (
    <div className="min-h-screen bg-background text-white">
      <InstallBanner />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/monsters" element={<MonstersPage />} />
          <Route path="/tournament" element={<TournamentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
