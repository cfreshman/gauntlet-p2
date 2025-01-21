import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Database } from '../database.types';

export type Profile = {
  id: string
  username: string
  email: string
  role: 'customer' | 'worker' | 'manager'
  team_id?: string
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, username: string, password: string, inviteId?: string | null) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<{ error: null | Error }>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Subscribe to profile changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile changed:', payload);
          if (payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  async function getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function validateUsername(username: string, userId?: string) {
    if (username.length < 3) {
      throw 'username must be at least 3 characters';
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      throw 'username must be alphanumeric';
    }

    // Check if username is taken
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    console.log(username, profiles)

    if (userId) {
      // For updates - check if taken by another user
      const existingUser = profiles?.find(p => p.id !== userId);
      if (existingUser) {
        throw 'username already taken';
      }
    } else {
      // For signup - check if taken by any user
      if (profiles?.length) {
        throw 'username already taken';
      }
    }
  }

  async function signUp(email: string, username: string, password: string, inviteId?: string | null) {
    try {
      await validateUsername(username);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-up`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email, username, password, inviteId })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      // Set the session from the response
      const { session } = data;
      if (!session) throw 'signup failed';

      // Set the session in Supabase client
      await supabase.auth.setSession(session);

      // Update auth state
      setUser(session.user);
      if (session.user) {
        await getProfile(session.user.id);
      }

    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'signup failed';
    }
  }

  async function signIn(username: string, password: string) {
    try {
      // Call our Edge Function instead of direct DB function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-in-with-username`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ username, password })
        }
      )

      const data = await response.json()
      
      if (data.error) {
        throw data.error.message
      }

      // Set the session from the response
      const { session } = data
      if (!session) throw 'invalid credentials'

      // Set the session in Supabase client
      await supabase.auth.setSession(session)

      // Update auth state
      setUser(session.user)
      if (session.user) {
        await getProfile(session.user.id)
      }

    } catch (error) {
      if (typeof error === 'string') {
        throw error
      }
      throw 'invalid credentials'
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function updateUsername(username: string) {
    try {
      if (!user) throw 'no user';

      await validateUsername(username, user.id);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (updateError) throw 'update failed';

      setProfile(profile => profile ? { ...profile, username } : null);
      return { error: null };
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  async function updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw 'update failed';
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  async function updateEmail(email: string) {
    try {
      if (!user) throw 'no user';

      const { error } = await supabase.rpc('update_email_admin', {
        user_id: user.id,
        new_email: email
      });

      if (error) throw 'update failed';

      // Profile will be updated automatically through realtime subscription
    } catch (error) {
      if (typeof error === 'string') {
        throw error;
      }
      throw 'update failed';
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateUsername,
    updatePassword,
    updateEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 