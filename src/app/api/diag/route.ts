import { NextResponse } from 'next/server';

export async function GET() {
  const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

  return NextResponse.json({
    env: process.env.NODE_ENV,
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    
    clientEmailSet: !!process.env.GOOGLE_CLIENT_EMAIL,
    serviceAccountEmailSet: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    resolvedEmailSet: !!email,
    resolvedEmailValue: email || null,

    sheetIdSet: !!process.env.GOOGLE_SHEET_ID,
    spreadsheetIdSet: !!process.env.GOOGLE_SPREADSHEET_ID,
    resolvedSheetIdSet: !!sheetId,
    resolvedSheetIdValue: sheetId || null,

    privateKeySet: !!key,
    privateKeyLength: key ? key.length : 0
  });
}
