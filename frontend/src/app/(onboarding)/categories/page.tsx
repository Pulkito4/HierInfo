"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
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
import { Newspaper } from "lucide-react";

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
      toast.success("Preferences saved successfully!");
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
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E5E5]">
          <div className="max-w-7xl mx-auto flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">HierInfo</span>
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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#6B6B6B]">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E5E5] bg-white">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">HierInfo</span>
            </Link>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-[#1A1A1A]" />
              <div className="w-8 h-1.5 rounded-full bg-[#1A1A1A]" />
              <div className="w-8 h-1.5 rounded-full bg-[#E5E5E5]" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-[#B45309]" />
                <span className="text-sm font-medium text-[#B45309]">Step 2 of 2</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">
                What topics interest you?
              </h1>
              <p className="text-lg text-[#6B6B6B] max-w-xl mx-auto">
                Select the categories you&apos;d like to see in your personalized feed. 
                You can always change these later.
              </p>
            </div>

            {/* Selected Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[#6B6B6B]">
                <span className="font-semibold text-[#1A1A1A]">{selectedCategories.length}</span> of{" "}
                <span className="font-semibold text-[#1A1A1A]">{categories.length}</span> selected
              </p>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-[#B45309] hover:text-[#92400E] transition-colors"
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
                    className="h-24 bg-[#F5F5F4] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6B6B6B]">No categories available. Please contact support.</p>
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
                          ? "border-[#B45309] bg-[#FEF3C7] shadow-sm"
                          : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4] hover:shadow-sm"
                        }
                      `}
                    >
                      {/* Checkmark */}
                      <div
                        className={`
                          absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all
                          flex items-center justify-center
                          ${isSelected
                            ? "bg-[#B45309] border-[#B45309]"
                            : "border-[#D4D4D4]"
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Category Name */}
                      <h3 className={`font-semibold ${isSelected ? "text-[#B45309]" : "text-[#1A1A1A]"}`}>
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
                className="flex items-center justify-center gap-2 px-8 py-3 text-base bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Feed
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={saving}
                className="px-8 py-3 text-base border-[#E5E5E5] text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#D4D4D4] font-medium rounded-lg transition-all"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-center mt-6 text-sm text-[#9CA3AF]">
              You can always modify your preferences in settings
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default CategoriesPage;
