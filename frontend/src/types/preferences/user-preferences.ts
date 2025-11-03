/**
 * Stored preference payload capturing category selections and metadata.
 */
export type UserPreferencesData = {
  categoryIds: string[];
  updatedAt: string;
};

/**
 * Client-facing shape for preference management in UI flows.
 */
export type UserPreferences = {
  categoryId: string | null;
  categoryIds?: string[];
  notificationsEnabled?: boolean;
};
