import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── cn ────────────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Weight formatting ─────────────────────────────────────────────────────
export function formatWeight(weight: number, units: 'kg' | 'lbs' = 'kg'): string {
  if (units === 'lbs') {
    return `${(weight * 2.20462).toFixed(1)} lbs`
  }
  return `${weight} kg`
}

// ─── Discipline colors ─────────────────────────────────────────────────────
export function disciplineColor(discipline: string): string {
  const map: Record<string, string> = {
    strength: '#ef4444',
    endurance: '#3b82f6',
    power: '#f59e0b',
    speed: '#10b981',
    recovery: '#06b6d4',
    flexibility: '#ec4899',
    // aliases
    Strength: '#ef4444',
    Endurance: '#3b82f6',
    Power: '#f59e0b',
    Speed: '#10b981',
    Recovery: '#06b6d4',
    Flexibility: '#ec4899',
  }
  return map[discipline] ?? '#8b5cf6'
}

// ─── Discipline icons ──────────────────────────────────────────────────────
export function disciplineIcon(discipline: string): string {
  const map: Record<string, string> = {
    strength: '⚔️',
    endurance: '🏃',
    power: '⚡',
    speed: '💨',
    recovery: '🌀',
    flexibility: '🌿',
    Strength: '⚔️',
    Endurance: '🏃',
    Power: '⚡',
    Speed: '💨',
    Recovery: '🌀',
    Flexibility: '🌿',
  }
  return map[discipline] ?? '🔥'
}

// ─── League colors ─────────────────────────────────────────────────────────
export function leagueColor(league: string): string {
  const map: Record<string, string> = {
    iron: '#6b7280',
    bronze: '#d97706',
    silver: '#94a3b8',
    gold: '#fbbf24',
    platinum: '#22d3ee',
    mythic: '#a78bfa',
    Iron: '#6b7280',
    Bronze: '#d97706',
    Silver: '#94a3b8',
    Gold: '#fbbf24',
    Platinum: '#22d3ee',
    Mythic: '#a78bfa',
  }
  return map[league] ?? '#8b5cf6'
}

// ─── League badge emoji ────────────────────────────────────────────────────
export function leagueBadgeEmoji(league?: string | null): string {
  if (!league) return '🏆'
  const map: Record<string, string> = {
    iron: '🔩',
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💠',
    mythic: '💎',
    Iron: '🔩',
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💠',
    Mythic: '💎',
  }
  return map[league] ?? '🏆'
}

// ─── Tier colors ───────────────────────────────────────────────────────────
export function tierColor(tier: string): string {
  const map: Record<string, string> = {
    common: '#9ca3af',
    rare: '#22c55e',
    epic: '#a78bfa',
    legendary: '#fb923c',
    ancient: '#f87171',
    COMMON: '#9ca3af',
    RARE: '#22c55e',
    EPIC: '#a78bfa',
    LEGENDARY: '#fb923c',
    ANCIENT: '#f87171',
  }
  return map[tier] ?? '#9ca3af'
}

// ─── XP formatting ─────────────────────────────────────────────────────────
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(2)}M XP`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K XP`
  return `${xp} XP`
}

// ─── Stat labels ───────────────────────────────────────────────────────────
export function getStatLabel(stat: string): string {
  const map: Record<string, string> = {
    str: 'Strength',
    end: 'Endurance',
    pwr: 'Power',
    spd: 'Speed',
    rec: 'Recovery',
    flex: 'Flexibility',
    strength: 'Strength',
    endurance: 'Endurance',
    power: 'Power',
    speed: 'Speed',
    recovery: 'Recovery',
    flexibility: 'Flexibility',
    oneRepMax: '1RM',
    volume: 'Volume',
    consistency: 'Consistency',
  }
  return map[stat] ?? stat.charAt(0).toUpperCase() + stat.slice(1)
}

// ─── Level progress ────────────────────────────────────────────────────────
export function calculateLevelProgress(xp: number, xpToNext: number): number {
  if (xpToNext <= 0) return 100
  return Math.min(100, Math.max(0, Math.round((xp / xpToNext) * 100)))
}

// ─── Time ago ──────────────────────────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(date)
}

// ─── Format date ───────────────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// ─── League rank class name ─────────────────────────────────────────────────
export function leagueBadgeClass(league?: string | null): string {
  const l = (league ?? '').toLowerCase()
  const map: Record<string, string> = {
    iron: 'badge-iron',
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'badge-platinum',
    mythic: 'badge-mythic',
  }
  return map[l] ?? 'badge-iron'
}

// ─── Rank badge class ──────────────────────────────────────────────────────
export function rankBadgeClass(rank?: string | null): string {
  const r = (rank ?? '').toLowerCase()
  const map: Record<string, string> = {
    iron: 'badge-iron',
    bronze: 'badge-bronze',
    silver: 'badge-silver',
    gold: 'badge-gold',
    platinum: 'badge-platinum',
    mythic: 'badge-mythic',
  }
  return map[r] ?? 'badge-iron'
}

// ─── Number compact ────────────────────────────────────────────────────────
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
