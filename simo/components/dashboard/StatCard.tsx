import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  warna: 'blue' | 'red' | 'green' | 'orange' | 'purple'
  featured?: boolean
}

const warnaMap = {
  blue:   { iconBg: 'bg-brand-100',    iconColor: 'text-brand-600' },
  red:    { iconBg: 'bg-danger-100',     iconColor: 'text-danger-500' },
  green:  { iconBg: 'bg-success-100', iconColor: 'text-success-600' },
  orange: { iconBg: 'bg-warning-100',  iconColor: 'text-warning-500' },
  purple: { iconBg: 'bg-purple-100',  iconColor: 'text-purple-600' },
}

export default function StatCard({ label, value, sublabel, icon: Icon, warna, featured }: StatCardProps) {
  if (featured) {
    return (
      <div className="rounded-xl bg-brand-600 p-5 shadow-md flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-fg-inverse" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-brand-100 font-medium truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight text-fg-inverse">{value}</p>
          {sublabel && <p className="text-xs text-brand-200 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    )
  }

  const w = warnaMap[warna]
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${w.iconBg}`}>
        <Icon className={`w-5 h-5 ${w.iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted font-medium truncate">{label}</p>
        <p className="text-2xl font-bold leading-tight text-fg">{value}</p>
        {sublabel && <p className="text-xs text-fg-muted mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
