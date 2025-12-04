import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'nostr-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  publicKey: string;
  createdAt: number;
}

/**
 * Get session from cookies (server-side)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as SessionData;
    // Validate session hasn't expired
    const age = Date.now() - session.createdAt;
    if (age > SESSION_MAX_AGE * 1000) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Set session in cookies (server-side)
 */
export async function setSession(publicKey: string): Promise<void> {
  const cookieStore = await cookies();
  const session: SessionData = {
    publicKey,
    createdAt: Date.now(),
  };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session (server-side)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session from request (for API routes)
 */
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as SessionData;
    // Validate session hasn't expired
    const age = Date.now() - session.createdAt;
    if (age > SESSION_MAX_AGE * 1000) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

