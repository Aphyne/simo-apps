import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  warna: 'blue' | 'red' | 'green' | 'orange' | 'purple'
}

const warnaMap = {
  blue:   { iconBg: 'bg-blue-100',    iconColor: 'text-blue-600' },
  red:    { iconBg: 'bg-red-100',     iconColor: 'text-red-500' },
  green:  { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  orange: { iconBg: 'bg-orange-100',  iconColor: 'text-orange-500' },
  purple: { iconBg: 'bg-purple-100',  iconColor: 'text-purple-600' },
}

export default function StatCard({ label, value, sublabel, icon: Icon, warna }: StatCardProps) {
  const w = warnaMap[warna]
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${w.iconBg}`}>
        <Icon className={`w-5 h-5 ${w.iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold leading-tight text-gray-900">{value}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
