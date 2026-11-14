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
    <div className="space-y-20 [&>section]:scroll-mt-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Design system SIMO</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Satu biru untuk aksi dan data, satu slate untuk yang lain. Halaman ini memperlihatkan token, huruf, dan komponen shadcn yang dipakai, semuanya hidup dan dibaca langsung dari CSS.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {VERSI_DESIGN}. Panduan tertulis: <code className="font-mono text-xs">{PANDUAN_PATH}</code>
        </p>
      </header>

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
