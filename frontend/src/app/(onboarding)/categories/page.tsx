//category selection page
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, updateUserPreferences, getCurrentUser } from '@/lib/supabaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      // Add debug info to help troubleshoot
      console.log('Loading categories page...');

      const [categoriesResult, userResult] = await Promise.all([
        getCategories(),
        getCurrentUser()
      ]);

      console.log('Categories result:', categoriesResult);
      console.log('User result:', userResult);

      if (categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      }
      
      if (userResult.user) {
        setUser(userResult.user);
      } else {
        router.push('/sign-in');
        return;
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleSavePreferences = async () => {
    if (!selectedCategory || !user) return;

    setSaving(true);
    try {
      const { profile, error } = await updateUserPreferences(user.id, selectedCategory);
      
      if (error) {
        console.error('Error saving preferences:', error);
        // You might want to show a toast or alert here
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to save preferences: ${errorMessage}`);
      } else {
        console.log('Preferences saved successfully:', profile);
        router.push('/home');
      }
    } catch (error) {
      console.error('Unexpected error saving preferences:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101130]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101130] p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Choose Your Interest</CardTitle>
            <p className="text-center text-gray-300">Select a category to personalize your experience</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-white/30 hover:border-white/50 text-white'
                  }`}
                >
                  <div className="font-medium">{category.name}</div>
                </button>
              ))}
            </div>
            
            <Button 
              onClick={handleSavePreferences}
              disabled={!selectedCategory || saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
