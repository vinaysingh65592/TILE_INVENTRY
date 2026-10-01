import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ============================================================
// Password Hashing (using Node.js crypto - zero dependencies)
// ============================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

// ============================================================
// Session Cookie Management (HMAC-signed)
// ============================================================

const SESSION_COOKIE_NAME = 'tile_warehouse_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-me';

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return { userId: data.userId };
  } catch {
    return null;
  }
}

// ============================================================
// Session Management Functions
// ============================================================

export async function createSession(userId: string): Promise<void> {
  const token = signToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) return null;

    const tokenData = verifyToken(sessionCookie.value);
    if (!tokenData) return null;

    const user = await db.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive || user.status !== 'APPROVED') return null;

    return user;
  } catch {
    return null;
  }
}

// ============================================================
// Auth Requirement Helpers
// ============================================================

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
  isActive: boolean;
  mustChangePassword: boolean;
};

export async function requireAuth(allowedRoles?: string[]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError('Authentication required.', 401);
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError('Insufficient permissions.', 403);
  }

  return user;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return { error: error.message, statusCode: error.statusCode };
  }
  return { error: 'Authentication error.', statusCode: 401 };
}
