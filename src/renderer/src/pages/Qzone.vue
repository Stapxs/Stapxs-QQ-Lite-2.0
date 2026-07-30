<template>
    <div class="qzone-view" @scroll.passive="handleFeedScroll">
        <label for="qzone-reply-choice-pic" class="sr-only">{{ $t('选择评论图片') }}</label>
        <input id="qzone-reply-choice-pic"
            style="display: none"
            type="file"
            accept="image/*"
            @change="selectQzoneReplyImage">
        <div class="qzone-view-header">
            <div>
                <h5>
                    {{ $t('QZone Feeds') }}<span>beta</span>
                    <a v-if="hitokoto.id" :href="`https://hitokoto.cn/?id=${hitokoto.id}`">
                        {{ hitokoto.hitokoto }} —— {{ hitokoto.from }}
                    </a>
                </h5>
                <div>
                    <a @click="toggleMyFeed">
                        <font-awesome-icon :icon="['fas', qzoneStore.state.currentView === 'my' ? 'arrow-left' : 'book']" />
                        {{ qzoneStore.state.currentView === 'my' ? $t('返回') : $t('我的') }}
                    </a>
                    <a @click="refreshCurrentView">
                        <font-awesome-icon :icon="['fas', 'rotate-right']" />
                        {{ $t('刷新') }}
                    </a>
                </div>
            </div>
            <div class="create-qzone">
                <label for="create-qzone-content" class="sr-only">{{ $t('分享新鲜事内容') }}</label>
                <textarea id="create-qzone-content"
                    v-model="createQzone.content"
                    type="text"
                    :placeholder="$t('分享新鲜事...')" />
                <label for="create-qzone-choice-pic" class="sr-only">{{ $t('选择说说图片') }}</label>
                <input id="create-qzone-choice-pic"
                    style="display: none"
                    type="file"
                    accept="image/*"
                    multiple
                    @change="selectQzoneImage">
                <div v-if="createQzone.images.length > 0"
                    class="create-qzone-img">
                    <div v-for="(image, index) in createQzone.images"
                        :key="image.preview + '-' + index"
                        class="create-qzone-img-item">
                        <img :src="image.preview">
                        <button type="button"
                            class="create-qzone-img-remove"
                            @click="removeQzoneImage(index)">
                            <font-awesome-icon :icon="['fas', 'xmark']" />
                        </button>
                    </div>
                </div>
                <div class="create-qzone-config">
                    <font-awesome-icon :icon="['fas', 'image']" @click="runSelectQzoneImage" />
                    <font-awesome-icon :icon="['fas', 'eye']" @click="openPermissionPan" />
                    <font-awesome-icon :icon="['fas', 'paper-plane']" @click="sendQzoneMsg" />
                </div>
            </div>
        </div>
        <div class="qzone-feed-items">
            <div v-for="item in normalizedFeeds"
                v-show="Number(item.uin) != 0"
                :key="item.id"
                class="qzone-feed-card ss-card">
                <article>
                    <header class="qzone-feed-card-header">
                        <img :src="item.avatar" :alt="item.nickname">
                        <div class="qzone-feed-meta">
                            <a>{{ item.nickname }}</a>
                            <span>{{ item.timeText }}</span>
                        </div>
                        <button v-if="Number(item.uin) === Number(authStore.loginInfo.uin)"
                            type="button"
                            class="qzone-feed-like-action"
                            @click="deleteQzoneMsg(item)">
                            <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                        <button type="button"
                            class="qzone-feed-like-action"
                            @click="toggleQzoneLike(item)">
                            <template v-if="item.footInfo.like?.isLiked">
                                <font-awesome-icon :icon="['fas', 'heart']" />
                            </template>
                            <template v-else>
                                <font-awesome-icon :icon="['far', 'heart']" />
                            </template>
                        </button>
                    </header>
                    <div :class="['qzone-feed-body',
                                  { 'forward': item.footInfo.forward?.origUin != item.uin }]">
                        <a v-if="item.footInfo.forward?.origUin != item.uin && item.footInfo.forward?.origName?.trim()"
                            class="qzone-feed-forward-title"
                            href="#"
                            v-text="item.footInfo.forward?.origName + ': '" />
                        <div v-if="item.text.trim()"
                            class="qzone-feed-content"
                            v-text="item.text" />
                        <div v-if="item.images.length > 0" class="qzone-feed-images">
                            <img v-for="(image, index) in item.images"
                                :key="item.id + '-image-' + index"
                                :src="image"
                                :alt="item.nickname + ' feed image ' + index"
                                class="qzone-feed-image"
                                @click.stop="viewFeedImage(item.images, image)">
                        </div>
                    </div>
                </article>
                <div class="qzone-feed-foot">
                    <div>
                        <span v-show="item.footInfo.visitor" class="visitor">
                            {{ item.footInfo.visitor }} {{ $t('浏览') }}
                        </span>
                    </div>
                    <div v-if="item.footInfo.like && item.footInfo.like.likeCount > 0"
                        class="likes">
                        <a v-for="(user, index) in item.footInfo.like.likeUsers"
                            :key="user.id"
                            :data-id="user.id"
                            href="#">
                            {{ user.nickname }}
                            <a v-if="index != item.footInfo.like?.likeUsers.length - 1">, </a>
                        </a>
                        <template v-if="item.footInfo.like.likeCount > 0">
                            {{ $t('等 {count} 人赞了', item.footInfo.like.likeCount) }}
                        </template>
                        <template v-else>
                            {{ $t('{count} 人赞了', item.footInfo.like.likeCount) }}
                        </template>
                    </div>
                </div>
                <div v-if="item.replies.length > 0" class="qzone-feed-replies">
                    <hr>
                    <template v-for="comment in item.replies" :key="'comment-' + item.id + '-' + comment.id">
                        <div>
                            <a href="#">{{ comment.author.nickname }}</a>
                            <span>: </span>
                            <span>{{ comment.content }}</span>
                        </div>
                        <div v-for="reply in comment.replies" :key="'reply-' + item.id + '-' + comment.id + '-' + reply.id">
                            <a href="#">{{ reply.author.nickname }}</a>
                            <template v-if="reply.replyTo?.nickname">
                                <span> {{ $t('回复了') }} </span>
                                <a href="#">{{ reply.replyTo.nickname }}</a>
                            </template>
                            <span>: </span>
                            <span>{{ reply.content }}</span>
                        </div>
                    </template>
                </div>
                <div class="qzone-feed-reply">
                    <img :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${authStore.loginInfo.uin}`">
                    <label :for="`qzone-reply-input-${item.id}`" class="sr-only">{{ $t('评论输入框') }}</label>
                    <input :id="`qzone-reply-input-${item.id}`"
                        v-model="getReplyDraft(item.id).content"
                        type="text"
                        class="ss-input"
                        :placeholder="$t('说点什么？')">
                    <button type="button"
                        class="qzone-feed-reply-action qzone-feed-reply-image-action"
                        @click="toggleReplyImage(item.id)">
                        <font-awesome-icon :icon="['fas', 'image']" />
                        <span v-if="getReplyDraft(item.id).image"
                            class="qzone-feed-reply-image-badge">1</span>
                    </button>
                    <button type="button"
                        class="qzone-feed-reply-action"
                        @click="sendQzoneComment(item)">
                        <font-awesome-icon :icon="['fas', 'paper-plane']" />
                    </button>
                </div>
            </div>
            <div v-if="qzoneStore.state.currentView === 'my' && qzoneStore.state.myLoading"
                class="qzone-feed-load-state ss-card">
                {{ $t('正在加载...') }}
            </div>
            <div v-else-if="qzoneStore.state.currentView === 'my' && !qzoneStore.state.myHasMore"
                class="qzone-feed-load-state ss-card">
                {{ $t('没有更多内容了') }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, inject, markRaw, onMounted, reactive, ref } from 'vue'
    import QzonePermissionPan from '@renderer/components/QzonePermissionPan.vue'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { Connector } from '@renderer/function/connect'
    import { Img } from '@renderer/function/model/img'
    import { useAuthStore } from '@renderer/state/auth'
    import { useContactStore } from '@renderer/state/contact'
    import { useUIStore } from '@renderer/state/ui'
    import { useQzoneStore } from '@renderer/state/qzone'
    import { getTrueLang, getViewTime } from '@renderer/function/utils/systemUtil'
    import { i18n } from '@renderer/main'

    defineOptions({ name: 'ViewQzone' })

    type QzoneFeedRaw = {
        id?: string | number
        type?: string | number
        nickname?: string
        uin?: string | number
        time?: number | string
        html?: string
        [key: string]: unknown
    }

    type QzoneCommentAuthor = {
        uin: number
        nickname: string
    }

    type QzoneCommentReply = {
        id: string
        author: QzoneCommentAuthor
        content: string
        time?: string
        replyTo: QzoneCommentAuthor | null
    }

    type QzoneComment = {
        id: string
        author: QzoneCommentAuthor
        content: string
        time?: string
        replies: QzoneCommentReply[]
    }

    type QzoneReplyDraft = {
        content: string
        image: { base64: string, preview: string } | null
    }

    type NormalizedQzoneFeed = {
        id?: string | number
        uin?: string | number
        nickname?: string
        time?: number | string
        text: string
        avatar: string
        images: string[]
        timeText: string
        footInfo: ReturnType<typeof getFootInfo>
        replies: QzoneComment[]
    }

    type HitokotoInfo = {
        id: number
        hitokoto: string
        from: string
    }

    const $t = i18n.global.t
    const trueLang = getTrueLang()
    const authStore = useAuthStore()
    const contactStore = useContactStore()
    const uiStore = useUIStore()
    const qzoneStore = useQzoneStore()
    const { viewer: viewerRef } = inject<{ viewer: any }>('viewer', { viewer: null })
    const hitokoto = reactive<HitokotoInfo>({
        id: 0,
        hitokoto: '',
        from: '',
    })
    const activeReplyImageFeedId = ref<string | null>(null)
    const replyDrafts = reactive({} as Record<string, QzoneReplyDraft>)
    const createQzone = reactive({
        content: '',
        images: [] as { base64: string, preview: string }[],
        permission: {
            mode: 'public' as 'public' | 'friends' | 'allow_some' | 'private' | 'deny_some',
            userIds: [] as number[],
        },
    })

    const normalizedFeeds = computed(() => {
        return qzoneStore.qzoneFeedList.map((feed) =>
            normalizeFeed(feed as QzoneFeedRaw)) as NormalizedQzoneFeed[]
    })

    onMounted(() => {
        fetchHitokoto()
    })

    async function fetchHitokoto() {
        try {
            const response = await fetch('https://v1.hitokoto.cn/?c=d&c=i')
            if (!response.ok) return
            const data = await response.json() as Partial<HitokotoInfo>
            hitokoto.id = Number(data.id ?? 0)
            hitokoto.hitokoto = data.hitokoto ?? ''
            hitokoto.from = data.from ?? ''
        } catch {
            // do nothing
        }
    }

    function requestFeed() {
        if (authStore.jsonMap.get_qzone_feed) {
            qzoneStore.state.currentView = 'feed'
            Connector.send(authStore.jsonMap.get_qzone_feed.name,
                {}, 'getQzoneFeed')
        }
    }

    function requestMyFeed(reset = false) {
        if (authStore.jsonMap.get_qzone_msg && authStore.loginInfo.uin) {
            if (qzoneStore.state.myLoading) return
            if (reset) {
                qzoneStore.state.myPagePos = 0
                qzoneStore.state.myHasMore = true
                qzoneStore.qzoneFeedList = []
            } else if (!qzoneStore.state.myHasMore) {
                return
            }

            qzoneStore.state.currentView = 'my'
            qzoneStore.state.myLoading = true
            Connector.send(authStore.jsonMap.get_qzone_msg.name,
                {
                    target_uin: authStore.loginInfo.uin,
                    pos: qzoneStore.state.myPagePos,
                    num: qzoneStore.state.myPageSize,
                }, 'getQzoneMsg')
        }
    }

    function refreshCurrentView() {
        if (qzoneStore.state.currentView === 'my') {
            requestMyFeed(true)
        } else {
            requestFeed()
        }
    }

    function toggleMyFeed() {
        if (qzoneStore.state.currentView === 'my') {
            requestFeed()
        } else {
            requestMyFeed(true)
        }
    }

    function runSelectQzoneImage() {
        const input = document.getElementById('create-qzone-choice-pic')
        if (input) {
            input.click()
        }
    }

    async function selectQzoneImage(event: Event) {
        const input = event.target as HTMLInputElement
        if (!input.files || input.files.length <= 0) return
        const files = Array.from(input.files)
        const remainCount = 4 - createQzone.images.length
        if (remainCount <= 0) {
            input.value = ''
            return
        }

        for (const file of files.slice(0, remainCount)) {
            if (!file.type.includes('image/') || file.size === 0) {
                continue
            }

            const dataUrl = await fileToDataURL(file)
            createQzone.images.push({
                preview: dataUrl,
                base64: dataUrl.substring(
                    dataUrl.indexOf('base64,') + 7,
                    dataUrl.length,
                ),
            })
        }
        input.value = ''
    }

    function removeQzoneImage(index: number) {
        createQzone.images.splice(index, 1)
    }

    function getReplyDraft(feedId: string | number | undefined) {
        const key = String(feedId ?? '')
        if (!replyDrafts[key]) {
            replyDrafts[key] = {
                content: '',
                image: null,
            }
        }
        return replyDrafts[key]
    }

    function runSelectQzoneReplyImage(feedId: string | number | undefined) {
        activeReplyImageFeedId.value = String(feedId ?? '')
        const input = document.getElementById('qzone-reply-choice-pic') as HTMLInputElement | null
        if (input) {
            input.click()
        }
    }

    function clearReplyImage(feedId: string | number | undefined) {
        getReplyDraft(feedId).image = null
    }

    function toggleReplyImage(feedId: string | number | undefined) {
        if (getReplyDraft(feedId).image) {
            clearReplyImage(feedId)
            return
        }
        runSelectQzoneReplyImage(feedId)
    }

    async function selectQzoneReplyImage(event: Event) {
        const input = event.target as HTMLInputElement
        const feedId = activeReplyImageFeedId.value
        if (!feedId || !input.files || input.files.length <= 0) return

        const file = input.files[0]
        if (!file.type.includes('image/') || file.size === 0) {
            input.value = ''
            activeReplyImageFeedId.value = null
            return
        }

        const dataUrl = await fileToDataURL(file)
        getReplyDraft(feedId).image = {
            preview: dataUrl,
            base64: dataUrl.substring(
                dataUrl.indexOf('base64,') + 7,
                dataUrl.length,
            ),
        }
        input.value = ''
        activeReplyImageFeedId.value = null
    }

    function openPermissionPan() {
        const popInfo = {
            title: $t('权限设置'),
            template: markRaw(QzonePermissionPan),
            templateValue: {
                sessions: contactStore.userList.filter((item) => item.user_id) as any[],
                modelValue: createQzone.permission,
                'onUpdate:modelValue': (value: typeof createQzone.permission) => {
                    createQzone.permission.mode = value.mode
                    createQzone.permission.userIds = value.userIds
                },
            },
            button: [
                {
                    text: $t('关闭'),
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
                {
                    text: $t('确定'),
                    master: true,
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    }

    function getQzonePermissionRight() {
        switch (createQzone.permission.mode) {
            case 'friends':
                return 4
            case 'allow_some':
                return 16
            case 'private':
                return 64
            case 'deny_some':
                return 128
            case 'public':
            default:
                return 1
        }
    }

    function resetCreateQzone() {
        createQzone.content = ''
        createQzone.images = []
        createQzone.permission.mode = 'public'
        createQzone.permission.userIds = []
    }

    async function sendQzoneMsg() {
        const content = createQzone.content.trim()
        if (!content && createQzone.images.length <= 0) return
        if (!authStore.jsonMap.send_qzone_msg) return

        const ugcRight = getQzonePermissionRight()
        const result = await Connector.callApi(
            'send_qzone_msg',
            {
                content,
                images: createQzone.images.map((item) => 'base64://' + item.base64),
                ugc_right: ugcRight,
                target_uins: [16, 128].includes(ugcRight) ? createQzone.permission.userIds : [],
            },
        )
        if (result === undefined) return
        if (result === null) {
            new PopInfo().add(PopType.ERR, $t('发送失败'))
            return
        }

        resetCreateQzone()
        new PopInfo().add(PopType.INFO, $t('发送成功'))

        if (qzoneStore.state.currentView === 'my') {
            requestMyFeed(true)
        } else {
            requestFeed()
        }
    }

    async function sendQzoneComment(item: NormalizedQzoneFeed) {
        const draft = getReplyDraft(item.id)
        const content = draft.content.trim()
        if (!content && !draft.image) return
        if (!authStore.jsonMap.comment_qzone) return

        const payload = {
            tid: String(item.id ?? ''),
            content,
            images: draft.image ? ['base64://' + draft.image.base64] : [],
        } as {
            tid: string
            content: string
            images: string[]
            target_uin?: number
        }

        const targetUin = Number(item.uin ?? 0)
        if (targetUin > 0 && targetUin !== Number(authStore.loginInfo.uin)) {
            payload.target_uin = targetUin
        }

        const result = await Connector.callApi('comment_qzone', payload)
        if (result === undefined) return
        if (result === null) {
            new PopInfo().add(PopType.ERR, $t('发送失败'))
            return
        }

        draft.content = ''
        draft.image = null
        new PopInfo().add(PopType.INFO, $t('发送成功'))

        if (qzoneStore.state.currentView === 'my') {
            requestMyFeed(true)
        } else {
            requestFeed()
        }
    }

    async function toggleQzoneLike(item: NormalizedQzoneFeed) {
        const isLiked = Boolean(item.footInfo.like?.isLiked)
        const apiName = isLiked ? 'unlike_qzone' : 'like_qzone'
        if (!authStore.jsonMap[apiName]) return

        const payload = {
            tid: String(item.id ?? ''),
            abstime: Number(item.time ?? 0),
        } as {
            tid: string
            abstime: number
            target_uin?: number
        }

        const targetUin = Number(item.uin ?? 0)
        if (targetUin > 0 && targetUin !== Number(authStore.loginInfo.uin)) {
            payload.target_uin = targetUin
        }

        const result = await Connector.callApi(apiName, payload)
        if (result === undefined) return
        if (result === null) {
            new PopInfo().add(PopType.ERR, isLiked ? $t('取消喜欢失败') : $t('喜欢失败'))
            return
        }

        if (qzoneStore.state.currentView === 'my') {
            requestMyFeed(true)
        } else {
            requestFeed()
        }
    }

    async function deleteQzoneMsg(item: NormalizedQzoneFeed) {
        if (!authStore.jsonMap.delete_qzone_msg) return

        const result = await Connector.callApi('delete_qzone_msg', {
            tid: String(item.id ?? ''),
        })
        if (result === undefined) return
        if (result === null) {
            new PopInfo().add(PopType.ERR, $t('删除失败'))
            return
        }

        new PopInfo().add(PopType.INFO, $t('删除成功'))

        if (qzoneStore.state.currentView === 'my') {
            requestMyFeed(true)
        } else {
            requestFeed()
        }
    }

    function handleFeedScroll(event: Event) {
        if (qzoneStore.state.currentView !== 'my') return
        if (qzoneStore.state.myLoading || !qzoneStore.state.myHasMore) return

        const target = event.target as HTMLElement
        if (!target) return

        const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
        if (distanceToBottom > 240) return

        qzoneStore.state.myPagePos += 1
        requestMyFeed(false)
    }

    function viewFeedImage(images: string[], src: string) {
        if (!viewerRef?.value) return
        const imageListHeader = Img.fromList(images)
        if (imageListHeader) {
            viewerRef.value.openBySrc(imageListHeader, src)
        } else {
            viewerRef.value.open(new Img(src))
        }
    }

    async function fileToDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function(event) {
                if (!event.target) reject(new Error('读取文件失败'))
                else resolve(event.target.result as string)
            }
            reader.onerror = function(error) {
                reject(error)
            }
            reader.readAsDataURL(file)
        })
    }

    function normalizeFeed(feed: QzoneFeedRaw) {
        return {
            id: feed.id,
            uin: feed.uin,
            nickname: feed.nickname,
            time: feed.time,
            text: extractTextFromHtml(feed.html ?? ''),
            avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${feed.uin}`,
            images: extractImagesFromHtml(feed.html ?? ''),
            timeText: formatFeedTime(Number(feed.time ?? 0)),
            footInfo: getFootInfo(feed.html ?? ''),
            replies: getCommentsDetailed(feed.html ?? '')
        }
    }

    function getFootInfo(html: string) {
        if (!html) return {}
        const div = document.createElement('div')
        div.innerHTML = html

        const visitorEl = div.querySelector('[data-role="Visitor"]')
        const feedData = div.querySelector('[name="feed_data"]')
        const feedNickName = div.querySelector('.f-single-content .nickname.name')
        const likeBtn = div.querySelector('.qz_like_btn_v3') ||
            div.querySelector('[data-islike]')
        // 浏览量
        const visitorText = visitorEl?.textContent ?? ''
        const visitor = Number(visitorText.replace('浏览', '').replace('次', '')) || 0
        // 喜欢信息
        const isLiked = likeBtn?.getAttribute('data-islike') == '1'
        const likeCountText = div.querySelector('[data-likecnt]')?.getAttribute('data-likecnt') ?? '0'
        const likeCount = Number(likeCountText) || 0
        const likeUsers = [] as { nickname: string, id: number }[]
        div.querySelectorAll('.user-list .item').forEach(el => {
            likeUsers.push({
                nickname: el.textContent,
                id: Number(((el as HTMLAnchorElement).href.match(/\/\/(\d+)/) ?? [0, 0])[1])
            })
        })
        // 转发来源（如有）
        const origUin = feedData?.getAttribute('data-origuin')
        const origTid = feedData?.getAttribute('data-origtid')
        const origName = feedNickName?.textContent
        // 可见度
        const accessright = Number(div.querySelector('.f-s-i')?.getAttribute('data-accessright') ?? '1') == 1

        return {
            visitor,
            like: { likeCount, likeUsers, isLiked },
            forward: { origUin, origTid, origName },
            accessright
        }
    }

    function extractTextFromHtml(html: string) {
        if (!html) return ''
        const div = document.createElement('div')
        div.innerHTML = html
        const content = div.getElementsByClassName('f-single-content')[0]
        // 在 content 中排除一些 dom
        div.querySelectorAll('.nickname, .state').forEach(el => el.remove())

        return (content?.textContent ?? '').replace(/\s+/g, ' ').trim()
    }

    function extractImagesFromHtml(html: string) {
        if (!html) return []
        const div = document.createElement('div')
        div.innerHTML = html
        const content = div.getElementsByClassName('f-single-content')[0]

        return Array.from(content?.querySelectorAll('img') ?? [])
            .map((img) => img.getAttribute('src') ?? '')
            .filter((src) => src.trim() !== '')
    }

    function formatFeedTime(time: number) {
        if (!time) return ''
        const viewTime = getViewTime(time)
        return Intl.DateTimeFormat(trueLang, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(new Date(viewTime))
    }

    function getCommentsDetailed(html: string) {
        if (!html) return []
        const div = document.createElement('div')
        div.innerHTML = html

        const comments = [] as QzoneComment[]
        const rootCommentList = div.querySelector('.mod-comments > .comments-list > ul')
        const rootComments = rootCommentList?.querySelectorAll(':scope > .comments-item') ?? []

        rootComments.forEach(root => {
            const commentData = {
                id: root.getAttribute('data-tid') ?? '0',
                author: {
                    uin: Number(root.getAttribute('data-uin') ?? 0),
                    nickname: root.getAttribute('data-nick') ?? '',
                },
                content: extractCommentText(root),
                time: root.querySelector('.comments-op .state')?.textContent?.trim(),
                replies: []
            } as QzoneComment

            // 解析回复
            const replies = root.querySelectorAll('.mod-comments-sub .comments-item')
            replies.forEach(reply => {
                commentData.replies.push({
                    id: reply.getAttribute('data-tid') ?? '0',
                    author: {
                        uin: Number(reply.getAttribute('data-uin')),
                        nickname: reply.getAttribute('data-nick') ?? '',
                    },
                    content: extractCommentText(reply),
                    time: reply.querySelector('.comments-op .state')?.textContent?.trim(),
                    replyTo: extractReplyTo(reply)
                })
            })

            comments.push(commentData)
        })

        return comments
    }

    // 辅助函数：提取评论纯文本（去除标签）
    function extractCommentText(el: Element) {
        const contentEl = el.querySelector('.comments-content')
        if (!contentEl) return ''

        // 克隆节点避免影响原DOM
        const clone = contentEl.cloneNode(true) as HTMLElement
        // 移除操作按钮
        const opEl = clone.querySelector('.comments-op')
        if (opEl) opEl.remove()

        const parts: string[] = []
        let shouldCollect = !clone.querySelector('.nickname')

        clone.childNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement
                if (element.classList.contains('nickname')) {
                    if (shouldCollect) {
                        parts.push(element.textContent ?? '')
                    }
                    return
                }
                parts.push(element.textContent ?? '')
                return
            }

            const text = node.textContent ?? ''
            if (shouldCollect) {
                parts.push(text)
                return
            }

            const colonIndex = text.search(/[:：]/)
            if (colonIndex >= 0) {
                shouldCollect = true
                parts.push(text.slice(colonIndex + 1))
            }
        })

        return parts.join('').replace(/\s+/g, ' ').trim()
    }

    // 辅助函数：提取被回复人信息
    function extractReplyTo(el: Element): QzoneCommentAuthor | null {
        const contentEl = el.querySelector('.comments-content')
        if (!contentEl) return null

        // 查找"回复"后面的昵称
        const text = contentEl.textContent ?? ''
        const match = text.match(/回复\s*([^\s:：]+)/)
        if (match) {
            const nickname = match[1]
            const nicknameEl = contentEl.querySelector('.nickname:last-child')
            if (nicknameEl && nicknameEl.textContent === nickname) {
                return {
                    nickname: nickname,
                    uin: Number(nicknameEl.getAttribute('link')?.match(/nameCard_(\d+)/)?.[1] ?? 0)
                }
            }
        }
        return null
    }
</script>

<style scoped>
.qzone-view {
    margin: 20px 15px 20px 5px;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    overflow-x: hidden;
    height: calc(100% - 40px);
}
.qzone-view-header {
    padding: 20px 0 0 0;
}
.qzone-view-header h5 {
    font-size: 1.2rem;
}
.qzone-view-header h5 span {
    font-weight: normal;
    display: inline-block;
    background: var(--color-main);
    border-radius: 1rem;
    padding: 1px 10px;
    font-size: 0.9rem;
    color: var(--color-font-r);
    margin-left: 10px;
}
.qzone-view-header h5 a {
    display: block;
    font-size: 0.8rem;
    font-weight: normal;
    color: var(--color-font-2);
    margin-top: 5px;
    background: transparent !important;
}
.qzone-view-header textarea {
    resize: none;
    padding: 10px;
    background-color: transparent;
    border: none;
    font-size: 0.9rem;
    width: calc(100% - 15px);
    height: 10vh;
}
.create-qzone {
    display: flex;
    flex-direction: column;
    justify-content: start;
    background-color: var(--color-card);
    border-radius: 7px;
}
.create-qzone-config {
    display: flex;
    justify-content: end;
    padding: 0 30px 10px 0;
    width: 100%;
    z-index: 10;
}
.create-qzone-config > svg {
    cursor: pointer;
    color: var(--color-font-2);
    font-size: 1rem;
    margin-left: 15px;
}
.create-qzone-img {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    justify-content: start !important;
    margin: -10px 0 -1rem 20px;
}
.create-qzone-img-item {
    position: relative;
}
.create-qzone-img img {
    display: block;
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 10px;
    background: var(--color-card);
    aspect-ratio: 1 / 1;
}
.create-qzone-img-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
}
.create-qzone-img-remove :deep(svg) {
    margin: 0 0 3px 0 !important;
    font-size: 0.85rem !important;
}
.qzone-view-header > div {
    display: flex;
    align-items: center;
}
.qzone-view-header > div > div {
    flex: 1;
    justify-content: end;
    display: flex;
}
.qzone-view-header div > a {
    margin: 5px;
    display: flex;
    flex-direction: column;
    font-size: 0.7rem;
    color: var(--color-font-1);
    background: var(--color-card);
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 7px;
    align-items: center;
    justify-content: center;
    padding: 5px;
}
.qzone-view-header svg {
    margin-bottom: 5px;
    font-size: 1rem;
}

.qzone-feed-items {
    column-width: 300px;
    column-gap: 12px;
    overflow: visible;
}

.qzone-feed-card {
    break-inside: avoid;
    display: inline-block;
    box-sizing: border-box;
    width: 100%;
    margin-top: 10px;
    opacity: 0;
    transform: translateY(-18px);
    animation: qzone-feed-card-enter 0.3s ease-out forwards;
}
.qzone-feed-card:nth-child(6n + 1) { animation-delay: 0.02s; }
.qzone-feed-card:nth-child(6n + 2) { animation-delay: 0.06s; }
.qzone-feed-card:nth-child(6n + 3) { animation-delay: 0.1s; }
.qzone-feed-card:nth-child(6n + 4) { animation-delay: 0.14s; }
.qzone-feed-card:nth-child(6n + 5) { animation-delay: 0.18s; }
.qzone-feed-card:nth-child(6n) { animation-delay: 0.22s; }
.qzone-feed-card-header {
    letter-spacing: normal;
    display: flex;
    align-items: center;
}
.qzone-feed-card-header img {
    width: 35px;
    height: 35px;
    border-radius: 35px;
    margin-right: 10px;
}
.qzone-feed-card-header svg {
    font-size: 17px;
    margin-left: 17px;
}

.qzone-feed-meta {
    display: flex;
    flex-direction: column;
    flex: 1;
}
.qzone-feed-meta a {
    font-weight: normal;
    font-size: 0.85rem;
}
.qzone-feed-meta span {
    font-size: 0.75rem;
    font-weight: normal;
    color: var(--color-font-2);
}
.qzone-feed-like-action {
    margin-left: auto;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    color: var(--color-font-2);
    display: flex;
    align-items: center;
}

.qzone-feed-body.forward {
    background: #0000000f;
    padding: 15px;
    border-radius: 7px;
}

.qzone-feed-content {
    display: inline-block;
}
.qzone-feed-images {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 12px;
    display: grid;
    gap: 8px;
}
.qzone-feed-image {
    background: var(--color-card-1);
    border-radius: 10px;
    object-fit: cover;
    aspect-ratio: 1 / 1;
    width: 100%;
}

.qzone-feed-foot {
    margin-top: 20px;
}
.qzone-feed-foot > div:first-child {
    display: flex;
}
.qzone-feed-foot .visitor {
    font-size: 0.75rem;
    color: var(--color-font-2);
}
.qzone-feed-foot .likes {
    margin-top: 5px;
    font-size: 0.75rem;
}
.qzone-feed-forward-title,
.qzone-feed-foot .likes a,
.qzone-feed-replies a {
    text-decoration: none;
    opacity: 0.7;
}

.qzone-feed-replies {
    font-size: 0.85rem;
}
.qzone-feed-replies hr {
    color: var(--color-card-1);
    opacity: 0.4;
}
.qzone-feed-reply {
    background: var(--color-card-2);
    margin-top: 10px;
    padding: 5px 10px 5px 5px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    width: calc(100% - 10px);
}
.qzone-feed-reply img {
    border-radius: 25px;
    width: 20px;
    height: 20px;
}
.qzone-feed-reply input {
    background: transparent;
    outline: none;
    height: 22px;
    font-size: 0.85rem;
    flex: 1;
}
.qzone-feed-reply svg {
    color: var(--color-font-2);
    font-size: 13px;
}
.qzone-feed-reply-action {
    border: none;
    background: transparent;
    padding: 0;
    margin-left: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
}
.qzone-feed-reply-image-action {
    position: relative;
}
.qzone-feed-reply-image-badge {
    position: absolute;
    top: -6px;
    right: -8px;
    height: 14px;
    border-radius: 999px;
    background: var(--color-main);
    color: var(--color-font-r);
    font-size: 0.65rem;
    line-height: 14px;
    text-align: center;
    padding: 0 5px;
}

.qzone-feed-load-state {
    color: var(--color-font-2);
    text-align: center;
    break-inside: avoid;
    display: inline-block;
    box-sizing: border-box;
    width: 100%;
    padding: 18px 0 8px 0;
    font-size: 0.8rem;
    margin-top: 10px;
}

@keyframes qzone-feed-card-enter {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .qzone-feed-card {
        opacity: 1;
        transform: none;
        animation: none;
    }
}
</style>
