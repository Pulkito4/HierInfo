/**
 * Produce the start and end of the day for the provided reference date.
 */
export function getDayBoundaries(reference: Date = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

/**
 * Normalize preference payloads from the profiles table into a list of category IDs.
 */
export function parseCategoryPreferences(preferences: unknown): string[] {
  if (!preferences) return [];

  if (typeof preferences === "string") {
    return preferences ? [preferences] : [];
  }

  if (Array.isArray(preferences)) {
    return preferences.filter((value): value is string => typeof value === "string" && value.length > 0);
  }

  if (typeof preferences === "object" && preferences !== null) {
    const maybeCategoryIds = (preferences as { categoryIds?: unknown }).categoryIds;
    if (Array.isArray(maybeCategoryIds)) {
      return maybeCategoryIds.filter((value): value is string => typeof value === "string" && value.length > 0);
    }
  }

  return [];
}
