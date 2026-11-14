'use client'

import { ChevronDown, KeyRound, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, Section } from '../_components'

export function DropdownMenuSection() {
  return (
    <section id="dropdown-menu">
      <PageHeader
        title="Menu"
        desc="Dropdown dan Select shadcn. Item aktif atau yang disorot memakai biru lembut (accent). Menu melayang di atas halaman, jadi hanya menu yang boleh memakai bayangan."
      />

      <Section title="Dropdown profil" desc="Klik tombol untuk membuka. Tombol ini memakai pola yang sama dengan menu profil di header." meta="DropdownMenu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
              <UserRound data-icon="inline-start" />
              Admin Apotek
              <ChevronDown data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">Admin Apotek</p>
              <p className="text-xs text-muted-foreground">@admin</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <KeyRound />
              Ganti password
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="Select filter" meta="Select">
        <Select defaultValue="semua">
          <SelectTrigger className="w-52" aria-label="Filter kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua kategori</SelectItem>
            <SelectItem value="analgesik">Analgesik</SelectItem>
            <SelectItem value="antibiotik">Antibiotik</SelectItem>
          </SelectContent>
        </Select>
      </Section>
    </section>
  )
}
