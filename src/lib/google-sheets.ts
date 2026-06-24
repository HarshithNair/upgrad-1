let google: typeof import('googleapis').google | null = null;

async function getGoogleInstance() {
  if (!google) {
    const mod = await import('googleapis');
    google = mod.google;
  }
  return google;
}

export function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
  return !!(email && key && sheetId);
}

export async function appendToGoogleSheet(data: {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  ready_to_relocate: string;
  resume_url: string;
  created_at: string;
}): Promise<void> {
  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  
  let rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (rawKey) {
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    } else if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    }
  }
  const GOOGLE_PRIVATE_KEY = rawKey?.replace(/\\n/g, '\n');
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    console.log('Google Sheets not configured — skipping sync.');
    return;
  }

  try {
    const googleInstance = await getGoogleInstance();
    const auth = new googleInstance.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = googleInstance.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.created_at,
          data.full_name,
          data.email,
          data.phone,
          data.location,
          data.ready_to_relocate,
          data.resume_url,
        ]],
      },
    });

    console.log('Registration synced to Google Sheets.');
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    throw error;
  }
}
