import { createClient } from '@supabase/supabase-js';
import type { AuthError, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if user profile exists
const checkUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { profile: data, error };
};

// Helper function to create user profile
const createUserProfile = async (userId: string, username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      preferences: null, // Initialize preferences as null
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return { profile: data, error };
};export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error || !data.user) {
    return { user: data.user, error, isNewUser: false };
  }

  // Check if profile exists
  const { profile } = await checkUserProfile(data.user.id);
  const isNewUser = !profile;

  return { user: data.user, error, isNewUser };
};

export const signUpWithEmail = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        username: username
      }
    }
  });
  
  if (error || !data.user) {
    return { user: data.user, error, isNewUser: false };
  }

  // Create profile for new user
  const { profile, error: profileError } = await createUserProfile(data.user.id, username);
  
  if (profileError) {
    console.error('Error creating user profile:', profileError);
    // Don't fail the signup if profile creation fails, but log it
    // The profile can be created later or during the categories selection
  }
  
  return { user: data.user, error, isNewUser: true };
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: `${window.location.origin}/auth/callback`
    },
  });
  return { error };
};

export const handleAuthCallback = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error, isNewUser: false };
  }

  // Check if profile exists
  const { profile } = await checkUserProfile(user.id);
  const isNewUser = !profile;

  // If new user, create profile
  if (isNewUser) {
    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    await createUserProfile(user.id, username);
  }

  return { user, error: null, isNewUser };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Function to get categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');
  
  return { categories: data, error };
};

// ...existing code...

// Function to update user preferences
export const updateUserPreferences = async (userId: string, categoryId: string) => {
  try {
    console.log('Updating preferences for user:', userId, 'with category:', categoryId);
    
    // First, check if the profile exists
    const { profile: existingProfile } = await checkUserProfile(userId);
    
    if (!existingProfile) {
      // If profile doesn't exist, create it first
      console.log('Profile not found, creating one...');
      const { data: user } = await supabase.auth.getUser();
      const username = user.user?.user_metadata?.username || 
                      user.user?.user_metadata?.full_name || 
                      user.user?.email?.split('@')[0] || 
                      'User';
      
      const { profile: newProfile, error: createError } = await createUserProfile(userId, username);
      if (createError) {
        console.error('Error creating profile:', createError);
        return { profile: null, error: createError };
      }
    }
    
    // Now update the preferences
    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences: categoryId })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error details (raw):', error);
      console.error('Supabase error details (structured):', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('Supabase error stringified:', JSON.stringify(error, null, 2));
      
      // If the error is about missing column, try to handle it gracefully
      if (error.message?.includes('column "preferences" does not exist')) {
        console.warn('Preferences column does not exist in profiles table. Please add it to your database schema.');
        return { profile: null, error: new Error('Database schema needs to be updated. Please add a "preferences" column to the profiles table.') };
      } else if (error.message?.includes('relation "public.profiles" does not exist')) {
        console.error('Profiles table does not exist. Please create it using the SQL in DATABASE_SETUP.md');
        return { profile: null, error: new Error('Database schema missing. Please create the profiles table using the SQL in DATABASE_SETUP.md') };
      }
    }
    
    console.log('Update result:', { data, error });
    return { profile: data, error };
  } catch (err) {
    console.error('Unexpected error in updateUserPreferences:', err);
    return { profile: null, error: err };
  }
};