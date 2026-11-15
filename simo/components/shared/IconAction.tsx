'use client'

import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type IconActionProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'aria-label'> & {
  // Nama aksi: jadi aria-label dan isi tooltip. Sebut sasarannya ("Ubah Paracetamol 500mg").
  label: string
}

// Tombol ikon di baris tabel: 40px, bertooltip, dan selalu berlabel. Bisa dipakai dengan asChild
// (untuk Link) maupun sebagai pemicu AlertDialog. Tooltip tidak muncul di layar sentuh; aria-label tetap ada.
export default function IconAction({ label, className, children, ...props }: IconActionProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={label} className={cn('size-10 rounded-xl', className)} {...props}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
