-- ==============================================================================
-- P1: Initial Schema, Security Definer Helper, and Strict RLS Policies
-- Target: Private Friends Chat 1.0 (4 users, 1 private room)
-- ==============================================================================

-- 1. Create isolated 'private' schema for internal security helpers
CREATE SCHEMA IF NOT EXISTS private;

-- Ensure schema 'private' is strictly hidden from PostgREST API and unprivileged roles.
-- Note: 'authenticated' and 'service_role' require USAGE on schema 'private' so PostgreSQL
-- can resolve functions like private.is_room_member() in RLS policies without permission errors.
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- 2. Tables

-- 2.1. profiles table: public profiles for the 4 accounts
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(trim(display_name)) >= 1 AND char_length(display_name) <= 50),
  avatar_url text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles for authorized room members.';

-- 2.2. rooms table: 1 fixed private chat room
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) >= 1 AND char_length(name) <= 100),
  description text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rooms IS 'Private chat rooms (fixed room for MVP).';

-- 2.3. room_members table: tracks which user belongs to which room
CREATE TABLE IF NOT EXISTS public.room_members (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

COMMENT ON TABLE public.room_members IS 'Membership table connecting users to rooms.';

-- 2.4. messages table: chat messages with composite cursor index
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) >= 1 AND char_length(content) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS 'Plain text chat messages within rooms.';

-- Composite index for deterministic cursor pagination and catch-up sync: (room_id, created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_messages_room_history
  ON public.messages (room_id, created_at DESC, id DESC);

-- 3. Security Helper: private.is_room_member
-- Eliminates infinite recursion in RLS by executing as SECURITY DEFINER with empty search_path
-- Uses auth.uid() directly inside the function body so client cannot forge parameters.
CREATE OR REPLACE FUNCTION private.is_room_member(_room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE room_id = _room_id
      AND user_id = (SELECT auth.uid())
  );
$$;

-- Lock down execute permissions: only authenticated users and service_role can execute
REVOKE ALL ON FUNCTION private.is_room_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_room_member(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_room_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_room_member(uuid) TO service_role;

-- 4. Automatic profile creation trigger on auth.users (facilitates admin creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
      'Thành viên'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Row Level Security (RLS) - DEFAULT DENY ALL

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5.1. profiles RLS
-- Members can view their own profile or profiles of members sharing any room
CREATE POLICY "profiles_select_own_or_co_members" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.room_members rm1
    JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = (SELECT auth.uid())
      AND rm2.user_id = public.profiles.id
  )
);

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- 5.2. rooms RLS
-- Members can view the room they belong to
CREATE POLICY "rooms_select_member" ON public.rooms
FOR SELECT TO authenticated
USING (private.is_room_member(id));

-- NO INSERT, UPDATE, DELETE for client roles on rooms (admin/provisioning only)

-- 5.3. room_members RLS
-- Members can view the member list of the room they belong to
-- Uses private.is_room_member to prevent recursion
CREATE POLICY "room_members_select_member" ON public.room_members
FOR SELECT TO authenticated
USING (private.is_room_member(room_id));

-- NO INSERT, UPDATE, DELETE for client roles on room_members (prevents self-joining!)

-- 5.4. messages RLS
-- Members can view messages in their room
CREATE POLICY "messages_select_member" ON public.messages
FOR SELECT TO authenticated
USING (private.is_room_member(room_id));

-- Members can insert messages in their room with their own user_id
CREATE POLICY "messages_insert_member" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND private.is_room_member(room_id)
);

-- NO UPDATE, DELETE for client roles in MVP
