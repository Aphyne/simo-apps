import {
  Activity, AlertTriangle, ArrowLeft, ArrowLeftRight, Bell, Calculator, CalendarDays,
  CalendarX, ChevronDown, ChevronLeft, ChevronUp, Clock, DollarSign, Download, Eye,
  FileSpreadsheet, FileText, FlaskConical, HelpCircle, Info, KeyRound, LayoutDashboard,
  Lock, LogOut, MapPin, MessageCircle, Package, PackageMinus, PackagePlus, Pencil, Phone,
  Pill, Plus, PlusCircle, RefreshCw, Save, Search, Settings, ShoppingCart, ToggleLeft,
  ToggleRight, Trash2, TrendingDown, TrendingUp, Truck, UserCheck, UserX, Users, X,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader, Section } from '../_components'

// Semua ikon lucide-react yang benar-benar dipakai di aplikasi (hasil grep
// langsung ke components/ + app/, bukan daftar tebakan).
const ALL_ICONS: Record<string, LucideIcon> = {
  Activity, AlertTriangle, ArrowLeft, ArrowLeftRight, Bell, Calculator, CalendarDays,
  CalendarX, ChevronDown, ChevronLeft, ChevronUp, Clock, DollarSign, Download, Eye,
  FileSpreadsheet, FileText, FlaskConical, HelpCircle, Info, KeyRound, LayoutDashboard,
  Lock, LogOut, MapPin, MessageCircle, Package, PackageMinus, PackagePlus, Pencil, Phone,
  Pill, Plus, PlusCircle, RefreshCw, Save, Search, Settings, ShoppingCart, ToggleLeft,
  ToggleRight, Trash2, TrendingDown, TrendingUp, Truck, UserCheck, UserX, Users, X,
}

export function IkonSection() {
  return (
    <section id="ikon">
      <PageHeader title="Ikon" desc="Library: lucide-react. Semua ikon di bawah ini benar-benar dipakai di aplikasi (bukan daftar tebakan) — hasil pencarian langsung ke seluruh folder components/ dan app/." />

      <Section title={`Semua ikon dipakai (${Object.keys(ALL_ICONS).length})`} meta="stroke-width: 2">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {Object.entries(ALL_ICONS).map(([name, Icon]) => (
            <div key={name} className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Icon className="w-5 h-5 text-gray-700" />
              <span className="text-[10px] text-gray-500 text-center leading-tight break-all">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Ukuran">
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-gray-700" />
            <span className="text-[11px] text-gray-400 font-mono">w-3.5 (14px)</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Pill className="w-4 h-4 text-gray-700" />
            <span className="text-[11px] text-gray-400 font-mono">w-4 (16px)</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Pill className="w-5 h-5 text-gray-700" />
            <span className="text-[11px] text-gray-400 font-mono">w-5 (20px) — StatCard</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Pill className="w-6 h-6 text-gray-700" />
            <span className="text-[11px] text-gray-400 font-mono">w-6 (24px) — featured</span>
          </div>
        </div>
      </Section>
    </section>
  )
}
