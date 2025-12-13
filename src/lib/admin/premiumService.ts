import { createClient } from '@supabase/supabase-js'

// Service role client for admin operations
// This bypasses RLS but should only be used for verified admin operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables check:', {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '***exists***' : 'missing',
  allEnv: Object.keys(import.meta.env)
});

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
}

const supabaseService = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function updateUserPremiumAsAdmin(
  adminId: string,
  targetUserId: string,
  premiumData: {
    is_premium: boolean
    premium_end_date?: string | null
    daily_post_limit: number
    ai_analysis_limit: number
  }
) {
  // First verify the admin is actually an admin
  const { data: adminCheck, error: adminError } = await supabaseService
    .from('profiles')
    .select('is_admin')
    .eq('id', adminId)
    .single()

  if (adminError || !adminCheck?.is_admin) {
    throw new Error('Unauthorized: Only admins can update premium status')
  }

  // Update the user's premium status using service role
  const { data, error } = await supabaseService
    .from('profiles')
    .update({
      is_premium: premiumData.is_premium,
      premium_end_date: premiumData.premium_end_date,
      daily_post_limit: premiumData.daily_post_limit,
      ai_analysis_limit: premiumData.ai_analysis_limit,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetUserId)
    .select()

  if (error) {
    throw new Error(`Failed to update premium status: ${error.message}`)
  }

  return data
}

export async function removeUserPremiumAsAdmin(adminId: string, targetUserId: string) {
  return updateUserPremiumAsAdmin(adminId, targetUserId, {
    is_premium: false,
    premium_end_date: null,
    daily_post_limit: 1,
    ai_analysis_limit: 10
  })
}
