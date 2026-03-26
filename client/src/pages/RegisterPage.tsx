import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Swords, Loader2, Check, X } from 'lucide-react'
import { auth } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

// ─── Star field (reusable, same as login) ─────────────────────────────────
function StarField() {
  const stars = useRef(
    Array.from({ length: 60 }, (_, i) => ({
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
            opacity: 0.12,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-700/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/5 blur-[100px]" />
    </div>
  )
}

// ─── Password strength ─────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Contains number', valid: /\d/.test(password) },
    { label: 'Contains special char', valid: /[!@#$%^&*]/.test(password) },
  ]
  const score = checks.filter((c) => c.valid).length

  const bar =
    score === 0
      ? 'bg-gray-700'
      : score === 1
        ? 'bg-red-500'
        : score === 2
          ? 'bg-orange-500'
          : score === 3
            ? 'bg-yellow-500'
            : 'bg-green-500'

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? bar : 'bg-gray-700',
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              c.valid ? 'text-green-400' : 'text-gray-500',
            )}
          >
            {c.valid ? <Check size={10} /> : <X size={10} />}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── RegisterPage ──────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.username.trim() || form.username.length < 3)
      errs.username = 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      errs.username = 'Username can only contain letters, numbers, underscores.'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.'
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.'
    if (!form.gender) errs.gender = 'Please select your gender.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setServerError('')
    setIsSubmitting(true)
    try {
      const { user, accessToken } = await auth.register({
        username: form.username,
        email: form.email,
        password: form.password,
        gender: form.gender as 'male' | 'female' | 'other',
      })
      setAuth(user, accessToken)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <StarField />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-700/30 border border-purple-600/40 shadow-purple-glow mb-4 animate-float">
            <Swords size={28} className="text-purple-300" />
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text mb-2">GymRPG</h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase font-display">
            Awaken Your Power
          </p>
        </div>

        {/* Card */}
        <div className="card-glow rounded-2xl bg-background-card p-8 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display text-xl font-semibold text-gray-100 mb-6">
            Create Hunter Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Hunter Name
              </label>
              <input
                type="text"
                autoComplete="username"
                className={cn('dark-input', errors.username && 'border-red-500/60')}
                placeholder="ShadowSlayer99"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.username && (
                <p className="text-red-400 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className={cn('dark-input', errors.email && 'border-red-500/60')}
                placeholder="hunter@realm.gg"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn('dark-input pr-10', errors.password && 'border-red-500/60')}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
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
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn('dark-input pr-10', errors.confirmPassword && 'border-red-500/60')}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Gender
              </label>
              <select
                className={cn('dark-input', errors.gender && 'border-red-500/60')}
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="text-red-400 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <span className="mt-0.5">⚠</span>
                <span>{serverError}</span>
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
                  Awakening...
                </>
              ) : (
                'Begin Your Legend'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already a hunter?{' '}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Enter the realm →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
