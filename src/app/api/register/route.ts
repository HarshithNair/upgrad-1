import { NextResponse } from 'next/server';
import db, { type Registration } from '@/lib/db';
import { validateRegistration } from '@/lib/validators';
import { appendToGoogleSheet } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the incoming registration data
    const errors = validateRegistration(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    const { full_name, email, phone, location = '' } = body;

    // 1. Explicit Duplicate checks before inserting new records
    const existingEmail = db.prepare('SELECT id FROM registrations WHERE email = ?').get(email);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'This email address is already registered.' },
        { status: 409 }
      );
    }

    const existingPhone = db.prepare('SELECT id FROM registrations WHERE phone = ?').get(phone);
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'This phone number is already registered.' },
        { status: 409 }
      );
    }

    let registration: Registration;
    try {
      // 2. Perform database insertion
      const stmt = db.prepare(`
        INSERT INTO registrations (full_name, email, phone, location)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(full_name, email, phone, location);

      // Fetch the newly inserted record
      registration = db.prepare(
        'SELECT * FROM registrations WHERE id = ?'
      ).get(result.lastInsertRowid) as Registration;
    } catch (dbError: unknown) {
      // Handle SQLite unique constraint violations (safety fallback for concurrent requests)
      if (
        dbError instanceof Error &&
        dbError.message.includes('UNIQUE constraint failed')
      ) {
        if (dbError.message.includes('registrations.email')) {
          return NextResponse.json(
            { success: false, error: 'This email address is already registered.' },
            { status: 409 }
          );
        }
        if (dbError.message.includes('registrations.phone')) {
          return NextResponse.json(
            { success: false, error: 'This phone number is already registered.' },
            { status: 409 }
          );
        }
      }
      throw dbError;
    }

    // 3. Sync to Google Sheets — awaited so the serverless function doesn't terminate
    // before the request completes; errors are caught so registration still succeeds.
    try {
      await appendToGoogleSheet(registration);
    } catch (sheetError) {
      console.error('Google Sheets sync failed (registration was saved):', sheetError);
    }

    return NextResponse.json(
      { success: true, message: 'Registration Successful', data: registration },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
