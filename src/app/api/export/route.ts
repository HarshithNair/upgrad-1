import { NextResponse } from 'next/server';
import db, { type Registration } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

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
    const format = searchParams.get('format') || 'xlsx';

    // Fetch all registrations
    const registrations = db.prepare(
      'SELECT * FROM registrations ORDER BY created_at DESC'
    ).all() as Registration[];

    // Map to export-friendly column names
    const exportData = registrations.map((r) => ({
      'Timestamp': r.created_at,
      'Full Name': r.full_name,
      'Email Address': r.email,
      'Phone Number': r.phone,
      'Location': r.location,
    }));

    if (format === 'csv') {
      // Generate CSV string
      const headers = ['Timestamp', 'Full Name', 'Email Address', 'Phone Number', 'Location'];
      const csvRows = [
        headers.join(','),
        ...exportData.map((row) =>
          headers.map((header) => {
            const value = String(row[header as keyof typeof row] ?? '');
            // Escape values containing commas, quotes, or newlines
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ),
      ];
      const csvString = csvRows.join('\n');

      return new Response(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="registrations.csv"',
        },
      });
    }

    // Default: XLSX format using SheetJS
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="registrations.xlsx"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
