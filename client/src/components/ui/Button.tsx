import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white border border-purple-500 shadow-purple-glow hover:shadow-purple-500/50',
  secondary:
    'bg-background-secondary hover:bg-background-card text-gray-200 border border-background-border hover:border-purple-600/50',
  ghost:
    'bg-transparent hover:bg-background-secondary text-gray-300 hover:text-white border border-transparent',
  danger:
    'bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-700/50 hover:border-red-500',
  gold:
    'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-black font-bold border border-yellow-400/50 shadow-gold-glow',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
