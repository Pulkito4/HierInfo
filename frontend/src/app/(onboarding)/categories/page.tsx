"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Newspaper, Heart } from "lucide-react";
import { toast } from "sonner";
import { updateUserMultiplePreferences } from "@/lib/supabaseAuth";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import ErrorMessage from "@/components/ui/error-message";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useQueryClient } from "@tanstack/react-query";
import { feedQueryKeys } from "@/lib/react-query";
import { CATEGORY_SKELETON_COUNT } from "@/lib/constants";
import Link from "next/link";

const CategoriesPage = () => {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch,
  } = useCategories();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .single();

        if (profile?.preferences) {
          if (
            typeof profile.preferences === "object" &&
            profile.preferences.categoryIds
          ) {
            setSelectedCategories(profile.preferences.categoryIds);
          } else if (typeof profile.preferences === "string") {
            setSelectedCategories([profile.preferences]);
          } else if (Array.isArray(profile.preferences)) {
            setSelectedCategories(profile.preferences);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchUserPreferences();
  }, [user, router]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!user?.id || selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setSaving(true);
    try {
      const result = await updateUserMultiplePreferences(
        user.id,
        selectedCategories
      );
      if (result.error) throw result.error;
      queryClient.invalidateQueries({ queryKey: feedQueryKeys.forYou(user.id) });
      toast.success("Your personalized feed is ready!");
      router.push("/home");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => router.push("/home");

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        <header className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">HierInfo</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <LoadingSkeleton type="categories" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <p className="text-slate-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">HierInfo</span>
            </Link>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-2 rounded-full bg-gradient-to-r from-coral to-coral-light" />
              <div className="w-10 h-2 rounded-full bg-gradient-to-r from-coral to-coral-light" />
              <div className="w-10 h-2 rounded-full bg-slate-200" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 border border-coral/20 mb-4">
                <Heart className="w-4 h-4 text-coral" />
                <span className="text-sm font-semibold text-coral">Step 2 of 2</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
                What interests you?
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Pick the topics you care about. We&apos;ll find the best stories for you.
              </p>
            </div>

            {/* Selected Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{selectedCategories.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">{categories.length}</span> selected
              </p>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-coral hover:text-coral-dark transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Categories Grid */}
            {categoriesError ? (
              <ErrorMessage
                error={categoriesError}
                onRetry={refetch}
                title="Failed to load categories"
              />
            ) : categoriesLoading === "loading" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: CATEGORY_SKELETON_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No categories available. Please contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`
                        relative p-5 rounded-xl border-2 transition-all duration-200 text-left
                        ${isSelected
                          ? "border-coral bg-coral/5 shadow-lg shadow-coral/10"
                          : "border-slate-200 bg-white hover:border-coral/50 hover:bg-slate-50"
                        }
                      `}
                    >
                      {/* Checkmark */}
                      <div
                        className={`
                          absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all
                          flex items-center justify-center
                          ${isSelected
                            ? "bg-coral border-coral"
                            : "border-slate-300"
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Category Name */}
                      <h3 className={`font-semibold ${isSelected ? "text-coral" : "text-slate-700"}`}>
                        {category.name}
                      </h3>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleSave}
                disabled={saving || selectedCategories.length === 0}
                className="flex items-center justify-center gap-2 px-8 py-3 text-base bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white font-semibold rounded-xl transition-all shadow-lg shadow-coral/25 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Create My Feed
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={saving}
                className="px-8 py-3 text-base border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 font-medium rounded-xl transition-all"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-center mt-6 text-sm text-slate-400">
              You can always change these later in settings
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CategoriesPage;
