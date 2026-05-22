export type UserRole = 'admin' | 'staf'

export interface User {
  id: number
  username: string
  nama: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface AuthUser {
  id: number
  username: string
  nama: string
  role: UserRole
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
