'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from '@react-oauth/google'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/shared/FormParts'
import { LoginPanel } from '@/components/auth/LoginPanel'
import type { LoginPayload } from '@/types/user'

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const setAuth = useAuthStore(s => s.setAuth)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>()

  // Tombol Google hanya menerima lebar dalam piksel (200-400); ukur kolom SEKALI lalu pasang tombolnya, supaya tidak meluap di HP.
  // Jangan diukur ulang terus-menerus: tiap perubahan `width` membuat GoogleLogin memanggil google.accounts.id.initialize() lagi
  // (peringatan GSI_LOGGER "initialize() is called multiple times").
  const googleRef = useRef<HTMLDivElement>(null)
  const [googleWidth, setGoogleWidth] = useState<number | null>(null)
  useEffect(() => {
    const el = googleRef.current
    if (el) setGoogleWidth(Math.min(400, Math.max(200, Math.floor(el.clientWidth))))
  }, [])

  const onSubmit = async (data: LoginPayload) => {
    try {
      setErrorMsg(null)
      const hasil = await login(data)
      window.location.replace(hasil.user.role === 'superadmin' ? '/pemantauan' : '/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      const pesan = e?.response?.data?.message ?? 'Login gagal. Periksa username dan password.'
      // Pesan server sengaja tidak membedakan username salah dan password salah; petunjuk tambahan hanya soal kapital.
      setErrorMsg(pesan === 'Username atau password salah' ? `${pesan}. Periksa juga huruf besar dan kecil pada username.` : pesan)
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    try {
      setErrorMsg(null)
      setGoogleLoading(true)
      const res = await api.post('/auth/login/google', { credential })
      const { token, user } = res.data.data
      setAuth(user, token)
      window.location.replace(user.role === 'superadmin' ? '/pemantauan' : '/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMsg(e?.response?.data?.message ?? 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const sibuk = isLoggingIn || googleLoading

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-8">
      {/* Latar halaman (hiasan): dua cahaya buram dari token biru dan kisi titik. Pengecualian halaman masuk atas permintaan Boss. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 -z-10 size-[34rem] rounded-full bg-primary/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 -z-10 size-[30rem] rounded-full bg-accent-foreground/20 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(color-mix(in_oklab,var(--primary)_30%,transparent)_1px,transparent_1.5px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      {/* Satu kartu besar terbelah dua: panel pengantar berbingkai bulat (hanya layar lebar) dan form. */}
      <div className="relative grid w-full max-w-5xl rounded-3xl bg-card p-3 shadow-xl ring-1 ring-foreground/5 lg:grid-cols-2">
        <LoginPanel className="hidden lg:flex" />

        <section className="flex flex-col justify-center px-3 py-8 sm:px-10 lg:px-12" aria-labelledby="judul-masuk">
          <div className="mx-auto w-full max-w-sm">
            {/* Di HP panel pengantar disembunyikan, jadi merek ikut di sini. */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              {/* Gambar logo punya tepi kosong sekitar 17% di tiap sisi; -ml-2 menyejajarkan bentuknya dengan tepi teks. */}
              <Image src="/logo.png" alt="" width={56} height={56} priority className="-ml-2 shrink-0" />
              <div className="-ml-2">
                <p className="text-xl font-semibold leading-tight tracking-tight text-foreground">SIMO</p>
                <p className="text-sm text-muted-foreground">Apotek Rezky Medika · Manokwari</p>
              </div>
            </div>

            <h1 id="judul-masuk" className="text-3xl font-semibold tracking-tight text-foreground">Selamat datang kembali</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Masuk dengan akun yang diberikan admin apotek.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8" aria-busy={sibuk}>
              <FieldGroup className="gap-4">
                <Field data-invalid={!!errors.username}>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    autoComplete="username"
                    // Username membedakan huruf besar dan kecil: keyboard HP tidak boleh membesarkan huruf pertama atau mengoreksi.
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                    className="h-11 rounded-xl"
                    {...register('username', { required: 'Username wajib diisi' })}
                  />
                  {errors.username && <FieldError id="username-error">{errors.username.message}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <InputPassword
                    id="password"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className="h-11"
                    {...register('password', { required: 'Password wajib diisi' })}
                  />
                  {errors.password && <FieldError id="password-error">{errors.password.message}</FieldError>}
                </Field>

                {errorMsg && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-danger-700">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <Button type="submit" disabled={sibuk} className="h-11 w-full rounded-xl px-4 text-[15px]">
                  {isLoggingIn && <Loader2 className="motion-safe:animate-spin" data-icon="inline-start" aria-hidden="true" />}
                  {isLoggingIn ? 'Sedang masuk...' : 'Masuk'}
                </Button>
              </FieldGroup>
            </form>

            <div className="my-6 flex items-center gap-3" role="separator" aria-label="atau lanjut dengan">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">atau lanjut dengan</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Tombol Google digambar Google di dalam iframe: isinya tidak bisa kita ubah (dan sengaja tidak ditutup, supaya
                akun yang akan dipakai tetap terlihat). Pembungkus ini hanya menyamakan sudut (rounded-xl) dan garis tepi dengan
                kolom isian: iframe dipotong bulat, lalu garis tepi kita digambar di atasnya (after:). */}
            <div ref={googleRef} className="relative mx-auto h-10 overflow-hidden rounded-xl after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-inset after:ring-input" style={googleWidth !== null ? { width: googleWidth } : undefined}>
              {googleWidth !== null && (
                <GoogleLogin
                  onSuccess={(res) => {
                    if (res.credential) handleGoogleSuccess(res.credential)
                  }}
                  onError={() => setErrorMsg('Login Google gagal atau dibatalkan.')}
                  width={String(googleWidth)}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                />
              )}
            </div>

            <p role="status" className="mt-2 min-h-5 text-center text-sm text-muted-foreground">
              {googleLoading ? 'Memverifikasi akun Google...' : ''}
            </p>

            <p className="mt-4 text-balance text-center text-sm text-muted-foreground">
              Lupa password? Hubungi admin apotek untuk mengatur ulang.
            </p>
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">Sistem Informasi Manajemen Persediaan Obat</p>
    </main>
  )
}
