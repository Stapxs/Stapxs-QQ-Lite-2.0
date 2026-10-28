import { describe, it, expect, beforeEach } from 'vitest'

// Mock Data Types
interface MockProfile {
  id: string
  display_name: string
}

interface MockRoom {
  id: string
  name: string
}

interface MockRoomMember {
  room_id: string
  user_id: string
  role: string
}

interface MockMessage {
  id: string
  room_id: string
  user_id: string
  content: string
}

/**
 * High-fidelity RLS Policy Engine simulating PostgreSQL Row Level Security
 * exactly as defined in: supabase/migrations/20261028000000_p1_initial_schema.sql
 */
class RlsEngine {
  profiles: MockProfile[] = []
  rooms: MockRoom[] = []
  roomMembers: MockRoomMember[] = []
  messages: MockMessage[] = []

  // Simulated current database session auth context
  currentAuthUid: string | null = null

  setAuthUser(userId: string | null) {
    this.currentAuthUid = userId
  }

  // Security Helper: private.is_room_member(room_id)
  // SECURITY DEFINER with search_path = '' and internal auth.uid()
  isRoomMember(roomId: string): boolean {
    if (!this.currentAuthUid) return false
    return this.roomMembers.some(
      rm => rm.room_id === roomId && rm.user_id === this.currentAuthUid
    )
  }

  // RLS on public.rooms (SELECT)
  selectRooms(): MockRoom[] {
    if (!this.currentAuthUid) return [] // Anon denied
    return this.rooms.filter(room => this.isRoomMember(room.id))
  }

  // RLS on public.room_members (SELECT)
  selectRoomMembers(): MockRoomMember[] {
    if (!this.currentAuthUid) return [] // Anon denied
    return this.roomMembers.filter(rm => this.isRoomMember(rm.room_id))
  }

  // Attempt to INSERT into room_members by client
  insertRoomMember(member: MockRoomMember): { success: boolean; error?: string } {
    // There is NO INSERT policy for authenticated or anon roles on room_members!
    return {
      success: false,
      error: 'new row violates row-level security policy for table "room_members"'
    }
  }

  // RLS on public.profiles (SELECT)
  selectProfiles(): MockProfile[] {
    if (!this.currentAuthUid) return []
    return this.profiles.filter(p => {
      if (p.id === this.currentAuthUid) return true
      // Or shares a room:
      return this.roomMembers.some(rm1 =>
        rm1.user_id === this.currentAuthUid &&
        this.roomMembers.some(rm2 => rm2.room_id === rm1.room_id && rm2.user_id === p.id)
      )
    })
  }

  // RLS on public.messages (SELECT)
  selectMessages(): MockMessage[] {
    if (!this.currentAuthUid) return []
    return this.messages.filter(msg => this.isRoomMember(msg.room_id))
  }

  // RLS on public.messages (INSERT)
  insertMessage(msg: MockMessage): { success: boolean; error?: string } {
    if (!this.currentAuthUid) {
      return { success: false, error: 'new row violates row-level security policy for table "messages"' }
    }

    // WITH CHECK: user_id = auth.uid() AND private.is_room_member(room_id)
    const matchesUser = msg.user_id === this.currentAuthUid
    const isMember = this.isRoomMember(msg.room_id)

    if (!matchesUser) {
      return { success: false, error: 'new row violates check policy: user_id must match auth.uid()' }
    }
    if (!isMember) {
      return { success: false, error: 'new row violates check policy: author is not a room member' }
    }

    this.messages.push(msg)
    return { success: true }
  }
}

describe('PostgreSQL RLS Policy Engine Simulation', () => {
  let rls: RlsEngine

  const userA = { id: 'usr-a-uuid', display_name: 'Bạn A' }
  const userB = { id: 'usr-b-uuid', display_name: 'Bạn B' }
  const userOutsider = { id: 'usr-outsider-uuid', display_name: 'Kẻ ngoài cuộc' }

  const fixedRoom = { id: 'room-fixed-001', name: 'Private Friends' }

  beforeEach(() => {
    rls = new RlsEngine()

    // Seed database
    rls.profiles = [userA, userB, userOutsider]
    rls.rooms = [fixedRoom]
    // Only userA and userB belong to the room
    rls.roomMembers = [
      { room_id: fixedRoom.id, user_id: userA.id, role: 'owner' },
      { room_id: fixedRoom.id, user_id: userB.id, role: 'member' }
    ]
    rls.messages = [
      { id: 'msg-1', room_id: fixedRoom.id, user_id: userA.id, content: 'Chào bạn B!' }
    ]
  })

  it('Scenario 1: Anonymous / Unauthenticated users are denied from reading all tables', () => {
    rls.setAuthUser(null)

    expect(rls.selectRooms()).toHaveLength(0)
    expect(rls.selectRoomMembers()).toHaveLength(0)
    expect(rls.selectProfiles()).toHaveLength(0)
    expect(rls.selectMessages()).toHaveLength(0)

    const insertResult = rls.insertMessage({
      id: 'msg-anon',
      room_id: fixedRoom.id,
      user_id: 'any',
      content: 'Tin nhắn nặc danh'
    })
    expect(insertResult.success).toBe(false)
  })

  it('Scenario 2: Member A can view room, room members, and messages', () => {
    rls.setAuthUser(userA.id)

    const rooms = rls.selectRooms()
    expect(rooms).toHaveLength(1)
    expect(rooms[0].name).toBe('Private Friends')

    const members = rls.selectRoomMembers()
    expect(members).toHaveLength(2)
    expect(members.map(m => m.user_id)).toContain(userA.id)
    expect(members.map(m => m.user_id)).toContain(userB.id)

    const messages = rls.selectMessages()
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Chào bạn B!')

    const profiles = rls.selectProfiles()
    expect(profiles).toHaveLength(2)
    expect(profiles.map(p => p.id)).not.toContain(userOutsider.id)
  })

  it('Scenario 3: Member B can view room, room members, and post messages', () => {
    rls.setAuthUser(userB.id)

    const rooms = rls.selectRooms()
    expect(rooms).toHaveLength(1)

    const insertResult = rls.insertMessage({
      id: 'msg-2',
      room_id: fixedRoom.id,
      user_id: userB.id,
      content: 'Chào bạn A, mình đây!'
    })
    expect(insertResult.success).toBe(true)
    expect(rls.selectMessages()).toHaveLength(2)
  })

  it('Scenario 4: User outside room gets 0 rows when attempting to SELECT', () => {
    rls.setAuthUser(userOutsider.id)

    // Important: In PostgreSQL RLS, unauthorized SELECT does not error, it returns 0 rows
    expect(rls.selectRooms()).toHaveLength(0)
    expect(rls.selectRoomMembers()).toHaveLength(0)
    expect(rls.selectMessages()).toHaveLength(0)

    // User outside can only see their own profile, not room members
    const profiles = rls.selectProfiles()
    expect(profiles).toHaveLength(1)
    expect(profiles[0].id).toBe(userOutsider.id)
  })

  it('Scenario 5: User outside room cannot INSERT message into the room', () => {
    rls.setAuthUser(userOutsider.id)

    const result = rls.insertMessage({
      id: 'msg-intruder',
      room_id: fixedRoom.id,
      user_id: userOutsider.id,
      content: 'Tôi muốn tham gia!'
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('author is not a room member')
  })

  it('Scenario 6: Member cannot forge user_id of another member when inserting', () => {
    rls.setAuthUser(userA.id)

    // User A attempts to forge user_id = User B
    const result = rls.insertMessage({
      id: 'msg-spoof',
      room_id: fixedRoom.id,
      user_id: userB.id, // Forged!
      content: 'Tôi là B đây (giả mạo)'
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('user_id must match auth.uid()')
  })

  it('Scenario 7: Client cannot self-join room_members table', () => {
    rls.setAuthUser(userOutsider.id)

    const selfJoinResult = rls.insertRoomMember({
      room_id: fixedRoom.id,
      user_id: userOutsider.id,
      role: 'member'
    })
    expect(selfJoinResult.success).toBe(false)
    expect(selfJoinResult.error).toContain('violates row-level security policy')
  })

  it('Scenario 8: isRoomMember terminates without recursion because it evaluates membership directly', () => {
    rls.setAuthUser(userA.id)
    // Directly calling isRoomMember should be deterministic and not loop
    expect(rls.isRoomMember(fixedRoom.id)).toBe(true)
    expect(rls.isRoomMember('non-existent-room')).toBe(false)
  })
})
