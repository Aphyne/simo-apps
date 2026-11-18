'use client'

import { useState } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import Segmented from '@/components/shared/Segmented'
import { FormActions, InputPassword, Opsional, Wajib } from '@/components/shared/FormParts'
import { useCreateUser, useUpdateUser, useDeleteUser, type UserItem } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'
import { PESAN_USERNAME, normalisasiUsername, usernameValid } from '@/lib/username'

// Aturan yang sama dengan backend (userController): password minimal 8 karakter dan tidak boleh sama dengan username;
// email harus berformat sah; akun sendiri tidak bisa dinonaktifkan dan tidak bisa diubah perannya.
const PASSWORD_MIN = 8
const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URUTAN_FIELD = ['nama', 'username', 'password', 'email'] as const

interface FormValues {
  nama: string
  username: string
  password: string
  email: string
  role: 'admin' | 'staf'
  is_active: boolean
}

interface Props {
  // Bila diisi, form mengubah user itu; bila kosong, form menambah user baru.
  initial?: UserItem
  onClose: () => void
}

export default function UserForm({ initial, onClose }: Props) {
  const isEdit = !!initial
  const currentUser = useAuthStore((s) => s.user)
  const isSelf = initial?.id === currentUser?.id

  const create = useCreateUser()
  const update = useUpdateUser()
  const hapus = useDeleteUser()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    // Fokus galat pertama diatur sendiri (fokusGalat) supaya urutannya sama dengan di layar.
    shouldFocusError: false,
    defaultValues: {
      nama: initial?.nama ?? '',
      username: initial?.username ?? '',
      password: '',
      email: initial?.email ?? '',
      role: initial?.role ?? 'staf',
      is_active: initial?.is_active ?? true,
    },
  })
  const role = useWatch({ control, name: 'role' })
  const usernameIsi = useWatch({ control, name: 'username' })
  // Username boleh diubah di form Ubah untuk akun lain (bukan akun sendiri).
  const usernameBisaDiubah = isEdit && !isSelf
  const usernameBerubah = usernameBisaDiubah && normalisasiUsername(usernameIsi) !== initial!.username
  const isActive = useWatch({ control, name: 'is_active' })

  const [buangTerbuka, setBuangTerbuka] = useState(false)
  const [hapusTerbuka, setHapusTerbuka] = useState(false)

  // Menutup dialog yang isiannya sudah diubah meminta konfirmasi dulu (juga lewat Esc, X, dan klik di luar).
  function mintaTutup() {
    if (isDirty) setBuangTerbuka(true)
    else onClose()
  }

  async function simpan(data: FormValues) {
    clearErrors('root.server')
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: initial!.id,
          // Hanya dikirim bila benar-benar diubah (akun sendiri tidak; username lama yang tidak sesuai format baru tetap aman).
          username: usernameBerubah ? normalisasiUsername(data.username) : undefined,
          nama: data.nama.trim(),
          role: data.role,
          // Akun sendiri tidak boleh dinonaktifkan: status tidak dikirim dari form akun sendiri.
          is_active: isSelf ? true : data.is_active,
          email: data.email.trim() || undefined,
        })
      } else {
        await create.mutateAsync({
          username: normalisasiUsername(data.username),
          password: data.password,
          nama: data.nama.trim(),
          role: data.role,
          email: data.email.trim() || undefined,
        })
      }
      onClose()
    } catch (err) {
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Data belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: FieldErrors<FormValues>) {
    const pertama = URUTAN_FIELD.find((k) => galat[k])
    if (!pertama) return
    const el = document.getElementById(pertama)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  async function hapusAkun() {
    try {
      await hapus.mutateAsync(initial!.id)
      onClose()
    } catch {
      setHapusTerbuka(false) // pesan servernya sudah tampil lewat toast
    }
  }

  const adaTransaksi = (initial?.jumlah_transaksi ?? 0) > 0

  return (
    <Dialog open onOpenChange={(o) => { if (!o) mintaTutup() }}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto p-5 sm:max-w-md">
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-lg font-semibold">{isEdit ? 'Ubah user' : 'Tambah user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? <>Akun <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{initial!.username}</span>{isSelf && ', akun yang sedang Anda pakai'}</>
              : 'Akun baru bisa langsung masuk dengan username dan password ini.'}
          </DialogDescription>
        </DialogHeader>

        {/* noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban. */}
        <form onSubmit={handleSubmit(simpan, fokusGalat)} noValidate className="space-y-5">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
          </p>

          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.nama}>
              <FieldLabel htmlFor="nama">Nama lengkap <Wajib /></FieldLabel>
              <Input
                id="nama"
                placeholder="Contoh: Budi Santoso"
                autoComplete="off"
                aria-required="true"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'nama-error' : undefined}
                className="h-10 rounded-xl"
                {...register('nama', { validate: (v) => !!v.trim() || 'Nama lengkap wajib diisi' })}
              />
              <FieldError id="nama-error">{errors.nama?.message}</FieldError>
            </Field>

            {(!isEdit || usernameBisaDiubah) && (
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username <Wajib /></FieldLabel>
                <Input
                  id="username"
                  placeholder="Contoh: budi123"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-required="true"
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'username-error' : 'username-hint'}
                  className="h-10 rounded-xl font-mono"
                  {...register('username', { validate: (v) => (isEdit && normalisasiUsername(v) === initial!.username) || usernameValid(v) || PESAN_USERNAME })}
                />
                {errors.username ? (
                  <FieldError id="username-error">{errors.username.message}</FieldError>
                ) : usernameBerubah ? (
                  <FieldDescription id="username-hint" className="font-medium text-foreground">
                    User harus masuk dengan username baru ini. Riwayat transaksinya tidak berubah.
                  </FieldDescription>
                ) : (
                  <FieldDescription id="username-hint">Dipakai untuk masuk. Huruf besar dan kecil dibedakan.</FieldDescription>
                )}
              </Field>
            )}

            {!isEdit && (
              <>
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password <Wajib /></FieldLabel>
                  <InputPassword
                    id="password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: { value: PASSWORD_MIN, message: `Password minimal ${PASSWORD_MIN} karakter` },
                      validate: (v) => v.toLowerCase() !== getValues('username').trim().toLowerCase() || 'Password tidak boleh sama dengan username',
                    })}
                  />
                  {errors.password ? (
                    <FieldError id="password-error">{errors.password.message}</FieldError>
                  ) : (
                    <FieldDescription id="password-hint">Minimal {PASSWORD_MIN} karakter dan tidak sama dengan username.</FieldDescription>
                  )}
                </Field>
              </>
            )}

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email Google <Opsional /></FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="contoh@gmail.com"
                autoComplete="off"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                className="h-10 rounded-xl"
                {...register('email', { validate: (v) => !v.trim() || FORMAT_EMAIL.test(v.trim()) || 'Format email belum benar, contoh: nama@gmail.com' })}
              />
              {errors.email ? (
                <FieldError id="email-error">{errors.email.message}</FieldError>
              ) : (
                <FieldDescription id="email-hint">Isi bila user ingin masuk dengan Google.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Peran <Wajib /></FieldLabel>
              <PilihanCombobox
                id="role"
                options={[{ value: 'staf', label: 'Staf' }, { value: 'admin', label: 'Admin' }]}
                value={role}
                onChange={(v) => setValue('role', v as 'admin' | 'staf', { shouldDirty: true })}
                noun="peran"
                disabled={isSelf}
                aria-describedby="role-hint"
              />
              <FieldDescription id="role-hint">
                {isSelf ? 'Peran akun sendiri tidak bisa diubah. ' : ''}Admin: akses penuh. Staf: hanya mencatat transaksi.
              </FieldDescription>
            </Field>

            {/* Status akun hanya di form Ubah dan tidak untuk akun sendiri (tidak boleh menonaktifkan diri sendiri). */}
            {isEdit && !isSelf && (
              <Field>
                <FieldLabel id="status-label">Status akun</FieldLabel>
                <Segmented
                  label="Status akun"
                  value={isActive ? 'aktif' : 'nonaktif'}
                  options={[{ value: 'aktif', label: 'Aktif' }, { value: 'nonaktif', label: 'Non-aktif' }]}
                  onChange={(v) => setValue('is_active', v === 'aktif', { shouldDirty: true })}
                  className="w-full [&>button]:flex-1"
                />
                <FieldDescription>User non-aktif tidak bisa masuk, tetapi riwayat transaksinya tetap ada.</FieldDescription>
              </Field>
            )}
          </FieldGroup>

          {/* Gagal menyimpan: pesan dari server tetap tampil sampai dicoba lagi (toast hilang sendiri) */}
          {errors.root?.server?.message && (
            <FieldError className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
          )}

          <FormActions>
            <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={mintaTutup}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 min-w-32 rounded-xl px-4">
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan perubahan' : 'Tambah user'}
            </Button>
          </FormActions>
        </form>

        {/* Hapus akun permanen: hanya di Ubah, bukan akun sendiri. Yang punya transaksi tidak bisa dihapus. */}
        {isEdit && !isSelf && (
          <section aria-label="Hapus akun" className="border-t pt-4">
            {adaTransaksi ? (
              <p className="text-sm text-muted-foreground">
                Akun ini tidak bisa dihapus karena punya {initial!.jumlah_transaksi} transaksi. Nonaktifkan saja bila tidak dipakai lagi.
              </p>
            ) : (
              <Button type="button" variant="ghost" className="-ml-2 h-10 rounded-xl px-2 text-destructive hover:text-destructive" onClick={() => setHapusTerbuka(true)}>
                Hapus akun ini
              </Button>
            )}
          </section>
        )}

        <AlertDialog open={hapusTerbuka} onOpenChange={setHapusTerbuka}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus akun {initial?.nama}?</AlertDialogTitle>
              <AlertDialogDescription>Akun dihapus permanen dan tidak bisa dikembalikan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={hapus.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); void hapusAkun() }} disabled={hapus.isPending} className="bg-destructive text-white hover:bg-destructive/90">
                {hapus.isPending ? 'Menghapus...' : 'Ya, hapus permanen'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={onClose} />
      </DialogContent>
    </Dialog>
  )
}
