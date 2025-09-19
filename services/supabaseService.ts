
import { supabase } from '../app/integrations/supabase/client';
import type { Database } from '../app/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type DailyEntry = Tables['daily_entries']['Row'];
type DailyEntryInsert = Tables['daily_entries']['Insert'];
type Activity = Tables['activities']['Row'];
type ActivityInsert = Tables['activities']['Insert'];
type User = Tables['users']['Row'];
type UserInsert = Tables['users']['Insert'];

export class SupabaseService {
  // Connection test
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Connection test successful');
      return { success: true };
    } catch (err) {
      console.error('Connection test error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  // User operations
  static async createUser(userData: UserInsert): Promise<{ data?: User; error?: string }> {
    try {
      console.log('Creating user:', userData);
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        console.error('Create user failed:', error);
        return { error: error.message };
      }
      
      console.log('User created successfully:', data);
      return { data };
    } catch (err) {
      console.error('Create user error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async getUser(userId: string): Promise<{ data?: User; error?: string }> {
    try {
      console.log('Getting user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Get user failed:', error);
        return { error: error.message };
      }
      
      console.log('User retrieved successfully:', data);
      return { data };
    } catch (err) {
      console.error('Get user error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Daily entries operations
  static async createDailyEntry(entryData: DailyEntryInsert): Promise<{ data?: DailyEntry; error?: string }> {
    try {
      console.log('Creating daily entry:', entryData);
      const { data, error } = await supabase
        .from('daily_entries')
        .insert(entryData)
        .select()
        .single();
      
      if (error) {
        console.error('Create daily entry failed:', error);
        return { error: error.message };
      }
      
      console.log('Daily entry created successfully:', data);
      return { data };
    } catch (err) {
      console.error('Create daily entry error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async getDailyEntries(userId: string, limit = 30): Promise<{ data?: DailyEntry[]; error?: string }> {
    try {
      console.log('Getting daily entries for user:', userId);
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Get daily entries failed:', error);
        return { error: error.message };
      }
      
      console.log('Daily entries retrieved successfully:', data?.length, 'entries');
      return { data };
    } catch (err) {
      console.error('Get daily entries error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async updateDailyEntry(entryId: string, updates: Partial<DailyEntry>): Promise<{ data?: DailyEntry; error?: string }> {
    try {
      console.log('Updating daily entry:', entryId, updates);
      const { data, error } = await supabase
        .from('daily_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) {
        console.error('Update daily entry failed:', error);
        return { error: error.message };
      }
      
      console.log('Daily entry updated successfully:', data);
      return { data };
    } catch (err) {
      console.error('Update daily entry error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Activity operations
  static async addActivity(activityData: ActivityInsert): Promise<{ data?: Activity; error?: string }> {
    try {
      console.log('Adding activity:', activityData);
      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();
      
      if (error) {
        console.error('Add activity failed:', error);
        return { error: error.message };
      }
      
      console.log('Activity added successfully:', data);
      return { data };
    } catch (err) {
      console.error('Add activity error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async getActivities(dailyEntryId: string): Promise<{ data?: Activity[]; error?: string }> {
    try {
      console.log('Getting activities for daily entry:', dailyEntryId);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('daily_entry_id', dailyEntryId)
        .order('completed_at', { ascending: false });
      
      if (error) {
        console.error('Get activities failed:', error);
        return { error: error.message };
      }
      
      console.log('Activities retrieved successfully:', data?.length, 'activities');
      return { data };
    } catch (err) {
      console.error('Get activities error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // Auth operations
  static async signUp(email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });
      
      if (error) {
        console.error('Sign up failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Sign up successful:', data);
      return { 
        success: true, 
        message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.' 
      };
    } catch (err) {
      console.error('Sign up error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Sign in successful:', data);
      return { success: true, message: 'Anmeldung erfolgreich!' };
    } catch (err) {
      console.error('Sign in error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Sign out successful');
      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  static async getCurrentUser() {
    try {
      console.log('Getting current user session');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session failed:', error);
        return { session: null, error: error.message };
      }
      
      console.log('Session retrieved:', session ? 'Authenticated' : 'Not authenticated');
      return { session, error: null };
    } catch (err) {
      console.error('Get session error:', err);
      return { 
        session: null, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  // Statistics and calculations
  static async calculateStreak(userId: string): Promise<{ streak: number; error?: string }> {
    try {
      console.log('Calculating streak for user:', userId);
      const { data, error } = await supabase
        .from('daily_entries')
        .select('date, total_points')
        .eq('user_id', userId)
        .gte('total_points', 1)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Calculate streak failed:', error);
        return { streak: 0, error: error.message };
      }
      
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < (data?.length || 0); i++) {
        const entryDate = new Date(data![i].date);
        const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === i) {
          streak++;
        } else {
          break;
        }
      }
      
      console.log('Streak calculated:', streak);
      return { streak };
    } catch (err) {
      console.error('Calculate streak error:', err);
      return { 
        streak: 0, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
}
