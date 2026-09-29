import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  PictureInPicture,
  ArrowLeft,
  Gauge,
} from 'lucide-react';
import { VideoItem, RepeatMode } from '../types';
import { formatTime } from '../utils/formatters';

interface YouTubeVideoHostProps {
  currentVideo: VideoItem | null;
  isPlaying: boolean;
  isFullPlayerOpen: boolean;
  isMiniPlayer: boolean;
  isAudioOnly: boolean;
  isFullscreen?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;
  playbackRate?: number;
  repeatMode?: RepeatMode;
  isShuffle?: boolean;
  isAdBlockActive?: boolean;
  isNativePiP?: boolean;
  isAutoPiPEnabled?: boolean;
  onTogglePlay: () => void;
  onSeekRelative?: (deltaSeconds: number) => void;
  onSeek?: (seconds: number) => void;
  onToggleFullscreen?: () => void;
  onPlayNext?: () => void;
  onPlayPrev?: () => void;
  onChangeVolume?: (vol: number) => void;
  onToggleMute?: () => void;
  onChangePlaybackRate?: (rate: number) => void;
  onCycleRepeat?: () => void;
  onToggleShuffle?: () => void;
  onToggleNativePiP?: () => void;
  onToggleAutoPiP?: () => void;
}

export function YouTubeVideoHost({
  currentVideo,
  isPlaying,
  isFullPlayerOpen,
  isMiniPlayer,
  isAudioOnly,
  isFullscreen = false,
  currentTime = 0,
  duration = 0,
  volume = 90,
  isMuted = false,
  playbackRate = 1,
  repeatMode = 'none',
  isShuffle = false,
  isAdBlockActive = true,
  isNativePiP = false,
  isAutoPiPEnabled = false,
  onTogglePlay,
  onSeekRelative,
  onSeek,
  onToggleFullscreen,
  onPlayNext,
  onPlayPrev,
  onChangeVolume,
  onToggleMute,
  onChangePlaybackRate,
  onCycleRepeat,
  onToggleShuffle,
  onToggleNativePiP,
  onToggleAutoPiP,
}: YouTubeVideoHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ icon: 'play' | 'pause' | 'rewind' | 'forward'; id: number } | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize the fixed position and size of the video player host
  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      const host = hostRef.current;
      if (!host) return;

      // 1. Fullscreen Cinema Mode has the highest priority: expand across the entire viewport
      if (isFullscreen && currentVideo) {
        host.style.position = 'fixed';
        host.style.top = '0px';
        host.style.left = '0px';
        host.style.width = '100vw';
        host.style.height = '100vh';
        host.style.opacity = '1';
        host.style.visibility = 'visible';
        host.style.pointerEvents = 'auto';
        host.style.zIndex = '99999';
        host.style.borderRadius = '0px';
        host.style.overflow = 'hidden';
        host.style.display = 'block';
        return;
      }

      // 2. Normal View: attach to the active slot
      let target: HTMLElement | null = null;
      if (isFullPlayerOpen && !isAudioOnly) {
        target = document.getElementById('full-video-view-slot');
      } else if (!isFullPlayerOpen && isMiniPlayer && !isAudioOnly) {
        target = document.getElementById('mini-video-view-slot');
      }

      if (target && currentVideo) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          host.style.position = 'fixed';
          host.style.top = `${rect.top}px`;
          host.style.left = `${rect.left}px`;
          host.style.width = `${rect.width}px`;
          host.style.height = `${rect.height}px`;
          host.style.opacity = '1';
          host.style.visibility = 'visible';
          host.style.pointerEvents = 'auto';
          host.style.zIndex = isFullPlayerOpen ? '55' : '52';
          host.style.borderRadius = isFullPlayerOpen ? '16px' : '0 0 12px 12px';
          host.style.overflow = 'hidden';
          host.style.display = 'block';
          return;
        }
      }

      // 3. Active Docked Background Mode (Audio-Only mode or bottom player background listening)
      // Must stay inside the viewport with visibility: 'visible', valid dimension, and minimal non-zero opacity
      // This strictly prevents iOS WebKit and Android Chromium from throttling/discarding the iframe!
      host.style.position = 'fixed';
      host.style.bottom = '80px';
      host.style.left = '16px';
      host.style.width = '64px';
      host.style.height = '64px';
      host.style.opacity = '0.01';
      host.style.visibility = 'visible';
      host.style.pointerEvents = 'none';
      host.style.zIndex = '1';
      host.style.borderRadius = '8px';
      host.style.overflow = 'hidden';
      host.style.display = 'block';
    };

    const loop = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isFullscreen, isFullPlayerOpen, isMiniPlayer, isAudioOnly, currentVideo]);

  // Show transient action feedback icon
  const triggerFeedback = useCallback((icon: 'play' | 'pause' | 'rewind' | 'forward') => {
    setActionFeedback({ icon, id: Date.now() });
    setTimeout(() => {
      setActionFeedback((curr) => (curr?.icon === icon ? null : curr));
    }, 600);
  }, []);

  // Handle click & double-click on the video screen
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on a button or slider inside the overlay, ignore screen click
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[data-no-screen-click]')) {
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    const host = hostRef.current;
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width * 0.35;
    const isRightSide = clickX > rect.width * 0.65;

    // Double tap detection (within 280ms)
    if (timeSinceLast < 280 && onSeekRelative) {
      if (isLeftSide) {
        onSeekRelative(-10);
        triggerFeedback('rewind');
        return;
      } else if (isRightSide) {
        onSeekRelative(10);
        triggerFeedback('forward');
        return;
      }
    }

    // Single click: toggle play/pause
    onTogglePlay();
    triggerFeedback(isPlaying ? 'pause' : 'play');

    // Reveal overlay controls briefly
    setShowOverlayControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowOverlayControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    setShowOverlayControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowOverlayControls(false);
    }, 3000);
  };

  const isControlsVisible = !isPlaying || showOverlayControls || showSpeedMenu;

  return (
    <div
      id="youtube-player-host"
      ref={hostRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        top: 0,
        left: '-9999px',
        width: '320px',
        height: '180px',
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: -999,
        backgroundColor: '#000000',
        transition: isFullscreen ? 'none' : 'opacity 0.2s ease',
      }}
      className={`select-none group ${isFullscreen && !isControlsVisible ? 'cursor-none' : 'cursor-default'}`}
    >
      {/* Permanent YouTube IFrame API Target Element */}
      <div id="youtube-iframe-mount" className="w-full h-full pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. CINEMA FULLSCREEN HUD OVERLAY                                         */}
      {/* ========================================================================= */}
      {isFullscreen && currentVideo && (
        <div
          id="fullscreen-cinema-hud"
          onClick={handleScreenClick}
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
            isControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar with Gradient */}
          <div className="w-full p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {onToggleFullscreen && (
                <button
                  id="fullscreen-exit-top-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFullscreen();
                  }}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-zinc-800 text-white border border-white/10 transition-colors flex items-center gap-2 group"
                  title="Thoát toàn màn hình (Phím ESC hoặc F)"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-xs font-semibold hidden sm:inline">Thoát [ESC]</span>
                </button>
              )}

              <div className="min-w-0">
                <h1 className="text-white text-base sm:text-lg font-bold truncate drop-shadow-md">
                  {currentVideo.title}
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm font-medium truncate drop-shadow">
                  {currentVideo.channelTitle}
                </p>
              </div>
            </div>

            {/* Right Top Status & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdBlockActive && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4" />
                  <span>0 Quảng Cáo</span>
                </div>
              )}

              {onToggleNativePiP && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNativePiP();
                  }}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    isNativePiP
                      ? 'bg-blue-600/30 text-blue-400 border-blue-500/40'
                      : 'bg-black/60 text-zinc-300 hover:text-white border-white/10 hover:bg-zinc-800'
                  }`}
                  title="Mở Picture-in-Picture ngoài ứng dụng"
                >
                  <PictureInPicture className="w-4 h-4" />
                  <span className="hidden md:inline">PiP</span>
                </button>
              )}

              {onToggleFullscreen && (
                <button
                  id="fullscreen-toggle-top-right-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFullscreen();
                  }}
                  className="p-2.5 rounded-xl bg-black/60 hover:bg-zinc-800 text-white border border-white/10 backdrop-blur-md transition-colors"
                  title="Thoát toàn màn hình [F]"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Center Playback Controls */}
          <div className="w-full flex items-center justify-center gap-4 sm:gap-8 pointer-events-none">
            {onPlayPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPrev();
                }}
                className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                title="Bài trước"
              >
                <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>
            )}

            {onSeekRelative && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekRelative(-10);
                  triggerFeedback('rewind');
                }}
                className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto flex items-center justify-center"
                title="Tua lùi 10s (Phím mũi tên trái)"
              >
                <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}

            {/* Central Master Play/Pause */}
            <button
              id="fullscreen-master-play-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
                triggerFeedback(isPlaying ? 'pause' : 'play');
              }}
              className="p-5 sm:p-6 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 pointer-events-auto border-2 border-white/30"
              title={isPlaying ? 'Tạm dừng (Phím Space hoặc K)' : 'Tiếp tục phát (Phím Space hoặc K)'}
            >
              {isPlaying ? (
                <Pause className="w-9 h-9 sm:w-11 sm:h-11 fill-current" />
              ) : (
                <Play className="w-9 h-9 sm:w-11 sm:h-11 fill-current translate-x-1" />
              )}
            </button>

            {onSeekRelative && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSeekRelative(10);
                  triggerFeedback('forward');
                }}
                className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto flex items-center justify-center"
                title="Tua tới 10s (Phím mũi tên phải)"
              >
                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            )}

            {onPlayNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayNext();
                }}
                className="p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 pointer-events-auto"
                title="Bài tiếp"
              >
                <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              </button>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div
            data-no-screen-click
            className="w-full p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-3"
          >
            {/* Scrubber Timeline */}
            <div className="w-full flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold text-zinc-300 w-12 text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 group/bar py-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek && onSeek(Number(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-zinc-700/70 rounded-full appearance-none cursor-pointer accent-red-600 hover:h-2.5 transition-all"
                />
              </div>

              <span className="text-xs sm:text-sm font-semibold text-zinc-400 w-12 text-left">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between gap-4">
              {/* Left group: Play, Next, Volume */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onTogglePlay}
                  className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
                  title={isPlaying ? 'Dừng phát' : 'Tiếp tục phát'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {onPlayNext && (
                  <button
                    onClick={onPlayNext}
                    className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
                    title="Bài tiếp"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                )}

                {/* Volume slider */}
                <div className="flex items-center gap-2 text-zinc-300">
                  <button
                    onClick={onToggleMute}
                    className="p-2 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
                    title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng (Phím M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-500" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onChangeVolume && onChangeVolume(Number(e.target.value))}
                    className="w-16 sm:w-28 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              </div>

              {/* Right group: Speed, Repeat, Shuffle, Exit Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Speed selector button & dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1 border border-white/10"
                    title="Tốc độ phát"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{playbackRate}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 p-1.5 rounded-xl bg-zinc-900/95 border border-zinc-700 backdrop-blur-xl shadow-2xl flex flex-col gap-1 min-w-[100px] z-50">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            onChangePlaybackRate && onChangePlaybackRate(rate);
                            setShowSpeedMenu(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors flex items-center justify-between ${
                            playbackRate === rate
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <span>{rate}x</span>
                          {rate === 1 && <span className="text-[10px] text-zinc-400">Chuẩn</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Repeat mode */}
                {onCycleRepeat && (
                  <button
                    onClick={onCycleRepeat}
                    className={`p-2 rounded-xl transition-colors ${
                      repeatMode !== 'none'
                        ? 'text-red-500 bg-red-600/20 border border-red-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Lặp lại: ${repeatMode === 'none' ? 'Tắt' : repeatMode === 'all' ? 'Tất cả' : '1 bài'}`}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                )}

                {/* Shuffle */}
                {onToggleShuffle && (
                  <button
                    onClick={onToggleShuffle}
                    className={`p-2 rounded-xl transition-colors ${
                      isShuffle
                        ? 'text-red-500 bg-red-600/20 border border-red-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Phát ngẫu nhiên: ${isShuffle ? 'Bật' : 'Tắt'}`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                )}

                {/* Exit Fullscreen button */}
                {onToggleFullscreen && (
                  <button
                    id="fullscreen-exit-bottom-btn"
                    onClick={onToggleFullscreen}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                    title="Thu nhỏ toàn màn hình [F]"
                  >
                    <Minimize2 className="w-5 h-5" />
                    <span className="text-xs font-semibold hidden md:inline">Thu nhỏ [F]</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NORMAL OVERLAY (FullPlayer or MiniPlayer)                              */}
      {/* ========================================================================= */}
      {!isFullscreen && (isFullPlayerOpen || isMiniPlayer) && !isAudioOnly && (
        <div
          id="video-screen-overlay"
          onClick={handleScreenClick}
          className="absolute inset-0 cursor-pointer flex items-center justify-center bg-transparent group-hover:bg-black/20 transition-colors"
        >
          {/* AdBlock Active Pill in Top-Left Corner */}
          {isAdBlockActive && isFullPlayerOpen && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/50 text-emerald-400 text-[11px] font-bold shadow-lg pointer-events-none select-none">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Premium • 0 Quảng Cáo</span>
            </div>
          )}

          {/* Fullscreen Expand Button in Top-Right Corner */}
          {onToggleFullscreen && (
            <button
              id="video-overlay-fullscreen-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen();
              }}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95 pointer-events-auto"
              title="Xem toàn màn hình (Phím F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Quick Play/Pause Center Button on Hover or When Paused */}
          {(!isPlaying || showOverlayControls) && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-2xl transition-transform active:scale-95 pointer-events-none">
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current text-white" />
              ) : (
                <Play className="w-7 h-7 fill-current text-white translate-x-0.5" />
              )}
            </div>
          )}

          {/* Double-tap instruction tooltip on full player hover */}
          {isFullPlayerOpen && showOverlayControls && (
            <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-zinc-400 border border-white/10">
                Nhấn 1 lần: Phát/Dừng • Nhấn đúp trái/phải: tua 10s • Nhấn F: Toàn màn hình
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transient Action Feedback Icon (Shared for both modes) */}
      {actionFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="p-4 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 animate-in zoom-in-75 duration-200 shadow-2xl flex items-center gap-2">
            {actionFeedback.icon === 'play' && <Play className="w-8 h-8 fill-current text-emerald-400" />}
            {actionFeedback.icon === 'pause' && <Pause className="w-8 h-8 fill-current text-amber-400" />}
            {actionFeedback.icon === 'rewind' && (
              <div className="flex items-center gap-1 text-red-400 font-bold text-sm">
                <RotateCcw className="w-6 h-6" />
                <span>-10s</span>
              </div>
            )}
            {actionFeedback.icon === 'forward' && (
              <div className="flex items-center gap-1 text-red-400 font-bold text-sm">
                <RotateCw className="w-6 h-6" />
                <span>+10s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
