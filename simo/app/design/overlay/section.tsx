import { X } from 'lucide-react'
import { PageHeader, Section } from '../_components'

export function OverlaySection() {
  return (
    <section id="overlay">
      <PageHeader title="Overlay" desc="Dialog untuk form/konfirmasi yang butuh fokus. Backdrop hitam 50% opacity, modal putih rounded-xl." />

      <Section title="Modal form" meta="ResetPasswordModal.tsx">
        <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Reset Password</h2>
              <button className="rounded-lg p-1.5 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Reset password untuk <span className="font-semibold text-gray-700">Staf Apotek</span></p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password Baru</label>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Minimal 6 karakter" readOnly />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm">Batal</button>
                <button className="bg-red-600 text-white font-medium rounded-lg px-4 py-2 text-sm">Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Dialog konfirmasi" meta="ConfirmDialog.tsx — aksi destruktif (hapus)">
        <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center">
          <div className="w-full max-w-xs rounded-xl bg-white shadow-2xl p-5 text-center">
            <p className="text-sm font-semibold text-gray-900 mb-1">Hapus Supplier?</p>
            <p className="text-xs text-gray-500 mb-4">Supplier yang masih digunakan oleh obat tidak bisa dihapus.</p>
            <div className="flex justify-center gap-2">
              <button className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm">Batal</button>
              <button className="bg-red-600 text-white font-medium rounded-lg px-4 py-2 text-sm">Hapus</button>
            </div>
          </div>
        </div>
      </Section>
    </section>
  )
}
