<template>
  <aside class="app-sidebar">
    <div class="sidebar-logo" title="Private Friends Chat">
      <font-awesome-icon :icon="['fas', 'comments']" />
    </div>

    <nav class="sidebar-nav">
      <button
        class="sidebar-item active"
        title="Phòng chat"
      >
        <font-awesome-icon :icon="['fas', 'message']" />
      </button>

      <button
        class="sidebar-item"
        :title="isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'"
        @click="toggleTheme"
      >
        <font-awesome-icon :icon="isDark ? ['fas', 'sun'] : ['fas', 'moon']" />
      </button>

      <button
        class="sidebar-item"
        title="Thông tin & Giấy phép"
        @click="$emit('open-about')"
      >
        <font-awesome-icon :icon="['fas', 'circle-info']" />
      </button>
    </nav>

    <div class="sidebar-bottom">
      <div
        class="user-avatar"
        :title="profile?.display_name || user?.email || 'Tài khoản'"
      >
        {{ getInitials(profile?.display_name || user?.email || 'U') }}
      </div>

      <button
        class="sidebar-item logout-btn"
        title="Đăng xuất"
        :disabled="actionLoading"
        @click="handleLogout"
      >
        <font-awesome-icon :icon="['fas', 'arrow-right-from-bracket']" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  (e: 'open-about'): void
}>()

const authStore = useAuthStore()
const { user, profile, actionLoading } = storeToRefs(authStore)

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  }
})

function getInitials(name: string): string {
  const clean = name.trim().split('@')[0]
  if (!clean) return 'U'
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return clean.substring(0, 2).toUpperCase()
}

async function handleLogout() {
  await authStore.logout()
}
</script>

<style scoped>
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-blue), #8059d9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 8px var(--color-shader);
}

.logout-btn:hover {
  color: var(--color-red) !important;
  background: var(--color-red-light) !important;
}
</style>
