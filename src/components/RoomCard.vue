<template>
  <div
    class="room-card"
    :class="{ active: selected }"
  >
    <div class="room-icon">
      <font-awesome-icon :icon="['fas', 'user-group']" />
    </div>

    <div class="room-info">
      <div class="room-title-row">
        <h3 class="room-name">{{ room.name }}</h3>
        <span class="ss-badge primary">Kín</span>
      </div>
      <p class="room-preview">
        {{ (memberCount ?? 0) > 0 ? `${memberCount} thành viên` : 'Phòng chat riêng tư' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Room } from '@/types/database'

defineProps<{
  room: Room
  selected?: boolean
  memberCount?: number
}>()
</script>

<style scoped>
.room-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.room-card:hover {
  background: var(--color-card-1);
  border-color: var(--color-border);
}

.room-card.active {
  background: var(--color-card-1);
  border-color: var(--color-blue);
  box-shadow: 0 2px 10px var(--color-shader);
}

.room-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-blue), #6c5ce7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.room-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.room-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.room-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-font);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-preview {
  font-size: 12px;
  color: var(--color-font-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
