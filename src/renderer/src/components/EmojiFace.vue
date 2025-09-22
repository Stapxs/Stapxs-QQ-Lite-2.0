<!--
 * @FileDescription: Emoji 表情
 * @Author: Mr.Lee
 * @Date: 2025/08/30
 * @Version: 1.0
-->
<template>
    <font-awesome-icon
        v-if="emoji === undefined"
        :icon="['fas', 'face-grin-wide']"
        :title="$t('表情')"
        class="emoji-face" />
    <img v-else-if="emoji.type === 'apng'"
        class="emoji-face"
        loading="lazy"
        :alt="emoji.description"
        :title="emoji.description"
        :src="emoji.value">
    <span v-else
        :title="emoji.description"
        class="emoji-face">
        {{ emoji.value }}
    </span>
</template>

<script setup lang="ts">
import Emoji from '@renderer/function/model/emoji';

const { emoji = undefined } = defineProps<{
    emoji?: Emoji
}>()
</script>
