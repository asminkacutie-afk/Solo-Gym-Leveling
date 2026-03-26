import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, glow, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-background-border bg-background-card',
        glow && 'shadow-purple-glow border-purple-600/40',
        hover && 'transition-all duration-200 hover:border-purple-600/50 hover:shadow-purple-glow cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 border-b border-background-border', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-white font-semibold text-base', className)}>
      {children}
    </h3>
  )
}
