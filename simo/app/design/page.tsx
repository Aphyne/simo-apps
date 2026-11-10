import { WarnaSection } from './warna/section'
import { TipografiSection } from './tipografi/section'
import { RadiusElevasiSection } from './radius-elevasi/section'
import { IkonSection } from './ikon/section'
import { ButtonSection } from './button/section'
import { FormSection } from './form/section'
import { DropdownMenuSection } from './dropdown-menu/section'
import { FeedbackSection } from './feedback/section'
import { OverlaySection } from './overlay/section'
import { NavigasiSection } from './navigasi/section'
import { TabelSection } from './tabel/section'
import { ChartSection } from './chart/section'
import { MotionSection } from './motion/section'
import { ProgresSection } from './progres/section'
import { VERSI_DESIGN, PANDUAN_PATH } from './_components'

export default function DesignPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-2xl font-bold text-fg">SIMO Design System</h1>
        <p className="text-sm text-fg-muted mt-1 max-w-2xl">
          Satu sumber untuk semua tampilan: ubah token di globals.css, komponen di components/ui. Halaman ini memperlihatkan token warna, tipografi, dan pola komponen yang dipakai di seluruh aplikasi SIMO. Referensi internal, bukan bagian dari alur user.
        </p>
        <p className="text-xs text-fg-muted mt-2 font-mono">{VERSI_DESIGN} · Panduan tertulis: {PANDUAN_PATH}</p>
      </div>

      <WarnaSection />
      <TipografiSection />
      <RadiusElevasiSection />
      <MotionSection />
      <IkonSection />
      <ButtonSection />
      <FormSection />
      <DropdownMenuSection />
      <FeedbackSection />
      <OverlaySection />
      <NavigasiSection />
      <TabelSection />
      <ChartSection />
      <ProgresSection />
    </div>
  )
}
