import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoItem, RepeatMode } from '../types';
import {
  enterNativePictureInPicture,
  exitPictureInPicture,
  isPictureInPictureActive,
  isPictureInPictureSupported,
  updatePiPState,
  preparePiPCarrier,
} from '../utils/pipService';
import { backgroundAudioService } from '../utils/backgroundAudioService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer() {
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(90);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isNativePiP, setIsNativePiP] = useState(false);
  const [isAutoPiPEnabled, setIsAutoPiPEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('yt_auto_pip');
    return saved !== null ? saved === 'true' : false;
  });
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [sleepTimerMode, setSleepTimerMode] = useState<'time' | 'end_of_track' | null>(null);
  const [equalizerPreset, setEqualizerPreset] = useState<'flat' | 'bass' | 'vocal' | 'chill'>('flat');

  // AdBlock Engine States
  const [isAdBlockActive, setIsAdBlockActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('yt_adblock_active');
    return saved !== null ? saved === 'true' : true;
  });

  const [adsBlockedCount, setAdsBlockedCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('yt_ads_blocked');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [adCurrentlyDetected, setAdCurrentlyDetected] = useState(false);
  const [adBlockToast, setAdBlockToast] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const progressTimerRef = useRef<any>(null);
  const adBlockCheckRef = useRef<any>(null);
  const isPlayingRef = useRef(isPlaying);
  const wakeLockRef = useRef<any>(null);

  // Synchronize isPlaying ref for background intervals and media events
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('yt_adblock_active', String(isAdBlockActive));
  }, [isAdBlockActive]);

  useEffect(() => {
    localStorage.setItem('yt_ads_blocked', String(adsBlockedCount));
  }, [adsBlockedCount]);

  useEffect(() => {
    localStorage.setItem('yt_auto_pip', String(isAutoPiPEnabled));
  }, [isAutoPiPEnabled]);

  // Show temporary toast notification
  const triggerToast = useCallback((msg: string) => {
    setAdBlockToast(msg);
    setTimeout(() => {
      setAdBlockToast((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Synchronize state with background audio keepalive service & PiP carrier
  useEffect(() => {
    backgroundAudioService.updateState(currentVideo, isPlaying, currentTime, duration, playbackRate);
    if (currentVideo) {
      updatePiPState(currentVideo, isPlaying, currentTime, duration);
      if (isAutoPiPEnabled && isPlaying) {
        preparePiPCarrier(currentVideo, isPlaying, currentTime, duration, () => {
          setIsNativePiP(false);
          setIsPiP(false);
        }).catch(() => {});
      }
    }
  }, [currentVideo, isPlaying, currentTime, duration, playbackRate, isAutoPiPEnabled]);

  // Screen WakeLock API: keeps screen alive while video plays without unexpected timeout
  useEffect(() => {
    let isMounted = true;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && isPlaying && !document.hidden && !wakeLockRef.current) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (isMounted) {
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          } else {
            lock.release();
          }
        }
      } catch {}
    };

    if (isPlaying) {
      requestLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      isMounted = false;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isPlaying]);

  // Sleep timer interval
  useEffect(() => {
    if (sleepTimerSeconds === null || sleepTimerSeconds <= 0) return;

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
          }
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Play next handler
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentVideo) {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }

    const nextVideo = queue[nextIndex];
    if (nextVideo) {
      setQueueIndex(nextIndex);
      setCurrentVideo(nextVideo);
    }
  }, [queue, queueIndex, repeatMode, isShuffle, currentVideo]);

  // Play previous handler
  const playPrev = useCallback(() => {
    if (currentTime > 4 && playerRef.current?.seekTo) {
      playerRef.current.seekTo(0, true);
      return;
    }
    if (queue.length === 0) return;

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    const prevVideo = queue[prevIndex];
    if (prevVideo) {
      setQueueIndex(prevIndex);
      setCurrentVideo(prevVideo);
    }
  }, [queue, queueIndex, currentTime]);

  // Auto PiP when leaving app/tab if user enabled AutoPiP
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlayingRef.current && currentVideo) {
        if (isAutoPiPEnabled && !isPictureInPictureActive()) {
          enterNativePictureInPicture(
            currentVideo,
            isPlayingRef.current,
            currentTime,
            duration,
            () => {
              setIsNativePiP(false);
              setIsPiP(false);
            }
          )
            .then((success) => {
              if (success) {
                setIsNativePiP(true);
                setIsPiP(true);
              }
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVideo, currentTime, duration, isAutoPiPEnabled]);

  // Manually skip any detected ad
  const skipCurrentAd = useCallback(() => {
    if (!playerRef.current) return;
    try {
      const adDur = playerRef.current.getDuration?.() || 0;
      if (adDur > 0) {
        playerRef.current.seekTo(adDur + 1, true);
      } else {
        playerRef.current.seekTo(currentTime + 30, true);
      }
      setAdCurrentlyDetected(false);
      setAdsBlockedCount((prev) => prev + 1);
      triggerToast('🛡️ Đã bỏ qua quảng cáo!');
    } catch (e) {
      console.warn('Ad skip error:', e);
    }
  }, [currentTime, triggerToast]);

  // Initialize or update YouTube Player with standard youtube.com host & ad suppression
  useEffect(() => {
    if (!currentVideo) return;

    const initPlayer = () => {
      const container = document.getElementById('youtube-iframe-mount');
      if (!container) return;

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById({
            videoId: currentVideo.id,
            suggestedQuality: isAudioOnly ? 'small' : 'hd720',
          });
          playerRef.current.playVideo();
          setIsPlaying(true);
          return;
        } catch (err) {
          console.warn('Error loading video by ID, re-initializing player:', err);
        }
      }

      // Standard youtube.com host with playsinline & suppressed annotations for ad-free high quality playback
      playerRef.current = new window.YT.Player('youtube-iframe-mount', {
        height: '100%',
        width: '100%',
        host: 'https://www.youtube.com',
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3, // Suppress annotations and marketing popups
          modestbranding: 1,
          playsinline: 1, // Crucial for iOS/Android background audio & PiP
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            event.target.setPlaybackRate(playbackRate);
            event.target.playVideo();
            setIsPlaying(true);
          },
          onError: (event: any) => {
            console.warn('YouTube Player error code:', event.data);
            if (event.data === 150 || event.data === 101) {
              triggerToast('Video này yêu cầu phát trực tiếp trên YouTube, đang chuyển bài tiếp...');
              setTimeout(() => playNext(), 1500);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              // If document is hidden, the browser or OS might have artificially paused YouTube iframe
              if (!document.hidden) {
                setIsPlaying(false);
              }
            } else if (event.data === 0) {
              // Ended
              if (sleepTimerMode === 'end_of_track') {
                setIsPlaying(false);
                setSleepTimerMode(null);
                setSleepTimerSeconds(null);
                return;
              }
              playNext();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [currentVideo, isAudioOnly, playNext]);

  // Periodic time tracker & Intelligent Auto-Ad-Skipper
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (adBlockCheckRef.current) clearInterval(adBlockCheckRef.current);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
        const curr = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        setCurrentTime(curr);
        setDuration(dur);

        // Update MediaSession position state
        if ('mediaSession' in navigator && dur > 0 && 'setPositionState' in navigator.mediaSession) {
          try {
            navigator.mediaSession.setPositionState({
              duration: dur,
              playbackRate: playbackRate,
              position: Math.min(curr, dur),
            });
          } catch {}
        }
      }
    }, 500);

    // Intelligent Ad-Block detector:
    // If an ad starts, detect and instantly fast-forward/skip past it
    if (isAdBlockActive) {
      adBlockCheckRef.current = setInterval(() => {
        if (!playerRef.current) return;

        try {
          const videoData = playerRef.current.getVideoData ? playerRef.current.getVideoData() : null;
          // In YouTube iframe, if video_id is different or player is in an ad
          const isAdPlaying =
            videoData &&
            videoData.video_id &&
            currentVideo &&
            videoData.video_id !== currentVideo.id;

          if (isAdPlaying) {
            setAdCurrentlyDetected(true);
            // Skip the ad automatically
            const adDuration = playerRef.current.getDuration ? playerRef.current.getDuration() : 0;
            if (adDuration > 0) {
              playerRef.current.seekTo(adDuration + 0.5, true);
            } else {
              playerRef.current.setPlaybackRate?.(16);
            }
            setAdsBlockedCount((prev) => prev + 1);
            triggerToast('🛡️ Đã tự động chặn 1 quảng cáo!');
          } else {
            setAdCurrentlyDetected(false);
          }
        } catch {}
      }, 800);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (adBlockCheckRef.current) clearInterval(adBlockCheckRef.current);
    };
  }, [isPlaying, playbackRate, isAdBlockActive, currentVideo, triggerToast]);

  // Controls
  const togglePlay = () => {
    backgroundAudioService.unlockAudio();
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      backgroundAudioService.ensureAudioCarrier();
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    if (playerRef.current?.getCurrentTime && playerRef.current?.seekTo) {
      const newTime = Math.max(0, playerRef.current.getCurrentTime() + deltaSeconds);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  // Register the player getter & controls with backgroundAudioService as the single authority
  useEffect(() => {
    backgroundAudioService.register(
      () => playerRef.current,
      {
        onPlay: () => {
          if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
          }
          setIsPlaying(true);
        },
        onPause: () => {
          if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
          }
          setIsPlaying(false);
        },
        onNext: () => playNext(),
        onPrev: () => playPrev(),
        onSeek: (seconds: number) => seekTo(seconds),
        onSeekRelative: (deltaSeconds: number) => seekRelative(deltaSeconds),
      }
    );
  }, [playNext, playPrev, seekTo, seekRelative]);

  const changeVolume = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleAudioOnly = () => {
    setIsAudioOnly(!isAudioOnly);
  };

  // Picture-in-Picture: Native OS PiP (system wide) + In-App PiP Mini Player
  const toggleNativePiP = async () => {
    if (!currentVideo) return;

    if (isPictureInPictureActive()) {
      await exitPictureInPicture();
      setIsNativePiP(false);
      setIsPiP(false);
    } else {
      const success = await enterNativePictureInPicture(
        currentVideo,
        isPlaying,
        currentTime,
        duration,
        () => {
          setIsNativePiP(false);
          setIsPiP(false);
        }
      );
      if (success) {
        setIsNativePiP(true);
        setIsPiP(true);
        triggerToast('📺 Đã mở Picture-in-Picture hệ thống (xem đè trên mọi ứng dụng)');
      } else {
        // Fallback to in-app floating mini player
        setIsMiniPlayer(true);
        setIsPiP(true);
        triggerToast('📺 Đã bật trình phát thu nhỏ (Mini Player)');
      }
    }
  };

  const toggleInAppPiP = () => {
    setIsMiniPlayer(!isMiniPlayer);
    setIsPiP(!isMiniPlayer);
  };

  const togglePiP = () => {
    if (isPictureInPictureSupported()) {
      toggleNativePiP();
    } else {
      toggleInAppPiP();
    }
  };

  const toggleAdBlock = () => {
    setIsAdBlockActive((prev) => {
      const next = !prev;
      triggerToast(next ? '🛡️ Khiên Chặn Quảng Cáo: ĐANG BẬT' : '⚠️ Khiên Chặn Quảng Cáo: ĐÃ TẮT');
      return next;
    });
  };

  const toggleAutoPiP = () => {
    setIsAutoPiPEnabled((prev) => {
      const next = !prev;
      triggerToast(next ? '📺 Tự động mở PiP khi ra ngoài: ĐANG BẬT' : '⚠️ Tự động mở PiP: ĐÃ TẮT');
      return next;
    });
  };

  const playVideo = (video: VideoItem, customQueue?: VideoItem[]) => {
    backgroundAudioService.unlockAudio();
    backgroundAudioService.ensureAudioCarrier();

    if (customQueue && customQueue.length > 0) {
      setQueue(customQueue);
      const idx = customQueue.findIndex((v) => v.id === video.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue((prev) => {
        const exists = prev.findIndex((v) => v.id === video.id);
        if (exists === -1) {
          const next = [video, ...prev];
          setQueueIndex(0);
          return next;
        } else {
          setQueueIndex(exists);
          return prev;
        }
      });
    }

    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const addToQueue = (video: VideoItem) => {
    setQueue((prev) => {
      if (prev.some((v) => v.id === video.id)) return prev;
      return [...prev, video];
    });
    triggerToast(`Đã thêm "${video.title.slice(0, 30)}..." vào hàng đợi`);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      playNext();
    } else if (index < queueIndex) {
      setQueueIndex(queueIndex - 1);
    }
  };

  const clearQueue = () => {
    if (currentVideo) {
      setQueue([currentVideo]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(-1);
    }
  };

  const setSleepTimer = (minutes: number | 'end_of_track' | null) => {
    if (minutes === null) {
      setSleepTimerSeconds(null);
      setSleepTimerMode(null);
      triggerToast('Đã hủy hẹn giờ tắt nhạc');
    } else if (minutes === 'end_of_track') {
      setSleepTimerMode('end_of_track');
      setSleepTimerSeconds(null);
      triggerToast('Hẹn giờ: Dừng khi hết bài hát hiện tại');
    } else {
      setSleepTimerMode('time');
      setSleepTimerSeconds(minutes * 60);
      triggerToast(`Hẹn giờ tắt sau ${minutes} phút`);
    }
  };

  // True Fullscreen Mode handlers
  const enterFullscreen = useCallback(async () => {
    setIsFullscreen(true);
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      }
    } catch (e) {
      console.log('Browser fullscreen request fallback to in-app fullscreen:', e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.log('Browser exitFullscreen exception:', e);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen || document.fullscreenElement || (document as any).webkitFullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Sync fullscreenchange listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isNativeFs) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Global Keyboard Shortcuts for YouTube Player (F for fullscreen, Space/K for play, Arrows, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          e.preventDefault();
          exitFullscreen();
        }
      } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeVolume(Math.min(100, volume + 5));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 5));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen, exitFullscreen, togglePlay, seekRelative, changeVolume, volume, toggleMute]);

  return {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    isShuffle,
    isAudioOnly,
    isPiP,
    isNativePiP,
    isMiniPlayer,
    isFullPlayerOpen,
    isFullscreen,
    queue,
    queueIndex,
    sleepTimerSeconds,
    sleepTimerMode,
    equalizerPreset,
    // AdBlock states & actions
    isAdBlockActive,
    adsBlockedCount,
    adCurrentlyDetected,
    adBlockToast,
    toggleAdBlock,
    skipCurrentAd,
    // PiP actions
    togglePiP,
    toggleNativePiP,
    toggleInAppPiP,
    isAutoPiPEnabled,
    toggleAutoPiP,
    setIsAutoPiPEnabled,
    // Fullscreen actions
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    setIsFullscreen,
    // Other controls
    playerRef,
    playerContainerRef,
    setIsMiniPlayer,
    setIsFullPlayerOpen,
    setIsAudioOnly,
    setEqualizerPreset,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    seekRelative,
    changeVolume,
    toggleMute,
    changePlaybackRate,
    cycleRepeatMode,
    toggleShuffle,
    toggleAudioOnly,
    playVideo,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setSleepTimer,
  };
}
