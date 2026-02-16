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
  vesselId?: string; // For when user creates their own vessel
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
  async signUp({ email, password, name, position, department, inviteCode, vesselId }: RegisterData) {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Determine user role (HOD for vessel creator, CREW otherwise)
        const role = vesselId ? 'HOD' : 'CREW';

        // Then create the user profile
        const userProfile: any = {
          id: authData.user.id,
          email,
          name,
          position,
          department: department as any,
          role: role as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If vesselId provided (user created vessel), use it
        if (vesselId) {
          userProfile.vessel_id = vesselId;
        }
        // Otherwise, if invite code provided, validate and link to vessel
        else if (inviteCode && inviteCode.trim()) {
          const vessel = await this.validateInviteCode(inviteCode);
          if (vessel) {
            userProfile.vessel_id = vessel.id;
          }
        }
        // If neither vesselId nor inviteCode provided, user can join a vessel later
        // vessel_id will be null

        const { error: profileError } = await supabase
          .from('users')
          .insert([userProfile]);

        if (profileError) throw profileError;

        // Map the profile to User type (snake_case -> camelCase)
        const mappedUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          position: userProfile.position,
          department: userProfile.department,
          role: userProfile.role,
          vesselId: userProfile.vessel_id, // Map vessel_id to vesselId
          profilePhoto: userProfile.profile_photo,
          createdAt: userProfile.created_at,
          updatedAt: userProfile.updated_at,
        };

        return { user: mappedUser, session: authData.session };
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
        .maybeSingle();

      if (error) throw error;
      
      // If no user found, return null (user doesn't have a profile yet)
      if (!data) {
        console.log('No user profile found for:', userId);
        return null;
      }
      
      // Map snake_case database columns to camelCase User type
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        position: data.position,
        department: data.department,
        role: data.role,
        vesselId: data.vessel_id, // Map vessel_id to vesselId
        profilePhoto: data.profile_photo,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as User;
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
        .eq('invite_code', inviteCode)
        .single();

      if (error) throw error;

      // Check if invite code is expired
      if (data && new Date(data.invite_expiry) < new Date()) {
        throw new Error('Invite code has expired');
      }

      return data;
    } catch (error) {
      console.error('Validate invite code error:', error);
      throw error;
    }
  }

  /**
   * Join a vessel using invite code (for users who registered without a vessel)
   */
  async joinVessel(userId: string, inviteCode: string) {
    try {
      // Validate invite code and get vessel
      const vessel = await this.validateInviteCode(inviteCode);
      
      if (!vessel) {
        throw new Error('Invalid invite code');
      }

      // Update user's vessel_id
      const { error } = await supabase
        .from('users')
        .update({ 
          vessel_id: vessel.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Return updated user profile
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error('Join vessel error:', error);
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
