import { create } from 'zustand'
import type { User } from '../lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setUser: (user: User) => void
}

type AuthStore = AuthState & AuthActions

const TOKEN_KEY = 'accessToken'

export const useAuthStore = create<AuthStore>((set) => ({
  // ─── Initial state ───────────────────────────────────────────────────
  user: null,
  accessToken: localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  isAuthenticated: false,

  // ─── Actions ─────────────────────────────────────────────────────────
  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setUser: (user) => set({ user }),
}))
