'use client';

import { useState, useCallback, useRef } from 'react';

interface AuthState {
  authenticated: boolean;
  publicKey: string | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    publicKey: null,
    loading: true,
  });
  const hasCheckedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.authenticated) {
        setAuthState({
          authenticated: true,
          publicKey: data.publicKey,
          loading: false,
        });
      } else {
        setAuthState({
          authenticated: false,
          publicKey: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        authenticated: false,
        publicKey: null,
        loading: false,
      });
    }
  }, []);

  // Lazy initialization - check auth on first access if not already checked
  if (!hasCheckedRef.current && authState.loading) {
    hasCheckedRef.current = true;
    checkAuth();
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear stored private key from sessionStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('nostr_private_key');
        } catch (err) {
          console.warn('Failed to clear private key from sessionStorage:', err);
        }
      }

      setAuthState({
        authenticated: false,
        publicKey: null,
        loading: false,
      });
      // Refresh the page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    ...authState,
    logout,
    refresh: checkAuth,
  };
}

