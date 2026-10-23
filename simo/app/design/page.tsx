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

export default function DesignPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SIMO Design System</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Satu sumber untuk semua tampilan — token warna, tipografi, dan pola komponen yang dipakai di seluruh aplikasi SIMO. Halaman ini referensi internal, bukan bagian dari alur user.
        </p>
      </div>

      <WarnaSection />
      <TipografiSection />
      <RadiusElevasiSection />
      <IkonSection />
      <ButtonSection />
      <FormSection />
      <DropdownMenuSection />
      <FeedbackSection />
      <OverlaySection />
      <NavigasiSection />
      <TabelSection />
      <ChartSection />
    </div>
  )
}
