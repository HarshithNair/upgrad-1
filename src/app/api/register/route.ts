import { NextResponse } from 'next/server';
import db, { type Registration } from '@/lib/db';
import { validateRegistration } from '@/lib/validators';
import { appendToGoogleSheet } from '@/lib/google-sheets';
import { uploadResumeToDrive } from '@/lib/google-drive';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const full_name = (formData.get('full_name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const location = (formData.get('location') as string) || '';
    const ready_to_relocate = (formData.get('ready_to_relocate') as string) || '';
    const resumeFile = formData.get('resume') as File | null;

    // Validate the incoming registration data
    const errors = validateRegistration({ full_name, email, phone, location, ready_to_relocate });
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Validate resume file
    if (resumeFile && resumeFile.size > 0) {
      if (resumeFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Resume file must be under 5MB.' },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(resumeFile.type)) {
        return NextResponse.json(
          { success: false, error: 'Resume must be a PDF, DOC, or DOCX file.' },
          { status: 400 }
        );
      }
    }

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

    // 2. Upload resume to Google Drive (if provided)
    let resume_url = '';
    if (resumeFile && resumeFile.size > 0) {
      try {
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        resume_url = await uploadResumeToDrive(buffer, resumeFile.name, resumeFile.type);
      } catch (driveError) {
        console.error('Google Drive upload failed:', driveError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload resume. Please try again.' },
          { status: 500 }
        );
      }
    }

    // 3. Perform database insertion
    let registration: Registration;
    try {
      const stmt = db.prepare(`
        INSERT INTO registrations (full_name, email, phone, location, ready_to_relocate, resume_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(full_name, email, phone, location, ready_to_relocate, resume_url);

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

    // 4. Sync to Google Sheets (blocking write, roll back database insertion on failure)
    try {
      await appendToGoogleSheet(registration);
    } catch (sheetError) {
      console.error('Google Sheets sync failed, rolling back SQLite insert:', sheetError);
      
      // Rollback database insertion
      db.prepare('DELETE FROM registrations WHERE id = ?').run(registration.id);

      return NextResponse.json(
        { success: false, error: 'Failed to write to Google Sheets. Please contact support or try again.' },
        { status: 500 }
      );
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
