import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Trash2, ChevronRight, Bell, Shield, Sparkles } from 'lucide-react';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Please log in to access settings</h2>
          <Button 
            onClick={() => router.push('/login')}
            className="bg-[#1A1A1A] hover:bg-[#2D2D2D]"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Settings</h1>
        <p className="text-[#6B6B6B]">Manage your account and preferences</p>
      </div>

      {/* User Profile Section */}
      <Card className="p-6 bg-white border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-[#B45309]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">User Profile</h3>
            <p className="text-sm text-[#6B6B6B]">Manage your personal information</p>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Username
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={loading ? 'Loading...' : 'Enter a username'}
                className="flex-1 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B45309]/20 focus:border-[#B45309] transition-all"
                disabled={loading || saving}
              />
              <Button 
                onClick={handleSaveUsername} 
                disabled={loading || saving}
                className="bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white px-6"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-[#DC2626] mt-2">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-[#059669] mt-2">{saveSuccess}</p>
            )}
          </div>

          {/* Email */}
          <div className="pt-4 border-t border-[#E5E5E5]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Email address</span>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {user.email || 'Not available'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-6 bg-white border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#1E40AF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Preferences</h3>
            <p className="text-sm text-[#6B6B6B]">Customize your news experience</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="ghost"
            onClick={() => router.push('/categories')}
            className="w-full justify-between hover:bg-[#F5F5F4] text-[#1A1A1A] h-12"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-[#6B6B6B]" />
              <span>Category Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </Button>

          <Button 
            variant="ghost"
            className="w-full justify-between hover:bg-[#F5F5F4] text-[#1A1A1A] h-12 opacity-60 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#6B6B6B]" />
              <span>Notifications</span>
            </div>
            <span className="text-xs text-[#9CA3AF] bg-[#F5F5F4] px-2 py-1 rounded">Coming soon</span>
          </Button>
        </div>
      </Card>

      {/* Account Actions Section */}
      <Card className="p-6 bg-white border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FCE7F3] rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#BE185D]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Account Actions</h3>
            <p className="text-sm text-[#6B6B6B]">Manage your account security</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start hover:bg-[#F5F5F4] text-[#1A1A1A] h-12"
          >
            <LogOut className="w-4 h-4 mr-3 text-[#6B6B6B]" />
            Sign Out
          </Button>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full justify-start hover:bg-[#FEF2F2] text-[#DC2626] h-12"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Delete Account
            </Button>
          ) : (
            <div className="mt-4 p-4 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
              <p className="text-sm text-[#DC2626] font-medium mb-3">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C]"
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
                  className="flex-1 border-[#E5E5E5]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-[#9CA3AF] pt-4">
        HierInfo v1.0 • Built with care for news readers
      </p>
    </div>
  );
};

export default SettingsPanel;
