import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Maximize2, Headphones, PictureInPicture, Move, Scaling } from 'lucide-react';
import { VideoItem } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';
import { formatTime } from '../utils/formatters';

interface MiniPlayerProps {
  currentVideo: VideoItem | null;
  isPlaying: boolean;
  isAudioOnly: boolean;
  isAdBlockActive?: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev?: () => void;
  onExpand: () => void;
  onClose: () => void;
  onToggleNativePiP?: () => void;
  onToggleFullscreen?: () => void;
}

export function MiniPlayer({
  currentVideo,
  isPlaying,
  isAudioOnly,
  currentTime = 0,
  duration = 0,
  onSeek,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onExpand,
  onClose,
  onToggleNativePiP,
}: MiniPlayerProps) {
  if (!currentVideo) return null;

  // Window sizing & position
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 340;
    const saved = localStorage.getItem('yt_mini_player_width');
    const parsed = saved ? parseInt(saved, 10) : 340;
    return Math.min(Math.max(260, parsed), Math.min(640, window.innerWidth - 32));
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; initialWidth: number } | null>(null);

  const thumbUrl = getReliableThumbnail(currentVideo.id, currentVideo.thumbnail);

  // Save width changes
  useEffect(() => {
    try {
      localStorage.setItem('yt_mini_player_width', width.toString());
    } catch {}
  }, [width]);

  // Dragging logic
  const handleDragStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    // Only drag if not clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  // Resizing logic (dragging resize handle)
  const handleResizeStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    resizeStartRef.current = {
      startX: clientX,
      initialWidth: width,
    };
    setIsResizing(true);
  };

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Handle dragging
      if (isDragging && dragStartRef.current) {
        const deltaX = clientX - dragStartRef.current.startX;
        const deltaY = clientY - dragStartRef.current.startY;

        setPosition({
          x: dragStartRef.current.initialX + deltaX,
          y: dragStartRef.current.initialY + deltaY,
        });
      }

      // Handle resizing
      if (isResizing && resizeStartRef.current) {
        // Dragging left or right alters width (since it's docked to bottom-right by default)
        const deltaX = resizeStartRef.current.startX - clientX;
        const newWidth = Math.min(
          Math.max(260, resizeStartRef.current.initialWidth + deltaX),
          Math.min(680, window.innerWidth - 32)
        );
        setWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, isResizing]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="floating-mini-player"
      style={{
        width: `${width}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      className={`fixed bottom-24 right-4 sm:right-6 z-50 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-xl select-none transition-shadow duration-100 ${
        isDragging
          ? 'shadow-red-600/30 ring-2 ring-red-500/50 cursor-grabbing'
          : isResizing
          ? 'shadow-blue-600/30 ring-2 ring-blue-500/50'
          : 'shadow-black/90'
      }`}
    >
      {/* Top Drag & Action Bar */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="px-3 py-2 bg-zinc-900/90 border-b border-zinc-800/80 rounded-t-2xl flex items-center justify-between cursor-grab text-zinc-400 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold min-w-0 pr-2">
          <Move className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="truncate text-zinc-200">{currentVideo.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Size presets */}
          <div className="hidden sm:flex items-center bg-zinc-800/80 rounded-lg p-0.5 mr-1 text-[10px] font-bold text-zinc-400">
            <button
              onClick={() => setWidth(280)}
              className={`px-1.5 py-0.5 rounded ${width <= 300 ? 'bg-red-600 text-white' : 'hover:text-white'}`}
              title="Cỡ nhỏ (280px)"
            >
              S
            </button>
            <button
              onClick={() => setWidth(380)}
              className={`px-1.5 py-0.5 rounded ${width > 300 && width <= 440 ? 'bg-red-600 text-white' : 'hover:text-white'}`}
              title="Cỡ vừa (380px)"
            >
              M
            </button>
            <button
              onClick={() => setWidth(520)}
              className={`px-1.5 py-0.5 rounded ${width > 440 ? 'bg-red-600 text-white' : 'hover:text-white'}`}
              title="Cỡ lớn (520px)"
            >
              L
            </button>
          </div>

          {/* Native OS PiP toggle */}
          {onToggleNativePiP && (
            <button
              onClick={onToggleNativePiP}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Chuyển sang PiP của hệ thống (OS PiP)"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand to Full Player Modal */}
          <button
            onClick={onExpand}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Mở toàn màn hình trình phát"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close Mini Player */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Đóng mini player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Media Canvas / Live Video View Slot */}
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        {isAudioOnly ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-4 text-center">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-700 shadow-xl mb-2">
              <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-red-500" />
              Chế độ chỉ nghe nhạc
            </span>
          </div>
        ) : (
          <div id="mini-video-view-slot" className="w-full h-full relative">
            <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div
          onClick={(e) => {
            if (!onSeek || duration <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(pct * duration);
          }}
          className="w-full h-1 bg-zinc-800 cursor-pointer group relative"
        >
          <div
            className="h-full bg-red-600 group-hover:bg-red-500 transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow transition-opacity" />
          </div>
        </div>
      )}

      {/* Track Info & Player Controls */}
      <div className="p-2.5 bg-zinc-950 flex items-center justify-between gap-2">
        {/* Resize Handle (Bottom-Left) */}
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="p-1 -ml-1 text-zinc-600 hover:text-red-400 cursor-ew-resize transition-colors flex items-center justify-center"
          title="Kéo sang trái/phải để điều chỉnh kích thước"
        >
          <Scaling className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={onExpand}>
          <p className="text-xs font-semibold text-zinc-100 truncate hover:text-red-400 transition-colors">
            {currentVideo.title}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
            <span className="truncate">{currentVideo.channelTitle}</span>
            {duration > 0 && (
              <span className="shrink-0 text-zinc-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onPlayPrev && (
            <button
              onClick={onPlayPrev}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Bài trước"
            >
              <SkipBack className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={onTogglePlay}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-transform active:scale-95"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
          </button>

          <button
            onClick={onPlayNext}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
