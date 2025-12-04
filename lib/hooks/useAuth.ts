'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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

