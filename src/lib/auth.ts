import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE = 'upgrad_admin_session';
const SESSION_TOKEN = 'upgrad-admin-authenticated';

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_TOKEN;
}

export function checkPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not configured.');
    return false;
  }
  return password === ADMIN_PASSWORD;
}

export function getSessionCookieConfig() {
  return {
    name: SESSION_COOKIE,
    value: SESSION_TOKEN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  };
}

export function getLogoutCookieConfig() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
