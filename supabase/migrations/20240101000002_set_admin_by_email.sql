-- Set admin role for specific user by email
UPDATE profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'husantolqinboyev08@gmail.com'
);
