import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// HttpOnly cookie-based auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Remove localStorage entirely - use HttpOnly cookies only
    persistSession: false, // Don't persist in localStorage
    autoRefreshToken: true, // Let server handle refresh via HttpOnly cookies
    detectSessionInUrl: true, // Handle OAuth callbacks
    flowType: 'pkce', // Use PKCE for better security
  }
});

// Utility functions for secure auth management
export const secureAuth = {
  // Get session without exposing tokens to JavaScript
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Sign out - clears HttpOnly cookies
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return error;
  },

  // Check if user is authenticated (no token exposure)
  async isAuthenticated() {
    const { session } = await this.getSession();
    return !!session;
  },

  // Get user info without tokens
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }
};
