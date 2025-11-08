import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'auth_token';

if (!JWT_SECRET) {
  throw new Error('Please define JWT_SECRET environment variable');
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Get current user from cookies (server-side)
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Create auth cookie string for Set-Cookie header
 */
export function createAuthCookie(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Create cookie string to clear auth cookie
 */
export function clearAuthCookie() {
  return serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Middleware to protect API routes
 * Returns user object if authenticated, throws error if not
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return user && user.role === 'admin';
}

/**
 * Check if user owns resource or is admin
 */
export function canModifyResource(user, resourceOwnerId) {
  if (!user) return false;
  return user.userId === resourceOwnerId.toString() || isAdmin(user);
}
