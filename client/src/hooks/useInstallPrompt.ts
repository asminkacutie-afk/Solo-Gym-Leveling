import { useState, useEffect, useCallback } from 'react'

export type InstallState =
  | 'idle'          // hasn't shown yet
  | 'prompt-native' // BeforeInstallPromptEvent available (Android/Chrome)
  | 'prompt-ios'    // iOS Safari — show manual instruction
  | 'installed'     // already running as PWA
  | 'dismissed'     // user said no

const STORAGE_KEY   = 'gymrpg-pwa'
const SESSION_KEY   = 'gymrpg-session'

interface StoredData {
  dismissed?: boolean
  sessionCount: number
  lastSession?: string // ISO date of last session start
}

function readStorage(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { sessionCount: 0 }
  } catch {
    return { sessionCount: 0 }
  }
}

function writeStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function isIOS() {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export interface UseInstallPromptReturn {
  state: InstallState
  triggerInstall: () => Promise<void>
  dismiss: () => void
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [state, setState] = useState<InstallState>('idle')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Already installed as PWA — never show banner
    if (isInStandaloneMode()) {
      setState('installed')
      return
    }

    const stored = readStorage()

    // User previously dismissed — respect that permanently
    if (stored.dismissed) {
      setState('dismissed')
      return
    }

    // Track session (only count once per page load, not every re-render)
    const alreadyCountedThisLoad = sessionStorage.getItem(SESSION_KEY)
    if (!alreadyCountedThisLoad) {
      sessionStorage.setItem(SESSION_KEY, '1')
      const today = new Date().toISOString().slice(0, 10)
      const isNewDay = stored.lastSession !== today
      // Only increment if it's a genuinely new session (new day or first time)
      if (isNewDay || stored.sessionCount === 0) {
        stored.sessionCount = (stored.sessionCount || 0) + 1
        stored.lastSession = today
        writeStorage(stored)
      }
    }

    const sessionCount = readStorage().sessionCount

    // iOS: show manual prompt from 2nd session onward
    if (isIOS()) {
      if (sessionCount >= 2) {
        setState('prompt-ios')
      }
      return
    }

    // Chrome/Android: listen for native BeforeInstallPromptEvent
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (sessionCount >= 2) {
        setState('prompt-native')
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // If app was installed externally
    window.addEventListener('appinstalled', () => {
      setState('installed')
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setState('installed')
    } else {
      dismiss()
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    const stored = readStorage()
    stored.dismissed = true
    writeStorage(stored)
    setState('dismissed')
  }, [])

  return { state, triggerInstall, dismiss }
}
