"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Tab v2: pil datar tanpa garis, sama dengan item menu sidebar (aktif = putih di atas kanvas, tebal).
// Radix menangani role tablist/tab/tabpanel, panah kiri-kanan, Home, dan End.
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex items-center gap-1 overflow-x-auto", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium whitespace-nowrap text-foreground/70 outline-none transition-colors hover:bg-card/60 focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex flex-col gap-4 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
