'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import type { LoginPayload } from '@/types/user'

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  const setAuth = useAuthStore(s => s.setAuth)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>()

  const onSubmit = async (data: LoginPayload) => {
    try {
      setErrorMsg(null)
      await login(data)
      window.location.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMsg(e?.response?.data?.message ?? 'Login gagal. Periksa username dan password.')
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    try {
      setErrorMsg(null)
      setGoogleLoading(true)
      const res = await api.post('/auth/login/google', { credential })
      const { token, user } = res.data.data
      setAuth(user, token)
      window.location.replace('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMsg(e?.response?.data?.message ?? 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SIMO</h1>
          <p className="text-sm text-gray-500 mt-1">Apotek Rezky Medika · Manokwari</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk ke Sistem</h2>
          <p className="text-sm text-gray-500 mb-6">Masukkan username dan password akun Anda</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <input
                placeholder="Masukkan username"
                autoComplete="username"
                autoFocus
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('username', { required: 'Username wajib diisi' })}
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('password', { required: 'Password wajib diisi' })}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) handleGoogleSuccess(res.credential)
              }}
              onError={() => setErrorMsg('Login Google gagal atau dibatalkan.')}
              width="320"
              text="signin_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-gray-400 mt-3">Memverifikasi akun Google...</p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistem Informasi Manajemen Persediaan Obat · 2026
        </p>
      </div>
    </div>
  )
}
