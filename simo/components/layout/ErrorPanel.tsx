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
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{judul}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{pesan}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {aksi && (
            <button
              type="button"
              onClick={aksi.onClick}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {aksi.label}
            </button>
          )}
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
