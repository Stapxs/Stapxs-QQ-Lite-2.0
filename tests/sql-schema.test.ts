import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('PostgreSQL SQL Schema & RLS Migrations', () => {
  const migrationPath = resolve(__dirname, '../supabase/migrations/20261028000000_p1_initial_schema.sql')
  const migrationSql = readFileSync(migrationPath, 'utf-8')

  it('creates isolated private schema with restricted permissions', () => {
    expect(migrationSql).toContain('CREATE SCHEMA IF NOT EXISTS private;')
    expect(migrationSql).toContain('REVOKE ALL ON SCHEMA private FROM PUBLIC;')
    expect(migrationSql).toContain('REVOKE ALL ON SCHEMA private FROM anon;')
    expect(migrationSql).toContain('GRANT USAGE ON SCHEMA private TO authenticated;')
    expect(migrationSql).toContain('GRANT USAGE ON SCHEMA private TO service_role;')
    expect(migrationSql).not.toContain('REVOKE ALL ON SCHEMA private FROM authenticated;')
  })

  it('defines all 4 required tables with proper foreign keys and constraints', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.profiles')
    expect(migrationSql).toContain('REFERENCES auth.users(id) ON DELETE CASCADE')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.rooms')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.room_members')
    expect(migrationSql).toContain('PRIMARY KEY (room_id, user_id)')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.messages')
    expect(migrationSql).toContain('char_length(trim(content)) >= 1 AND char_length(content) <= 4000')
  })

  it('creates composite cursor index on (room_id, created_at DESC, id DESC)', () => {
    expect(migrationSql).toContain('CREATE INDEX IF NOT EXISTS idx_messages_room_history')
    expect(migrationSql).toContain('(room_id, created_at DESC, id DESC)')
  })

  it('implements security helper private.is_room_member with zero-parameter spoofing', () => {
    expect(migrationSql).toContain('FUNCTION private.is_room_member(_room_id uuid)')
    // Crucial: Must NOT accept user_id parameter from caller
    expect(migrationSql).not.toContain('FUNCTION private.is_room_member(_room_id uuid, _user_id uuid)')
    expect(migrationSql).toContain('SECURITY DEFINER')
    expect(migrationSql).toContain("SET search_path = ''")
    expect(migrationSql).toContain('(SELECT auth.uid())')
    expect(migrationSql).toContain('REVOKE ALL ON FUNCTION private.is_room_member(uuid) FROM PUBLIC;')
    expect(migrationSql).toContain('REVOKE ALL ON FUNCTION private.is_room_member(uuid) FROM anon;')
    expect(migrationSql).toContain('GRANT EXECUTE ON FUNCTION private.is_room_member(uuid) TO authenticated;')
  })

  it('enables Row Level Security (RLS) on all 4 tables', () => {
    expect(migrationSql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;')
    expect(migrationSql).toContain('ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;')
    expect(migrationSql).toContain('ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;')
    expect(migrationSql).toContain('ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;')
  })

  it('strictly forbids client-side INSERT/UPDATE/DELETE on rooms and room_members', () => {
    // There must be NO client insert/update/delete policies for rooms or room_members
    expect(migrationSql).not.toContain('CREATE POLICY "rooms_insert"')
    expect(migrationSql).not.toContain('CREATE POLICY "rooms_update"')
    expect(migrationSql).not.toContain('CREATE POLICY "rooms_delete"')
    expect(migrationSql).not.toContain('CREATE POLICY "room_members_insert"')
    expect(migrationSql).not.toContain('CREATE POLICY "room_members_update"')
    expect(migrationSql).not.toContain('CREATE POLICY "room_members_delete"')
  })

  it('enforces membership and identity check on message insertion', () => {
    expect(migrationSql).toContain('CREATE POLICY "messages_insert_member" ON public.messages')
    expect(migrationSql).toContain('user_id = (SELECT auth.uid())')
    expect(migrationSql).toContain('private.is_room_member(room_id)')
  })
})
