import React, { useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthContextType } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      // Admin status ni tekshirish o'rniga, hozircha false qaytaramiz
      // Chunki profiles table da is_admin column mavjud emas
      return false;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      return false;
    }
  };

  const checkPremiumStatus = async (userId: string): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('is_premium, premium_end_date')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Premium status check error:', error);
        return false;
      }
      
      // Check if user is premium and subscription is not expired
      const isUserPremium = data?.is_premium === true;
      const premiumEndDate = data?.premium_end_date;
      
      if (!isUserPremium || !premiumEndDate) {
        return false;
      }
      
      // Check if premium is still valid
      return new Date(premiumEndDate) > new Date();
    } catch (error) {
      console.error('Error in checkPremiumStatus:', error);
      return false;
    }
  };

  const checkNewUserStatus = async (userId: string): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('is_new_user, full_name, phone')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Agar profile bo'lmasa, yangi user hisoblanadi
        return error.code === 'PGRST116';
      }
      
      // Agar is_new_user true bo'lsa va ma'lumotlar to'liq bo'lmasa
      const hasIncompleteProfile = data?.is_new_user === true || 
             !data?.full_name || 
             !data?.phone || 
             data?.full_name === '' || 
             data?.phone === '';
      
      console.log('New user check result:', { userId, data, hasIncompleteProfile });
      return hasIncompleteProfile;
    } catch (error) {
      console.error('Error in checkNewUserStatus:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authStateInitialized = false;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.id);
        
        if (mounted && !authStateInitialized) {
          authStateInitialized = true;
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Check admin status asynchronously
          if (session?.user) {
            checkAdminStatus(session.user.id).then(adminStatus => {
              if (mounted) setIsAdmin(adminStatus);
            }).catch(error => {
              console.error('Error checking admin status:', error);
              if (mounted) setIsAdmin(false);
            });

            checkPremiumStatus(session.user.id).then(premiumStatus => {
              if (mounted) setIsPremium(premiumStatus);
            }).catch(error => {
              console.error('Error checking premium status:', error);
              if (mounted) setIsPremium(false);
            });
          } else {
            if (mounted) {
              setIsAdmin(false);
              setIsPremium(false);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted && !authStateInitialized) {
          authStateInitialized = true;
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsPremium(false);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Only process if this is a different state than what we already have
        const currentUserId = user?.id;
        const newUserId = session?.user?.id;
        
        if (mounted && currentUserId !== newUserId) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Check admin status, premium status, and new user status asynchronously
          if (session?.user) {
            checkAdminStatus(session.user.id).then(adminStatus => {
              if (mounted) setIsAdmin(adminStatus);
            }).catch(error => {
              console.error('Error checking admin status:', error);
              if (mounted) setIsAdmin(false);
            });

            checkPremiumStatus(session.user.id).then(premiumStatus => {
              if (mounted) setIsPremium(premiumStatus);
            }).catch(error => {
              console.error('Error checking premium status:', error);
              if (mounted) setIsPremium(false);
            });

            // Check if user needs profile setup
            checkNewUserStatus(session.user.id).then(isNewUser => {
              if (mounted && isNewUser) {
                // Only redirect if not already on profile-setup page
                if (!window.location.pathname.includes('/profile-setup')) {
                  window.location.href = '/profile-setup';
                }
              }
            }).catch(error => {
              console.error('Error checking new user status:', error);
            });
          } else {
            if (mounted) {
              setIsAdmin(false);
              setIsPremium(false);
            }
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/',
      },
    });
    return { error: error || null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error || undefined };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error || undefined };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserProfile = async (metadata: Record<string, string | number | boolean>) => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    isPremium,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};