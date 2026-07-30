<template>
    <div class="theme-color-picker-pan">
        <div class="theme-color-preview">
            <label :for="colorHexInputId" class="sr-only">{{ $t('主题颜色值') }}</label>
            <div class="theme-color-preview-chip" :style="{ background: colorHex }" />
            <input :id="colorHexInputId"
                v-model="inputValue"
                class="ss-input theme-color-preview-input"
                type="text"
                inputmode="text"
                maxlength="7"
                spellcheck="false"
                placeholder="#RRGGBB"
                @change="commitHexInput"
                @blur="commitHexInput">
        </div>
        <div class="theme-color-main">
            <div class="theme-color-main-left">
                <div ref="boardRef"
                    class="theme-color-board"
                    :style="{ '--theme-picker-hue': `hsl(${hue} 100% 50%)` }"
                    @pointerdown.prevent="startBoardDrag">
                    <div class="theme-color-board-white" />
                    <div class="theme-color-board-black" />
                    <div class="theme-color-board-thumb"
                        :style="{
                            left: `${saturation}%`,
                            top: `${100 - value}%`,
                            background: colorHex,
                        }" />
                </div>
            </div>
            <div v-if="historyColors.length > 0" class="theme-color-history">
                <button v-for="color in historyColors"
                    :key="color"
                    class="theme-color-preset"
                    type="button"
                    :title="color"
                    :style="{ background: color }"
                    @click="applyPreset(color)" />
            </div>
        </div>
        <div class="ss-range theme-color-hue-range"
            :style="{ '--range-precent': `${(hue / 360) * 100}%` }">
            <label :for="colorHueInputId" class="sr-only">{{ $t('主题色相') }}</label>
            <input :id="colorHueInputId"
                v-model="hue"
                class="theme-color-hue"
                type="range"
                min="0"
                max="360"
                step="1">
            <div />
        </div>
        <div class="tip">
            <font-awesome-icon icon="exclamation-triangle" />
            <span>{{ $t('实际颜色将由颜色转换器处理为更适应风格的颜色，可能与选色存在差异。') }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import { i18n } from '@renderer/main'

    defineOptions({ name: 'ThemeColorPickerPan' })

    const props = withDefaults(defineProps<{
        modelValue: string
        onChange?: (value: string) => void
        historyColors?: string[]
    }>(), {
        onChange: undefined,
        historyColors: () => [],
    })

    const emit = defineEmits<{
        'update:modelValue': [value: string]
    }>()

    const $t = i18n.global.t
    const boardRef = ref<HTMLDivElement | null>(null)
    const hue = ref(0)
    const saturation = ref(100)
    const value = ref(100)
    const inputValue = ref('#FFFFFF')
    const isSyncing = ref(false)
    const colorHexInputId = `theme-color-preview-input-${Math.random().toString(36).slice(2, 9)}`
    const colorHueInputId = `theme-color-hue-input-${Math.random().toString(36).slice(2, 9)}`

    const colorHex = computed(() => {
        return hsvToHex(hue.value, saturation.value, value.value)
    })
    const historyColors = computed(() => {
        return props.historyColors.map((item) => normalizeHexColor(item))
    })

    watch(
        () => props.modelValue,
        (nextColor) => {
            syncFromHex(nextColor)
        },
        { immediate: true },
    )

    watch(
        [hue, saturation, value],
        () => {
            if (isSyncing.value) {
                return
            }
            emitColor()
        },
    )

    function startBoardDrag(event: PointerEvent) {
        updateBoardValue(event)
        const target = event.currentTarget as HTMLDivElement | null
        if (!target) {
            return
        }
        target.setPointerCapture(event.pointerId)
        target.addEventListener('pointermove', updateBoardValue)
        target.addEventListener('pointerup', stopBoardDrag, { once: true })
        target.addEventListener('pointercancel', stopBoardDrag, { once: true })
    }

    function stopBoardDrag(event: PointerEvent) {
        const target = event.currentTarget as HTMLDivElement | null
        if (!target) {
            return
        }
        target.removeEventListener('pointermove', updateBoardValue)
        if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId)
        }
    }

    function updateBoardValue(event: PointerEvent) {
        if (!boardRef.value) {
            return
        }
        const rect = boardRef.value.getBoundingClientRect()
        const nextSaturation = ((event.clientX - rect.left) / rect.width) * 100
        const nextValue = 100 - (((event.clientY - rect.top) / rect.height) * 100)
        saturation.value = clamp(nextSaturation, 0, 100)
        value.value = clamp(nextValue, 0, 100)
    }

    function applyPreset(color: string) {
        syncFromHex(color, true)
    }

    function commitHexInput() {
        syncFromHex(inputValue.value, true)
    }

    function syncFromHex(color: string, notify = false) {
        const normalized = normalizeHexColor(color)
        const hsv = hexToHsv(normalized)
        isSyncing.value = true
        hue.value = Math.round(hsv.h)
        saturation.value = Math.round(hsv.s)
        value.value = Math.round(hsv.v)
        inputValue.value = normalized
        isSyncing.value = false
        if (notify) {
            emitColor()
        }
    }

    function emitColor() {
        const nextColor = colorHex.value
        inputValue.value = nextColor
        emit('update:modelValue', nextColor)
        props.onChange?.(nextColor)
    }

    function normalizeHexColor(color: string | undefined) {
        const value = (color ?? '').trim()
        const match = value.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
        if (!match) {
            return '#FFFFFF'
        }
        const hex = match[1]
        if (hex.length === 3) {
            return '#' + hex.split('').map((item) => item + item).join('').toUpperCase()
        }
        return '#' + hex.toUpperCase()
    }

    function hexToHsv(color: string) {
        const normalized = normalizeHexColor(color).slice(1)
        const r = parseInt(normalized.slice(0, 2), 16) / 255
        const g = parseInt(normalized.slice(2, 4), 16) / 255
        const b = parseInt(normalized.slice(4, 6), 16) / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const diff = max - min

        let h = 0
        if (diff !== 0) {
            switch (max) {
                case r:
                    h = 60 * (((g - b) / diff) % 6)
                    break
                case g:
                    h = 60 * (((b - r) / diff) + 2)
                    break
                default:
                    h = 60 * (((r - g) / diff) + 4)
            }
        }

        return {
            h: h < 0 ? h + 360 : h,
            s: max === 0 ? 0 : (diff / max) * 100,
            v: max * 100,
        }
    }

    function hsvToHex(h: number, s: number, v: number) {
        const hueValue = ((h % 360) + 360) % 360
        const saturationValue = clamp(s, 0, 100) / 100
        const brightnessValue = clamp(v, 0, 100) / 100
        const chroma = brightnessValue * saturationValue
        const x = chroma * (1 - Math.abs(((hueValue / 60) % 2) - 1))
        const m = brightnessValue - chroma

        let r = 0
        let g = 0
        let b = 0

        if (hueValue < 60) {
            r = chroma
            g = x
        } else if (hueValue < 120) {
            r = x
            g = chroma
        } else if (hueValue < 180) {
            g = chroma
            b = x
        } else if (hueValue < 240) {
            g = x
            b = chroma
        } else if (hueValue < 300) {
            r = x
            b = chroma
        } else {
            r = chroma
            b = x
        }

        return '#' + [r, g, b].map((channel) => {
            return Math.round((channel + m) * 255).toString(16).padStart(2, '0')
        }).join('').toUpperCase()
    }

    function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max)
    }
</script>

<style scoped>
    .theme-color-picker-pan {
        width: min(420px, 70vw);
    }

    .tip {
        align-items: center;
        color: var(--color-font-2);
        display: flex;
        gap: 6px;
        font-size: 12px;
        margin-top: 12px;
    }

    .theme-color-preview {
        align-items: center;
        display: flex;
        gap: 12px;
        margin-bottom: 14px;
    }

    .theme-color-preview-chip {
        border: 2px solid rgb(255 255 255 / 55%);
        border-radius: 10px;
        height: 30px;
        flex-shrink: 0;
        width: 64px;
    }

    .theme-color-preview-input {
        border-bottom: 1px solid var(--color-font-2);
        background: var(--color-card-1);
        box-sizing: border-box;
        font-family: monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        height: 30px;
        width: 100%;
    }

    .theme-color-main {
        align-items: stretch;
        display: flex;
        gap: 12px;
    }

    .theme-color-main-left {
        flex: 1;
        min-width: 0;
    }

    .theme-color-board {
        background: var(--theme-picker-hue);
        border-radius: 10px;
        cursor: crosshair;
        height: 200px;
        overflow: hidden;
        position: relative;
        touch-action: none;
        width: 100%;
    }

    .theme-color-board-white,
    .theme-color-board-black,
    .theme-color-board-thumb {
        pointer-events: none;
        position: absolute;
    }

    .theme-color-board-white,
    .theme-color-board-black {
        inset: 0;
    }

    .theme-color-board-white {
        background: linear-gradient(90deg, #fff 0%, rgb(255 255 255 / 0%) 100%);
    }

    .theme-color-board-black {
        background: linear-gradient(180deg, rgb(0 0 0 / 0%) 0%, #000 100%);
    }

    .theme-color-board-thumb {
        border: 2px solid #fff;
        border-radius: 999px;
        box-shadow: 0 0 0 1px rgb(0 0 0 / 20%);
        height: 18px;
        transform: translate(-50%, -50%);
        width: 18px;
    }

    .theme-color-hue-range {
        margin-top: 16px;
        width: 100%;
    }

    .theme-color-hue-range > input.theme-color-hue {
        background-color: transparent;
        background-image: linear-gradient(90deg,
            #ff0000 0%,
            #ffff00 17%,
            #00ff00 33%,
            #00ffff 50%,
            #0000ff 67%,
            #ff00ff 83%,
            #ff0000 100%);
        background-size: 100% 100%;
        min-width: 100%;
    }

    .theme-color-hue-range > div {
        background: var(--color-main);
        border-color: var(--color-card);
        box-shadow: 0 0 5px rgb(0 0 0 / 18%);
    }

    .theme-color-history {
        display: grid;
        gap: 8px;
        grid-auto-rows: 34px;
        grid-template-columns: 1fr;
        max-height: 256px;
        overflow-y: auto;
        padding-right: 2px;
        width: 46px;
    }

    .theme-color-preset {
        border: 2px solid rgb(255 255 255 / 55%);
        border-radius: 10px;
        cursor: pointer;
        height: 34px;
        padding: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        width: 100%;
    }

    @media (max-width: 500px) {
        .theme-color-picker-pan {
            width: calc(100% - 20px);
            padding: 10px !important;
        }

        .theme-color-main {
            flex-direction: column;
        }

        .theme-color-board {
            height: 150px;
        }

        .theme-color-history {
            max-height: 236px;
            width: 42px;
        }
    }
</style>
