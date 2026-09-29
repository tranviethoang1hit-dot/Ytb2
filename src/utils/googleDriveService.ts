import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import JSZip from 'jszip';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory token cache - NEVER store in localStorage/sessionStorage
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được OAuth Access Token từ Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface UploadResult {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Creates or retrieves a folder in Google Drive with the specified name
 */
export async function getOrCreateDriveFolder(
  folderName: string,
  accessToken: string
): Promise<string> {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo thư mục trên Google Drive: ${errText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads a file (blob or text) to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  blobContent: Blob,
  folderId: string | null,
  accessToken: string
): Promise<UploadResult> {
  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeaderPart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const fileHeaderBlob = new Blob([fileHeaderPart], { type: 'text/plain' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBlob = new Blob([metadataBlob, fileHeaderBlob, blobContent, closeBlob], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Tải file lên Google Drive thất bại: ${errorText}`);
  }

  return await res.json();
}

/**
 * Bundles the complete Android Kotlin project into a ZIP and uploads it to Google Drive
 */
export async function exportAndroidKotlinProjectToDrive(
  accessToken: string,
  onProgress?: (msg: string) => void
): Promise<UploadResult> {
  onProgress?.('Đang kết nối thư mục YouTube Music trên Google Drive...');
  const folderId = await getOrCreateDriveFolder('YTMusic-Android-Source-Export', accessToken);

  onProgress?.('Đang tải danh sách tệp nguồn Android Kotlin...');
  const filesRes = await fetch('/api/android/files');
  if (!filesRes.ok) {
    throw new Error('Không thể lấy danh sách tệp nguồn Android từ máy chủ');
  }

  const { files } = await filesRes.json();
  if (!files || files.length === 0) {
    throw new Error('Thư mục Android trống hoặc chưa sẵn sàng');
  }

  onProgress?.(`Đang nén ${files.length} tệp mã nguồn Kotlin & Gradle sang file ZIP...`);
  const zip = new JSZip();
  const rootFolder = zip.folder('android-ytmusic-player');

  for (const f of files) {
    if (f.isBase64) {
      rootFolder?.file(f.path, f.content, { base64: true });
    } else {
      rootFolder?.file(f.path, f.content);
    }
  }

  // Include README instructions inside ZIP
  rootFolder?.file(
    'README.md',
    `# YouTube Music Player - Native Android Kotlin & Jetpack Compose\n\n` +
      `Dự án được xuất tự động từ Google AI Studio lên Google Drive.\n\n` +
      `### Hướng dẫn mở và xuất APK trên Android Studio:\n` +
      `1. Giải nén thư mục này.\n` +
      `2. Mở Android Studio -> Chọn Open -> Chọn thư mục này.\n` +
      `3. Đợi Gradle đồng bộ (Sync Project with Gradle Files).\n` +
      `4. Chọn menu: Build -> Build Bundle(s) / APK(s) -> Build APK(s).\n` +
      `5. File app-debug.apk sẽ xuất hiện trong app/build/outputs/apk/debug/.\n`
  );

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipFileName = `YTMusic_Android_Kotlin_Source_${timestamp}.zip`;

  onProgress?.(`Đang tải ${zipFileName} (${(zipBlob.size / 1024).toFixed(1)} KB) lên Google Drive...`);
  const result = await uploadFileToDrive(zipFileName, 'application/zip', zipBlob, folderId, accessToken);

  onProgress?.('Hoàn tất tải lên Google Drive!');
  return result;
}

/**
 * Exports user playlists, favorites, and history as JSON to Google Drive
 */
export async function exportUserDataToDrive(
  data: {
    favorites: any[];
    history: any[];
    playlists: any[];
    offlineVideos: any[];
  },
  accessToken: string,
  onProgress?: (msg: string) => void
): Promise<UploadResult> {
  onProgress?.('Đang tạo thư mục sao lưu dữ liệu trên Google Drive...');
  const folderId = await getOrCreateDriveFolder('YTMusic-Backups', accessToken);

  onProgress?.('Đang định dạng dữ liệu sao lưu...');
  const backupPayload = {
    appName: 'YouTube Music Player',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    data: data,
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const jsonBlob = new Blob([jsonStr], { type: 'application/json' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `YTMusic_UserData_Backup_${timestamp}.json`;

  onProgress?.(`Đang tải ${fileName} lên Google Drive...`);
  const result = await uploadFileToDrive(fileName, 'application/json', jsonBlob, folderId, accessToken);

  onProgress?.('Hoàn tất sao lưu!');
  return result;
}
