import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth'

describe('Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with unauthenticated default state', () => {
    const authStore = useAuthStore()

    expect(authStore.user).toBeNull()
    expect(authStore.session).toBeNull()
    expect(authStore.profile).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.error).toBeNull()
  })

  it('gracefully handles login attempt when Supabase credentials are not configured', async () => {
    const authStore = useAuthStore()

    const result = await authStore.login('test@friends.local', 'password123')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Supabase chưa được cấu hình')
    expect(authStore.error).toContain('Supabase chưa được cấu hình')
  })

  it('clears state on logout', async () => {
    const authStore = useAuthStore()

    const result = await authStore.logout()
    expect(result.success).toBe(true)
    expect(authStore.user).toBeNull()
    expect(authStore.session).toBeNull()
    expect(authStore.profile).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })
})
