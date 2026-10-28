<template>
  <div class="app-container">
    <!-- Left Icon Sidebar -->
    <Sidebar @open-about="showAbout = true" />

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Session / Room List Panel -->
      <section class="session-panel" :class="{ 'hidden-mobile': mobileView === 'chat' }">
        <header class="session-header">
          <h2>Hội thoại</h2>
          <span class="ss-badge primary">1 Phòng</span>
        </header>

        <div class="session-list">
          <div v-if="loading" style="text-align: center; padding: 20px; color: var(--color-font-2);">
            <font-awesome-icon :icon="['fas', 'spinner']" class="spinner" />
            <div style="margin-top: 8px; font-size: 13px;">Đang tải phòng...</div>
          </div>

          <template v-else-if="rooms.length > 0">
            <RoomCard
              v-for="room in rooms"
              :key="room.id"
              :room="room"
              :selected="activeRoom?.id === room.id"
              :member-count="roomMembers.length"
              @click="handleSelectRoom(room)"
            />
          </template>

          <div v-else class="empty-state">
            <font-awesome-icon :icon="['fas', 'door-closed']" style="font-size: 28px; margin-bottom: 8px;" />
            <p>Không tìm thấy phòng chat nào mà bạn được cấp quyền.</p>
          </div>
        </div>
      </section>

      <!-- Active Chat Room Panel -->
      <section class="chat-container" :class="{ 'hidden-mobile': mobileView === 'rooms' }">
        <!-- Room Header -->
        <header v-if="activeRoom" class="chat-header">
          <div class="chat-header-info">
            <button
              class="mobile-back-btn"
              title="Quay lại danh sách phòng"
              aria-label="Quay lại danh sách phòng"
              @click="mobileView = 'rooms'"
            >
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <div class="chat-header-avatar">
              PF
            </div>
            <div>
              <h2 class="chat-header-title">{{ activeRoom.name }}</h2>
              <p class="chat-header-desc">
                {{ roomMembers.length }} thành viên tham gia &bull; Phòng chat riêng tư
              </p>
            </div>
          </div>

          <div class="chat-header-actions">
            <button
              class="ss-button secondary"
              style="height: 36px; padding: 0 12px; font-size: 13px;"
              @click="showMembers = !showMembers"
            >
              <font-awesome-icon :icon="['fas', 'users']" />
              <span>Thành viên ({{ roomMembers.length }})</span>
            </button>
          </div>
        </header>

        <!-- Room Main Body -->
        <div class="chat-body">
          <div class="foundation-notice ss-card">
            <div class="foundation-icon">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
            </div>
            <h3>P1 — Nền tảng Auth & Phân quyền RLS đã sẵn sàng!</h3>
            <p>
              Tài khoản <strong>{{ profile?.display_name || user?.email }}</strong> đã được xác thực an toàn qua Supabase Auth và phân quyền thông qua PostgreSQL Row Level Security (RLS).
            </p>

            <div class="features-status">
              <div class="status-item verified">
                <font-awesome-icon :icon="['fas', 'check']" />
                <span>Supabase Email Auth & Phiên làm việc</span>
              </div>
              <div class="status-item verified">
                <font-awesome-icon :icon="['fas', 'check']" />
                <span>PostgreSQL Schema 4 bảng & RLS Default Deny</span>
              </div>
              <div class="status-item verified">
                <font-awesome-icon :icon="['fas', 'check']" />
                <span>Helper `private.is_room_member` chống đệ quy</span>
              </div>
              <div class="status-item pending">
                <font-awesome-icon :icon="['fas', 'clock']" />
                <span>Tin nhắn Realtime & Bù tin nhắn reconnect (P2)</span>
              </div>
            </div>
          </div>

          <!-- Members Drawer / Modal -->
          <div v-if="showMembers" class="members-panel ss-card">
            <div class="members-header">
              <h4>Danh sách thành viên ({{ roomMembers.length }})</h4>
              <button class="close-btn" @click="showMembers = false">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>

            <div class="members-list">
              <div
                v-for="member in roomMembers"
                :key="member.user_id"
                class="member-item"
              >
                <div class="member-avatar">
                  {{ (member.profile?.display_name || 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="member-details">
                  <div class="member-name">
                    {{ member.profile?.display_name || 'Thành viên' }}
                    <span v-if="member.user_id === user?.id" class="ss-badge primary" style="font-size: 10px;">Bạn</span>
                  </div>
                  <div class="member-role">
                    {{ member.role === 'owner' ? 'Trưởng nhóm' : 'Thành viên' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- About Modal -->
    <AboutModal v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import Sidebar from '@/components/Sidebar.vue'
import RoomCard from '@/components/RoomCard.vue'
import AboutModal from '@/components/AboutModal.vue'

const authStore = useAuthStore()
const chatStore = useChatStore()

const { user, profile } = storeToRefs(authStore)
const { rooms, activeRoom, roomMembers, loading } = storeToRefs(chatStore)

const showAbout = ref(false)
const showMembers = ref(false)
const mobileView = ref<'rooms' | 'chat'>('rooms')

function handleSelectRoom(room: any) {
  chatStore.selectRoom(room)
  mobileView.value = 'chat'
}

onMounted(async () => {
  await chatStore.fetchRooms()
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 30px 16px;
  color: var(--color-font-2);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.foundation-notice {
  max-width: 620px;
  margin: 30px auto;
  padding: 32px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.foundation-icon {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-full);
  background: var(--color-green-light);
  color: var(--color-green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.foundation-notice h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-font);
}

.foundation-notice p {
  font-size: 14px;
  color: var(--color-font-2);
  line-height: 1.6;
}

.features-status {
  width: 100%;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.status-item.verified {
  background: var(--color-green-light);
  color: var(--color-green);
  border: 1px solid rgba(45, 164, 78, 0.2);
}

.status-item.pending {
  background: var(--color-card-2);
  color: var(--color-font-2);
  border: 1px solid var(--color-border);
}

.members-panel {
  max-width: 620px;
  width: 100%;
  margin: 20px auto 0;
  padding: 20px;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.members-header h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-font);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-font-2);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.close-btn:hover {
  color: var(--color-font);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--color-card-2);
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-blue), #8059d9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.member-details {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-font);
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-role {
  font-size: 12px;
  color: var(--color-font-2);
}
</style>
