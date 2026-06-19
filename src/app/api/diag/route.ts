import { NextResponse } from 'next/server';

export async function GET() {
  const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  
  let rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const rawLength = rawKey ? rawKey.length : 0;
  if (rawKey) {
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    } else if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    }
  }
  const key = rawKey?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

  let authSuccess = false;
  let authError: { message: string; code?: string } | null = null;

  if (email && key) {
    try {
      const { google } = await import('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: email,
          private_key: key,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      await auth.getClient();
      authSuccess = true;
    } catch (err: unknown) {
      const errorObj = err as { message?: string; code?: string };
      authError = {
        message: errorObj.message || 'Unknown authentication error',
        code: errorObj.code,
      };
    }
  }

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
    rawPrivateKeyLength: rawLength,
    processedPrivateKeyLength: key ? key.length : 0,

    authSuccess,
    authError,
  });
}


