import React, { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CombatFlashProps {
  /** When this toggles to true, the flash fires */
  trigger: boolean
  color?: string
  children?: ReactNode
}

interface UseCombatFlashResult {
  flash: () => void
  FlashWrapper: React.FC<{ children: ReactNode }>
}

// ─── CombatFlash component ────────────────────────────────────────────────────
//
// Wraps children in a relative container. When `trigger` flips to true it:
//   • briefly applies a box-shadow ring around the container
//   • scales the container 1 → 1.02 → 1
//   • fires a coloured screen-edge flash overlay that fades out

export default function CombatFlash({
  trigger,
  color = '#7c3aed',
  children,
}: CombatFlashProps) {
  // Track previous trigger value to fire only on rising edge
  const prevTriggerRef = useRef(trigger)
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wasActive = prevTriggerRef.current
    prevTriggerRef.current = trigger

    if (trigger && !wasActive) {
      // Clear any running flash
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setActive(true)
      timeoutRef.current = setTimeout(() => setActive(false), 320)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [trigger])

  return (
    <motion.div
      className="relative"
      animate={
        active
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                `0 0 0px ${color}00`,
                `0 0 22px ${color}cc, 0 0 44px ${color}66`,
                `0 0 0px ${color}00`,
              ],
            }
          : { scale: 1, boxShadow: `0 0 0px ${color}00` }
      }
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ borderRadius: 'inherit' }}
    >
      {children}

      {/* Screen-edge flash overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="combat-screen-flash"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              background: `radial-gradient(ellipse at center, ${color}33 0%, ${color}11 60%, transparent 100%)`,
              boxShadow: `inset 0 0 28px ${color}99`,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── useCombatFlash hook ──────────────────────────────────────────────────────
//
// Returns a `flash()` imperative trigger and a `FlashWrapper` component.
// Usage:
//   const { flash, FlashWrapper } = useCombatFlash()
//   <FlashWrapper><YourCard /></FlashWrapper>
//   // on set completion:
//   flash()

export function useCombatFlash(color: string = '#7c3aed'): UseCombatFlashResult {
  const [triggered, setTriggered] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    // Force a rising edge by briefly setting false then true
    setTriggered(false)
    // Use rAF to ensure the false state is committed before re-setting true
    requestAnimationFrame(() => {
      setTriggered(true)
      timeoutRef.current = setTimeout(() => setTriggered(false), 400)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const FlashWrapper: React.FC<{ children: ReactNode }> = useCallback(
    ({ children }: { children: ReactNode }) => (
      <CombatFlash trigger={triggered} color={color}>
        {children}
      </CombatFlash>
    ),
    [triggered, color],
  )

  return { flash, FlashWrapper }
}
