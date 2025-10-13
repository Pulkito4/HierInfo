import React, { useState } from 'react';
import { Category } from '@/types';
import { updateUserPreferences } from '@/lib/supabaseAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, User, Palette, Shield } from 'lucide-react';
import LoadingSkeleton from '@/components/ui/loading-skeleton';

interface SettingsPanelProps {
  user: any;
  categories: Category[];
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSavePreferences = async () => {
    if (!user?.id || !selectedCategory) return;

    setSaving(true);
    try {
      await updateUserPreferences(user.id, selectedCategory);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <LoadingSkeleton type="profile" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <User className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="text-xl font-semibold">Profile</h3>
            <p className="text-gray-600 dark:text-gray-400">Your account information</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <p className="text-lg">{user.user_metadata?.username || user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="text-lg">{user.email}</p>
          </div>
        </div>
      </Card>

      {/* News Preferences */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Palette className="w-8 h-8 text-green-500" />
          <div>
            <h3 className="text-xl font-semibold">News Preferences</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your preferred news category for personalized feed
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Preferred Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="cursor-pointer p-2 text-sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={!selectedCategory || saving}
            className="mt-4"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Bell className="w-8 h-8 text-yellow-500" />
          <div>
            <h3 className="text-xl font-semibold">Notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure how you want to be notified about breaking news
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Breaking News Alerts</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified about critical news updates
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Daily Digest</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive a summary of top stories each day
              </p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Shield className="w-8 h-8 text-red-500" />
          <div>
            <h3 className="text-xl font-semibold">Privacy & Security</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your privacy settings and account security
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download My Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPanel;