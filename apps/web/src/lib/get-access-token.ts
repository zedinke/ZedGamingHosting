'use client';

/**
 * Helper function to get access token from Zustand persist storage
 * The auth store uses persist middleware which stores the entire state under 'auth-storage' key
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;
    
    const parsed = JSON.parse(authStorage);
    return parsed.state?.accessToken || null;
  } catch (error) {
    console.error('Failed to parse auth storage:', error);
    return null;
  }
}

/** Get refresh token from persisted auth storage */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;

    const parsed = JSON.parse(authStorage);
    return parsed.state?.refreshToken || null;
  } catch (error) {
    console.error('Failed to parse auth storage (refresh):', error);
    return null;
  }
}
