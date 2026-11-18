'use client'

import { useEffect } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import PilihanCombobox from '@/components/ui/PilihanCombobox'
import { FormSection, InputSatuan } from '@/components/shared/FormParts'
import Istilah from '@/components/shared/Istilah'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { useCegatPindah } from '@/components/shared/useCegatPindah'
import { useUpdatePengaturan, type PengaturanData } from '@/hooks/usePengaturan'
import { SERVICE_LEVEL_OPTIONS } from '@/lib/constants'

// Nilai form selalu teks (sama dengan yang dikirim ke API). Batas angka sama dengan backend (pengaturanController).
type FormValues = {
  nama_apotek: string
  alamat_apotek: string
  nama_apj: string
  nomor_sia: string
  nomor_sipa_apj: string
  kota_apotek: string
  default_service_level: string
  default_lead_time: string
  asumsi_dus_tradisional: string
  threshold_expired_hari: string
}

const MAKS_TEKS = 255
const URUTAN_FIELD: (keyof FormValues)[] = [
  'nama_apotek', 'alamat_apotek', 'nama_apj', 'nomor_sia', 'nomor_sipa_apj', 'kota_apotek',
  'default_service_level', 'default_lead_time', 'asumsi_dus_tradisional', 'threshold_expired_hari',
]

function bentukForm(data: PengaturanData): FormValues {
  const v = (k: string, awal = '') => data[k]?.value ?? awal
  return {
    nama_apotek: v('nama_apotek'),
    alamat_apotek: v('alamat_apotek'),
    nama_apj: v('nama_apj'),
    nomor_sia: v('nomor_sia'),
    nomor_sipa_apj: v('nomor_sipa_apj'),
    kota_apotek: v('kota_apotek'),
    default_service_level: v('default_service_level', '95'),
    default_lead_time: v('default_lead_time', '1'),
    asumsi_dus_tradisional: v('asumsi_dus_tradisional', '2'),
    threshold_expired_hari: v('threshold_expired_hari', '90'),
  }
}

const bulat = (min: number, maks: number, nama: string) => (v: string) => {
  if (v.trim() === '') return `${nama} wajib diisi`
  const n = Number(v)
  if (!Number.isInteger(n)) return `${nama} harus bilangan bulat, tanpa koma`
  if (n < min) return `${nama} minimal ${min}`
  if (n > maks) return `${nama} maksimal ${maks}`
  return true
}
const teksPanjang = (v: string) => v.length <= MAKS_TEKS || `Maksimal ${MAKS_TEKS} karakter`

interface Props {
  data: PengaturanData
}

export default function PengaturanForm({ data }: Props) {
  const update = useUpdatePengaturan()
  const nilaiServer = bentukForm(data)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({ shouldFocusError: false, defaultValues: nilaiServer })
  const serviceLevel = useWatch({ control, name: 'default_service_level' })

  // Peramban memperingatkan bila halaman ditutup atau dimuat ulang saat ada perubahan yang belum disimpan.
  useEffect(() => {
    if (!isDirty) return
    const cegah = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', cegah)
    return () => window.removeEventListener('beforeunload', cegah)
  }, [isDirty])

  // Klik menu atau tautan lain saat ada perubahan yang belum disimpan meminta konfirmasi dulu.
  const cegat = useCegatPindah(isDirty)

  async function simpan(values: FormValues) {
    clearErrors('root.server')
    try {
      await update.mutateAsync(values)
      reset(values) // yang baru disimpan menjadi nilai awal: tidak lagi dianggap berubah
    } catch (err) {
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Pengaturan belum bisa disimpan. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: FieldErrors<FormValues>) {
    const pertama = URUTAN_FIELD.find((k) => galat[k])
    if (!pertama) return
    const el = document.getElementById(pertama)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  const levelLuarDaftar = !SERVICE_LEVEL_OPTIONS.some((o) => String(o.value) === serviceLevel)

  return (
    // noValidate: galat ditulis inline oleh form ini, bukan balon bawaan peramban.
    <form onSubmit={handleSubmit(simpan, fokusGalat)} noValidate className="space-y-4">

      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <FormSection title="Identitas apotek" description="Dipakai di kop laporan dan Surat Pesanan (PDF).">
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
            <Field className="md:col-span-2" data-invalid={!!errors.nama_apotek}>
              <FieldLabel htmlFor="nama_apotek">Nama apotek</FieldLabel>
              <Input id="nama_apotek" placeholder="Apotek Rezky Medika" aria-invalid={!!errors.nama_apotek} aria-describedby={errors.nama_apotek ? 'nama_apotek-error' : undefined} className="h-10 rounded-xl" {...register('nama_apotek', { validate: teksPanjang })} />
              <FieldError id="nama_apotek-error">{errors.nama_apotek?.message}</FieldError>
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.alamat_apotek}>
              <FieldLabel htmlFor="alamat_apotek">Alamat apotek</FieldLabel>
              <Textarea id="alamat_apotek" rows={2} placeholder="Jalan, kelurahan, kota, provinsi" aria-invalid={!!errors.alamat_apotek} aria-describedby={errors.alamat_apotek ? 'alamat_apotek-error' : undefined} className="rounded-xl" {...register('alamat_apotek', { validate: teksPanjang })} />
              <FieldError id="alamat_apotek-error">{errors.alamat_apotek?.message}</FieldError>
            </Field>

            <Field className="md:col-span-2" data-invalid={!!errors.nama_apj}>
              <FieldLabel htmlFor="nama_apj">Apoteker penanggung jawab (APJ)</FieldLabel>
              <Input id="nama_apj" placeholder="apt. Nama Lengkap, S.Farm." aria-invalid={!!errors.nama_apj} aria-describedby={errors.nama_apj ? 'nama_apj-error' : undefined} className="h-10 rounded-xl" {...register('nama_apj', { validate: teksPanjang })} />
              <FieldError id="nama_apj-error">{errors.nama_apj?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.nomor_sia}>
              <FieldLabel htmlFor="nomor_sia">Nomor SIA</FieldLabel>
              <Input id="nomor_sia" aria-invalid={!!errors.nomor_sia} aria-describedby={errors.nomor_sia ? 'nomor_sia-error' : undefined} className="h-10 rounded-xl tabular-nums" {...register('nomor_sia', { validate: teksPanjang })} />
              <FieldError id="nomor_sia-error">{errors.nomor_sia?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.nomor_sipa_apj}>
              <FieldLabel htmlFor="nomor_sipa_apj">Nomor SIPA APJ</FieldLabel>
              <Input id="nomor_sipa_apj" aria-invalid={!!errors.nomor_sipa_apj} aria-describedby={errors.nomor_sipa_apj ? 'nomor_sipa_apj-error' : undefined} className="h-10 rounded-xl tabular-nums" {...register('nomor_sipa_apj', { validate: teksPanjang })} />
              <FieldError id="nomor_sipa_apj-error">{errors.nomor_sipa_apj?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.kota_apotek}>
              <FieldLabel htmlFor="kota_apotek">Kota</FieldLabel>
              <Input id="kota_apotek" placeholder="Manokwari" aria-invalid={!!errors.kota_apotek} aria-describedby={errors.kota_apotek ? 'kota_apotek-error' : 'kota_apotek-hint'} className="h-10 rounded-xl" {...register('kota_apotek', { validate: teksPanjang })} />
              {errors.kota_apotek ? (
                <FieldError id="kota_apotek-error">{errors.kota_apotek.message}</FieldError>
              ) : (
                <FieldDescription id="kota_apotek-hint">Untuk tanggal di Surat Pesanan.</FieldDescription>
              )}
            </Field>
          </div>
        </FormSection>
      </section>

      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <FormSection title="Nilai bawaan perhitungan" description="Dipakai untuk obat yang baru ditambahkan. Permintaan dihitung otomatis dari penjualan 30 hari terakhir.">
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="default_service_level">
                <Istilah istilah="Service level" arti="Peluang stok cukup selama menunggu pesanan datang. 95% berarti dari 100 kali memesan, sekitar 95 kali tidak kehabisan. Makin tinggi, stok pengaman makin besar (Z adalah angka pengali di rumusnya)." />
              </FieldLabel>
              <PilihanCombobox
                id="default_service_level"
                options={[
                  ...SERVICE_LEVEL_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
                  ...(levelLuarDaftar ? [{ value: serviceLevel, label: `${serviceLevel}%` }] : []),
                ]}
                value={serviceLevel}
                onChange={(v) => setValue('default_service_level', v, { shouldDirty: true })}
                noun="service level"
                aria-describedby="default_service_level-hint"
              />
              <FieldDescription id="default_service_level-hint">Peluang stok cukup selama menunggu pesanan. Makin tinggi, stok pengaman makin besar.</FieldDescription>
            </Field>

            <Field data-invalid={!!errors.default_lead_time}>
              <FieldLabel htmlFor="default_lead_time">Lead time</FieldLabel>
              <InputSatuan
                id="default_lead_time" type="number" min={1} max={365} step={1} inputMode="numeric" akhiran="hari" className="pr-12"
                aria-invalid={!!errors.default_lead_time} aria-describedby={errors.default_lead_time ? 'default_lead_time-error' : 'default_lead_time-hint'}
                onKeyDown={(e) => { if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault() }}
                {...register('default_lead_time', { validate: bulat(1, 365, 'Lead time') })}
              />
              {errors.default_lead_time ? (
                <FieldError id="default_lead_time-error">{errors.default_lead_time.message}</FieldError>
              ) : (
                <FieldDescription id="default_lead_time-hint">Hari dari pesan sampai barang datang.</FieldDescription>
              )}
            </Field>

          </div>
        </FormSection>
      </section>

      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <FormSection title="Analisis dan peringatan" description="Asumsi untuk halaman Analisis dan Dashboard, dan kapan obat mulai diperingatkan akan kedaluarsa.">
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
          <Field data-invalid={!!errors.asumsi_dus_tradisional}>
            <FieldLabel htmlFor="asumsi_dus_tradisional">Asumsi jumlah dus per pemesanan (tradisional)</FieldLabel>
            <InputSatuan
              id="asumsi_dus_tradisional" type="number" min={0.1} step={0.1} inputMode="decimal" akhiran="dus" className="pr-11"
              aria-invalid={!!errors.asumsi_dus_tradisional} aria-describedby={errors.asumsi_dus_tradisional ? 'asumsi_dus_tradisional-error' : 'asumsi_dus_tradisional-hint'}
              {...register('asumsi_dus_tradisional', {
                validate: (v) => {
                  if (v.trim() === '') return 'Asumsi jumlah dus wajib diisi'
                  const n = Number(v)
                  return (Number.isFinite(n) && n >= 0.1) || 'Asumsi jumlah dus minimal 0,1'
                },
              })}
            />
            {errors.asumsi_dus_tradisional ? (
              <FieldError id="asumsi_dus_tradisional-error">{errors.asumsi_dus_tradisional.message}</FieldError>
            ) : (
              <FieldDescription id="asumsi_dus_tradisional-hint">Angka asumsi tetap, bukan dihitung dari riwayat transaksi. Bawaan 2 dus.</FieldDescription>
            )}
          </Field>
          <Field data-invalid={!!errors.threshold_expired_hari}>
            <FieldLabel htmlFor="threshold_expired_hari">Peringatan kedaluarsa</FieldLabel>
            <InputSatuan
              id="threshold_expired_hari" type="number" min={1} max={3650} step={1} inputMode="numeric" akhiran="hari" className="pr-12"
              aria-invalid={!!errors.threshold_expired_hari} aria-describedby={errors.threshold_expired_hari ? 'threshold_expired_hari-error' : 'threshold_expired_hari-hint'}
              onKeyDown={(e) => { if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault() }}
              {...register('threshold_expired_hari', { validate: bulat(1, 3650, 'Batas peringatan') })}
            />
            {errors.threshold_expired_hari ? (
              <FieldError id="threshold_expired_hari-error">{errors.threshold_expired_hari.message}</FieldError>
            ) : (
              <FieldDescription id="threshold_expired_hari-hint">Obat yang expired dalam rentang ini tampil di peringatan Dashboard dan Laporan kedaluarsa.</FieldDescription>
            )}
          </Field>
          </div>
        </FormSection>
      </section>

      {errors.root?.server?.message && (
        <FieldError className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
      )}

      {/* Bilah simpan menempel di dasar layar selama form panjang digulir. Melayang di atas isi, jadi memakai bayangan
          dan cincin tipis (seperti popover). Tombol Simpan mati selama belum ada perubahan. */}
      <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-3 pl-5 shadow-md ring-1 ring-foreground/10">
        <p role="status" className="text-sm text-muted-foreground">
          {isDirty ? <span className="font-medium text-foreground">Ada perubahan yang belum disimpan</span> : 'Belum ada perubahan'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-xl px-4" disabled={!isDirty || isSubmitting} onClick={() => reset(nilaiServer)}>
            Batalkan perubahan
          </Button>
          <Button type="submit" className="h-10 min-w-36 rounded-xl px-4" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan pengaturan'}
          </Button>
        </div>
      </div>

      <KonfirmasiBuang open={cegat.tertunda} onOpenChange={(o) => { if (!o) cegat.batal() }} onBuang={cegat.lanjut} />
    </form>
  )
}
