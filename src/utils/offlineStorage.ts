import { OfflineVideoItem, VideoItem, VideoResolutionId } from '../types';

const DB_NAME = 'vtube_offline_db';
const DB_VERSION = 1;
const STORE_VIDEOS = 'offline_videos';
const STORE_MEDIA = 'offline_media_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
        db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a video and its media blob to offline storage
 */
export async function saveOfflineVideo(
  video: VideoItem,
  resolution: VideoResolutionId,
  format: 'mp4' | 'mp3',
  mediaBlob: Blob
): Promise<OfflineVideoItem> {
  const db = await openDB();

  const item: OfflineVideoItem = {
    id: video.id,
    video,
    resolution,
    format,
    downloadedAt: Date.now(),
    sizeBytes: mediaBlob.size,
    localMediaKey: video.id,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VIDEOS, STORE_MEDIA], 'readwrite');
    const videosStore = tx.objectStore(STORE_VIDEOS);
    const mediaStore = tx.objectStore(STORE_MEDIA);

    videosStore.put(item);
    mediaStore.put({ id: video.id, blob: mediaBlob });

    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Gets all saved offline videos
 */
export async function getOfflineVideos(): Promise<OfflineVideoItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VIDEOS, 'readonly');
      const store = tx.objectStore(STORE_VIDEOS);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: OfflineVideoItem[] = req.result || [];
        // Sort newest first
        items.sort((a, b) => b.downloadedAt - a.downloadedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('getOfflineVideos error:', err);
    return [];
  }
}

/**
 * Gets the media Blob for an offline video
 */
export async function getOfflineVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const store = tx.objectStore(STORE_MEDIA);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Checks if a specific video is saved offline
 */
export async function isOfflineAvailable(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VIDEOS, 'readonly');
      const store = tx.objectStore(STORE_VIDEOS);
      const req = store.get(id);

      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Deletes an offline video and its media blob
 */
export async function deleteOfflineVideo(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VIDEOS, STORE_MEDIA], 'readwrite');
    tx.objectStore(STORE_VIDEOS).delete(id);
    tx.objectStore(STORE_MEDIA).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Calculates total storage used by offline media
 */
export async function getOfflineStorageInfo(): Promise<{ usedBytes: number; count: number }> {
  try {
    const items = await getOfflineVideos();
    const usedBytes = items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0);
    return {
      usedBytes,
      count: items.length,
    };
  } catch {
    return { usedBytes: 0, count: 0 };
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
