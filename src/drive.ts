import { getAccessToken } from './auth';

const FOLDER_NAME = 'SheetMusicApp';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export async function getDriveHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error("Google Drive access token missing. Please sign in.");
  return {
    'Authorization': `Bearer ${token}`
  };
}

// 1. Find or create the app folder in Google Drive
export async function getOrCreateFolder(): Promise<string | null> {
  const headers = await getDriveHeaders();
  
  try {
    // Search for the folder
    const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, { headers });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
    } else {
      console.warn("Folder search returned an error, status:", searchRes.status, await searchRes.text());
    }
  } catch (error) {
    console.warn("Folder search failed to fetch:", error);
  }
  
  // Try to create the folder if not found or search failed
  try {
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: FOLDER_MIME_TYPE
      })
    });
    
    if (createRes.ok) {
      const createData = await createRes.json();
      return createData.id;
    } else {
      console.warn("Folder creation failed:", createRes.status, await createRes.text());
    }
  } catch (error) {
    console.warn("Folder creation failed to fetch:", error);
  }
  
  return null; // Return null if creating/searching fails so the app won't crash
}

export async function uploadToDrive(filename: string, mimeType: string, base64Data: string, metadata: any) {
  const folderId = await getOrCreateFolder();
  const headers = await getDriveHeaders();
  
  // Google Drive REST API multi-part upload
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const fileMetadata: any = {
    name: filename,
    appProperties: {
      title: metadata.title,
      chord: metadata.chord,
      type: 'sheet-music'
    }
  };
  
  // Conditionally add parents folder if folderId was successfully obtained
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    close_delim;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,thumbnailLink', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    throw new Error('Failed to upload to Google Drive: ' + await res.text());
  }
  
  return await res.json();
}

export async function getSheetsFromDrive() {
  const folderId = await getOrCreateFolder();
  const headers = await getDriveHeaders();
  
  let queryStr = `trashed=false and appProperties has { key='type' and value='sheet-music' }`;
  if (folderId) {
    queryStr += ` and '${folderId}' in parents`;
  }
  
  const query = encodeURIComponent(queryStr);
  
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,appProperties,createdTime,webContentLink,thumbnailLink,mimeType)`, {
    headers
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch from Google Drive: ' + await res.text());
  }
  
  const data = await res.json();
  return data.files || [];
}

export async function deleteFromDrive(fileId: string) {
  const headers = await getDriveHeaders();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete from Google Drive');
  }
}

// Fetch file content to use as data URIs (since direct Drive links require OAuth to view)
export async function fetchFileContentBase64(fileId: string, mimeType: string): Promise<string> {
  const headers = await getDriveHeaders();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers
  });
  if (!res.ok) throw new Error('Failed to load media');
  const buffer = await res.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = window.btoa(binary);
  return `data:${mimeType};base64,${b64}`;
}
