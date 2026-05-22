'use client'

import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { LoginPayload, LoginResponse } from '@/types/user'
import type { ApiResponse } from '@/types/api'

export function useAuth() {
  const { user, token, isHydrated, setAuth, logout: storeLogout, hydrate, isAdmin } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload)
      return res.data.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
    },
  })

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // JWT stateless — lanjut logout meski request gagal
    }
    storeLogout()
    // Pakai hard navigation agar cookie terhapus sebelum middleware mengevaluasi request
    window.location.href = '/login'
  }

  return {
    user,
    token,
    isHydrated,
    isAdmin: isAdmin(),
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    hydrate,
  }
}
