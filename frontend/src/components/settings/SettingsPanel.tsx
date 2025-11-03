import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

const SettingsPanel = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profile, setProfile] = useState<{ username?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
          setUsernameInput(data?.username ?? '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation is handled by the auth context
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete user profile data first
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Sign out and redirect
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: usernameInput })
        .eq('id', user.id);
      if (error) {
        setSaveError(error.message ?? 'Failed to update username');
        return;
      }
      setProfile((p) => ({ ...(p ?? {}), username: usernameInput }));
      setSaveSuccess('Username updated');
      // hide success after a short delay
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please log in to access settings</h2>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* User Profile Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Profile
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={loading ? 'Loading…' : 'Enter a username'}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || saving}
              />
              <Button onClick={handleSaveUsername} disabled={loading || saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-red-500 mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-green-500 mt-2">{saveSuccess}</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {user.email || 'Not available'}
            </span>
          </div>
         
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Preferences
          </h3>
        </div>
        <div className="space-y-3">
          <Button 
            variant="ghost"
            onClick={() => router.push('/categories')}
            className="w-full justify-between hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span>Category Preferences</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Account Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
        <div className="space-y-3">
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SettingsPanel