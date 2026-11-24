'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from '@react-oauth/google'
import { ArrowLeft, Loader2, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/shared/FormParts'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { URL_BERANDA } from '@/lib/domain'
import type { LoginPayload } from '@/types/user'

// Logo "G" Google (empat warna resmi), dipakai pada tombol Masuk dengan Google.
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.78H1.33v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.36 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.33a12 12 0 0 0 0 10.8l4.03-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.33 6.6l4.03 3.09A7.15 7.15 0 0 1 12 4.77Z" />
    </svg>
  )
}

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

        <section className="relative flex flex-col justify-center px-3 py-8 sm:px-10 lg:px-12 lg:py-20" aria-labelledby="judul-masuk">
          {/* Jalan kembali ke halaman depan (domain utama bila domain dipisah, lihat lib/domain.ts). Di layar lebar menempel
              di pojok kanan atas kartu, sejajar baris logo panel biru; di HP di atas merek. Tautan halus, tidak bersaing dengan tombol Masuk. */}
          <a
            href={URL_BERANDA}
            className="-ml-3 mb-6 inline-flex h-11 items-center gap-2 self-start rounded-full px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:ml-[calc(50%-12rem-0.75rem)] lg:absolute lg:right-6 lg:top-8 lg:mb-0 lg:ml-0"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke beranda
          </a>

          <div className="mx-auto w-full max-w-sm">
            {/* Di HP panel pengantar disembunyikan, jadi merek ikut di sini. */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              {/* Gambar logo punya tepi kosong sekitar 17% di tiap sisi; -ml-2 menyejajarkan bentuknya dengan tepi teks. */}
              <Image src="/logo.png" alt="" width={56} height={56} priority className="-ml-2 shrink-0" />
              <div className="-ml-2">
                <p className="text-xl font-semibold leading-tight tracking-tight text-foreground">SIMO</p>
                <p className="text-sm text-muted-foreground">Sistem persediaan obat apotek</p>
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

            <div className="my-6 flex items-center gap-3" role="separator" aria-label="atau">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">atau</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Tombol Google: yang terlihat adalah tombol kita sendiri (serasi dengan kolom isian dan tombol Masuk). Di atasnya
                dipasang tombol asli Google (iframe, bentuknya tidak bisa kita ubah) yang hampir transparan dan diperbesar
                sedikit agar menutupi seluruh tombol, jadi klik tetap diterima tombol asli dan alur token tidak berubah.
                Hover dan fokus tombol asli diteruskan lewat group dan focus-within pada pembungkus. */}
            <div
              ref={googleRef}
              className="group relative h-11 w-full rounded-xl focus-within:ring-3 focus-within:ring-ring/50"
            >
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center gap-2.5 rounded-xl border border-input bg-card text-[15px] font-medium text-foreground transition-colors group-hover:bg-muted"
              >
                <GoogleLogo />
                Masuk dengan Google
              </div>
              {googleWidth !== null && (
                <div
                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-y-[1.12] justify-center overflow-hidden rounded-xl opacity-[0.01]"
                  style={{ width: googleWidth }}
                >
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
                </div>
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
