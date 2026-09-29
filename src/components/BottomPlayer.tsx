import { ChangeEvent } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  ListOrdered,
  Moon,
  Headphones,
  Tv,
  Heart,
  PictureInPicture,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { VideoItem, RepeatMode } from '../types';
import { formatTime } from '../utils/formatters';
import { getReliableThumbnail } from '../data/mockVideos';

interface BottomPlayerProps {
  currentVideo: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isAudioOnly: boolean;
  isFavorite: boolean;
  queueLength: number;
  sleepTimerSeconds: number | null;
  sleepTimerMode: 'time' | 'end_of_track' | null;
  isAdBlockActive?: boolean;
  adsBlockedCount?: number;
  isNativePiP?: boolean;
  isAutoPiPEnabled?: boolean;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSeek: (seconds: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onCycleRepeat: () => void;
  onToggleShuffle: () => void;
  onToggleAudioOnly: () => void;
  onTogglePiP: () => void;
  onToggleNativePiP?: () => void;
  onToggleAutoPiP?: () => void;
  onOpenAdShield?: () => void;
  onOpenGuideModal?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onToggleFavorite: (video: VideoItem) => void;
  onOpenFullPlayer: () => void;
  onOpenSleepTimer: () => void;
  onOpenQueue: () => void;
  onDownload?: () => void;
}

export function BottomPlayer({
  currentVideo,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  isAudioOnly,
  isFavorite,
  queueLength,
  sleepTimerSeconds,
  sleepTimerMode,
  isAdBlockActive = true,
  adsBlockedCount = 0,
  isNativePiP = false,
  isAutoPiPEnabled = true,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onCycleRepeat,
  onToggleShuffle,
  onToggleAudioOnly,
  onTogglePiP,
  onToggleNativePiP,
  onToggleAutoPiP,
  onOpenAdShield,
  onOpenGuideModal,
  onToggleFavorite,
  onOpenFullPlayer,
  onOpenSleepTimer,
  onOpenQueue,
  isFullscreen = false,
  onToggleFullscreen,
  onDownload,
}: BottomPlayerProps) {
  if (!currentVideo) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const thumbUrl = getReliableThumbnail(currentVideo.id, currentVideo.thumbnail);

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  return (
    <div
      id="bottom-playback-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-xl px-3 sm:px-4 py-2 select-none shadow-2xl"
    >
      {/* Top micro progress scrubber for quick mobile tapping */}
      <div className="absolute -top-1 left-0 right-0 h-1 bg-zinc-800/80 group hover:h-2 transition-all cursor-pointer">
        <div
          className="h-full bg-red-600 transition-all duration-150 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Video Metadata & Quick Fav */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-1/3 sm:w-1/4">
          <div
            onClick={onOpenFullPlayer}
            className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer group shadow-md"
          >
            <img
              src={thumbUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
            {isAudioOnly && (
              <div className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-tighter">
                Audio
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={onOpenFullPlayer}
              className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:text-red-400 transition-colors"
              title={currentVideo.title}
            >
              {currentVideo.title}
            </h4>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {currentVideo.channelTitle}
            </p>
          </div>

          <button
            id="bottom-fav-btn"
            onClick={() => onToggleFavorite(currentVideo)}
            className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
              isFavorite ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isFavorite ? 'Bỏ thích' : 'Yêu thích'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-xl px-1 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-4 mb-1">
            {/* Shuffle */}
            <button
              id="bottom-shuffle-btn"
              onClick={onToggleShuffle}
              title={isShuffle ? 'Tắt xáo trộn' : 'Bật xáo trộn'}
              className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                isShuffle ? 'text-red-500' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              id="bottom-prev-btn"
              onClick={onPlayPrev}
              title="Bài trước"
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Play/Pause Main */}
            <button
              id="bottom-play-toggle-btn"
              onClick={onTogglePlay}
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              id="bottom-next-btn"
              onClick={onPlayNext}
              title="Bài tiếp"
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Repeat mode */}
            <button
              id="bottom-repeat-btn"
              onClick={onCycleRepeat}
              title={`Lặp lại: ${repeatMode === 'none' ? 'Tắt' : repeatMode === 'all' ? 'Tất cả' : '1 bài'}`}
              className={`p-1.5 rounded-lg transition-colors hidden sm:block ${
                repeatMode !== 'none' ? 'text-red-500' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="w-full flex items-center gap-2 text-[11px] font-medium text-zinc-400">
            <span className="w-9 text-right shrink-0">{formatTime(currentTime)}</span>
            <input
              id="bottom-seek-slider"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-1.5 transition-all"
            />
            <span className="w-9 text-left shrink-0">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Premium Features (Audio-only, Sleep timer, PiP, Volume, Queue) */}
        <div className="flex items-center justify-end gap-1 sm:gap-2.5 w-auto sm:w-1/4">
          {/* AdBlock Shield Indicator */}
          {onOpenAdShield && (
            <button
              id="bottom-ad-shield-btn"
              onClick={onOpenAdShield}
              title={`Khiên Chặn Quảng Cáo: ${isAdBlockActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'} (Đã chặn ${adsBlockedCount})`}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isAdBlockActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">0 Ads</span>
            </button>
          )}

          {/* Background Screen-Off Mode indicator / guide */}
          {onOpenGuideModal && (
            <button
              id="bottom-bg-mode-btn"
              onClick={onOpenGuideModal}
              title="Chế độ Nghe Nền khi tắt màn hình điện thoại: ĐANG BẬT (Bấm xem hướng dẫn)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Nghe Nền</span>
            </button>
          )}

          {/* Audio-Only Mode Toggle (Save Data & Battery) */}
          <button
            id="bottom-audio-only-toggle"
            onClick={onToggleAudioOnly}
            title={isAudioOnly ? 'Đang bật Chỉ Nghe Nhạc (Tắt màn hình/tiết kiệm pin). Bấm để xem Video' : 'Bật chế độ Chỉ Nghe Nhạc (tiết kiệm pin & dữ liệu)'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAudioOnly
                ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {isAudioOnly ? <Headphones className="w-3.5 h-3.5 text-red-500" /> : <Tv className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isAudioOnly ? 'Chỉ Nghe' : 'Video'}</span>
          </button>

          {/* Sleep Timer button */}
          <button
            id="bottom-sleep-timer-btn"
            onClick={onOpenSleepTimer}
            title="Hẹn giờ tắt nhạc khi ngủ"
            className={`relative p-2 rounded-xl transition-colors ${
              sleepTimerSeconds !== null || sleepTimerMode === 'end_of_track'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            {(sleepTimerSeconds !== null || sleepTimerMode === 'end_of_track') && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Download button */}
          {onDownload && (
            <button
              id="bottom-download-btn"
              onClick={onDownload}
              title="Tải video này về máy / xem ngoại tuyến"
              className="p-2 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Picture in picture */}
          <button
            id="bottom-pip-btn"
            onClick={onToggleNativePiP || onTogglePiP}
            title={
              isAutoPiPEnabled
                ? 'Cửa sổ nổi PiP (Tự động mở khi ra ngoài ứng dụng: BẬT)'
                : 'Mở cửa sổ Picture-in-Picture để vừa nghe vừa dùng app khác'
            }
            className={`p-2 rounded-xl transition-colors flex items-center relative ${
              isNativePiP
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <PictureInPicture className="w-4 h-4" />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 shadow animate-pulse"
              title="Cửa sổ nổi PiP sẵn sàng khi thoát app"
            />
          </button>

          {/* Volume */}
          <div className="hidden xl:flex items-center gap-1.5 text-zinc-400">
            <button
              onClick={onToggleMute}
              className="p-1 hover:text-white transition-colors"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Queue Drawer toggle */}
          <button
            id="bottom-queue-toggle-btn"
            onClick={onOpenQueue}
            title="Danh sách hàng đợi phát"
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
            {queueLength > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full">
                {queueLength}
              </span>
            )}
          </button>

          {/* Fullscreen Mode Button */}
          <button
            id="bottom-fullscreen-btn"
            onClick={onToggleFullscreen || onOpenFullPlayer}
            title={isFullscreen ? "Thu nhỏ màn hình [F]" : "Xem toàn màn hình [F]"}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
