<template>
  <div v-if="loading" class="initial-loader">
    <div class="ss-card loading-box">
      <font-awesome-icon :icon="['fas', 'spinner']" class="spinner" style="font-size: 32px; color: var(--color-blue);" />
      <p style="margin-top: 14px; font-weight: 500; font-size: 14px; color: var(--color-font-2);">
        Đang tải Private Friends Chat...
      </p>
    </div>
  </div>

  <template v-else>
    <ChatShell v-if="isAuthenticated" />
    <LoginView v-else />
  </template>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import ChatShell from '@/views/ChatShell.vue'

const authStore = useAuthStore()
const { loading, isAuthenticated } = storeToRefs(authStore)

onMounted(async () => {
  await authStore.initialize()
})
</script>

<style scoped>
.initial-loader {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-main);
}

.loading-box {
  padding: 36px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
</style>
