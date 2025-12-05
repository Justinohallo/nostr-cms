'use client';

import { useCallback, useEffect, useState } from 'react';

interface AuthState {
  authenticated: boolean;
  publicKey: string | null;
  loading: boolean;
}

// Global registry of refresh functions to update all instances on login
const refreshCallbacks = new Set<() => Promise<void>>();

// Set up global listener for login success (only once, module level)
if (typeof window !== 'undefined') {
  window.addEventListener('nostr-login-success', () => {
    setTimeout(() => {
      refreshCallbacks.forEach((refresh) => refresh());
    }, 200);
  });
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    publicKey: null,
    loading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      setAuthState({
        authenticated: data.authenticated || false,
        publicKey: data.publicKey || null,
        loading: false,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        authenticated: false,
        publicKey: null,
        loading: false,
      });
    }
  }, []);

  // Check auth on mount and register for global refresh
  useEffect(() => {
    checkAuth();
    refreshCallbacks.add(checkAuth);
    return () => {
      refreshCallbacks.delete(checkAuth);
    };
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState({
        authenticated: false,
        publicKey: null,
        loading: false,
      });
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    ...authState,
    logout,
    refresh: checkAuth,
  };
}

