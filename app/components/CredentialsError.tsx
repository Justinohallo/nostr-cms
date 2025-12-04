'use client';

export function CredentialsError() {
  // Check if we're in development by checking if we're on localhost
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className="flex flex-col gap-6 p-6 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
      <div>
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-400 mb-2">
          Nostr Credentials Required
        </h2>
        <p className="text-red-600 dark:text-red-300">
          Nostr credentials are not configured. Please set up your environment variables to continue.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
            {isDevelopment ? 'Development Setup' : 'Production Setup'}
          </h3>
          {isDevelopment ? (
            <div className="space-y-2 text-sm text-red-600 dark:text-red-300">
              <p>1. Create a <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">.env.local</code> file in the root of your project</p>
              <p>2. Add the following environment variable:</p>
              <pre className="bg-red-100 dark:bg-red-900/40 p-3 rounded overflow-x-auto">
{`NOSTR_PRIVATE_KEY=your_private_key_here
NOSTR_RELAY_URL=wss://relay.damus.io`}
              </pre>
              <p>3. Restart your development server</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-red-600 dark:text-red-300">
              <p>1. Set the <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">NOSTR_PRIVATE_KEY</code> environment variable in your hosting platform</p>
              <p>2. Optionally set <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">NOSTR_RELAY_URL</code> (defaults to wss://relay.damus.io)</p>
              <p>3. Redeploy your application</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
            Getting Your Private Key
          </h3>
          <div className="text-sm text-red-600 dark:text-red-300 space-y-2">
            <p>You can generate a Nostr private key using:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Nostr client applications (like Damus, Amethyst, or Snort)</li>
              <li>Command line: <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">npx nostr-tools generate</code></li>
              <li>Online tools (use with caution)</li>
            </ul>
            <p className="mt-2">
              <strong>Important:</strong> Keep your private key secure and never commit it to version control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

