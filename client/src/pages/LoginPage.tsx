import { useState, FormEvent, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Swords, Loader2 } from 'lucide-react'
import { auth } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

// ─── Star field (CSS only) ─────────────────────────────────────────────────
function StarField() {
  const stars = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    })),
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.current.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.15,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      {/* Nebula blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-700/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/5 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full bg-gold-600/3 blur-[80px]" />
    </div>
  )
}

// ─── LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, isAuthenticated } = useAuthStore()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authed
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      const { user, accessToken } = await auth.login({ email, password })
      setAuth(user, accessToken)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Check your email and password.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4">
      <StarField />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-700/30 border border-purple-600/40 shadow-purple-glow mb-4 animate-float">
            <Swords size={28} className="text-purple-300" />
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text mb-2">GymRPG</h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase font-display">
            Enter the Shadow Realm
          </p>
        </div>

        {/* Card */}
        <div className="card-glow rounded-2xl bg-background-card p-8 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display text-xl font-semibold text-gray-100 mb-6">
            Hunter Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="dark-input"
                placeholder="hunter@realm.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="dark-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'btn-primary w-full flex items-center justify-center gap-2 py-3',
                isSubmitting && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entering...
                </>
              ) : (
                'Enter the Realm'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            No account?{' '}
            <Link
              to="/register"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Awaken your power →
            </Link>
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Your fitness journey. Legendary status awaits.
        </p>
      </div>
    </div>
  )
}
