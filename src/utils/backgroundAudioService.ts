/**
 * Background Audio & MediaSession Keepalive Service
 * Ensures continuous background playback for YouTube audio when screen is locked or app is minimized,
 * and maintains complete MediaSession metadata & lock screen controls on Android & iOS.
 */

import { VideoItem } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';

interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onSeekRelative: (deltaSeconds: number) => void;
}

/**
 * Generate a valid 5-second 16-bit PCM WAV audio Blob with a sub-audible dither
 * This ensures Android/iOS AudioManager recognizes it as active non-zero audio
 * without putting the audio pipeline to sleep.
 */
function createSubAudibleWavBlob(durationSeconds = 5, sampleRate = 11025): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = durationSeconds * sampleRate;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Fill with a tiny, imperceptible 20Hz sub-audible carrier (amplitude ~2 out of 32767)
  // This keeps the mobile hardware DSP actively decoding audio
  for (let i = 0; i < numSamples; i++) {
    const sampleVal = Math.round(2 * Math.sin((2 * Math.PI * 20 * i) / sampleRate));
    view.setInt16(44 + i * 2, sampleVal, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

class BackgroundAudioService {
  private silentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private worker: Worker | null = null;
  private wakeLock: any = null;
  private isUnlocked = false;
  private isPlaying = false;
  private currentVideo: VideoItem | null = null;
  private callbacks: MediaSessionCallbacks | null = null;
  private playerGetter: (() => any) | null = null;
  private blobUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initGestureUnlock();
      this.initSilentAudio();
      this.initWorkerHeartbeat();
      this.initVisibilityListener();
    }
  }

  /**
   * Automatically unlock audio context and silent element on the first user interaction
   */
  private initGestureUnlock() {
    const unlockHandler = () => {
      this.unlockAudio();
    };

    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
    window.addEventListener('pointerdown', unlockHandler, { capture: true, passive: true });
    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
  }

  private audioStreamDestination: MediaStreamAudioDestinationNode | null = null;

  public getAudioTrack(): MediaStreamTrack[] {
    if (this.audioStreamDestination && this.audioStreamDestination.stream) {
      return this.audioStreamDestination.stream.getAudioTracks();
    }
    return [];
  }

  /**
   * Unlock Web Audio context and silent element on user interaction
   */
  public unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
        this.audioStreamDestination = this.audioContext.createMediaStreamDestination();

        // Create an inaudible 20Hz carrier tone connected to both speaker and MediaStream
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.0001; // completely imperceptible
        osc.frequency.value = 20;
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        gain.connect(this.audioStreamDestination);
        osc.start();

        // Attach stream to audio element if available
        if (this.silentAudio && this.audioStreamDestination.stream) {
          try {
            this.silentAudio.srcObject = this.audioStreamDestination.stream;
          } catch {}
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio unlock warning:', e);
    }

    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {});
    }

    this.isUnlocked = true;
  }

  /**
   * Initialize silent WAV audio element attached to document
   */
  private initSilentAudio() {
    try {
      const blob = createSubAudibleWavBlob(5, 11025);
      this.blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.blobUrl);
      audio.loop = true;
      audio.volume = 0.05; // minimal non-zero volume for mobile AudioManager
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('x5-playsinline', 'true');
      audio.id = 'app-background-audio-keepalive';
      // Keep inside viewport with non-zero dimensions & minimal opacity to prevent iOS/Android discarding
      audio.style.position = 'fixed';
      audio.style.bottom = '0px';
      audio.style.left = '0px';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.01';
      audio.style.pointerEvents = 'none';
      document.body.appendChild(audio);

      // Continuous OS audio thread heartbeat that runs even when phone screen is locked
      audio.addEventListener('timeupdate', () => {
        if (this.isPlaying && document.hidden) {
          this.ensurePlayerPlaying();
        }
      });

      this.silentAudio = audio;
    } catch (e) {
      console.warn('Silent audio initialization failed:', e);
    }
  }

  /**
   * Initialize unthrottled Web Worker for background heartbeat
   */
  private initWorkerHeartbeat() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 400);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = () => {
        if (this.isPlaying && document.hidden) {
          this.ensurePlayerPlaying();
        }
      };
      this.worker = worker;
    } catch (e) {
      console.warn('Worker heartbeat warning:', e);
    }
  }

  /**
   * Listen to visibility changes and prevent background suspension
   */
  private initVisibilityListener() {
    const handleVisibility = () => {
      if (document.hidden) {
        if (this.isPlaying) {
          this.ensureAudioCarrier();
          if (this.worker) this.worker.postMessage('start');
          if (this.silentAudio) this.silentAudio.play().catch(() => {});

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }

          // Staggered auto-resume sequence to counter OS sleep pause
          this.ensurePlayerPlaying();
          setTimeout(() => this.ensurePlayerPlaying(), 100);
          setTimeout(() => this.ensurePlayerPlaying(), 300);
          setTimeout(() => this.ensurePlayerPlaying(), 700);
          setTimeout(() => this.ensurePlayerPlaying(), 1500);
        }
      } else {
        if (this.worker) this.worker.postMessage('stop');
        if (this.isPlaying) {
          this.ensurePlayerPlaying();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    window.addEventListener('freeze', handleVisibility);
  }

  /**
   * Resumes the YouTube player if paused unexpectedly by the OS
   */
  private ensurePlayerPlaying() {
    if (!this.isPlaying) return;
    try {
      const player = this.playerGetter?.();
      if (player && typeof player.getPlayerState === 'function') {
        const state = player.getPlayerState();
        // State 2 = Paused, -1 = Unstarted, 5 = Cued
        if (state === 2 || state === -1 || state === 5) {
          player.playVideo();
        }
      }
    } catch {}
  }

  /**
   * Ensure audio context & silent audio are actively running
   */
  public ensureAudioCarrier() {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      if (this.silentAudio && this.isPlaying && this.silentAudio.paused) {
        this.silentAudio.play().catch(() => {});
      }
    } catch {}
  }

  /**
   * Register player getter and callbacks
   */
  public register(playerGetter: () => any, callbacks: MediaSessionCallbacks) {
    this.playerGetter = playerGetter;
    this.callbacks = callbacks;
    this.setupMediaSessionHandlers();
  }

  /**
   * Update playback state (called by useYouTubePlayer)
   */
  public updateState(video: VideoItem | null, isPlaying: boolean, currentTime: number, duration: number, playbackRate = 1) {
    this.currentVideo = video;
    this.isPlaying = isPlaying;

    if (isPlaying) {
      this.ensureAudioCarrier();
      if (this.worker && document.hidden) {
        this.worker.postMessage('start');
      }
      this.acquireWakeLock();
    } else {
      if (this.silentAudio && !this.silentAudio.paused) {
        this.silentAudio.pause();
      }
      if (this.worker) {
        this.worker.postMessage('stop');
      }
      this.releaseWakeLock();
    }

    // Update MediaSession
    this.syncMediaSession(video, isPlaying, currentTime, duration, playbackRate);
  }

  /**
   * Setup OS Lock Screen / Media Notification controls
   */
  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`MediaSession action "${action}" not supported:`, err);
      }
    };

    setAction('play', () => {
      this.ensureAudioCarrier();
      if (this.silentAudio && this.silentAudio.paused) {
        this.silentAudio.play().catch(() => {});
      }
      this.callbacks?.onPlay();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    });

    setAction('pause', () => {
      if (this.silentAudio) this.silentAudio.pause();
      this.callbacks?.onPause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    });

    setAction('previoustrack', () => {
      this.callbacks?.onPrev();
    });

    setAction('nexttrack', () => {
      this.callbacks?.onNext();
    });

    setAction('seekto', (details) => {
      if (details.seekTime !== undefined && Number.isFinite(details.seekTime)) {
        this.callbacks?.onSeek(details.seekTime);
      }
    });

    setAction('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      this.callbacks?.onSeekRelative(-offset);
    });

    setAction('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      this.callbacks?.onSeekRelative(offset);
    });

    setAction('stop', () => {
      if (this.silentAudio) this.silentAudio.pause();
      this.callbacks?.onPause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    });
  }

  /**
   * Sync rich metadata & position state to MediaSession
   */
  public syncMediaSession(
    video: VideoItem | null,
    isPlaying: boolean,
    currentTime: number,
    duration: number,
    playbackRate = 1
  ) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      if (video) {
        const reliableThumb = getReliableThumbnail(video.id, video.thumbnail);
        const videoId = video.id;

        // Clean redundant bracket tags from title for clean lock screen display
        const cleanTitle = video.title
          .replace(/\s*[\(\[]\s*(Official\s*)?(Music\s*)?(Video|Audio|MV|Lyric(s)?|Visualizer|HD|4K|Audio)\s*[\)\]]/gi, '')
          .replace(/\s*[\(\[]\s*MV\s*[\)\]]/gi, '')
          .trim() || video.title;

        const artworkList = [
          { src: `https://i.ytimg.com/vi/${videoId}/default.jpg`, sizes: '120x90', type: 'image/jpeg' },
          { src: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
          { src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
          { src: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`, sizes: '640x480', type: 'image/jpeg' },
          { src: reliableThumb, sizes: '512x512', type: 'image/jpeg' },
        ];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: cleanTitle,
          artist: video.channelTitle || 'YouTube Music',
          album: 'YouTube Premium Background',
          artwork: artworkList,
        });
      }

      // Safely update position state for Android Lock Screen seekbar
      if (
        'setPositionState' in navigator.mediaSession &&
        Number.isFinite(duration) &&
        duration > 0 &&
        Number.isFinite(currentTime) &&
        currentTime >= 0
      ) {
        try {
          const safePos = Math.min(Math.max(0, currentTime), duration);
          const safeRate = Math.max(0.25, Math.min(4, playbackRate || 1));
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, duration),
            playbackRate: safeRate,
            position: safePos,
          });
        } catch {}
      }
    } catch (err) {
      console.warn('MediaSession sync error:', err);
    }
  }

  /**
   * Screen WakeLock management
   */
  private async acquireWakeLock() {
    try {
      if ('wakeLock' in navigator && !document.hidden && !this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch {}
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }
}

export const backgroundAudioService = new BackgroundAudioService();

