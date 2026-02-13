/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import { supabase } from './supabase';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  position: string;
  department: string;
  inviteCode?: string;
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        const userData = await this.getUserProfile(data.user.id);
        return { user: userData, session: data.session };
      }

      return { user: null, session: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp({ email, password, name, position, department, inviteCode }: RegisterData) {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then create the user profile
        const userProfile: Partial<User> = {
          id: authData.user.id,
          email,
          name,
          position,
          department: department as any,
          role: 'CREW', // Default role, will be updated based on position
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If invite code provided, validate and link to vessel
        if (inviteCode) {
          const vessel = await this.validateInviteCode(inviteCode);
          if (vessel) {
            userProfile.vesselId = vessel.id;
          }
        }

        const { error: profileError } = await supabase
          .from('users')
          .insert([userProfile]);

        if (profileError) throw profileError;

        return { user: userProfile as User, session: authData.session };
      }

      return { user: null, session: null };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Validate invite code and get vessel
   */
  async validateInviteCode(inviteCode: string) {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .select('*')
        .eq('inviteCode', inviteCode)
        .single();

      if (error) throw error;

      // Check if invite code is expired
      if (data && new Date(data.inviteExpiry) < new Date()) {
        throw new Error('Invite code has expired');
      }

      return data;
    } catch (error) {
      console.error('Validate invite code error:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await this.getUserProfile(session.user.id);
        callback(userData);
      } else {
        callback(null);
      }
    });
  }
}

export default new AuthService();
