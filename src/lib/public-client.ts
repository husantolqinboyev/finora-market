import { createClient } from '@supabase/supabase-js';

// Global public client for read-only operations
// This avoids Multiple GoTrueClient instances issue
export const publicSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
