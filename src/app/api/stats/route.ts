import { NextResponse } from 'next/server';
import db, { type Registration } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';

interface CountResult {
  count: number;
}

interface LocationResult {
  location: string;
  count: number;
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Total registrations
    const { count: total } = db.prepare(
      'SELECT COUNT(*) as count FROM registrations'
    ).get() as CountResult;

    // Registrations today
    const { count: today } = db.prepare(
      "SELECT COUNT(*) as count FROM registrations WHERE date(created_at) = date('now')"
    ).get() as CountResult;

    // Top 5 locations by registration count
    const topLocations = db.prepare(`
      SELECT location, COUNT(*) as count
      FROM registrations
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 5
    `).all() as LocationResult[];

    // 5 most recent registrations
    const recentSignups = db.prepare(
      'SELECT * FROM registrations ORDER BY created_at DESC LIMIT 5'
    ).all() as Registration[];

    return NextResponse.json({
      success: true,
      data: {
        total,
        today,
        topLocations,
        recentSignups,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
