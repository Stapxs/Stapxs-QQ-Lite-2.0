-- ==============================================================================
-- P1: Seed Script (Fixed Room & Provisioning Instructions)
-- ==============================================================================

-- 1. Create the fixed private room (ID fixed or generated)
-- Using a known deterministic UUID for the single MVP room:
INSERT INTO public.rooms (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Private Friends',
  'Phòng chat riêng tư dành riêng cho 4 người bạn.'
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ==============================================================================
-- 2. HƯỚNG DẪN PROVISION 4 TÀI KHOẢN (Thực hiện bởi Owner trên Supabase Dashboard)
-- ==============================================================================
--
-- Bước A: Tắt tính năng đăng ký công khai (Public Signups Disabled):
--   1. Vào Supabase Dashboard -> Authentication -> Configuration (Providers) -> Email.
--   2. Tắt tùy chọn: "Allow new users to sign up" (chỉ cho phép Admin tạo tài khoản).
--   3. Tắt xác thực email nếu muốn đăng nhập ngay không cần click link xác nhận:
--      Tắt "Confirm email".
--
-- Bước B: Tạo 4 tài khoản trên Supabase Dashboard:
--   Vào Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create user"
--   Ví dụ 4 email:
--     - user1@friends.local (Tên hiển thị: Bạn 1)
--     - user2@friends.local (Tên hiển thị: Bạn 2)
--     - user3@friends.local (Tên hiển thị: Bạn 3)
--     - user4@friends.local (Tên hiển thị: Bạn 4)
--   (Đặt mật khẩu an toàn theo ý Owner; mật khẩu không bao giờ lưu trong code này).
--
-- Bước C: Sau khi tạo 4 users, chạy lệnh SQL sau trong Supabase SQL Editor để gán
--         4 thành viên vào phòng chat '00000000-0000-0000-0000-000000000001':
--
-- INSERT INTO public.room_members (room_id, user_id, role)
-- SELECT '00000000-0000-0000-0000-000000000001', id, 'member'
-- FROM auth.users
-- WHERE email IN (
--   'user1@friends.local',
--   'user2@friends.local',
--   'user3@friends.local',
--   'user4@friends.local'
-- )
-- ON CONFLICT (room_id, user_id) DO NOTHING;
-- ==============================================================================
