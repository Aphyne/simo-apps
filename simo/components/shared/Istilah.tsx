'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  // Istilah yang ditulis (mis. "ROP", "Service level").
  istilah: string
  // Penjelasan dalam bahasa sehari-hari, satu sampai tiga kalimat.
  arti: string
  // Arah munculnya penjelasan. Bawaan ke bawah: di kepala tabel, ke atas akan menutupi bilah filter di atasnya.
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

// Istilah teknis yang bisa dijelaskan: bergaris titik-titik, bisa difokus dengan keyboard, dan penjelasannya muncul saat
// disorot atau difokus (dibacakan pembaca layar lewat teks sr-only). Tooltip tidak muncul di layar sentuh, jadi arti
// yang penting juga harus tertulis di keterangan di bawah kolom atau di dekatnya.
export default function Istilah({ istilah, arti, side = 'bottom', className }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn('cursor-help rounded-sm underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
          >
            {istilah}
            <span className="sr-only">: {arti}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={6} collisionPadding={12} className="max-w-72 text-pretty">{arti}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
