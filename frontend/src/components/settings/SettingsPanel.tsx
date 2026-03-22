import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Trash2, ChevronRight, Bell, Shield, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

const SettingsPanel = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [, setProfile] = useState<{ username?: string } | null>(null);
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
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

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
      setSaveSuccess('Username updated successfully');
      setTimeout(() => setSaveSuccess(null), 3000);
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
          <h2 className="text-xl font-bold text-slate-100 mb-4">Please log in to access settings</h2>
          <Button 
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-coral to-coral-light"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* User Profile Section */}
      <div className="bg-slate-900/75 rounded-2xl p-6 border border-slate-700/70 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
            <User className="w-6 h-6 text-coral" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Your Profile</h3>
            <p className="text-sm text-slate-400">Manage your account details</p>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={loading ? 'Loading...' : 'Enter a display name'}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all"
                disabled={loading || saving}
              />
              <Button 
                onClick={handleSaveUsername} 
                disabled={loading || saving}
                className="bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white px-6 rounded-xl"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-rose-500 mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-teal-light mt-2">{saveSuccess}</p>
            )}
          </div>

          {/* Email */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Email address</span>
              <span className="text-sm font-medium text-slate-100">
                {user.email || 'Not available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-900/75 rounded-2xl p-6 border border-slate-700/70 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-teal" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Your Preferences</h3>
            <p className="text-sm text-slate-400">Customize your news experience</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="ghost"
            onClick={() => router.push('/categories')}
            className="w-full justify-between hover:bg-slate-800 text-slate-200 h-12 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-coral" />
              <span>Topic Interests</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </Button>

          <Button 
            variant="ghost"
            className="w-full justify-between hover:bg-slate-800 text-slate-500 h-12 rounded-xl cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded-lg text-slate-400">Soon</span>
          </Button>
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="bg-slate-900/75 rounded-2xl p-6 border border-slate-700/70 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-rose-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Account Security</h3>
            <p className="text-sm text-slate-400">Manage your account access</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start hover:bg-slate-800 text-slate-200 h-12 rounded-xl"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-500" />
            Sign Out
          </Button>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start hover:bg-rose-500/10 text-rose-300 h-12 rounded-xl"
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Delete Account
            </Button>
          ) : (
            <div className="mt-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
              <p className="text-sm text-rose-300 font-medium mb-3">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 rounded-xl"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete Account'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 border-slate-300 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gradient-to-r from-coral/5 to-teal/5 rounded-2xl p-6 border border-coral/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6 text-coral" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">HierInfo Premium</h3>
            <p className="text-sm text-slate-500">
              You&apos;re on the free plan. All core features are available!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-sm text-slate-400">
          HierInfo — News that respects your time
        </p>
        <p className="text-xs text-slate-300 mt-1">
          Version 1.0
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
