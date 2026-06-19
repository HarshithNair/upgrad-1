let google: typeof import('googleapis').google | null = null;

async function getGoogleInstance() {
  if (!google) {
    const mod = await import('googleapis');
    google = mod.google;
  }
  return google;
}

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

export function isGoogleSheetsConfigured(): boolean {
  return !!(GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEET_ID);
}

export async function appendToGoogleSheet(data: {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
}): Promise<void> {
  if (!isGoogleSheetsConfigured()) {
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
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.created_at,
          data.full_name,
          data.email,
          data.phone,
          data.location,
        ]],
      },
    });

    console.log('Registration synced to Google Sheets.');
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    throw error;
  }
}
