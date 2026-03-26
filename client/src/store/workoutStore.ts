import { create } from 'zustand'
import type { WorkoutSession, WorkoutSet } from '../lib/api'

interface WorkoutState {
  activeSession: WorkoutSession | null
  sets: WorkoutSet[]
  isLogging: boolean
  sessionElapsedSeconds: number
}

interface WorkoutActions {
  startSession: (session: WorkoutSession) => void
  endSession: (summary?: Partial<WorkoutSession>) => void
  addSet: (set: WorkoutSet) => void
  removeSet: (index: number) => void
  clearSession: () => void
  setIsLogging: (val: boolean) => void
  tickTimer: () => void
  resetTimer: () => void
}

type WorkoutStore = WorkoutState & WorkoutActions

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  // ─── State ───────────────────────────────────────────────────────────
  activeSession: null,
  sets: [],
  isLogging: false,
  sessionElapsedSeconds: 0,

  // ─── Actions ─────────────────────────────────────────────────────────
  startSession: (session) =>
    set({
      activeSession: session,
      sets: session.sets ?? [],
      isLogging: true,
      sessionElapsedSeconds: 0,
    }),

  endSession: (summary) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...summary, endedAt: new Date().toISOString() }
        : null,
      isLogging: false,
    })),

  addSet: (newSet) =>
    set((state) => ({
      sets: [...state.sets, newSet],
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            sets: [...(state.activeSession.sets ?? []), newSet],
          }
        : null,
    })),

  removeSet: (index) =>
    set((state) => {
      const updatedSets = state.sets.filter((_, i) => i !== index)
      return {
        sets: updatedSets,
        activeSession: state.activeSession
          ? { ...state.activeSession, sets: updatedSets }
          : null,
      }
    }),

  clearSession: () =>
    set({
      activeSession: null,
      sets: [],
      isLogging: false,
      sessionElapsedSeconds: 0,
    }),

  setIsLogging: (val) => set({ isLogging: val }),

  tickTimer: () =>
    set((state) => ({ sessionElapsedSeconds: state.sessionElapsedSeconds + 1 })),

  resetTimer: () => set({ sessionElapsedSeconds: 0 }),
}))
