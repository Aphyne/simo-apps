'use client'

import { useMemo, useState } from 'react'
import { KeyRound, Pencil, Plus, SearchX, ShieldCheck, UserPlus, UserX, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { StatTile } from '@/components/dashboard/StatTile'
import Panel from '@/components/dashboard/Panel'
import PageHeader from '@/components/shared/PageHeader'
import { FilterBar, SearchField } from '@/components/shared/FilterBar'
import { TabelData, type KolomData } from '@/components/shared/TabelData'
import { useCariTertunda, useFilterUrl } from '@/components/shared/useFilterUrl'
import IconAction from '@/components/shared/IconAction'
import UserForm from '@/components/users/UserForm'
import ResetPasswordModal from '@/components/users/ResetPasswordModal'
import { useToggleAktif, useUserList, type UserItem } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'
import { cn, formatTanggal } from '@/lib/utils'

const PERAN = ['admin', 'staf'] as const
const STATUS = ['aktif', 'nonaktif'] as const

// Kolom tampil bertahap menurut lebar konten (sidebar 256px muncul mulai lg): selalu User dan Aksi; md Peran dan Status
// (di bawah md ikut di bawah nama); xl Email dan Terdaftar; 2xl Transaksi.
const KOLOM = {
  peran: 'hidden md:table-cell',
  status: 'hidden md:table-cell',
  email: 'hidden xl:table-cell',
  terdaftar: 'hidden xl:table-cell',
  transaksi: 'hidden 2xl:table-cell',
}

function BadgePeran({ peran }: { peran: UserItem['role'] }) {
  return <Badge variant={peran === 'admin' ? 'secondary' : 'outline'}>{peran === 'admin' ? 'Admin' : 'Staf'}</Badge>
}

export default function UserTable() {
  const { data: users = [], isLoading, isError, refetch } = useUserList()
  const toggleAktif = useToggleAktif()
  const currentUser = useAuthStore((s) => s.user)

  const [formTambah, setFormTambah] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [resetUser, setResetUser] = useState<UserItem | null>(null)
  // Menonaktifkan membuat user tidak bisa masuk, jadi diminta konfirmasi dulu. Mengaktifkan kembali langsung.
  const [konfirmasiNonaktif, setKonfirmasiNonaktif] = useState<UserItem | null>(null)

  // Kata kunci, peran, status, dan halaman disimpan di URL (?q=&peran=&status=&hal=). Nilai yang tidak dikenal diabaikan.
  const { sp, ubahParam } = useFilterUrl()
  const search = sp.get('q') ?? ''
  const peranUrl = sp.get('peran') ?? ''
  const peran = (PERAN as readonly string[]).includes(peranUrl) ? peranUrl : ''
  const statusUrl = sp.get('status') ?? ''
  const status = (STATUS as readonly string[]).includes(statusUrl) ? statusUrl : ''
  const halaman = Math.max(1, parseInt(sp.get('hal') ?? '1', 10) || 1)
  const [cari, setCari] = useCariTertunda(search, ubahParam)

  const tampil = useMemo(() => {
    const kata = search.trim().toLowerCase()
    return users.filter((u) => {
      const cocokKata = !kata || u.nama.toLowerCase().includes(kata) || u.username.toLowerCase().includes(kata)
      const cocokPeran = !peran || u.role === peran
      const cocokStatus = !status || (status === 'aktif' ? u.is_active : !u.is_active)
      return cocokKata && cocokPeran && cocokStatus
    })
  }, [users, search, peran, status])

  const adaFilter = search.trim() !== '' || peran !== '' || status !== ''
  function aturUlang() {
    setCari('')
    ubahParam({ q: null, peran: null, status: null })
  }

  // Status akun berupa saklar berlabel: menunjukkan keadaan SEKALIGUS jelas bisa diubah (hijau aktif, abu non-aktif; hijau di sini
  // pengecualian atas aturan v2, permintaan Boss). Tulisan Aktif/Non-aktif selalu ada, jadi warna tidak sendirian.
  // Akun sendiri tidak bisa dinonaktifkan (backend menolaknya), jadi saklarnya mati.
  const saklarStatus = (u: UserItem) => {
    const diriSendiri = u.id === currentUser?.id
    const lagiUbah = toggleAktif.isPending && toggleAktif.variables === u.id
    return (
      <span className="inline-flex items-center gap-2" title={diriSendiri ? 'Akun yang sedang dipakai tidak bisa dinonaktifkan' : undefined}>
        <Switch
          checked={u.is_active}
          disabled={diriSendiri || lagiUbah}
          aria-label={`Status akun ${u.nama}`}
          onCheckedChange={(menyala) => (menyala ? toggleAktif.mutate(u.id) : setKonfirmasiNonaktif(u))}
        />
        <span className={cn('text-sm font-medium', u.is_active ? 'text-success-700' : 'text-muted-foreground')}>{u.is_active ? 'Aktif' : 'Non-aktif'}</span>
      </span>
    )
  }

  // Ringkasan. Data gagal dimuat tampil "-", bukan 0. Jumlah akun seluruhnya ada di lencana panel dan keterangan ubin pertama.
  const aktif = users.filter((u) => u.is_active).length
  const adminAktif = users.filter((u) => u.is_active && u.role === 'admin').length
  const nonAktif = users.length - aktif
  const angka = (n: number) => (isError ? null : n)

  const kolom: KolomData<UserItem>[] = [
    {
      id: 'user', judul: 'User', skeleton: ['w-40', 'w-24'],
      sel: (u) => (
        <>
          <span className={u.is_active ? 'font-medium text-foreground' : 'font-medium text-muted-foreground'}>{u.nama}</span>
          {u.id === currentUser?.id && <Badge variant="outline" className="ml-2 align-middle">Akun Anda</Badge>}
          <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{u.username}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
            <BadgePeran peran={u.role} />
            {saklarStatus(u)}
          </span>
        </>
      ),
    },
    { id: 'peran', judul: 'Peran', kelas: KOLOM.peran, skeleton: 'w-16', sel: (u) => <BadgePeran peran={u.role} /> },
    { id: 'status', judul: 'Status', kelas: KOLOM.status, skeleton: 'w-28', sel: (u) => saklarStatus(u) },
    {
      id: 'email', judul: 'Email Google', kelas: KOLOM.email, skeleton: 'w-40',
      sel: (u) => (u.email ? <span className="block max-w-[14rem] truncate" title={u.email}>{u.email}</span> : <span className="text-muted-foreground">-</span>),
    },
    { id: 'terdaftar', judul: 'Terdaftar', kelas: KOLOM.terdaftar, skeleton: 'w-24', sel: (u) => <span className="whitespace-nowrap">{formatTanggal(u.created_at)}</span> },
    { id: 'transaksi', judul: 'Transaksi', kanan: true, kelas: KOLOM.transaksi, skeleton: 'w-10', sel: (u) => <span className="tabular-nums">{u.jumlah_transaksi}</span> },
    {
      id: 'aksi', judul: <span className="sr-only">Aksi</span>, kanan: true, aksi: true, skeleton: 'w-28',
      sel: (u) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconAction label={`Ubah ${u.nama}`} onClick={() => setEditUser(u)}><Pencil /></IconAction>
          <IconAction label={`Reset password ${u.nama}`} onClick={() => setResetUser(u)}><KeyRound /></IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
      <PageHeader
        className="col-span-12"
        title="Manajemen user"
        description="Akun yang bisa masuk ke SIMO beserta perannya. Admin mengelola semuanya; staf hanya mencatat transaksi."
      />

      <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile compact icon={Users} label="Akun aktif" value={angka(aktif)} sublabel={`dari ${users.length} akun`} isLoading={isLoading} />
        <StatTile compact icon={ShieldCheck} label="Admin aktif" value={angka(adminAktif)} sublabel="akses penuh" isLoading={isLoading} />
        <StatTile
          compact
          icon={UserX}
          label="Non-aktif"
          value={angka(nonAktif)}
          sublabel={nonAktif > 0 ? 'tidak bisa masuk' : 'semua akun aktif'}
          isLoading={isLoading}
          onSelect={nonAktif > 0 ? () => ubahParam({ status: status === 'nonaktif' ? null : 'nonaktif' }) : undefined}
          selected={status === 'nonaktif'}
        />
      </div>

      <Panel title="Daftar user" count={isLoading || isError ? undefined : tampil.length} className="col-span-12" bodyClassName="px-0 pb-0">
        <FilterBar className="grid grid-cols-2 px-5 pb-4 sm:flex sm:flex-wrap">
          <SearchField
            className="col-span-2 sm:col-span-1 sm:max-w-[18rem]"
            label="Cari user"
            placeholder="Cari nama atau username"
            value={cari}
            onChange={setCari}
          />
          <PilihanCombobox
            aria-label="Filter peran"
            className="sm:w-40"
            options={[{ value: '', label: 'Semua peran' }, { value: 'admin', label: 'Admin' }, { value: 'staf', label: 'Staf' }]}
            value={peran}
            onChange={(v) => ubahParam({ peran: v || null })}
            noun="peran"
          />
          <PilihanCombobox
            aria-label="Filter status"
            className="sm:w-40"
            options={[{ value: '', label: 'Semua status' }, { value: 'aktif', label: 'Aktif' }, { value: 'nonaktif', label: 'Non-aktif' }]}
            value={status}
            onChange={(v) => ubahParam({ status: v || null })}
            noun="status"
          />
          {adaFilter && (
            <Button variant="ghost" size="lg" className="col-span-2 h-10 rounded-xl px-3 text-muted-foreground sm:col-span-1" onClick={aturUlang}>
              Atur ulang
            </Button>
          )}
          <Button size="lg" className="col-span-2 h-10 rounded-xl px-4 sm:col-span-1 sm:ml-auto" onClick={() => setFormTambah(true)}>
            <Plus data-icon="inline-start" />
            Tambah user
          </Button>
        </FilterBar>

        <TabelData
          kolom={kolom}
          baris={tampil}
          kunci={(u) => u.id}
          isLoading={isLoading}
          isError={isError}
          onCobaLagi={() => refetch()}
          judulGagal="Daftar user belum bisa dimuat"
          keteranganGagal="Ini bukan berarti belum ada user. Periksa koneksi, lalu coba lagi."
          kosong={{
            icon: adaFilter ? SearchX : UserPlus,
            judul: adaFilter ? 'Tidak ada user yang cocok' : 'Belum ada user',
            keterangan: adaFilter ? 'Ubah kata kunci atau lepas filter.' : 'Tambahkan akun untuk admin atau staf apotek.',
            aksi: adaFilter
              ? <Button variant="outline" size="lg" className="h-10 rounded-xl px-4" onClick={aturUlang}>Atur ulang filter</Button>
              : <Button size="lg" className="h-10 rounded-xl px-4" onClick={() => setFormTambah(true)}><Plus data-icon="inline-start" />Tambah user</Button>,
          }}
          halaman={halaman}
          onHalaman={(n) => ubahParam({ hal: n > 1 ? String(n) : null }, { resetHalaman: false })}
          barisSkeleton={5}
          noun="user"
        />
      </Panel>

      <AlertDialog open={konfirmasiNonaktif !== null} onOpenChange={(o) => { if (!o) setKonfirmasiNonaktif(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan {konfirmasiNonaktif?.nama}?</AlertDialogTitle>
            <AlertDialogDescription>User ini tidak bisa masuk sampai diaktifkan kembali. Riwayat transaksinya tetap ada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (konfirmasiNonaktif) toggleAktif.mutate(konfirmasiNonaktif.id) }}>Nonaktifkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {formTambah && <UserForm onClose={() => setFormTambah(false)} />}
      {editUser && <UserForm initial={editUser} onClose={() => setEditUser(null)} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
    </div>
  )
}
