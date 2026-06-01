<!--
 * @FileDescription: 设置页面（功能子页面）
 * @Author: Stapxs
 * @Date: 2022/11/07
 * @Version: 1.0
-->
<!-- eslint-disable max-len -->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('通知选项') }}</header>
            <div class="opt-item">
                <div :class="checkDefault('close_notice')" />
                <font-awesome-icon :icon="['fas', 'volume-xmark']" />
                <div>
                    <span>{{ $t('禁用通知') }}</span>
                    <span>{{ $t('好嘛 …… 不烦你 ……') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.close_notice"
                        type="checkbox" name="close_notice" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('bubble_sort_user')" />
                <font-awesome-icon :icon="['fas', 'box-open']" />
                <div>
                    <span>{{ $t('群收纳盒') }}</span>
                    <span>{{ $t('全都放出来！全都放出来！') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.bubble_sort_user"
                        type="checkbox" name="bubble_sort_user" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('show_all_sessions')" />
                <font-awesome-icon :icon="['fas', 'address-book']" />
                <div>
                    <span>{{ $t('显示全部会话') }}</span>
                    <span>{{ $t('在消息页显示全部好友和群；未开启时仍按最近会话和群收纳盒逻辑显示') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.show_all_sessions"
                        type="checkbox" name="show_all_sessions" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="!settingsStore.sysConfig.bubble_sort_user" class="opt-item">
                <div :class="checkDefault('group_notice_type')" />
                <font-awesome-icon :icon="['fas', 'user-group']" />
                <div>
                    <span>{{ $t('群消息通知方式') }}</span>
                    <span>{{ $t('重要消息将始终发起应用内通知和系统通知') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-model="settingsStore.sysConfig.group_notice_type"
                        name="group_notice_type" title="group_notice_type" @change="save">
                        <option value="none">
                            {{ $t('不通知（默认）') }}
                        </option>
                        <option value="inner">
                            {{ $t('仅应用内通知') }}
                        </option>
                        <option value="all">
                            {{ $t('应用内通知和系统通知') }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('聊天选项') }}</header>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'box-archive']" />
                <div>
                    <span>{{ $t('消息防撤回') }}</span>
                    <span>{{
                        ndt === 0 ? $t('说出去的话就像泼出去的水 ……') : $t('说了不做这功能就是不做')
                    }}</span>
                </div>
                <label
                    v-if="ndt < 3"
                    class="ss-switch">
                    <input v-model="ndv" type="checkbox" @change="msgND">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('msg_taill')" />
                <font-awesome-icon :icon="['fas', 'fish-fins']" />
                <div>
                    <span>{{ $t('小尾巴') }}</span>
                    <span>{{ $t('只会追加在最后一段话后面') }}</span>
                </div>
                <input v-model="settingsStore.sysConfig.msg_taill"
                    class="ss-input" style="width: 150px"
                    type="text" name="msg_taill" @keyup="save">
            </div>
            <div class="opt-item">
                <div :class="checkDefault('send_face')" />
                <font-awesome-icon :icon="['fas', 'square-arrow-up-right']" />
                <div>
                    <span>{{ $t('直接发送表情') }}</span>
                    <span>{{
                        $t('咻！点击发送！')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.send_face"
                        type="checkbox" name="send_face" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('use_breakline')" />
                <font-awesome-icon :icon="['fas', 'keyboard']" />
                <div>
                    <span>{{ $t('多行模式') }}</span>
                    <span>{{ $t('I have a shift I have an enter ...') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.use_breakline" type="checkbox"
                        name="use_breakline" @change="breakLineTip($event);save($event)">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="settingsStore.sysConfig.use_breakline" class="opt-item">
                <div :class="checkDefault('send_key')" />
                <font-awesome-icon :icon="['fas', 'keyboard']" />
                <div>
                    <span>{{ $t('发送键') }}</span>
                    <span>{{ $t('你可以使用其他组合键来换行') }}</span>
                </div>
                <div class="select-wrapper">
                    <select v-if="backend.platform === 'darwin' || backend.platform === 'ios'" v-model="settingsStore.sysConfig.send_key"
                        name="send_key" title="send_key" @change="save">
                        <option value="none">
                            Enter
                        </option>
                        <option value="shift">
                            Shift + Enter (⇧)
                        </option>
                        <option value="ctrl">
                            Control + Enter (⌃)
                        </option>
                        <option value="alt">
                            Option + Enter (⌥)
                        </option>
                        <option value="meta">
                            Command + Enter (⌘)
                        </option>
                    </select>
                    <select v-else v-model="settingsStore.sysConfig.send_key"
                        name="send_key" title="send_key" @change="save">
                        <option value="none">
                            Enter
                        </option>
                        <option value="shift">
                            Shift + Enter
                        </option>
                        <option value="ctrl">
                            Ctrl + Enter
                        </option>
                        <option value="alt">
                            Alt + Enter
                        </option>
                        <option value="meta">
                            Meta + Enter
                        </option>
                    </select>
                </div>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('record_recent_emoji')" />
                <font-awesome-icon :icon="['fas', 'clock-rotate-left']" />
                <div>
                    <span>{{ $t('缓存最近使用表情') }}</span>
                    <span>{{ $t('终于不用翻表情了') }}</span>
                </div>
                <div class="select-wrapper">
                    <select
                        v-model="settingsStore.sysConfig.record_recent_emoji"
                        name="record_recent_emoji"
                        title="record_recent_emoji">
                        <option value="none">
                            {{ $t('不记录') }}
                        </option>
                        <option value="order">
                            {{ $t('使用顺序') }}
                        </option>
                        <option value="100times">
                            {{ $t('100次使用频率（默认）') }}
                        </option>
                        <option value="500times">
                            {{ $t('500次使用频率') }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('浏览选项') }}</header>
            <div class="opt-item">
                <div :class="checkDefault('close_respond')" />
                <font-awesome-icon :icon="['fas', 'comments']" />
                <div>
                    <span>{{ $t('关闭回应功能') }}</span>
                    <span>{{
                        $t('如果你不想用它或者 bot 不支持，可以关闭这个功能')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.close_respond"
                        type="checkbox" name="close_respond" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <div :class="checkDefault('use_super_face')" />
                <font-awesome-icon :icon="['fas', 'face-laugh-squint']" />
                <div>
                    <span>{{ $t('超级表情') }}</span>
                    <span>{{
                        $t('小黄脸长大了，变成了大黄脸！')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.use_super_face"
                        type="checkbox" name="use_super_face" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>

            <div v-if="backend.isDesktop()"
                class="opt-item">
                <div :class="checkDefault('opt_always_top')" />
                <font-awesome-icon :icon="['fas', 'angle-up']" />
                <div>
                    <span>{{ $t('置顶窗口') }}</span>
                    <span>{{
                        $t('你也不想想让 ta 知道你不在看消息吧 ~')
                    }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.opt_always_top"
                        type="checkbox" name="opt_always_top" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
        <div v-if="backend.type === 'tauri'" class="ss-card">
            <header>{{ $t('消息存储') }}</header>
            <div
                class="opt-item"
                :style="{ 'background': settingsStore.sysConfig.enable_local_history ? 'var(--color-card-1)' : 'none' }">
                <div :class="checkDefault('enable_local_history')" />
                <font-awesome-icon :icon="['fas', 'database']" />
                <div>
                    <span>{{ $t('启用消息存储') }}</span>
                    <span>{{ $t('保存消息记录何尝不是一种囤囤鼠') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.enable_local_history"
                        type="checkbox" name="enable_local_history" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="settingsStore.sysConfig.enable_local_history" class="tip">
                {{
                    $t('Stapxs QQ Lite 支持将消息缓存至本地，消息将以加密数据库的方式安全的保存。')
                }}
            </div>
            <div v-if="settingsStore.sysConfig.enable_local_history" class="opt-item">
                <div :class="checkDefault('mixed_load_messages')" />
                <font-awesome-icon :icon="['fas', 'shuffle']" />
                <div>
                    <span>{{ $t('混合加载消息（实验性）') }}</span>
                    <span>{{ $t('优先加载本地缓存的消息以取得更快的加载速度') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.mixed_load_messages"
                        type="checkbox"
                        name="mixed_load_messages"
                        @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="settingsStore.sysConfig.enable_local_history" class="opt-item">
                <div :class="checkDefault('disable_local_history_image_cache')" />
                <font-awesome-icon :icon="['fas', 'image']" />
                <div>
                    <span>{{ $t('不缓存图片') }}</span>
                    <span>{{ $t('开启后将删除已缓存图片，仅保留消息文本') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.disable_local_history_image_cache"
                        type="checkbox"
                        name="disable_local_history_image_cache"
                        @change="toggleLocalHistoryImageCache">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
            <div v-if="settingsStore.sysConfig.enable_local_history && dbStats != null" class="db-stats-cards">
                <div class="db-stat-card">
                    <font-awesome-icon :icon="['fas', 'message']" />
                    <span class="db-stat-value">{{ dbStats.totalMessages.toLocaleString() }}</span>
                    <span class="db-stat-label">{{ $t('已存消息') }}</span>
                </div>
                <div class="db-stat-card">
                    <font-awesome-icon :icon="['fas', 'database']" />
                    <span class="db-stat-value">{{ formatDbSize(dbStats.dbSizeBytes) }}</span>
                    <span class="db-stat-label">{{ $t('数据库大小') }}</span>
                </div>
                <div class="db-stat-card">
                    <font-awesome-icon :icon="['fas', 'image']" />
                    <span class="db-stat-value">{{ dbStats.imageCount > 0 ? formatDbSize(dbStats.imageCacheBytes) : '-' }}</span>
                    <span class="db-stat-label">{{ $t('图片缓存') }}{{ dbStats.imageCount > 0 ? '\u00a0(' + dbStats.imageCount.toLocaleString() + ')' : '' }}</span>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('分析信息') }}</header>
            <div
                class="opt-item"
                :style="{ 'background': settingsStore.sysConfig.close_ga !== true ? 'var(--color-card-1)' : 'none' }">
                <div :class="checkDefault('close_ga')" />
                <font-awesome-icon :icon="['fas', 'cloud']" />
                <div>
                    <span>{{ $t('关闭分析') }}</span>
                    <span>{{ $t('真的不让看吗（小声') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.close_ga" type="checkbox"
                        name="close_ga" @change="save">
                    <div style="background: var(--color-card-2)">
                        <div />
                    </div>
                </label>
            </div>
            <div
                v-if="settingsStore.sysConfig.close_ga !== true"
                class="tip">
                {{
                    $t('我们使用 Umami 对应用的使用情况进行分析，它将不会上传精确到用户的信息；你也可以在这儿控制分析功能的开关和额外分析项。')
                }}
            </div>
            <div v-if="settingsStore.sysConfig.close_ga !== true" class="opt-item">
                <font-awesome-icon :icon="['fas', 'file-invoice']" />
                <div>
                    <span>{{ $t('分析统计信息') }}</span>
                    <span>{{ $t('都有些什么数据呢') }}</span>
                </div>
                <button style="width: 100px; font-size: 0.8rem"
                    class="ss-button" @click=" showUmamiInfo">
                    {{ $t('查看') }}
                </button>
            </div>
            <div v-if="settingsStore.sysConfig.close_ga !== true"
                class="opt-item">
                <div :class="checkDefault('open_ga_bot')" />
                <font-awesome-icon :icon="['fas', 'dice']" />
                <div>
                    <span>{{ $t('后端类型分析') }}</span>
                    <span>{{ $t('在连接后上传所使用的 bot 的类型分析') }}</span>
                </div>
                <label class="ss-switch">
                    <input v-model="settingsStore.sysConfig.open_ga_bot" type="checkbox"
                        name="open_ga_bot" @change="save">
                    <div>
                        <div />
                    </div>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref, watch, markRaw } from 'vue'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { runASWEvent as save, checkDefault, runAS } from '@renderer/function/option'
    import { i18n } from '@renderer/main'

    import UmamiInfoPan from '@renderer/components/UmamiInfoPan.vue'
    import { backend } from '@renderer/runtime/backend'
    import { dbClearImages, dbGetStats } from '@renderer/function/utils/localHistoryUtil'
    import { useSettingsStore } from '@renderer/state/settings'
    import { useAuthStore } from '@renderer/state/auth'
    import { useUIStore } from '@renderer/state/ui'

    const settingsStore = useSettingsStore()
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const $t = i18n.global.t

    defineOptions({ name: 'ViewOptFunction' })

    const dbStats = ref<{ totalMessages: number; imageCount: number; imageCacheBytes: number; dbSizeBytes: number } | null>(null)
    const clearImageProgressText = ref('')
    const ndt = ref(0)
    const ndv = ref(false)

    watch(() => authStore.loginInfo.uin, (uin) => {
        if (uin && settingsStore.sysConfig.enable_local_history) {
            loadDbStats()
        }
    }, { immediate: true })

    watch(() => settingsStore.sysConfig.enable_local_history, (enabled) => {
        if (enabled && authStore.loginInfo.uin) {
            loadDbStats()
        }
    }, { immediate: true })

    async function loadDbStats() {
        if (authStore.loginInfo?.uin) {
            dbStats.value = await dbGetStats(authStore.loginInfo.uin)
        }
    }

    function formatDbSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    function showUmamiInfo() {
        const popInfo = {
            title: '',
            template: markRaw(UmamiInfoPan),
            full: true,
            allowQuickClose: false
        }
        uiStore.popBoxList.push(popInfo)
    }

    function msgND() {
        ndt.value++
        setTimeout(() => {
            ndv.value = false
        }, 300)
    }

    function breakLineTip(event: Event) {
        const sender = event.target as HTMLInputElement
        if (sender.checked) {
            const popInfo = {
                title: $t('提醒'),
                html: `<span>${$t('开启多行模式可能会在一些拥有特殊选词模式的输入法上出现问题，如 微软注音2003、新注音2003 和 绝大部分很早期的拼音输入法；如果在使用的时候遇到问题可以尝试关闭此功能。（或者换个更现代的输入法）')}</span>`,
                button: [
                    {
                        text: $t('知道了'),
                        master: true,
                        fun: () => {
                            uiStore.popBoxList.shift()
                        },
                    },
                ],
            }
            uiStore.popBoxList.push(popInfo)
        }
    }

    function toggleLocalHistoryImageCache(event: Event) {
        save(event)

        const sender = event.target as HTMLInputElement
        if (!sender.checked) return

        const selfId = authStore.loginInfo?.uin
        if (!selfId) {
            new PopInfo().add(PopType.INFO, $t('请连接后在进行操作'))
            return
        }

        const popInfo = {
            title: $t('提醒'),
            html: `<span>${$t('确认要关闭图片缓存吗？所有已缓存图片都将被清除！')}</span>`,
            button: [
                {
                    text: $t('确认'),
                    fun: async() =>  {
                        uiStore.popBoxList.shift()

                        const progressPop = {
                            title: $t('提醒'),
                            html: `<span>${$t('正在清理图片缓存 0/0（0%）')}</span>`,
                            allowClose: false
                        }

                        clearImageProgressText.value = $t('正在清理图片缓存 0/0（0%）')
                        uiStore.popBoxList.push(progressPop)

                        const result = await dbClearImages(selfId, (progress) => {
                            const text = $t('正在清理图片缓存 {deleted}/{total}（{percent}%）', {
                                deleted: progress.deleted,
                                total: progress.total,
                                percent: progress.progress.toFixed(1),
                            })
                            clearImageProgressText.value = text
                            progressPop.html = `<span>${text}</span>`
                        })

                        if (uiStore.popBoxList.length > 0) {
                            uiStore.popBoxList.shift()
                        }

                        new PopInfo().add(
                            PopType.INFO,
                            $t('图片缓存清理完成，共删除 {count} 项（{batches} 批）。', {
                                count: result.deleted,
                                batches: result.batches,
                            }),
                        )
                        clearImageProgressText.value = ''
                        loadDbStats()
                    },
                },
                {
                    text: $t('取消'),
                    master: true,
                    fun: () => {
                        runAS('disable_local_history_image_cache', false)
                        uiStore.popBoxList.shift()
                    },
                }
            ],
        }
        uiStore.popBoxList.push(popInfo)
    }
</script>
<style>
    .ss-switch input:checked ~ div {
        background: var(--color-main) !important;
    }

    .ga-share {
        background: var(--color-card-2);
        border-radius: 7px;
        align-items: center;
        margin-top: 10px;
        cursor: pointer;
        display: flex;
        padding: 10px 20px;
    }

    .ga-share > svg {
        fill: var(--color-font);
        margin-right: 10px;
        width: 20px;
    }

    .ga-share > a {
        text-decoration: underline;
        color: var(--color-font-1);
        font-size: 0.8rem;
    }

    .db-stats-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 4px 0 8px;
    }

    .db-stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 12px 8px;
        border-radius: 7px;
        min-width: 0;
    }

    .db-stat-card > svg {
        width: 16px;
        height: 16px;
        opacity: 0.5;
        flex-shrink: 0;
    }

    .db-stat-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-font);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    .db-stat-label {
        font-size: 0.72rem;
        color: var(--color-font-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }
</style>
