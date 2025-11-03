/**
 * User profile row tracked in Supabase for personalization settings.
 */
import type { UserPreferencesData } from "../preferences";

export type Profile = {
  id: string;
  username: string;
  preferences?: UserPreferencesData | string | null;
  created_at: string;
};
