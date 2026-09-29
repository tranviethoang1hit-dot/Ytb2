import { VideoItem } from '../types';
import { formatTime } from './formatters';
import { getReliableThumbnail } from '../data/mockVideos';
import { backgroundAudioService } from './backgroundAudioService';

let pipVideoElement: HTMLVideoElement | null = null;
let pipCanvasElement: HTMLCanvasElement | null = null;
let pipAnimationId: number | null = null;
let isPiPActive = false;
let currentThumbnailImg: HTMLImageElement | null = null;

// Dynamic state tracked by PiP canvas
let activeVideo: VideoItem | null = null;
let activeIsPlaying = false;
let activeCurrentTime = 0;
let activeDuration = 0;
let onLeavePiPCallback: (() => void) | null = null;

export function isPictureInPictureSupported(): boolean {
  return typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
}

export function isAutoPictureInPictureSupported(): boolean {
  return typeof HTMLVideoElement !== 'undefined' && 'autoPictureInPicture' in HTMLVideoElement.prototype;
}

export function isPictureInPictureActive(): boolean {
  return typeof document !== 'undefined' && !!document.pictureInPictureElement;
}

export async function exitPictureInPicture(): Promise<void> {
  if (typeof document !== 'undefined' && document.pictureInPictureElement) {
    try {
      await document.exitPictureInPicture();
    } catch (e) {
      console.warn('Error exiting PiP:', e);
    }
  }
  stopCanvasAnimation();
  isPiPActive = false;
}

function stopCanvasAnimation() {
  if (pipAnimationId) {
    cancelAnimationFrame(pipAnimationId);
    pipAnimationId = null;
  }
}

/**
 * Updates dynamic playback state so the PiP canvas reflects live time and waveform
 */
export function updatePiPState(
  video: VideoItem,
  isPlaying: boolean,
  currentTime: number,
  duration: number
) {
  activeVideo = video;
  activeIsPlaying = isPlaying;
  activeCurrentTime = currentTime;
  activeDuration = duration;

  // Update thumbnail if changed
  if (video && (!currentThumbnailImg || currentThumbnailImg.getAttribute('data-id') !== video.id)) {
    const thumbUrl = getReliableThumbnail(video.id, video.thumbnail);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = thumbUrl;
    img.setAttribute('data-id', video.id);
    currentThumbnailImg = img;
  }
}

function ensureCanvasAndVideo(onLeave?: () => void) {
  if (typeof document === 'undefined') return null;

  if (onLeave) {
    onLeavePiPCallback = onLeave;
  }

  // Create canvas if not exists (clean 16:9 640x360 ratio)
  if (!pipCanvasElement) {
    pipCanvasElement = document.createElement('canvas');
    pipCanvasElement.width = 640;
    pipCanvasElement.height = 360;
    pipCanvasElement.style.display = 'none';
    document.body.appendChild(pipCanvasElement);
  }

  // Create video carrier if not exists
  if (!pipVideoElement) {
    pipVideoElement = document.createElement('video');
    pipVideoElement.autoplay = true;
    pipVideoElement.muted = false;
    pipVideoElement.volume = 0.05;
    pipVideoElement.playsInline = true;

    // Enable native Chromium Auto Picture-in-Picture
    (pipVideoElement as any).autoPictureInPicture = true;
    pipVideoElement.setAttribute('autopictureinpicture', 'true');

    pipVideoElement.style.position = 'fixed';
    pipVideoElement.style.top = '-9999px';
    pipVideoElement.style.left = '-9999px';
    pipVideoElement.style.width = '1px';
    pipVideoElement.style.height = '1px';
    pipVideoElement.style.opacity = '0';
    pipVideoElement.style.pointerEvents = 'none';
    document.body.appendChild(pipVideoElement);

    pipVideoElement.addEventListener('enterpictureinpicture', () => {
      isPiPActive = true;
    });

    pipVideoElement.addEventListener('leavepictureinpicture', () => {
      isPiPActive = false;
      if (onLeavePiPCallback) onLeavePiPCallback();
    });
  }

  return { canvas: pipCanvasElement, video: pipVideoElement };
}

function startRenderLoop() {
  if (pipAnimationId) return; // already running

  const ctx = pipCanvasElement?.getContext('2d');
  if (!ctx) return;

  const renderFrame = () => {
    const width = 640;
    const height = 360;

    // 1. Sleek neutral dark background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Ambient Cover Art & sharp artwork card
    if (currentThumbnailImg && currentThumbnailImg.complete && currentThumbnailImg.naturalWidth > 0) {
      // Subtle ambient backdrop
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.drawImage(currentThumbnailImg, 0, 0, width, height);
      ctx.restore();

      // Sharp rounded album art
      const boxWidth = 220;
      const boxHeight = 124; // 16:9
      const boxX = 36;
      const boxY = (height - boxHeight) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
      ctx.clip();
      ctx.drawImage(currentThumbnailImg, boxX, boxY, boxWidth, boxHeight);
      ctx.restore();

      // Subtle border around artwork
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
      ctx.stroke();
    }

    // 3. Clean typography & progress bar (No flashy neon clutter)
    const textStartX = 280;
    const textCenterY = height / 2;

    // Track Title
    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let displayTitle = activeVideo?.title || 'YouTube Music';
    if (ctx.measureText(displayTitle).width > 320) {
      while (ctx.measureText(displayTitle + '...').width > 320 && displayTitle.length > 5) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += '...';
    }
    ctx.fillText(displayTitle, textStartX, textCenterY - 24);

    // Artist / Channel Name
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(activeVideo?.channelTitle || 'YouTube', textStartX, textCenterY + 2);

    // Clean Progress Bar
    const barWidth = 310;
    const barHeight = 4;
    const barY = textCenterY + 28;
    const progress = activeDuration > 0 ? Math.min(1, Math.max(0, activeCurrentTime / activeDuration)) : 0;

    // Track background
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(textStartX, barY, barWidth, barHeight, 2);
    ctx.fill();

    // Active progress
    if (progress > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(textStartX, barY, barWidth * progress, barHeight, 2);
      ctx.fill();
    }

    // Time Stamps
    ctx.fillStyle = '#71717a';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const currentTimeStr = formatTime(activeCurrentTime);
    const durationStr = formatTime(activeDuration);
    ctx.fillText(currentTimeStr, textStartX, barY + 18);
    const durWidth = ctx.measureText(durationStr).width;
    ctx.fillText(durationStr, textStartX + barWidth - durWidth, barY + 18);

    pipAnimationId = requestAnimationFrame(renderFrame);
  };

  renderFrame();
}

/**
 * Prepares the video carrier with canvas stream for PiP
 */
export async function preparePiPCarrier(
  video: VideoItem,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  onLeave?: () => void
): Promise<boolean> {
  if (!isPictureInPictureSupported()) return false;

  updatePiPState(video, isPlaying, currentTime, duration);
  const elements = ensureCanvasAndVideo(onLeave);
  if (!elements) return false;

  startRenderLoop();

  try {
    if (!elements.video.srcObject && (elements.canvas as any).captureStream) {
      const canvasStream = (elements.canvas as any).captureStream(30);
      const audioTracks = backgroundAudioService.getAudioTrack();
      const combinedTracks = [...canvasStream.getVideoTracks(), ...audioTracks];
      const stream = new MediaStream(combinedTracks);
      elements.video.srcObject = stream;
      elements.video.muted = false;
      elements.video.volume = 0.05;
      await elements.video.play();
    }
    return true;
  } catch (err) {
    console.warn('preparePiPCarrier warning:', err);
    return false;
  }
}

export async function enterNativePictureInPicture(
  video: VideoItem,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  onLeavePiP?: () => void
): Promise<boolean> {
  if (!isPictureInPictureSupported()) {
    console.warn('Picture-in-Picture is not supported in this browser environment');
    return false;
  }

  updatePiPState(video, isPlaying, currentTime, duration);
  const elements = ensureCanvasAndVideo(onLeavePiP);
  if (!elements) return false;

  startRenderLoop();

  try {
    if (!elements.video.srcObject && (elements.canvas as any).captureStream) {
      const canvasStream = (elements.canvas as any).captureStream(30);
      const audioTracks = backgroundAudioService.getAudioTrack();
      const combinedTracks = [...canvasStream.getVideoTracks(), ...audioTracks];
      const stream = new MediaStream(combinedTracks);
      elements.video.srcObject = stream;
      elements.video.muted = false;
      elements.video.volume = 0.05;
      await elements.video.play();
    }

    if (document.pictureInPictureElement !== elements.video) {
      await elements.video.requestPictureInPicture();
      isPiPActive = true;
    }
    return true;
  } catch (err) {
    console.warn('Failed to enter Picture-in-Picture:', err);
    return false;
  }
}
