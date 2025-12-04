'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';

export function NostrLogin() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [connectionURI, setConnectionURI] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const router = useRouter();

  const generateConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/connect');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setConnectionURI(data.uri);
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(data.uri, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);

      // Check for NIP-07 extension (desktop fallback)
      if (typeof window !== 'undefined' && (window as any).nostr) {
        // Don't auto-login, let user choose
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to generate connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNip07Login = async () => {
    // For NIP-07, we need to create an auth event
    // This is a simplified version - in production, you'd follow NIP-46 auth flow
    try {
      if (!(window as any).nostr) {
        setError('Nostr extension not found. Please install a Nostr browser extension.');
        return;
      }

      const publicKey = await (window as any).nostr.getPublicKey();
      
      // Create auth event (kind 22242 per NIP-46)
      const authEvent = {
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: '',
      };

      const signedEvent = await (window as any).nostr.signEvent(authEvent);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: signedEvent }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      if (!data.success) {
        setError('Login failed. Please try again.');
        return;
      }

      // Success - redirect to studio
      window.location.href = '/studio';
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    }
  };

  const handleManualConnect = async () => {
    if (!connectionURI) {
      setError('Please generate a connection first');
      return;
    }

    // Copy URI to clipboard
    try {
      await navigator.clipboard.writeText(connectionURI);
      alert('Connection URI copied to clipboard! Paste it into your Nostr app.');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleManualKeyLogin = async () => {
    if (!privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Import private key and get public key
      const { getPublicKey, finalizeEvent } = await import('nostr-tools');
      const { hexToBytes } = await import('@noble/hashes/utils');
      const { decode, NostrTypeGuard } = await import('nostr-tools/nip19');

      let privateKeyBytes: Uint8Array;
      const trimmedKey = privateKey.trim();

      // Handle nsec format
      if (NostrTypeGuard.isNSec(trimmedKey)) {
        const decoded = decode(trimmedKey);
        if (decoded.type === 'nsec') {
          privateKeyBytes = decoded.data;
        } else {
          throw new Error('Invalid nsec format');
        }
      } else {
        // Handle hex format
        let normalizedKey = trimmedKey.toLowerCase();
        if (normalizedKey.startsWith('0x')) {
          normalizedKey = normalizedKey.slice(2);
        }
        if (!/^[0-9a-f]+$/.test(normalizedKey)) {
          throw new Error('Invalid hex characters. Private key must contain only 0-9 and a-f');
        }
        if (normalizedKey.length === 63) {
          normalizedKey = '0' + normalizedKey;
        }
        if (normalizedKey.length !== 64) {
          throw new Error(`Invalid private key length: expected 64 hex characters, got ${normalizedKey.length}`);
        }
        privateKeyBytes = hexToBytes(normalizedKey);
      }

      const publicKey = getPublicKey(privateKeyBytes);

      // Create auth event
      const authEvent = {
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: '',
      };

      const signedEvent = finalizeEvent(authEvent, privateKeyBytes);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: signedEvent }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Login failed (${response.status})`;
        console.error('Login API error:', errorMsg, data);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (data.error) {
        console.error('Login error in response:', data.error);
        setError(data.error || 'Login failed. Please check your private key and try again.');
        setLoading(false);
        return;
      }

      if (!data.success && !data.publicKey) {
        console.error('Login failed - no success flag or public key:', data);
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Login successful, redirecting...', data);

      // Clear private key from memory immediately
      setPrivateKey('');
      
      // Success - redirect to studio or reload
      // Use window.location to ensure full page reload and auth state refresh
      window.location.href = '/studio';
    } catch (err) {
      console.error('Manual login error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to login. Please check your private key format.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate connection on mount
    generateConnection();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Connect with Nostr
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {showManualEntry 
            ? 'Enter your private key to login (nsec or hex format)'
            : 'Scan the QR code with a Nostr app that supports NIP-46 (like Amethyst) or use manual entry'}
        </p>
        {!showManualEntry && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Note:</strong> Damus doesn't support NIP-46 yet. Use Amethyst or enter your key manually.
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-gray-600 dark:text-gray-400">
          {showManualEntry ? 'Logging in...' : 'Generating connection...'}
        </div>
      )}

      {qrCodeDataUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCodeDataUrl} alt="Nostr Connect QR Code" className="w-64 h-64" />
          </div>
          
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
            <p className="text-center">
              Scan with your Nostr app to connect
            </p>
            <button
              onClick={handleManualConnect}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Or copy connection URI
            </button>
          </div>
        </div>
      )}

      {showManualEntry ? (
        <div className="w-full max-w-md flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
              Private Key (nsec or hex)
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                setError(null); // Clear error when user types
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && privateKey.trim()) {
                  handleManualKeyLogin();
                }
              }}
              placeholder="nsec1... or hex key"
              className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your private key is only used to sign an auth event and is never stored.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManualKeyLogin}
              disabled={loading || !privateKey.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              onClick={() => {
                setShowManualEntry(false);
                setPrivateKey('');
                setError(null);
              }}
              className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {typeof window !== 'undefined' && (window as any).nostr && (
            <div className="mt-4">
              <button
                onClick={handleNip07Login}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Login with Browser Extension (NIP-07)
              </button>
            </div>
          )}

          {!loading && !qrCodeDataUrl && (
            <button
              onClick={generateConnection}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate QR Code (NIP-46)
            </button>
          )}

          <button
            onClick={() => setShowManualEntry(true)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Enter Private Key Manually
          </button>
        </>
      )}

      {!showManualEntry && (
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          <p>
            <strong>NIP-46 Support:</strong> Use{' '}
            <a href="https://amethyst.social" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Amethyst
            </a>
            {' '}for QR code scanning. Damus doesn't support NIP-46 yet.
          </p>
        </div>
      )}
    </div>
  );
}

