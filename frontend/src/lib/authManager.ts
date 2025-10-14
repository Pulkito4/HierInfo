/**
 * Centralized Authentication Manager
 * Single source of truth for authentication state with intelligent caching
 */

import { getCurrentUser } from '@/lib/supabaseAuth';

interface CachedAuth {
  user: User | null;
  timestamp: number;
  isValidating: boolean;
}

interface User {
  id: string;
  email?: string;
}

class AuthManager {
  private cache = new Map<string, CachedAuth>();
  private globalCache: CachedAuth | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 60 seconds
  private readonly CACHE_KEY = 'global_auth';
  
  /**
   * Get authenticated user with intelligent caching
   */
  async getAuthenticatedUser(): Promise<{ user: User | null; loading: boolean; error?: Error }> {
    const now = Date.now();
    const cached = this.globalCache;
    
    // Return cached result if valid and not expired
    if (cached && (now - cached.timestamp < this.CACHE_DURATION)) {
      return { 
        user: cached.user, 
        loading: cached.isValidating,
        error: undefined 
      };
    }
    
    // If currently validating, return loading state
    if (cached?.isValidating) {
      return { 
        user: cached.user, 
        loading: true,
        error: undefined 
      };
    }
    
    // Start validation
    this.globalCache = {
      user: cached?.user || null,
      timestamp: now,
      isValidating: true
    };
    
    try {
      const { user, error } = await getCurrentUser();
      
      // Update cache with result
      this.globalCache = {
        user: error ? null : user,
        timestamp: now,
        isValidating: false
      };
      
      return { 
        user: error ? null : user, 
        loading: false,
        error: error || undefined 
      };
    } catch (err) {
      // Update cache with error state
      this.globalCache = {
        user: null,
        timestamp: now,
        isValidating: false
      };
      
      return { 
        user: null, 
        loading: false,
        error: err as Error 
      };
    }
  }
  
  /**
   * Validate specific user session with caching
   */
  async validateUserSession(userId: string): Promise<{ isValid: boolean; user: User | null }> {
    const cacheKey = `user_${userId}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    
    // Return cached result if valid and not expired
    if (cached && (now - cached.timestamp < this.CACHE_DURATION) && !cached.isValidating) {
      return { 
        isValid: !!cached.user && cached.user.id === userId, 
        user: cached.user 
      };
    }
    
    // If currently validating, return cached user state
    if (cached?.isValidating) {
      return { 
        isValid: !!cached.user && cached.user.id === userId, 
        user: cached.user 
      };
    }
    
    // Start validation
    this.cache.set(cacheKey, {
      user: cached?.user || null,
      timestamp: now,
      isValidating: true
    });
    
    try {
      const { user, error } = await getCurrentUser();
      const isValid = !error && !!user && user.id === userId;
      
      // Update cache
      this.cache.set(cacheKey, {
        user: isValid ? user : null,
        timestamp: now,
        isValidating: false
      });
      
      return { isValid, user: isValid ? user : null };
    } catch {
      // Update cache with error state
      this.cache.set(cacheKey, {
        user: null,
        timestamp: now,
        isValidating: false
      });
      
      return { isValid: false, user: null };
    }
  }
  
  /**
   * Invalidate all auth caches (on logout, etc.)
   */
  invalidateCache(): void {
    this.cache.clear();
    this.globalCache = null;
  }
  
  /**
   * Invalidate specific user cache
   */
  invalidateUserCache(userId: string): void {
    this.cache.delete(`user_${userId}`);
  }
  
  /**
   * Update cache with known user (after successful login)
   */
  setCachedUser(user: User): void {
    const now = Date.now();
    this.globalCache = {
      user,
      timestamp: now,
      isValidating: false
    };
    this.cache.set(`user_${user.id}`, {
      user,
      timestamp: now,
      isValidating: false
    });
  }
  
  /**
   * Force refresh authentication state (bypasses cache)
   */
  async forceRefresh(): Promise<{ user: User | null; loading: boolean; error?: Error }> {
    // Clear existing cache
    this.globalCache = null;
    
    // Fetch fresh auth state
    return this.getAuthenticatedUser();
  }
  
  /**
   * Check if user is authenticated (cached check only)
   */
  isAuthenticated(): boolean {
    const cached = this.globalCache;
    if (!cached || cached.isValidating) return false;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp >= this.CACHE_DURATION;
    
    return !isExpired && !!cached.user;
  }
  
  /**
   * Get cached user without validation
   */
  getCachedUser(): User | null {
    const cached = this.globalCache;
    if (!cached || cached.isValidating) return null;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp >= this.CACHE_DURATION;
    
    return isExpired ? null : cached.user;
  }
}

// Export singleton instance
export const authManager = new AuthManager();

// Export convenience functions
export const getAuthenticatedUser = () => authManager.getAuthenticatedUser();
export const validateUserSession = (userId: string) => authManager.validateUserSession(userId);
export const invalidateAuthCache = () => authManager.invalidateCache();
export const setCachedUser = (user: User) => authManager.setCachedUser(user);
export const isUserAuthenticated = () => authManager.isAuthenticated();
export const getCachedUser = () => authManager.getCachedUser();
export const forceAuthRefresh = () => authManager.forceRefresh();