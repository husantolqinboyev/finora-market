import { supabase } from './client';

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
