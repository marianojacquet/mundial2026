import { cn } from '@/lib/utils'

type AlertProps = {
  type?: 'error' | 'success' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
}

export function Alert({ type = 'info', children, className }: AlertProps) {
  const styles = {
    error:   'bg-red-950/50 border-red-800 text-red-300',
    success: 'bg-emerald-950/50 border-emerald-800 text-emerald-300',
    warning: 'bg-amber-950/50 border-amber-800 text-amber-300',
    info:    'bg-sky-950/50 border-sky-800 text-sky-300',
  }
  return (
    <div className={cn('border rounded-lg px-4 py-3 text-sm', styles[type], className)}>
      {children}
    </div>
  )
}
