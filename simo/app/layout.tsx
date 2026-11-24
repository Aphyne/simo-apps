import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { Toaster } from '@/components/ui/sonner'
import { cn } from "@/lib/utils";

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
})

export const metadata: Metadata = {
  title: 'SIMO - Sistem Informasi Manajemen Persediaan Obat',
  description: 'Sistem Informasi Manajemen Persediaan Obat untuk apotek: stok, titik pesan ulang (ROP), jumlah pesan (EOQ), dan kedaluwarsa.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", figtree.variable, "font-sans")}>
      <body className="min-h-full bg-surface-subtle">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
