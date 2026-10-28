<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="ss-card about-card">
      <div class="about-header">
        <div class="about-icon">
          <font-awesome-icon :icon="['fas', 'shield-heart']" />
        </div>
        <h3>Private Friends Chat</h3>
        <p class="about-version">Phiên bản 1.0.0 (P1 Foundation)</p>
      </div>

      <div class="about-content">
        <p>
          Ứng dụng chat riêng tư dành riêng cho nhóm 4 người bạn, kế thừa ngôn ngữ thiết kế thẻ trong suốt và thẩm mỹ hiện đại từ <strong>Stapxs QQ Lite 2.0</strong>, sử dụng nền tảng xác thực và bảo mật dữ liệu <strong>Supabase (PostgreSQL + RLS)</strong>.
        </p>

        <div class="info-block">
          <div class="info-row">
            <span class="label">Mã nguồn:</span>
            <a href="https://github.com/diepdo1810/Private-Friends-Chat-1.0" target="_blank" rel="noopener noreferrer">
              diepdo1810/Private-Friends-Chat-1.0
            </a>
          </div>
          <div class="info-row">
            <span class="label">Giấy phép:</span>
            <span class="badge">AGPL-3.0-only</span>
          </div>
          <div class="info-row">
            <span class="label">Nguồn gốc UI:</span>
            <a href="https://github.com/Stapxs/Stapxs-QQ-Lite-2.0" target="_blank" rel="noopener noreferrer">
              Stapxs QQ Lite 2.0
            </a>
          </div>
        </div>

        <p class="license-notice">
          Phần mềm tuân thủ điều khoản giấy phép <strong>GNU AGPLv3 Section 13</strong>. Mã nguồn tương ứng công khai đầy đủ cho người dùng tương tác qua mạng.
        </p>
      </div>

      <div class="about-actions">
        <button class="ss-button secondary" @click="$emit('close')">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.about-card {
  width: 100%;
  max-width: 460px;
  padding: 28px 24px 20px;
  background: var(--color-card-1);
}

.about-header {
  text-align: center;
  margin-bottom: 20px;
}

.about-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-blue), #8059d9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(49, 108, 244, 0.3);
}

.about-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-font);
}

.about-version {
  font-size: 12px;
  color: var(--color-font-2);
  margin-top: 2px;
}

.about-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-font);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-block {
  background: var(--color-card-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-row .label {
  color: var(--color-font-2);
}

.info-row .badge {
  background: var(--color-blue-light);
  color: var(--color-blue);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
}

.license-notice {
  font-size: 11px;
  color: var(--color-font-2);
  line-height: 1.5;
}

.about-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
</style>
