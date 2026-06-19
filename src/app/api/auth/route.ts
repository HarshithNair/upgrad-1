import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkPassword, getSessionCookieConfig, getLogoutCookieConfig, verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (checkPassword(password)) {
      const cookieStore = await cookies();
      const cookieConfig = getSessionCookieConfig();
      cookieStore.set(cookieConfig);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const cookieConfig = getLogoutCookieConfig();
    cookieStore.set(cookieConfig);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authenticated = await verifyAdmin();
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
