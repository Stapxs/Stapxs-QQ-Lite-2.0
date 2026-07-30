import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

export const useQzoneStore = defineStore('qzone', () => {
    const qzoneFeedList = ref<any[]>([])
    const state = shallowReactive({
        currentView: 'feed' as 'feed' | 'my',
        myPagePos: 0,
        myPageSize: 10,
        myHasMore: true,
        myLoading: false,
    })

    return {
        qzoneFeedList,
        state
    }
})
