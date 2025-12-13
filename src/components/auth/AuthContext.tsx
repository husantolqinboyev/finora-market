import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  signInWithGoogle: () => Promise<{ error?: { message?: string } | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: { message?: string } | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: { message?: string } | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (metadata: Record<string, string | number | boolean>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
