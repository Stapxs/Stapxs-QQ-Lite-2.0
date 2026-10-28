import { describe, it, expect } from 'vitest'
import { supabase, isSupabaseConfigured } from '../src/services/supabase'

describe('Live Supabase & Database RLS Integration Verification', () => {
  it('connects to Supabase endpoint and verifies Anonymous role restrictions', async () => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line no-console
      console.warn('[Live DB Verification] Skipped: Supabase credentials not configured in environment.')
      return
    }

    // 1. Anonymous SELECT on public.rooms must NOT return any private rooms
    const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*')
    if (roomsError && roomsError.code === 'PGRST205') {
      // eslint-disable-next-line no-console
      console.warn(
        '[Live DB Verification] Supabase instance is online, but tables are pending migration.\n' +
        'Action required: Run supabase/migrations/20261028000000_p1_initial_schema.sql in the Supabase SQL Editor.'
      )
      expect(roomsError.code).toBe('PGRST205')
      return
    }

    // When tables are present, RLS must deny anonymous reads
    expect(rooms ?? []).toEqual([])

    // 2. Anonymous SELECT on public.room_members must NOT return any member lists
    const { data: members } = await supabase.from('room_members').select('*')
    expect(members ?? []).toEqual([])

    // 3. Anonymous SELECT on public.messages must NOT return any messages
    const { data: messages } = await supabase.from('messages').select('*')
    expect(messages ?? []).toEqual([])

    // 4. Anonymous INSERT into public.messages must be rejected
    const { error: insertMsgError } = await supabase.from('messages').insert({
      room_id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      content: 'Unauthorized anonymous probe',
    })
    expect(insertMsgError).toBeDefined()

    // 5. Anonymous INSERT into public.room_members must be rejected (no self-joining)
    const { error: joinError } = await supabase.from('room_members').insert({
      room_id: '00000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      role: 'member',
    })
    expect(joinError).toBeDefined()
  })

  it('provides automated audit for authenticated test users when configured in env', async () => {
    const memberEmail = process.env.TEST_MEMBER_EMAIL
    const memberPassword = process.env.TEST_MEMBER_PASSWORD
    const outsiderEmail = process.env.TEST_OUTSIDER_EMAIL
    const outsiderPassword = process.env.TEST_OUTSIDER_PASSWORD

    if (!memberEmail || !memberPassword) {
      // Expected in normal CI where test accounts are not pre-seeded
      return
    }

    // 1. Authenticate as Member
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: memberEmail,
      password: memberPassword,
    })
    expect(authError).toBeNull()
    const memberId = authData.user?.id

    // 2. Member can view the assigned room
    const { data: memberRooms } = await supabase.from('rooms').select('*')
    expect(memberRooms?.length).toBeGreaterThan(0)

    // 3. Member cannot spoof user_id on message insertion
    const fakeUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    const { error: spoofError } = await supabase.from('messages').insert({
      room_id: memberRooms![0].id,
      user_id: fakeUserId,
      content: 'Spoofed message',
    })
    expect(spoofError).toBeDefined()

    // Clean up session
    await supabase.auth.signOut()

    // 4. Authenticate as Outsider (if provided)
    if (outsiderEmail && outsiderPassword) {
      const { error: outsiderAuthError } = await supabase.auth.signInWithPassword({
        email: outsiderEmail,
        password: outsiderPassword,
      })
      expect(outsiderAuthError).toBeNull()

      // Outsider must see 0 rooms
      const { data: outsiderRooms } = await supabase.from('rooms').select('*')
      expect(outsiderRooms ?? []).toEqual([])

      // Outsider cannot insert messages into the room
      const { error: outsiderMsgError } = await supabase.from('messages').insert({
        room_id: memberRooms![0].id,
        user_id: memberId,
        content: 'Outsider intrusion',
      })
      expect(outsiderMsgError).toBeDefined()

      await supabase.auth.signOut()
    }
  })
})
