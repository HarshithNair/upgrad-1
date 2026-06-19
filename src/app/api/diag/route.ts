import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: process.env.NODE_ENV,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    clientEmailSet: !!process.env.GOOGLE_CLIENT_EMAIL,
    privateKeySet: !!process.env.GOOGLE_PRIVATE_KEY,
    sheetIdSet: !!process.env.GOOGLE_SHEET_ID,
    clientEmailValue: process.env.GOOGLE_CLIENT_EMAIL || null,
    sheetIdValue: process.env.GOOGLE_SHEET_ID || null,
    privateKeyLength: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0
  });
}
