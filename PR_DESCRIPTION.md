# Nostr Connect Authentication (NIP-46)

## Summary
This PR implements Nostr Connect authentication (NIP-46) to replace hardcoded private keys, allowing users to authenticate with their Nostr profiles instead of requiring server-side private key configuration.

## Changes

### Authentication System
- **NIP-46 Support**: Implemented Nostr Connect protocol for authentication
- **Session Management**: Added cookie-based session management using Next.js cookies
- **Multiple Auth Methods**: Supports NIP-07 (browser extensions), NIP-46 (QR codes), and manual key entry

### New Files
- `lib/auth/nip46.ts` - NIP-46 connection token generation and URI formatting
- `lib/auth/session.ts` - Session management utilities
- `lib/auth/nip46-client.ts` - Client-side NIP-46 connection handling
- `lib/hooks/useAuth.ts` - React hook for authentication state
- `app/api/auth/login/route.ts` - Login endpoint for auth events
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/me/route.ts` - Current user endpoint
- `app/api/auth/connect/route.ts` - Connection token generation
- `app/components/NostrLogin.tsx` - Login UI with QR code and manual entry

### Modified Files
- `app/api/content/structured/route.ts` - Now accepts signed events instead of signing server-side
- `app/studio/page.tsx` - Requires authentication, handles client-side signing
- `lib/services/structuredContent.ts` - Uses authenticated user's public key or env variable
- `package.json` - Added `qrcode` dependency for QR code generation

## Features

### Authentication Methods
1. **NIP-07 Browser Extension** (Desktop)
   - One-click login with browser extensions like Alby, nos2x
   - Automatic detection and login option

2. **NIP-46 QR Code** (Mobile/Desktop)
   - QR code generation for scanning with Nostr apps
   - Compatible with apps that support NIP-46 (Amethyst, etc.)
   - Note: Damus doesn't support NIP-46 yet

3. **Manual Key Entry** (Fallback)
   - Users can paste their nsec or hex private key
   - Key is only used to sign auth event, never stored
   - Works with any Nostr app

### Security Improvements
- ✅ No server-side private keys required
- ✅ Events signed client-side
- ✅ Session-based authentication with secure cookies
- ✅ Event signature verification
- ✅ Author verification (events must match authenticated user)

### User Experience
- Clean login UI with QR code display
- Clear error messages and loading states
- Automatic redirect after successful login
- Public key display in studio
- Logout functionality

## Breaking Changes
- **Removed**: `NOSTR_PRIVATE_KEY` environment variable requirement
- **Added**: `NOSTR_PUBLIC_KEY` environment variable (optional, for home page content display)

## Migration Guide
1. Remove `NOSTR_PRIVATE_KEY` from `.env.local` (no longer needed)
2. Optionally add `NOSTR_PUBLIC_KEY` if you want the home page to display content from a specific public key
3. Users will need to authenticate via one of the supported methods

## Testing
- [x] Manual key entry login
- [x] NIP-07 browser extension login
- [x] QR code generation
- [x] Session persistence
- [x] Event signing and publishing
- [x] Logout functionality

## Notes
- Full NIP-46 WebSocket protocol implementation is not complete (QR code generation works, but full protocol needs WebSocket handling)
- Currently works best with NIP-07 browser extensions on desktop
- Manual key entry provides fallback for all platforms

