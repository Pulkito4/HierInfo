// Reuse the single browser Supabase client to avoid multiple GoTrue instances
import { supabase } from '@/lib/supabase';

// Helper function to check if user profile exists
const checkUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Handle specific error cases first
      if (error.code === 'PGRST116') {
        // No rows returned - user profile doesn't exist
        return { profile: null, error: null };
      }
      
      if (error.message?.includes('relation "public.profiles" does not exist')) {
        return { 
          profile: null, 
          error: new Error('Profiles table missing. Please create it in your Supabase database.') 
        };
      }
      
      return { profile: null, error };
    }
    
    return { profile: data, error: null };
    
  } catch (err) {
    return { profile: null, error: err as Error };
  }
};

// Helper function to create user profile
const createUserProfile = async (userId: string, username: string) => {
  try {
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

    if (error) {
      if (error.message?.includes('relation "public.profiles" does not exist')) {
        return { 
          profile: null, 
          error: new Error('Profiles table missing. Please create it in your Supabase database.') 
        };
      }
      
      return { profile: null, error };
    }
    
    return { profile: data, error: null };
    
  } catch (err) {
    return { profile: null, error: err as Error };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  if (error || !data.user) {
    return { user: data.user, error, isNewUser: false };
  }

  // Check if profile exists
  const { profile } = await checkUserProfile(data.user.id);
  const isNewUser = !profile;

  return { user: data.user, error, isNewUser };
};

export const signUpWithEmail = async (email: string, password: string, username: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      return { user: null, error, isNewUser: false };
    }

    if (!data.user) {
      return { user: null, error: new Error('No user returned'), isNewUser: false };
    }

    // For email confirmation flow, don't create profile immediately
    // It will be created in the auth callback after email confirmation
    if (!data.session) {
      return { user: data.user, error: null, isNewUser: true };
    }

    // If immediate session (email confirmation disabled), create profile now
    const { error: profileError } = await createUserProfile(data.user.id, username);
    
    if (profileError) {
      // Profile creation failed but signup succeeded - profile can be created later
      return { user: data.user, error: null, isNewUser: true };
    }

    return { user: data.user, error: null, isNewUser: true };
  } catch (err) {
    return { user: null, error: err as Error, isNewUser: false };
  }
};

export const signInWithGoogle = async () => {
  // Get redirect parameter from current URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('redirect') || '/home';
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`
    },
  });
  return { error };
};

export const handleAuthCallback = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { user: null, error, isNewUser: false };
    }

    if (!user) {
      return { user: null, error: new Error('No user found'), isNewUser: false };
    }

    // Check if profile exists
    const { profile } = await checkUserProfile(user.id);
    let isNewUser = !profile;

    // Ensure profile exists for ALL new users (email or OAuth) before redirecting
    if (isNewUser) {
      const usernameFromMeta =
        (user.user_metadata as Record<string, unknown>)?.['username'] as string | undefined ||
        (user.user_metadata as Record<string, unknown>)?.['full_name'] as string | undefined ||
        user.email?.split('@')[0] ||
        'user';

      const { error: profileError } = await createUserProfile(user.id, usernameFromMeta);
      if (profileError) {
        return { user: null, error: profileError, isNewUser: false };
      }
      isNewUser = true;
    }

    return { user, error: null, isNewUser };
  } catch (err) {
    return { user: null, error: err as Error, isNewUser: false };
  }
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

// Function to get user preferences
export const getUserPreferences = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    if (error) {
      return { preferences: null, error };
    }
    
    return { preferences: profile?.preferences, error: null };
  } catch (err) {
    return { preferences: null, error: err };
  }
};


// Function to update user preferences (multiple categories)
export const updateUserMultiplePreferences = async (userId: string, categoryIds: string[]) => {
  try {
    // First, check if the profile exists
    const { profile: existingProfile } = await checkUserProfile(userId);
    
    if (!existingProfile) {
      // If profile doesn't exist, create it first
      const { data: user } = await supabase.auth.getUser();
      const username = user.user?.user_metadata?.username || 
                      user.user?.user_metadata?.full_name || 
                      user.user?.email?.split('@')[0] || 
                      'User';
      
      const { error: createError } = await createUserProfile(userId, username);
      if (createError) {
        return { profile: null, error: createError };
      }
    }
    
    // Store as JSON array in the preferences field
    const preferencesData = {
      categoryIds: categoryIds,
      updatedAt: new Date().toISOString()
    };
    
    // Now update the preferences
    const { data, error } = await supabase
      .from('profiles')
      .update({ preferences: preferencesData })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      // If the error is about missing column, try to handle it gracefully
      if (error.message?.includes('column "preferences" does not exist')) {
        return { profile: null, error: new Error('Database schema needs to be updated. Please add a "preferences" column to the profiles table.') };
      } else if (error.message?.includes('relation "public.profiles" does not exist')) {
        return { profile: null, error: new Error('Database schema missing. Please create the profiles table using the SQL in DATABASE_SETUP.md') };
      }
    }
    
    return { profile: data, error };
  } catch (err) {
    return { profile: null, error: err };
  }
};