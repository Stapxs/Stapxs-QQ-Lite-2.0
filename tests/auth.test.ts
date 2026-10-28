import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth'
import { useChatStore } from '../src/stores/chat'

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

  it('handles login failure cleanly (unconfigured or invalid credentials)', async () => {
    const authStore = useAuthStore()

    const result = await authStore.login('invalid-user@friends.local', 'wrongpassword')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(authStore.error).toBe(result.error)
  })

  it('clears auth state and resets chat store on logout', async () => {
    const authStore = useAuthStore()
    const chatStore = useChatStore()

    chatStore.rooms = [{ id: '1', name: 'Room 1', description: '', created_at: '' }]
    chatStore.activeRoom = chatStore.rooms[0]
    chatStore.roomMembers = [{ room_id: '1', user_id: 'u1', role: 'member', joined_at: '' }]

    const result = await authStore.logout()
    expect(result.success).toBe(true)
    expect(authStore.user).toBeNull()
    expect(authStore.session).toBeNull()
    expect(authStore.profile).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)

    // Chat store must be reset to prevent stale state on account switch
    expect(chatStore.rooms).toEqual([])
    expect(chatStore.activeRoom).toBeNull()
    expect(chatStore.roomMembers).toEqual([])
  })

  it('resets chat store completely when chatStore.reset() is called', () => {
    const chatStore = useChatStore()
    chatStore.rooms = [{ id: '1', name: 'Room 1', description: '', created_at: '' }]
    chatStore.activeRoom = chatStore.rooms[0]
    chatStore.roomMembers = [{ room_id: '1', user_id: 'u1', role: 'member', joined_at: '' }]
    chatStore.error = 'Some error'

    chatStore.reset()
    expect(chatStore.rooms).toEqual([])
    expect(chatStore.activeRoom).toBeNull()
    expect(chatStore.roomMembers).toEqual([])
    expect(chatStore.error).toBeNull()
  })

  it('handles signOut error gracefully if supabase.auth.signOut fails', async () => {
    const authStore = useAuthStore()
    const { supabase } = await import('../src/services/supabase')
    const originalSignOut = supabase.auth.signOut
    supabase.auth.signOut = async () => ({ error: { message: 'Network disconnect' } } as any)

    const result = await authStore.logout()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network disconnect')
    expect(authStore.error).toBe('Network disconnect')

    supabase.auth.signOut = originalSignOut
  })
})
