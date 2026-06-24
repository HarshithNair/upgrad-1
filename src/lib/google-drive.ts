let google: typeof import('googleapis').google | null = null;

async function getGoogleInstance() {
  if (!google) {
    const mod = await import('googleapis');
    google = mod.google;
  }
  return google;
}

export async function uploadResumeToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const GOOGLE_CLIENT_EMAIL =
    process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  let rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (rawKey) {
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    } else if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
      rawKey = rawKey.substring(1, rawKey.length - 1);
    }
  }
  const GOOGLE_PRIVATE_KEY = rawKey?.replace(/\\n/g, '\n');
  const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Drive credentials not configured.');
  }

  const googleInstance = await getGoogleInstance();
  const auth = new googleInstance.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = googleInstance.drive({ version: 'v3', auth });

  // Build file metadata
  const fileMetadata: { name: string; parents?: string[] } = {
    name: `${Date.now()}_${fileName}`,
  };

  if (GOOGLE_DRIVE_FOLDER_ID) {
    fileMetadata.parents = [GOOGLE_DRIVE_FOLDER_ID];
  }

  // Upload the file
  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = response.data.id;

  if (!fileId) {
    throw new Error('Failed to upload file to Google Drive — no file ID returned.');
  }

  // Make the file publicly viewable (anyone with the link)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Return the web view link (or construct one)
  return response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
}
