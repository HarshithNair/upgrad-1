import { NextResponse } from 'next/server';
import db, { type Registration } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Whitelist sortBy columns to prevent SQL injection
    const allowedSortColumns = ['full_name', 'email', 'phone', 'location', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(`(
        full_name LIKE ? OR
        email LIKE ? OR
        phone LIKE ? OR
        location LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (location) {
      conditions.push('location = ?');
      params.push(location);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM registrations ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params) as { total: number };

    // Fetch paginated results
    const dataQuery = `
      SELECT * FROM registrations
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    const registrations = db.prepare(dataQuery).all(
      ...params,
      limit,
      offset
    ) as Registration[];

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: registrations,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
