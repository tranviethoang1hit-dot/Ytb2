import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Radio, HelpCircle, AlertCircle, RefreshCw, ShieldCheck, Shuffle, Play, Flame, Smartphone, Cloud } from 'lucide-react';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { VideoItem, Playlist, Category, OfflineVideoItem } from './types';
import { DEFAULT_CATEGORIES, CURATED_VIDEOS } from './data/mockVideos';
import {
  loadFavorites,
  saveFavorites,
  loadHistory,
  saveHistory,
  loadPlaylists,
  savePlaylists,
} from './utils/formatters';
import { getOfflineVideos, deleteOfflineVideo } from './utils/offlineStorage';

// Components
import { Navbar } from './components/Navbar';
import { CategoryChips } from './components/CategoryChips';
import { VideoCard } from './components/VideoCard';
import { BottomPlayer } from './components/BottomPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { MiniPlayer } from './components/MiniPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { SleepTimerModal } from './components/SleepTimerModal';
import { DirectUrlModal } from './components/DirectUrlModal';
import { PlaylistModal } from './components/PlaylistModal';
import { BackgroundGuideModal } from './components/BackgroundGuideModal';
import { PlaylistsView } from './components/PlaylistsView';
import { AdShieldModal } from './components/AdShieldModal';
import { YouTubeVideoHost } from './components/YouTubeVideoHost';
import { DownloadModal } from './components/DownloadModal';
import { OfflinePlayerModal } from './components/OfflinePlayerModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';

export default function App() {
  const player = useYouTubePlayer();

  // App navigation & search
  const [activeTab, setActiveTab] = useState<'explore' | 'favorites' | 'playlists' | 'history' | 'downloads'>('explore');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedVideos, setDisplayedVideos] = useState<VideoItem[]>(CURATED_VIDEOS.trending);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Local storage lists
  const [favorites, setFavorites] = useState<VideoItem[]>(() => loadFavorites());
  const [history, setHistory] = useState<VideoItem[]>(() => loadHistory());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());

  // Offline video storage
  const [offlineVideos, setOfflineVideos] = useState<OfflineVideoItem[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [videoForDownloadModal, setVideoForDownloadModal] = useState<VideoItem | null>(null);
  const [activeOfflinePlayback, setActiveOfflinePlayback] = useState<OfflineVideoItem | null>(null);
  const [isOfflinePlayerOpen, setIsOfflinePlayerOpen] = useState(false);

  // Modals
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState(false);
  const [isDirectUrlModalOpen, setIsDirectUrlModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAdShieldModalOpen, setIsAdShieldModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [videoForPlaylistModal, setVideoForPlaylistModal] = useState<VideoItem | null>(null);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);

  const loadOfflineList = useCallback(async () => {
    try {
      const items = await getOfflineVideos();
      setOfflineVideos(items);
    } catch (err) {
      console.warn('Failed to load offline videos:', err);
    }
  }, []);

  useEffect(() => {
    loadOfflineList();
  }, [loadOfflineList]);

  // Auto-save lists
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  // Load videos based on search or category
  const fetchVideos = useCallback(async (query: string, categoryId?: string) => {
    setIsLoadingVideos(true);
    const catQuery = categoryId ? DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.query : '';
    const q = (query || catQuery || 'nhạc việt thịnh hành trending hot nhất').trim();
    const curatedList = (categoryId && CURATED_VIDEOS[categoryId]) || CURATED_VIDEOS.trending;

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDisplayedVideos(data);
          setIsLoadingVideos(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fetch videos error, using curated fallback', err);
    }

    // Fallback to curated list
    setDisplayedVideos(curatedList);
    setIsLoadingVideos(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchVideos('', 'trending');
  }, [fetchVideos]);

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategoryId('');
    fetchVideos(query);
  };

  // Category change
  const handleSelectCategory = (category: Category) => {
    setActiveCategoryId(category.id);
    setSearchQuery('');
    fetchVideos('', category.id);
  };

  // Play a video
  const handlePlayVideo = (video: VideoItem, customQueue?: VideoItem[]) => {
    const queueToUse = customQueue && customQueue.length > 0 ? customQueue : displayedVideos;
    player.playVideo(video, queueToUse);
    player.setIsFullPlayerOpen(true);
    player.setIsMiniPlayer(false);

    // Record in history
    setHistory((prev) => {
      const filtered = prev.filter((v) => v.id !== video.id);
      return [video, ...filtered].slice(0, 50);
    });
  };

  // Play all from list
  const handlePlayAll = (videos: VideoItem[], shuffle = false) => {
    if (videos.length === 0) return;
    const listToPlay = shuffle ? [...videos].sort(() => Math.random() - 0.5) : [...videos];
    player.playVideo(listToPlay[0], listToPlay);
    player.setIsFullPlayerOpen(true);
    player.setIsMiniPlayer(false);
  };

  // Toggle favorite
  const handleToggleFavorite = (video: VideoItem) => {
    setFavorites((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      if (exists) {
        return prev.filter((v) => v.id !== video.id);
      } else {
        return [video, ...prev];
      }
    });
  };

  // Playlist management
  const handleCreatePlaylist = (title: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      videos: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  const handleToggleVideoInPlaylist = (playlistId: string, video: VideoItem) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.videos.some((v) => v.id === video.id);
        return {
          ...pl,
          videos: exists ? pl.videos.filter((v) => v.id !== video.id) : [...pl.videos, video],
        };
      })
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const handleRenamePlaylist = (playlistId: string, newTitle: string, newDesc?: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === playlistId ? { ...pl, title: newTitle, description: newDesc ?? pl.description } : pl))
    );
  };

  const handleReorderPlaylist = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const updated = [...pl.videos];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return { ...pl, videos: updated };
      })
    );
  };

  const handleRemoveFromPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === playlistId ? { ...pl, videos: pl.videos.filter((v) => v.id !== videoId) } : pl))
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const openPlaylistModalForVideo = (video?: VideoItem) => {
    setVideoForPlaylistModal(video || null);
    setIsPlaylistModalOpen(true);
  };

  const handleOpenDownloadModal = (video: VideoItem) => {
    setVideoForDownloadModal(video);
    setIsDownloadModalOpen(true);
  };

  const handlePlayOfflineVideo = (item: OfflineVideoItem) => {
    setActiveOfflinePlayback(item);
    setIsOfflinePlayerOpen(true);
  };

  const handleDeleteOfflineVideo = async (id: string) => {
    await deleteOfflineVideo(id);
    loadOfflineList();
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white pb-24">
      {/* Synchronized video player host: keeps background playback alive and visibly mounts to FullPlayer, MiniPlayer or Cinema Fullscreen */}
      <YouTubeVideoHost
        currentVideo={player.currentVideo}
        isPlaying={player.isPlaying}
        isFullPlayerOpen={player.isFullPlayerOpen}
        isMiniPlayer={player.isMiniPlayer}
        isAudioOnly={player.isAudioOnly}
        isFullscreen={player.isFullscreen}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        playbackRate={player.playbackRate}
        repeatMode={player.repeatMode}
        isShuffle={player.isShuffle}
        isAdBlockActive={player.isAdBlockActive}
        isNativePiP={player.isNativePiP}
        isAutoPiPEnabled={player.isAutoPiPEnabled}
        onTogglePlay={player.togglePlay}
        onSeekRelative={player.seekRelative}
        onSeek={player.seekTo}
        onToggleFullscreen={player.toggleFullscreen}
        onPlayNext={player.playNext}
        onPlayPrev={player.playPrev}
        onChangeVolume={player.changeVolume}
        onToggleMute={player.toggleMute}
        onChangePlaybackRate={player.changePlaybackRate}
        onCycleRepeat={player.cycleRepeatMode}
        onToggleShuffle={player.toggleShuffle}
        onToggleNativePiP={player.toggleNativePiP}
        onToggleAutoPiP={player.toggleAutoPiP}
      />

      {/* Top Navbar */}
      <Navbar
        onSearch={handleSearch}
        searchQuery={searchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        historyCount={history.length}
        playlistsCount={playlists.length}
        downloadsCount={offlineVideos.length}
        onOpenDirectUrlModal={() => setIsDirectUrlModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        isAudioPlaying={player.isPlaying}
        isAdBlockActive={player.isAdBlockActive}
        adsBlockedCount={player.adsBlockedCount}
        isNativePiP={player.isNativePiP}
        isAutoPiPEnabled={player.isAutoPiPEnabled}
        onOpenAdShield={() => setIsAdShieldModalOpen(true)}
        onToggleNativePiP={player.toggleNativePiP}
        onToggleAutoPiP={player.toggleAutoPiP}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
      />

      {/* Floating AdBlock Toast Alert */}
      {player.adBlockToast && (
        <div
          id="adblock-toast-alert"
          className="fixed top-18 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 border border-emerald-400"
        >
          <ShieldCheck className="w-4 h-4 text-black shrink-0" />
          <span>{player.adBlockToast}</span>
        </div>
      )}

      {/* Premium Features Banner */}
      <div className="bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-950 border-b border-red-900/30 px-4 py-1.5 text-xs text-zinc-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium truncate">
              YouTube Premium Miễn Phí: <strong>Chặn 100% quảng cáo</strong> • <strong>Phát khi tắt màn hình</strong> • <strong>Tự động PiP khi ra ngoài app</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsGoogleDriveModalOpen(true)}
              className="text-white hover:bg-blue-500 bg-blue-600 px-2.5 py-0.5 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
            >
              <Cloud className="w-3 h-3" />
              <span>Xuất Google Drive</span>
            </button>
            <button
              onClick={() => setIsAdShieldModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Khiên QC ({player.adsBlockedCount})</span>
            </button>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-red-400 hover:text-red-300 font-semibold underline text-[11px]"
            >
              Xem hướng dẫn
            </button>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-white hover:bg-red-500 bg-red-600 px-2 py-0.5 rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
            >
              <Smartphone className="w-3 h-3" />
              <span>Cài App / APK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Chips (Only on Explore tab) */}
      {activeTab === 'explore' && (
        <CategoryChips
          categories={DEFAULT_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'explore' && (
          <section className="space-y-6">
            {/* Featured Spotlight Card when on home explore without active query */}
            {!searchQuery && displayedVideos.length > 0 && !isLoadingVideos && (
              <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-5">
                  <div
                    onClick={() => handlePlayVideo(displayedVideos[0], displayedVideos)}
                    className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden group cursor-pointer shrink-0 border border-zinc-700/60 shadow-lg"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${displayedVideos[0].id}/hqdefault.jpg`}
                      alt={displayedVideos[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 fill-current translate-x-0.5" />
                      </div>
                    </div>
                    {displayedVideos[0].duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[11px] font-bold text-white">
                        {displayedVideos[0].duration}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 w-full">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Nổi Bật Hôm Nay</span>
                      </div>
                      <h3
                        onClick={() => handlePlayVideo(displayedVideos[0], displayedVideos)}
                        className="text-base sm:text-xl font-bold text-white line-clamp-2 cursor-pointer hover:text-red-400 transition-colors"
                      >
                        {displayedVideos[0].title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                        {displayedVideos[0].channelTitle}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handlePlayVideo(displayedVideos[0], displayedVideos)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Phát Ngay</span>
                      </button>
                      <button
                        onClick={() => handlePlayAll(displayedVideos, true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-all"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Xáo Trộn Danh Sách</span>
                      </button>
                      <button
                        onClick={() => handleOpenDownloadModal(displayedVideos[0])}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-xs font-semibold border border-zinc-700 transition-all"
                      >
                        <span>Tải Ngoại Tuyến</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>
                    {searchQuery
                      ? `Kết quả cho: "${searchQuery}"`
                      : activeCategoryId
                      ? DEFAULT_CATEGORIES.find((c) => c.id === activeCategoryId)?.name || 'Khám Phá Video'
                      : 'Video Thịnh Hành'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                    {displayedVideos.length} bài
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Chọn bất kỳ video nào để bắt đầu nghe nhạc nền không quảng cáo
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="play-all-current-grid-btn"
                  onClick={() => handlePlayAll(displayedVideos, false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phát Danh Sách</span>
                </button>

                <button
                  id="shuffle-all-current-grid-btn"
                  onClick={() => handlePlayAll(displayedVideos, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xáo Trộn</span>
                </button>

                <button
                  onClick={() => fetchVideos(searchQuery, activeCategoryId)}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingVideos ? 'animate-spin text-red-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Video Cards Grid */}
            {isLoadingVideos ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-3 space-y-3 animate-pulse">
                    <div className="aspect-video bg-zinc-800 rounded-xl" />
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="text-center py-16 px-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto stroke-1 text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-200">Không tìm thấy video phù hợp</p>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Thử chọn một trong các gợi ý phổ biến dưới đây để khám phá ngay:
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto pt-2">
                  {['Sơn Tùng M-TP', 'Vũ. Lạ Lùng', 'Đen Vâu', 'Lofi Chill Việt', 'HIEUTHUHAI', 'Acoustic nhẹ nhàng', 'US-UK Hot 100'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleSearch(topic)}
                      className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isCurrentlyPlaying={player.currentVideo?.id === video.id}
                    isPlayingStatus={player.isPlaying}
                    isFavorite={favorites.some((f) => f.id === video.id)}
                    onPlay={(v) => handlePlayVideo(v, displayedVideos)}
                    onAddToQueue={(v) => player.addToQueue(v)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenPlaylistModal={openPlaylistModalForVideo}
                    onDownload={handleOpenDownloadModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Other Tabs: Favorites, Playlists, History, Downloads */}
        {activeTab !== 'explore' && (
          <PlaylistsView
            activeTab={activeTab}
            favorites={favorites}
            history={history}
            playlists={playlists}
            offlineVideos={offlineVideos}
            onPlayVideo={handlePlayVideo}
            onPlayAll={handlePlayAll}
            onToggleFavorite={handleToggleFavorite}
            onOpenPlaylistModal={openPlaylistModalForVideo}
            onDeletePlaylist={handleDeletePlaylist}
            onClearHistory={handleClearHistory}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
            onRenamePlaylist={handleRenamePlaylist}
            onReorderPlaylist={handleReorderPlaylist}
            onPlayOfflineVideo={handlePlayOfflineVideo}
            onDeleteOfflineVideo={handleDeleteOfflineVideo}
            onOpenDownloadModal={handleOpenDownloadModal}
          />
        )}
      </main>

      {/* Persistent Bottom Playback Bar */}
      <BottomPlayer
        currentVideo={player.currentVideo}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        repeatMode={player.repeatMode}
        isShuffle={player.isShuffle}
        isAudioOnly={player.isAudioOnly}
        isFavorite={player.currentVideo ? favorites.some((f) => f.id === player.currentVideo?.id) : false}
        queueLength={player.queue.length}
        sleepTimerSeconds={player.sleepTimerSeconds}
        sleepTimerMode={player.sleepTimerMode}
        isAdBlockActive={player.isAdBlockActive}
        adsBlockedCount={player.adsBlockedCount}
        isNativePiP={player.isNativePiP}
        onTogglePlay={player.togglePlay}
        onPlayNext={player.playNext}
        onPlayPrev={player.playPrev}
        onSeek={player.seekTo}
        onChangeVolume={player.changeVolume}
        onToggleMute={player.toggleMute}
        onCycleRepeat={player.cycleRepeatMode}
        onToggleShuffle={player.toggleShuffle}
        onToggleAudioOnly={player.toggleAudioOnly}
        onTogglePiP={player.togglePiP}
        onToggleNativePiP={player.toggleNativePiP}
        isAutoPiPEnabled={player.isAutoPiPEnabled}
        onToggleAutoPiP={player.toggleAutoPiP}
        isFullscreen={player.isFullscreen}
        onToggleFullscreen={player.toggleFullscreen}
        onOpenAdShield={() => setIsAdShieldModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onToggleFavorite={handleToggleFavorite}
        onOpenFullPlayer={() => {
          player.setIsFullPlayerOpen(true);
          player.setIsMiniPlayer(false);
        }}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
        onOpenQueue={() => setIsQueueDrawerOpen(true)}
        onDownload={() => player.currentVideo && handleOpenDownloadModal(player.currentVideo)}
      />

      {/* Full Player Modal */}
      <FullPlayerModal
        isOpen={player.isFullPlayerOpen}
        onClose={() => {
          player.setIsFullPlayerOpen(false);
          player.setIsMiniPlayer(true);
        }}
        currentVideo={player.currentVideo}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        playbackRate={player.playbackRate}
        repeatMode={player.repeatMode}
        isShuffle={player.isShuffle}
        isAudioOnly={player.isAudioOnly}
        isFavorite={player.currentVideo ? favorites.some((f) => f.id === player.currentVideo?.id) : false}
        queue={player.queue}
        queueIndex={player.queueIndex}
        sleepTimerSeconds={player.sleepTimerSeconds}
        sleepTimerMode={player.sleepTimerMode}
        equalizerPreset={player.equalizerPreset}
        isAdBlockActive={player.isAdBlockActive}
        adsBlockedCount={player.adsBlockedCount}
        adCurrentlyDetected={player.adCurrentlyDetected}
        isNativePiP={player.isNativePiP}
        isAutoPiPEnabled={player.isAutoPiPEnabled}
        onTogglePlay={player.togglePlay}
        onPlayNext={player.playNext}
        onPlayPrev={player.playPrev}
        onSeek={player.seekTo}
        onSeekRelative={player.seekRelative}
        onChangeVolume={player.changeVolume}
        onToggleMute={player.toggleMute}
        onChangePlaybackRate={player.changePlaybackRate}
        onCycleRepeat={player.cycleRepeatMode}
        onToggleShuffle={player.toggleShuffle}
        onToggleAudioOnly={player.toggleAudioOnly}
        onToggleFavorite={handleToggleFavorite}
        onOpenPlaylistModal={openPlaylistModalForVideo}
        onOpenSleepTimer={() => setIsSleepTimerModalOpen(true)}
        onSetEqualizer={player.setEqualizerPreset}
        onSelectQueueItem={(idx) => {
          const v = player.queue[idx];
          if (v) player.playVideo(v);
        }}
        onRemoveQueueItem={player.removeFromQueue}
        onOpenAdShield={() => setIsAdShieldModalOpen(true)}
        onSkipCurrentAd={player.skipCurrentAd}
        onToggleNativePiP={player.toggleNativePiP}
        onToggleAutoPiP={player.toggleAutoPiP}
        isFullscreen={player.isFullscreen}
        onToggleFullscreen={player.toggleFullscreen}
        onDownload={() => player.currentVideo && handleOpenDownloadModal(player.currentVideo)}
      />

      {/* Ad Shield Status & Management Modal */}
      <AdShieldModal
        isOpen={isAdShieldModalOpen}
        onClose={() => setIsAdShieldModalOpen(false)}
        isAdBlockActive={player.isAdBlockActive}
        adsBlockedCount={player.adsBlockedCount}
        adCurrentlyDetected={player.adCurrentlyDetected}
        isAutoPiPEnabled={player.isAutoPiPEnabled}
        onToggleAdBlock={player.toggleAdBlock}
        onSkipCurrentAd={player.skipCurrentAd}
        onToggleAutoPiP={player.toggleAutoPiP}
      />

      {/* Slide-over Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueDrawerOpen}
        onClose={() => setIsQueueDrawerOpen(false)}
        queue={player.queue}
        queueIndex={player.queueIndex}
        onSelectTrack={(idx) => {
          const item = player.queue[idx];
          if (item) player.playVideo(item);
        }}
        onRemoveTrack={player.removeFromQueue}
        onClearQueue={player.clearQueue}
        onShuffleQueue={player.toggleShuffle}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerModalOpen}
        onClose={() => setIsSleepTimerModalOpen(false)}
        sleepTimerSeconds={player.sleepTimerSeconds}
        sleepTimerMode={player.sleepTimerMode}
        onSetTimer={player.setSleepTimer}
      />

      {/* Direct YouTube Link/ID Modal */}
      <DirectUrlModal
        isOpen={isDirectUrlModalOpen}
        onClose={() => setIsDirectUrlModalOpen(false)}
        onPlayVideo={(v) => handlePlayVideo(v)}
      />

      {/* Playlist Management Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setVideoForPlaylistModal(null);
        }}
        videoToAdd={videoForPlaylistModal}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        onToggleVideoInPlaylist={handleToggleVideoInPlaylist}
        onDeletePlaylist={handleDeletePlaylist}
      />

      {/* Background Playback Guide Modal */}
      <BackgroundGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Floating Mini Player (when full player minimized) */}
      {player.isMiniPlayer && !player.isFullPlayerOpen && player.currentVideo && (
        <MiniPlayer
          currentVideo={player.currentVideo}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          isAudioOnly={player.isAudioOnly}
          isAdBlockActive={player.isAdBlockActive}
          onTogglePlay={player.togglePlay}
          onPlayNext={player.playNext}
          onPlayPrev={player.playPrev}
          onSeek={player.seekTo}
          onExpand={() => {
            player.setIsFullPlayerOpen(true);
            player.setIsMiniPlayer(false);
          }}
          onClose={() => {
            player.setIsMiniPlayer(false);
          }}
          onToggleNativePiP={player.toggleNativePiP}
          onToggleFullscreen={player.toggleFullscreen}
        />
      )}

      {/* Download Resolution & Offline Storage Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setVideoForDownloadModal(null);
        }}
        video={videoForDownloadModal}
        onDownloadComplete={loadOfflineList}
      />

      {/* Offline Stored Video / Audio Player Modal */}
      <OfflinePlayerModal
        isOpen={isOfflinePlayerOpen}
        onClose={() => {
          setIsOfflinePlayerOpen(false);
          setActiveOfflinePlayback(null);
        }}
        item={activeOfflinePlayback}
      />

      {/* Google Drive Export & Backup Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        userData={{
          favorites,
          history,
          playlists,
          offlineVideos,
        }}
      />
    </div>
  );
}
