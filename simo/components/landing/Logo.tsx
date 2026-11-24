import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Tautan ke tiap bagian halaman depan (dipakai navbar dan footer).
export const TAUTAN_BAGIAN = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#demo', label: 'Demo' },
  { href: '#tanya-jawab', label: 'Tanya jawab' },
] as const

export function Logo({ className, gelap }: { className?: string; gelap?: boolean }) {
  return (
    <Link href="/" aria-label="SIMO, ke awal halaman" className={cn('flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}>
      <Image src="/logo.png" alt="" width={32} height={32} className="size-8" />
      <span className={cn('text-[17px] font-semibold tracking-tight', gelap ? 'text-white' : 'text-foreground')}>SIMO</span>
    </Link>
  )
}
