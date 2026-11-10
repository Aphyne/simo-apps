import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

// Panel kesalahan satu-halaman, dipakai error.tsx dan not-found.tsx (gaya kartu putih
// sesuai docs/FE-AGENT.md: kartu putih, ikon dalam lingkaran tint, tombol utama biru).
export default function ErrorPanel({
  judul,
  pesan,
  aksi,
}: {
  judul: string
  pesan: string
  aksi?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
          <AlertTriangle className="h-6 w-6 text-danger-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-fg">{judul}</h1>
        <p className="mt-1.5 text-sm text-fg-muted">{pesan}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {aksi && (
            <button
              type="button"
              onClick={aksi.onClick}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-fg-inverse hover:bg-brand-700"
            >
              {aksi.label}
            </button>
          )}
          <Link
            href="/dashboard"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-fg-tertiary hover:bg-surface-muted"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
