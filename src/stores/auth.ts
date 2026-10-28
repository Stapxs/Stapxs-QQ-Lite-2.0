import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { Profile } from '@/types/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  const actionLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(user.value))

  async function fetchProfile(userId: string) {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        // eslint-disable-next-line no-console
        console.error('[AuthStore] Error fetching profile:', profileError.message)
        return null
      }

      if (data) {
        profile.value = data as Profile
      }
      return data
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[AuthStore] Exception fetching profile:', err)
      return null
    }
  }

  async function initialize() {
    loading.value = true
    error.value = null

    if (!isSupabaseConfigured) {
      loading.value = false
      return
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        error.value = sessionError.message
      } else if (sessionData.session) {
        session.value = sessionData.session
        user.value = sessionData.session.user
        await fetchProfile(sessionData.session.user.id)
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          profile.value = null
        }
      })
    } catch (err: any) {
      error.value = err.message || 'Không thể khởi tạo phiên xác thực.'
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    actionLoading.value = true
    error.value = null

    if (!isSupabaseConfigured) {
      const msg = 'Supabase chưa được cấu hình. Vui lòng cung cấp VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong .env.'
      error.value = msg
      actionLoading.value = false
      return { success: false, error: msg }
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        let friendlyMessage = signInError.message
        if (signInError.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Email hoặc mật khẩu không chính xác.'
        } else if (signInError.message.includes('Email not confirmed')) {
          friendlyMessage = 'Email chưa được xác thực trong hệ thống.'
        }
        error.value = friendlyMessage
        return { success: false, error: friendlyMessage }
      }

      if (data.session && data.user) {
        session.value = data.session
        user.value = data.user
        await fetchProfile(data.user.id)
      }

      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Đã xảy ra lỗi không xác định khi đăng nhập.'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      actionLoading.value = false
    }
  }

  async function logout(): Promise<{ success: boolean }> {
    actionLoading.value = true
    error.value = null
    try {
      await supabase.auth.signOut()
      user.value = null
      session.value = null
      profile.value = null
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Lỗi khi đăng xuất.'
      return { success: false }
    } finally {
      actionLoading.value = false
    }
  }

  return {
    user,
    session,
    profile,
    loading,
    actionLoading,
    error,
    isAuthenticated,
    initialize,
    login,
    logout,
    fetchProfile,
  }
})
