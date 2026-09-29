import { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  ListPlus,
  Moon,
  Headphones,
  Tv,
  ListOrdered,
  Gauge,
  Sliders,
  Radio,
  Share2,
  Check,
  Trash2,
  PictureInPicture,
  ShieldCheck,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Download,
} from 'lucide-react';
import { VideoItem, RepeatMode } from '../types';
import { formatTime } from '../utils/formatters';
import { getReliableThumbnail } from '../data/mockVideos';

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isAudioOnly: boolean;
  isFavorite: boolean;
  queue: VideoItem[];
  queueIndex: number;
  sleepTimerSeconds: number | null;
  sleepTimerMode: 'time' | 'end_of_track' | null;
  equalizerPreset: 'flat' | 'bass' | 'vocal' | 'chill';
  isAdBlockActive?: boolean;
  adsBlockedCount?: number;
  adCurrentlyDetected?: boolean;
  isNativePiP?: boolean;
  isAutoPiPEnabled?: boolean;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onSeek: (seconds: number) => void;
  onSeekRelative: (delta: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onCycleRepeat: () => void;
  onToggleShuffle: () => void;
  onToggleAudioOnly: () => void;
  onToggleFavorite: (video: VideoItem) => void;
  onOpenPlaylistModal: (video: VideoItem) => void;
  onOpenSleepTimer: () => void;
  onSetEqualizer: (preset: 'flat' | 'bass' | 'vocal' | 'chill') => void;
  onSelectQueueItem: (index: number) => void;
  onRemoveQueueItem: (index: number) => void;
  onOpenAdShield?: () => void;
  onSkipCurrentAd?: () => void;
  onToggleNativePiP?: () => void;
  onToggleAutoPiP?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onDownload?: () => void;
}

export function FullPlayerModal({
  isOpen,
  onClose,
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
  isFavorite,
  queue,
  queueIndex,
  sleepTimerSeconds,
  sleepTimerMode,
  equalizerPreset,
  isAdBlockActive = true,
  adsBlockedCount = 0,
  adCurrentlyDetected = false,
  isNativePiP = false,
  isAutoPiPEnabled = true,
  isFullscreen = false,
  onTogglePlay,
  onPlayNext,
  onPlayPrev,
  onSeek,
  onSeekRelative,
  onChangeVolume,
  onToggleMute,
  onChangePlaybackRate,
  onCycleRepeat,
  onToggleShuffle,
  onToggleAudioOnly,
  onToggleFavorite,
  onOpenPlaylistModal,
  onOpenSleepTimer,
  onSetEqualizer,
  onSelectQueueItem,
  onRemoveQueueItem,
  onOpenAdShield,
  onSkipCurrentAd,
  onToggleNativePiP,
  onToggleAutoPiP,
  onToggleFullscreen,
  onDownload,
}: FullPlayerModalProps) {
  const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'audio_settings'>('player');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !currentVideo) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const thumbUrl = getReliableThumbnail(currentVideo.id, currentVideo.thumbnail);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${currentVideo.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      id="full-player-modal"
      className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-2xl flex flex-col text-zinc-100 animate-in slide-in-from-bottom-6 duration-300 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ opacity: isPlaying ? 0.35 : 0.1 }}
      />

      {/* Top Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-zinc-800/60 z-10 shrink-0">
        <button
          id="minimize-full-player-btn"
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <ChevronDown className="w-5 h-5" />
          <span className="hidden sm:inline">Thu nhỏ</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                YouTube Premium Player
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-red-600 text-white">
                MIỄN PHÍ
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Phát nền & Màn hình khóa đang hoạt động</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AdBlock Shield badge */}
          {onOpenAdShield && (
            <button
              id="full-player-ad-shield-btn"
              onClick={onOpenAdShield}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isAdBlockActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Khiên Chặn Quảng Cáo: ĐANG BẬT"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">0 Quảng Cáo</span>
            </button>
          )}

          {/* Picture in Picture */}
          {onToggleNativePiP && (
            <button
              id="full-player-pip-btn"
              onClick={onToggleNativePiP}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors relative ${
                isNativePiP
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title={
                isAutoPiPEnabled
                  ? 'Picture-in-Picture (Tự động mở khi ra ngoài ứng dụng: BẬT)'
                  : 'Mở Picture-in-Picture hệ thống'
              }
            >
              <PictureInPicture className="w-4 h-4" />
              <span className="hidden md:inline">PiP</span>
              {isAutoPiPEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Tự động mở khi ra ngoài ứng dụng" />
              )}
            </button>
          )}

          {/* Quick toggle for Auto PiP */}
          {onToggleAutoPiP && (
            <button
              id="full-player-auto-pip-btn"
              onClick={onToggleAutoPiP}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors border ${
                isAutoPiPEnabled
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
              title="Tự động mở cửa sổ PiP khi chuyển app hoặc ẩn tab"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoPiPEnabled ? 'bg-blue-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span>Auto PiP</span>
            </button>
          )}

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              id="full-player-fullscreen-btn"
              onClick={onToggleFullscreen}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isFullscreen
                  ? 'bg-red-600/30 text-red-400 border-red-500/40'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border-zinc-800'
              }`}
              title="Xem chế độ toàn màn hình (Phím F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Toàn Màn Hình</span>
            </button>
          )}

          {/* Sleep Timer badge */}
          <button
            id="full-player-timer-btn"
            onClick={onOpenSleepTimer}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
              sleepTimerSeconds !== null || sleepTimerMode === 'end_of_track'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Hẹn giờ tắt nhạc"
          >
            <Moon className="w-4 h-4" />
            <span className="hidden md:inline">
              {sleepTimerSeconds !== null
                ? formatTime(sleepTimerSeconds)
                : sleepTimerMode === 'end_of_track'
                ? 'Hết bài'
                : 'Hẹn giờ'}
            </span>
          </button>

          {/* Share */}
          <button
            id="share-video-link-btn"
            onClick={handleCopyLink}
            title="Sao chép link YouTube"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between z-10 custom-scrollbar">
        {/* Nav Tabs within Modal: Player | Up Next Queue | Audio Settings */}
        <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'player'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Trình Phát
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Hàng Đợi ({queue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audio_settings')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'audio_settings'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Âm Thanh & Tốc Độ</span>
          </button>
        </div>

        {activeTab === 'player' && (
          <div className="flex flex-col items-center justify-center flex-1 my-auto">
            {/* Display Area: Either Audio-Only Vinyl / Visualizer OR Video Frame */}
            {isAudioOnly ? (
              /* AUDIO-ONLY MODE: Glowing Vinyl Artwork + Pulsing Bars */
              <div className="flex flex-col items-center text-center my-4">
                <div className="relative group select-none">
                  {/* Outer glowing vinyl groove */}
                  <div
                    className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-700 ${
                      isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''
                    }`}
                  >
                    {/* Vinyl Grooves concentric rings */}
                    <div className="absolute inset-4 rounded-full border border-zinc-800/80" />
                    <div className="absolute inset-8 rounded-full border border-zinc-800/60" />
                    <div className="absolute inset-12 rounded-full border border-zinc-800/40" />
                    <div className="absolute inset-16 rounded-full border border-zinc-800/30" />

                    {/* Center Album Artwork */}
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-zinc-700 shadow-lg relative">
                      <img
                        src={thumbUrl}
                        alt={currentVideo.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Center Spindle Hole */}
                      <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-zinc-950 border-2 border-zinc-500 shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* Animated Audio Equalizer Waveform */}
                <div className="flex items-center justify-center gap-1.5 h-8 mt-6">
                  {[40, 70, 100, 60, 85, 45, 90, 65, 80, 50, 95, 70, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-gradient-to-t from-red-600 to-amber-400 rounded-full transition-all duration-300 ${
                        isPlaying ? 'animate-pulse' : 'opacity-30'
                      }`}
                      style={{
                        height: isPlaying ? `${h}%` : '20%',
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold border border-red-500/30 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5" />
                    Chế độ Chỉ Nghe Nhạc (Tắt màn hình & Tiết kiệm pin)
                  </span>
                  <button
                    onClick={onToggleAudioOnly}
                    className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Bật Video
                  </button>
                </div>
              </div>
            ) : (
              /* VIDEO MODE: Standard Video View Placeholder */
              <div className="w-full max-w-2xl flex flex-col items-center">
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800 relative group">
                  {/* YouTube IFrame Embed Container Slot (filled by main host) */}
                  <div id="full-video-view-slot" className="w-full h-full relative flex items-center justify-center">
                    <img
                      src={thumbUrl}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Ad-Blocker Active Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Không Quảng Cáo</span>
                    </div>

                    {/* Live Ad Alert Banner if ad detected */}
                    {adCurrentlyDetected && (
                      <div className="absolute bottom-4 inset-x-4 p-3 rounded-xl bg-amber-500/90 text-black backdrop-blur-md flex items-center justify-between shadow-2xl animate-pulse">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Đang tự động tua qua quảng cáo YouTube...</span>
                        </div>
                        {onSkipCurrentAd && (
                          <button
                            onClick={onSkipCurrentAd}
                            className="px-2.5 py-1 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800"
                          >
                            Bỏ qua ngay
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {onToggleFullscreen && (
                    <button
                      id="full-player-cinema-btn"
                      onClick={onToggleFullscreen}
                      className="px-3.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
                      title="Xem toàn màn hình cinema tràn viền không quảng cáo"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Xem Full Màn Hình (F)</span>
                    </button>
                  )}

                  <button
                    onClick={onToggleAudioOnly}
                    className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Headphones className="w-3.5 h-3.5 text-red-400" />
                    Chuyển sang Chỉ Nghe Âm Thanh (Tiết kiệm pin 4G)
                  </button>

                  {onToggleNativePiP && (
                    <button
                      onClick={onToggleNativePiP}
                      className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="Thu nhỏ cửa sổ ra ngoài màn hình chính để dùng app khác"
                    >
                      <PictureInPicture className="w-3.5 h-3.5 text-blue-400" />
                      Mở PiP Ngoài Ứng Dụng
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Video Meta info & Quick Fav */}
            <div className="w-full max-w-xl mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-tight">
                  {currentVideo.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
                  {currentVideo.channelTitle}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="full-player-fav-btn"
                  onClick={() => onToggleFavorite(currentVideo)}
                  className={`p-2.5 rounded-xl transition-all ${
                    isFavorite
                      ? 'bg-red-600/20 text-red-500 border border-red-500/40'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                  title={isFavorite ? 'Bỏ thích' : 'Yêu thích'}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  id="full-player-add-pl-btn"
                  onClick={() => onOpenPlaylistModal(currentVideo)}
                  className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                  title="Thêm vào playlist"
                >
                  <ListPlus className="w-5 h-5" />
                </button>

                {onDownload && (
                  <button
                    id="full-player-download-btn"
                    onClick={onDownload}
                    className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-emerald-400 border border-zinc-800 transition-colors"
                    title="Tải video này về máy / xem ngoại tuyến"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrubber & Timeline */}
            <div className="w-full max-w-xl mt-4">
              <input
                id="full-player-seek-bar"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1.5 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Controls */}
            <div className="w-full max-w-xl mt-3 flex items-center justify-between px-2 sm:px-6">
              {/* Shuffle */}
              <button
                id="full-player-shuffle-btn"
                onClick={onToggleShuffle}
                className={`p-2 rounded-xl transition-colors ${
                  isShuffle ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                }`}
                title="Xáo trộn bài hát"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Seek Backward 10s */}
              <button
                id="full-player-seek-back-btn"
                onClick={() => onSeekRelative(-10)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                title="Tua lại 10 giây"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Previous */}
              <button
                id="full-player-prev-btn"
                onClick={onPlayPrev}
                className="p-2.5 rounded-2xl text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Bài trước"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              {/* Play / Pause Main Button */}
              <button
                id="full-player-play-btn"
                onClick={onTogglePlay}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-95 transition-all"
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                id="full-player-next-btn"
                onClick={onPlayNext}
                className="p-2.5 rounded-2xl text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors"
                title="Bài tiếp"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              {/* Seek Forward 10s */}
              <button
                id="full-player-seek-fwd-btn"
                onClick={() => onSeekRelative(10)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                title="Tua tới 10 giây"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Repeat Mode */}
              <button
                id="full-player-repeat-btn"
                onClick={onCycleRepeat}
                className={`p-2 rounded-xl transition-colors ${
                  repeatMode !== 'none' ? 'text-red-500' : 'text-zinc-400 hover:text-white'
                }`}
                title={`Lặp lại: ${repeatMode === 'none' ? 'Tắt' : repeatMode === 'all' ? 'Tất cả' : '1 bài'}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume bar */}
            <div className="w-full max-w-sm mt-4 flex items-center justify-center gap-3 text-zinc-400">
              <button
                onClick={onToggleMute}
                className="p-1 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="w-36 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="text-xs text-zinc-400 w-8">{isMuted ? '0%' : `${volume}%`}</span>
            </div>
          </div>
        )}

        {/* Tab 2: Queue view */}
        {activeTab === 'queue' && (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-red-500" />
                <span>Danh Sách Hàng Đợi Phát</span>
                <span className="text-xs text-zinc-400 font-normal">({queue.length} bài hát)</span>
              </h3>
            </div>

            <div className="mt-3 space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {queue.length === 0 ? (
                <p className="text-center py-12 text-zinc-500 text-xs">Hàng đợi đang trống.</p>
              ) : (
                queue.map((item, idx) => {
                  const isCur = idx === queueIndex;
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-xs ${
                        isCur
                          ? 'bg-red-600/20 border border-red-500/40 text-white'
                          : 'bg-zinc-900/70 border border-zinc-800/80 hover:bg-zinc-800'
                      }`}
                    >
                      <div
                        onClick={() => onSelectQueueItem(idx)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <span className="w-5 text-center text-zinc-500 text-[11px] font-semibold">
                          {idx + 1}
                        </span>
                        <img
                          src={getReliableThumbnail(item.id, item.thumbnail)}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold truncate ${isCur ? 'text-red-400' : 'text-zinc-200'}`}>
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">{item.channelTitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                        {isCur && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 px-2 py-0.5 rounded bg-red-950/80 border border-red-800">
                            Đang phát
                          </span>
                        )}
                        <button
                          onClick={() => onRemoveQueueItem(idx)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Xóa khỏi hàng đợi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Audio Settings & Speed */}
        {activeTab === 'audio_settings' && (
          <div className="flex-1 flex flex-col max-w-xl mx-auto w-full my-auto space-y-6">
            {/* Playback Speed */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-red-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Tốc Độ Phát (Speed)
                </h4>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {speedOptions.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onChangePlaybackRate(rate)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      playbackRate === rate
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Presets */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Chế Độ Tinh Chỉnh Âm Thanh (Audio Presets)
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'flat', label: 'Cân Bằng', desc: 'Âm chuẩn gốc' },
                  { id: 'bass', label: 'Tăng Bass', desc: 'Trầm & Sôi động' },
                  { id: 'vocal', label: 'Rõ Lời (Vocal)', desc: 'Podcast / Ballad' },
                  { id: 'chill', label: 'Thư Giãn (Chill)', desc: 'Êm dịu ngủ sâu' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSetEqualizer(item.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      equalizerPreset === item.id
                        ? 'bg-red-600/20 border-red-500 text-white'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <p className="font-semibold text-xs">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto PiP Setting Card */}
            {onToggleAutoPiP && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <PictureInPicture className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-white">Tự Động Mở PiP Khi Ra Ngoài Ứng Dụng</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Khi thoát ra màn hình chính hoặc chuyển sang app khác (Zalo, Facebook, Game...), khung video PiP sẽ tự động nổi lên.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleAutoPiP}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isAutoPiPEnabled
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {isAutoPiPEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            )}

            {/* Background Playback Notice */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 flex items-start gap-3">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Âm thanh nền luôn hoạt động</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Ngay cả khi bạn tắt màn hình hoặc chuyển tab sang ứng dụng khác, bài hát sẽ tự động chuyển tiếp và phát liên tục không ngừng.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
