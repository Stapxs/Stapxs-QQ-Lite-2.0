export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface RoomMember {
  room_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  sender?: Profile
}
