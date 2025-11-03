"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { updateUserMultiplePreferences } from "@/lib/supabaseAuth";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import ErrorMessage from "@/components/ui/error-message";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useQueryClient } from "@tanstack/react-query";
import { feedQueryKeys } from "@/lib/react-query";
import { CATEGORY_SKELETON_COUNT } from "@/lib/constants";

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
      // Proactively invalidate the For You feed so updates reflect immediately
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
      <div className="min-h-screen bg-[#050B1E] flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-6">
          <LoadingSkeleton type="categories" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050B1E] flex items-center justify-center">
        <p className="text-gray-300">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-[#050B1E] via-[#0A122A] to-[#101935] text-gray-200">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="text-center mt-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 text-transparent bg-clip-text mb-2">
                Choose Your Interests
              </h1>
              <p className="text-gray-400 text-lg">
                Select multiple categories to personalize your feed
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can change them anytime in settings.
              </p>
            </div>
          </div>

          {/* Categories */}
          <Card className="p-8 mb-8 bg-[#0B1430]/70 border border-[#1A2348] backdrop-blur-md shadow-xl shadow-blue-900/20">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">
                Available Categories
              </h2>
              <p className="text-gray-400 text-sm">
                Selected: {selectedCategories.length} categories
              </p>
            </div>

            {categoriesError ? (
              <ErrorMessage
                error={categoriesError}
                onRetry={refetch}
                title="Failed to load categories"
              />
            ) : categoriesLoading === "loading" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: CATEGORY_SKELETON_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-[#121C3F] rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No categories available. Please contact support.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <div
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`relative p-6 rounded-xl border transition-all duration-300 cursor-pointer group
                        ${
                          isSelected
                            ? "border-blue-500/70 bg-gradient-to-br from-[#10214E]/70 via-[#0E1B40]/60 to-[#09132D]/80 shadow-md shadow-blue-900/30"
                            : "border-[#1A2348] hover:border-blue-400/40 hover:bg-[#0E1735]"
                        }
                      `}
                    >
                      {/* Indicator */}
                      <div
                        className={`absolute top-3 right-3 w-6 h-6 rounded-full border transition-all ${
                          isSelected
                            ? "bg-blue-500 border-blue-400"
                            : "border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white absolute top-1 left-1" />
                        )}
                      </div>

                      {/* Category Name */}
                      <h3 className="text-lg font-semibold text-gray-100">
                        {category.name}
                      </h3>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <Card className="p-6 mb-8 bg-[#08122A]/80 border border-[#1B2750] backdrop-blur-md shadow-md shadow-blue-900/20">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Your Selected Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find(
                    (cat) => cat.id === categoryId
                  );
                  return category ? (
                    <Badge
                      key={categoryId}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-2 bg-[#10214E]/40 border border-blue-500/40 text-blue-300 hover:bg-[#13265C]/50 transition"
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

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSave}
              disabled={saving || selectedCategories.length === 0}
              className="flex items-center gap-2 px-8 py-3 text-lg bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1D4ED8] hover:to-[#1E3A8A] text-white transition-all rounded-lg shadow-md shadow-blue-900/30"
            >
              <Save className="w-5 h-5" />
              {saving
                ? "Saving..."
                : `Save ${selectedCategories.length} Categories`}
            </Button>

            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
              className="px-8 py-3 text-lg border border-[#1E3A8A] text-gray-300 hover:border-blue-400 hover:text-white transition-all rounded-lg"
            >
              Skip for Now
            </Button>
          </div>

          <div className="text-center mt-8 text-sm text-gray-500">
            You can always modify your preferences later in the settings page.
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CategoriesPage;
