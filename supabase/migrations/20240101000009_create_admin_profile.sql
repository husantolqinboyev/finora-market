-- Create profile for current user and set as admin
INSERT INTO profiles (id, auth_user_id, is_admin, full_name, phone, telegram_username, created_at, updated_at)
VALUES (
  '45914288-f1b7-4e77-8ea3-4c3bde664951',
  '45914288-f1b7-4e77-8ea3-4c3bde664951',
  true,
  'Admin User',
  '+998000000000',
  'admin_user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  updated_at = NOW();
