'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LoginPayload } from '@/types/user'

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>()

  const onSubmit = async (data: LoginPayload) => {
    try {
      setErrorMsg(null)
      await login(data)
      window.location.replace('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setErrorMsg(
        axiosErr?.response?.data?.message ?? 'Login gagal. Periksa username dan password.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-sm px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700 tracking-tight">SIMO</h1>
          <p className="text-sm text-gray-500 mt-1">Apotek Rezky Medika · Manokwari</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Masuk ke Sistem</CardTitle>
            <CardDescription>Masukkan username dan password akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoFocus
                  {...register('username', { required: 'Username wajib diisi' })}
                />
                {errors.username && (
                  <p className="text-xs text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'Password wajib diisi' })}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Sedang masuk...' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistem Informasi Manajemen Persediaan Obat · 2026
        </p>
      </div>
    </div>
  )
}
