import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Clock, ChevronRight } from 'lucide-react'
import { exercises } from '../../lib/api'
import type { Exercise } from '../../lib/api'
import { cn, disciplineColor, disciplineIcon } from '../../lib/utils'

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void
  recentExercises?: Exercise[]
}

const DEBOUNCE_MS = 300

export default function ExerciseSearch({ onSelect, recentExercises = [] }: ExerciseSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    exercises
      .search(q, 10)
      .then((res) => {
        setResults(res)
        setHighlightedIndex(-1)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayList = query.trim() ? results : recentExercises

  const handleSelect = (ex: Exercise) => {
    onSelect(ex)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || displayList.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, displayList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && displayList[highlightedIndex]) {
        handleSelect(displayList[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          className="dark-input pl-9"
          placeholder="Search exercises (bench press, squat...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (displayList.length > 0 || (!query && recentExercises.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background-card border border-background-border rounded-xl shadow-card-glow z-50 overflow-hidden max-h-72 overflow-y-auto">
          {!query && recentExercises.length > 0 && (
            <div className="px-3 py-2 border-b border-background-border">
              <p className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold uppercase tracking-widest">
                <Clock size={10} />
                Recent
              </p>
            </div>
          )}

          {displayList.map((ex, i) => {
            const color = disciplineColor(ex.discipline)
            const icon = disciplineIcon(ex.discipline)
            return (
              <button
                key={ex.id}
                onMouseDown={() => handleSelect(ex)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  i === highlightedIndex
                    ? 'bg-purple-500/15'
                    : 'hover:bg-background-secondary',
                )}
              >
                {/* Discipline icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: color + '25' }}
                >
                  {icon}
                </div>

                {/* Name + muscles */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{ex.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {ex.primaryMuscles?.join(', ')}
                    {ex.equipment && ` · ${ex.equipment}`}
                  </p>
                </div>

                {/* Discipline tag */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color,
                    backgroundColor: color + '20',
                  }}
                >
                  {ex.discipline}
                </span>

                <ChevronRight size={12} className="text-gray-600 shrink-0" />
              </button>
            )
          })}

          {query && !loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              No exercises found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
