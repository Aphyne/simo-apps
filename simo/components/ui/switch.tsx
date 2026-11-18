"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Saklar dua keadaan. Hijau saat menyala, abu saat mati (dipakai untuk status akun, lihat halaman Manajemen user). Role switch, bisa digeser dengan Spasi, dan keadaannya dibaca pembaca layar.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-success-600 data-[state=unchecked]:bg-muted-foreground/60",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
