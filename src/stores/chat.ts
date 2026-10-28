import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import type { Room, RoomMember } from '@/types/database'

export const useChatStore = defineStore('chat', () => {
  const rooms = ref<Room[]>([])
  const activeRoom = ref<Room | null>(null)
  const roomMembers = ref<RoomMember[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRooms() {
    if (!isSupabaseConfigured) return []

    loading.value = true
    error.value = null

    try {
      // Query rooms table - RLS filters only rooms user belongs to!
      const { data, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: true })

      if (roomError) {
        error.value = roomError.message
        return []
      }

      rooms.value = (data as Room[]) || []

      // If there is a room and none active, activate the first one
      if (rooms.value.length > 0 && !activeRoom.value) {
        await selectRoom(rooms.value[0])
      }

      return rooms.value
    } catch (err: any) {
      error.value = err.message || 'Không thể tải danh sách phòng chat.'
      return []
    } finally {
      loading.value = false
    }
  }

  async function selectRoom(room: Room) {
    activeRoom.value = room
    await fetchRoomMembers(room.id)
  }

  async function fetchRoomMembers(roomId: string) {
    if (!isSupabaseConfigured) return []

    try {
      // Query room_members joining profiles table
      const { data, error: membersError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          user_id,
          role,
          joined_at,
          profile:profiles (
            id,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('room_id', roomId)

      if (membersError) {
        // eslint-disable-next-line no-console
        console.error('[ChatStore] Error fetching members:', membersError.message)
        return []
      }

      // Map raw response
      roomMembers.value = (data || []).map((item: any) => ({
        room_id: item.room_id,
        user_id: item.user_id,
        role: item.role,
        joined_at: item.joined_at,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
      }))

      return roomMembers.value
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[ChatStore] Exception fetching members:', err)
      return []
    }
  }

  return {
    rooms,
    activeRoom,
    roomMembers,
    loading,
    error,
    fetchRooms,
    selectRoom,
    fetchRoomMembers,
  }
})
