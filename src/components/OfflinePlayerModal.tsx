import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, X, WifiOff, RotateCcw, RotateCw } from 'lucide-react';
import { OfflineVideoItem } from '../types';
import { getOfflineVideoBlob } from '../utils/offlineStorage';
import { formatTime } from '../utils/formatters';

interface OfflinePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoItem?: OfflineVideoItem | null;
  item?: OfflineVideoItem | null;
}

export function OfflinePlayerModal({
  isOpen,
  onClose,
  videoItem: propVideoItem,
  item,
}: OfflinePlayerModalProps) {
  const videoItem = propVideoItem ?? item ?? null;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let isMounted = true;

    if (isOpen && videoItem) {
      setLoading(true);
      getOfflineVideoBlob(videoItem.id).then((blob) => {
        if (!isMounted) return;
        if (blob) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
        setLoading(false);
      });
    } else {
      setBlobUrl(null);
    }

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, videoItem?.id]);

  if (!isOpen || !videoItem) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    videoRef.current.play().catch(() => {});
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const seekRelative = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + sec));
  };

  return (
    <div
      id="offline-player-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
    >
      <div
        ref={containerRef}
        id="offline-player-container"
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-bold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>NGOẠI TUYẾN</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">{videoItem.video.title}</p>
              <p className="text-[11px] text-zinc-400 truncate">
                {videoItem.video.channelTitle} • Độ phân giải: <span className="uppercase text-amber-400 font-bold">{videoItem.resolution}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-2 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Audio viewport */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-400 text-xs">
              <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              <span>Đang tải tệp tin từ bộ nhớ offline...</span>
            </div>
          ) : blobUrl ? (
            <video
              ref={videoRef}
              src={blobUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full h-full object-contain"
              playsInline
              onClick={togglePlay}
            />
          ) : (
            <div className="text-center p-6 text-zinc-500 text-xs">
              <p>Tệp tin không tìm thấy trong bộ nhớ cục bộ.</p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800 space-y-2">
          {/* Progress scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-[11px] font-mono text-zinc-400 w-10">{formatTime(duration)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => seekRelative(-10)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Tua lùi 10 giây"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Tua tới 10 giây"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2 ml-3">
                <button onClick={handleToggleMute} className="text-zinc-400 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Toàn màn hình"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
