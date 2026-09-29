import { VideoItem, Playlist } from '../types';

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already 11-char ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL regex
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

// Storage helpers
const FAVORITES_KEY = 'vtube_favorites_v1';
const HISTORY_KEY = 'vtube_history_v1';
const PLAYLISTS_KEY = 'vtube_playlists_v1';

export function loadFavorites(): VideoItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(list: VideoItem[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {}
}

export function loadHistory(): VideoItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(list: VideoItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (!raw) {
      // Default sample playlist
      const defaultPlaylists: Playlist[] = [
        {
          id: 'pl-chill',
          title: 'Giai Điệu Thư Giãn',
          description: 'Danh sách bài hát nhẹ nhàng để nghe lúc học tập và thư giãn',
          createdAt: Date.now(),
          videos: [
            {
              id: '8r_C4A_N7Z8',
              title: 'Vũ. - Lạ Lùng (Official Audio)',
              channelTitle: 'Vũ. Official',
              thumbnail: 'https://i.ytimg.com/vi/8r_C4A_N7Z8/hqdefault.jpg',
              duration: '4:21'
            },
            {
              id: 'p7f6Ld_eJbQ',
              title: 'Chillies - Vùng Ký Ức (Official Music Video)',
              channelTitle: 'Chillies',
              thumbnail: 'https://i.ytimg.com/vi/p7f6Ld_eJbQ/hqdefault.jpg',
              duration: '4:48'
            }
          ]
        }
      ];
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(defaultPlaylists));
      return defaultPlaylists;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch {}
}
