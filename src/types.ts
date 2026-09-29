export interface VideoItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  publishedAt?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  videos: VideoItem[];
  createdAt: number;
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface Category {
  id: string;
  name: string;
  iconName: string;
  query: string;
  description?: string;
}

export interface AdBlockStats {
  blockedCount: number;
  timeSavedSeconds: number;
  isAdBlockActive: boolean;
  adCurrentlyDetected: boolean;
}

export type VideoResolutionId = '1080p' | '720p' | '480p' | '360p' | 'mp3';

export interface VideoResolutionOption {
  id: VideoResolutionId;
  label: string;
  resolution: string;
  format: 'mp4' | 'mp3';
  approxSizeMb: number;
  isHd?: boolean;
  bitrate?: string;
}

export interface OfflineVideoItem {
  id: string;
  video: VideoItem;
  resolution: VideoResolutionId;
  format: 'mp4' | 'mp3';
  downloadedAt: number;
  sizeBytes: number;
  localMediaKey?: string;
}

export interface DownloadTask {
  videoId: string;
  video: VideoItem;
  resolution: VideoResolutionId;
  progress: number;
  status: 'pending' | 'downloading' | 'saving' | 'completed' | 'error';
  errorMessage?: string;
  startTime: number;
}

