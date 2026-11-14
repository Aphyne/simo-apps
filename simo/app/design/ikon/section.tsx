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

// Semua ikon lucide-react yang dipakai di aplikasi (hasil grep ke components/ dan app/).
const ALL_ICONS: Record<string, LucideIcon> = {
  Activity, AlertTriangle, ArrowLeft, ArrowLeftRight, Bell, Calculator, CalendarDays,
  CalendarX, ChevronDown, ChevronLeft, ChevronUp, Clock, DollarSign, Download, Eye,
  FileSpreadsheet, FileText, FlaskConical, HelpCircle, Info, KeyRound, LayoutDashboard,
  Lock, LogOut, MapPin, MessageCircle, Package, PackageMinus, PackagePlus, Pencil, Phone,
  Pill, Plus, PlusCircle, RefreshCw, Save, Search, Settings, ShoppingCart, ToggleLeft,
  ToggleRight, Trash2, TrendingDown, TrendingUp, Truck, UserCheck, UserX, Users, X,
}

const UKURAN: [string, string][] = [
  ['size-3.5', '14px, di dalam badge dan tombol kecil'],
  ['size-4', '16px, di dalam tombol dan label'],
  ['size-5', '20px, di dalam menu dan header'],
  ['size-6', '24px, keadaan kosong'],
]

export function IkonSection() {
  return (
    <section id="ikon">
      <PageHeader
        title="Ikon"
        desc="Hanya Lucide (lucide-react), garis 2px, satu warna mengikuti teks. Tidak ada kotak berwarna di belakang ikon dan tidak ada emoji. Ikon tanpa teks wajib punya aria-label."
      />

      <Section title={`Ikon yang dipakai (${Object.keys(ALL_ICONS).length})`} meta="lucide-react · stroke-width 2">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {Object.entries(ALL_ICONS).map(([name, Icon]) => (
            <div key={name} className="flex flex-col items-center gap-1.5 rounded-md p-2 transition-colors hover:bg-accent">
              <Icon className="size-5 text-foreground" aria-hidden="true" />
              <span className="break-all text-center text-xs leading-tight text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Ukuran" meta="size-{3.5, 4, 5, 6}">
        <div className="flex flex-wrap items-end gap-8">
          {UKURAN.map(([kelas, ket]) => (
            <div key={kelas} className="flex flex-col items-center gap-1.5 text-center">
              <Pill className={`${kelas} text-foreground`} aria-hidden="true" />
              <span className="font-mono text-xs text-muted-foreground">{kelas}</span>
              <span className="max-w-28 text-xs text-muted-foreground">{ket}</span>
            </div>
          ))}
        </div>
      </Section>
    </section>
  )
}
