'use client'

// ============================================================
// HireSphere AI — global auth store (zustand)
// ------------------------------------------------------------
// Talks to /api/auth/* per docs/api-contract.md.
// Session transport is dual-mode (see api-client.ts): the server
// sets the httpOnly `hs_token` cookie AND returns the JWT in the
// response body. We persist the body token so protected calls
// keep working inside the preview iframe, where cookies with
// SameSite=Lax are not stored.
// ============================================================

import { create } from 'zustand'
import { get, post, setToken } from '@/lib/api-client'

export type Role = 'ADMIN' | 'HR' | 'CANDIDATE' | 'EMPLOYEE'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
  phone?: string | null
  status?: string
  hasEmployeeRecord?: boolean
  candidateProfile?: {
    id: string
    headline?: string | null
    experienceYears?: number
    phone?: string | null
  } | null
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  phone?: string
}

type AuthStatus = 'loading' | 'authed' | 'guest'

type AuthStore = {
  user: AuthUser | null
  status: AuthStatus
  /** Bootstrap on app mount: resolve the session from the cookie. */
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: 'loading',

  fetchMe: async () => {
    try {
      const data = await get<{ user: AuthUser }>('/api/auth/me')
      set({ user: data.user, status: 'authed' })
    } catch {
      setToken(null) // drop stale/invalid token so it isn't replayed
      set({ user: null, status: 'guest' })
    }
  },

  login: async (email, password) => {
    const data = await post<{ user: AuthUser; token?: string }>('/api/auth/login', { email, password })
    if (data.token) setToken(data.token)
    set({ user: data.user, status: 'authed' })
    return data.user
  },

  register: async (input) => {
    const data = await post<{ user: AuthUser; token?: string }>('/api/auth/register', input)
    if (data.token) setToken(data.token)
    set({ user: data.user, status: 'authed' })
    return data.user
  },

  logout: async () => {
    try {
      await post('/api/auth/logout')
    } catch {
      // even if the call fails, clear local session state
    }
    setToken(null)
    set({ user: null, status: 'guest' })
  },
}))

/** Landing dashboards per role (used after login + role redirects). */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '#/admin/dashboard',
  HR: '#/hr/dashboard',
  CANDIDATE: '#/portal/dashboard',
  EMPLOYEE: '#/employee/dashboard',
}

/** Which roles may view a given top-level area. */
export function rolesForArea(area: string): Role[] | null {
  switch (area) {
    case 'admin':
      return ['ADMIN']
    case 'hr':
      return ['HR', 'ADMIN']
    case 'portal':
      return ['CANDIDATE']
    case 'employee':
      return ['EMPLOYEE']
    default:
      return null
  }
}
