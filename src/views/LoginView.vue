<template>
  <div class="login-page">
    <div class="ss-card login-card">
      <div class="login-logo">
        <font-awesome-icon :icon="['fas', 'shield-halved']" />
      </div>

      <h1 class="login-title">Private Friends Chat</h1>
      <p class="login-subtitle">Ứng dụng chat độc lập & riêng tư cho 4 người bạn</p>

      <div class="ss-alert info">
        <font-awesome-icon :icon="['fas', 'lock']" style="margin-top: 2px;" />
        <div>
          <strong>Hệ thống nội bộ:</strong> Tính năng đăng ký công khai đã bị khóa. Vui lòng sử dụng tài khoản được cấp bởi Admin.
        </div>
      </div>

      <div v-if="error" class="ss-alert error">
        <font-awesome-icon :icon="['fas', 'circle-exclamation']" style="margin-top: 2px;" />
        <div>{{ error }}</div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Tài khoản Email</label>
          <div class="ss-input-wrapper">
            <font-awesome-icon :icon="['fas', 'envelope']" class="input-icon" />
            <input
              id="email"
              v-model="email"
              type="email"
              class="ss-input"
              placeholder="user@friends.local"
              required
              autocomplete="email"
              :disabled="actionLoading"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <div class="ss-input-wrapper">
            <font-awesome-icon :icon="['fas', 'key']" class="input-icon" />
            <input
              id="password"
              v-model="password"
              type="password"
              class="ss-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              :disabled="actionLoading"
            />
          </div>
        </div>

        <button
          type="submit"
          class="ss-button"
          style="width: 100%; margin-top: 10px;"
          :disabled="actionLoading || !email || !password"
        >
          <font-awesome-icon v-if="actionLoading" :icon="['fas', 'spinner']" class="spinner" />
          <span>{{ actionLoading ? 'Đang xác thực...' : 'Đăng nhập' }}</span>
        </button>
      </form>

      <footer class="login-footer">
        <div>
          Thiết kế dựa trên <strong>Stapxs QQ Lite</strong> &bull;
          <a href="#" @click.prevent="showAbout = true">Giấy phép AGPLv3</a>
        </div>
        <div>
          <a href="https://github.com/diepdo1810/Private-Friends-Chat-1.0" target="_blank" rel="noopener noreferrer">
            Xem mã nguồn trên GitHub
          </a>
        </div>
      </footer>
    </div>

    <!-- About Modal -->
    <AboutModal v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import AboutModal from '@/components/AboutModal.vue'

const authStore = useAuthStore()
const { actionLoading, error } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const showAbout = ref(false)

async function handleSubmit() {
  if (!email.value || !password.value) return
  await authStore.login(email.value, password.value)
}
</script>
