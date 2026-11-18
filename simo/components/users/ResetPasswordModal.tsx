'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import KonfirmasiBuang from '@/components/shared/KonfirmasiBuang'
import { FormActions, InputPassword, Wajib } from '@/components/shared/FormParts'
import { useResetPassword, type UserItem } from '@/hooks/useUsers'

// Sama dengan backend (userController): minimal 8 karakter dan tidak boleh sama dengan username.
const PASSWORD_MIN = 8

interface FormValues {
  password: string
  konfirmasi: string
}

interface Props {
  user: UserItem
  onClose: () => void
}

export default function ResetPasswordModal({ user, onClose }: Props) {
  const reset = useResetPassword()
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({ shouldFocusError: false, defaultValues: { password: '', konfirmasi: '' } })
  const [buangTerbuka, setBuangTerbuka] = useState(false)

  function mintaTutup() {
    if (isDirty) setBuangTerbuka(true)
    else onClose()
  }

  async function simpan(data: FormValues) {
    clearErrors('root.server')
    try {
      await reset.mutateAsync({ id: user.id, password_baru: data.password })
      onClose()
    } catch (err) {
      const galat = err as { response?: { data?: { message?: string } } }
      setError('root.server', { message: galat?.response?.data?.message ?? 'Password belum bisa diganti. Periksa koneksi, lalu coba lagi.' })
    }
  }

  function fokusGalat(galat: typeof errors) {
    const id = galat.password ? 'password-baru' : galat.konfirmasi ? 'konfirmasi' : null
    if (!id) return
    const el = document.getElementById(id)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) mintaTutup() }}>
      <DialogContent className="gap-5 p-5 sm:max-w-sm">
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-lg font-semibold">Reset password</DialogTitle>
          <DialogDescription>
            Password baru untuk <span className="font-medium text-foreground">{user.nama}</span>{' '}
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{user.username}</span>.
            Sesi yang sedang berjalan akan berakhir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(simpan, fokusGalat)} noValidate className="space-y-5">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive" aria-hidden="true">*</span> Wajib diisi
          </p>

          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password-baru">Password baru <Wajib /></FieldLabel>
              <InputPassword
                id="password-baru"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-baru-error' : 'password-baru-hint'}
                {...register('password', {
                  required: 'Password baru wajib diisi',
                  minLength: { value: PASSWORD_MIN, message: `Password minimal ${PASSWORD_MIN} karakter` },
                  validate: (v) => v.toLowerCase() !== user.username.toLowerCase() || 'Password tidak boleh sama dengan username',
                  onChange: () => { if (getValues('konfirmasi')) void trigger('konfirmasi') },
                })}
              />
              {errors.password ? (
                <FieldError id="password-baru-error">{errors.password.message}</FieldError>
              ) : (
                <FieldDescription id="password-baru-hint">Minimal {PASSWORD_MIN} karakter dan tidak sama dengan username.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.konfirmasi}>
              <FieldLabel htmlFor="konfirmasi">Ulangi password baru <Wajib /></FieldLabel>
              <InputPassword
                id="konfirmasi"
                aria-required="true"
                aria-invalid={!!errors.konfirmasi}
                aria-describedby={errors.konfirmasi ? 'konfirmasi-error' : undefined}
                {...register('konfirmasi', {
                  required: 'Ulangi password baru',
                  validate: (v) => v === getValues('password') || 'Password dan pengulangannya belum sama',
                })}
              />
              <FieldError id="konfirmasi-error">{errors.konfirmasi?.message}</FieldError>
            </Field>
          </FieldGroup>

          {errors.root?.server?.message && (
            <FieldError className="rounded-xl bg-destructive/10 px-4 py-3">{errors.root.server.message}</FieldError>
          )}

          <FormActions>
            <Button type="button" variant="outline" className="h-10 rounded-xl px-4" onClick={mintaTutup}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="h-10 min-w-32 rounded-xl px-4">
              {isSubmitting ? 'Menyimpan...' : 'Reset password'}
            </Button>
          </FormActions>
        </form>

        <KonfirmasiBuang open={buangTerbuka} onOpenChange={setBuangTerbuka} onBuang={onClose} />
      </DialogContent>
    </Dialog>
  )
}
