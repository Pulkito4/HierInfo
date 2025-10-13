"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowLeft, Save } from 'lucide-react';
import { updateUserMultiplePreferences } from '@/lib/supabaseAuth';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import ErrorMessage from '@/components/ui/error-message';
import { useAuth } from '@/lib/authContext';

const CategoriesPage = () => {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();

  const { categories, loading: categoriesLoading, error: categoriesError, refetch } = useCategories();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user profile to get existing preferences
        const { supabase } = await import('@/lib/supabase');
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferences) {
          // Handle different preference formats
          if (typeof profile.preferences === 'object' && profile.preferences.categoryIds) {
            setSelectedCategories(profile.preferences.categoryIds);
          } else if (typeof profile.preferences === 'string') {
            setSelectedCategories([profile.preferences]);
          } else if (Array.isArray(profile.preferences)) {
            setSelectedCategories(profile.preferences);
          }
        }
      } catch {
        // Ignore errors for now
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchUserPreferences();
  }, [user, router]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    if (!user?.id || selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserMultiplePreferences(user.id, selectedCategories);
      if (result.error) {
        throw result.error;
      }
      
      // Show success message and redirect
      alert('Preferences saved successfully!');
      router.push('/home');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/home');
  };

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-6">
          <LoadingSkeleton type="categories" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Your Interests
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Select multiple categories to personalize your news feed
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You can change these preferences anytime in settings
            </p>
          </div>
        </div>

        {/* Categories Selection */}
        <Card className="p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Available Categories</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Selected: {selectedCategories.length} categories
            </p>
          </div>

          {categoriesError ? (
            <ErrorMessage 
              error={categoriesError} 
              onRetry={refetch}
              title="Failed to load categories"
            />
          ) : categoriesLoading === 'loading' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No categories available. Please contact support.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`
                      relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    <div className={`
                      absolute top-3 right-3 w-6 h-6 rounded-full border-2 transition-all
                      ${isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}>
                      {isSelected && (
                        <Check className="w-4 h-4 text-white absolute top-0 left-0" />
                      )}
                    </div>

                    {/* Category Content */}
                    <div className="pr-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get personalized news from {category.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Selected Categories Preview */}
        {selectedCategories.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Selected Categories</h3>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((categoryId) => {
                const category = categories.find(cat => cat.id === categoryId);
                return category ? (
                  <Badge
                    key={categoryId}
                    variant="default"
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    {category.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(categoryId);
                      }}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSave}
            disabled={saving || selectedCategories.length === 0}
            className="flex items-center gap-2 px-8 py-3 text-lg"
            size="lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : `Save ${selectedCategories.length} Categories`}
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={saving}
            className="px-8 py-3 text-lg"
            size="lg"
          >
            Skip for Now
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t worry! You can always modify your preferences later in the settings page.
          </p>
        </div>

        {/* Debug Component - Remove this after testing */}

      </div>
    </div>
  );
};

export default CategoriesPage;