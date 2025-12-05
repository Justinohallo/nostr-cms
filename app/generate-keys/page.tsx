'use client';

import { generateSecretKey, getPublicKey } from 'nostr-tools';

import { bytesToHex } from '@noble/hashes/utils';
import { nip19 } from 'nostr-tools';
import { useState } from 'react';

export default function GenerateKeysPage() {
  const [privateKeyHex, setPrivateKeyHex] = useState<string | null>(null);
  const [publicKeyHex, setPublicKeyHex] = useState<string | null>(null);
  const [privateKeyNsec, setPrivateKeyNsec] = useState<string | null>(null);
  const [publicKeyNpub, setPublicKeyNpub] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [visible, setVisible] = useState({
    nsec: false,
    npub: false,
    privhex: false,
    pubhex: false,
  });

  const generateKeys = () => {
    // Generate keys - simple as the nostr-tools examples
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);

    // Encode to bech32 format
    const nsec = nip19.nsecEncode(sk);
    const npub = nip19.npubEncode(pk);

    // Convert to hex for display
    setPrivateKeyHex(bytesToHex(sk));
    setPublicKeyHex(pk);
    setPrivateKeyNsec(nsec);
    setPublicKeyNpub(npub);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleVisibility = (key: keyof typeof visible) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskKey = (key: string | null) => {
    if (!key) return '';
    return '•'.repeat(Math.min(key.length, 64));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-8">
            Generate Nostr Keys
          </h1>

          <div className="mb-6">
            <button
              onClick={generateKeys}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Generate New Keys
            </button>
          </div>

          {privateKeyHex && (
            <div className="space-y-6">
              <div className="p-6 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    Private Key (nsec)
                  </h2>
                  {privateKeyNsec && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisibility('nsec')}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        type="button"
                        aria-label={visible.nsec ? 'Hide key' : 'Show key'}
                      >
                        {visible.nsec ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(privateKeyNsec, 'nsec')}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {copied === 'nsec' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Use this for authentication (keep it secret!)
                </p>
                <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm break-all text-black dark:text-white">
                  {visible.nsec ? privateKeyNsec : maskKey(privateKeyNsec)}
                </code>
              </div>

              <div className="p-6 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    Public Key (npub)
                  </h2>
                  {publicKeyNpub && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleVisibility('npub')}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        type="button"
                        aria-label={visible.npub ? 'Hide key' : 'Show key'}
                      >
                        {visible.npub ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(publicKeyNpub, 'npub')}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {copied === 'npub' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Share this publicly - it's your identity
                </p>
                <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm break-all text-black dark:text-white">
                  {visible.npub ? publicKeyNpub : maskKey(publicKeyNpub)}
                </code>
              </div>

              <div className="p-6 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Important Security Warning
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>Never share your private key (nsec) with anyone</li>
                  <li>Store it securely - if you lose it, you lose access to your account</li>
                  <li>These keys are generated in your browser - they are not stored anywhere</li>
                  <li>Refresh the page to generate new keys</li>
                </ul>
              </div>

              <details className="p-6 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800">
                <summary className="cursor-pointer text-lg font-semibold text-black dark:text-white mb-4">
                  Raw Hex Format (Advanced)
                </summary>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-black dark:text-white">
                        Private Key (Hex)
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVisibility('privhex')}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          type="button"
                          aria-label={visible.privhex ? 'Hide key' : 'Show key'}
                        >
                          {visible.privhex ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(privateKeyHex, 'privhex')}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {copied === 'privhex' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm break-all text-black dark:text-white">
                      {visible.privhex ? privateKeyHex : maskKey(privateKeyHex)}
                    </code>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-black dark:text-white">
                        Public Key (Hex)
                      </h4>
                      {publicKeyHex && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVisibility('pubhex')}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            type="button"
                            aria-label={visible.pubhex ? 'Hide key' : 'Show key'}
                          >
                            {visible.pubhex ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                                />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(publicKeyHex, 'pubhex')}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {copied === 'pubhex' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                    <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm break-all text-black dark:text-white">
                      {visible.pubhex ? publicKeyHex : maskKey(publicKeyHex)}
                    </code>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

