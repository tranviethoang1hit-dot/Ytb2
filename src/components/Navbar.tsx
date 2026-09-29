import { useState, useEffect, useRef, FormEvent } from 'react';
import { Search, Youtube, Sparkles, Link2, Heart, History, ListMusic, X, Radio, HelpCircle, ShieldCheck, PictureInPicture, Download, Cloud, FolderArchive } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  activeTab: 'explore' | 'favorites' | 'playlists' | 'history' | 'downloads';
  setActiveTab: (tab: 'explore' | 'favorites' | 'playlists' | 'history' | 'downloads') => void;
  favoritesCount: number;
  historyCount: number;
  playlistsCount: number;
  downloadsCount?: number;
  onOpenDirectUrlModal: () => void;
  onOpenGuideModal: () => void;
  isAudioPlaying: boolean;
  isAdBlockActive?: boolean;
  adsBlockedCount?: number;
  isNativePiP?: boolean;
  isAutoPiPEnabled?: boolean;
  onOpenAdShield?: () => void;
  onToggleNativePiP?: () => void;
  onToggleAutoPiP?: () => void;
  onOpenGoogleDrive?: () => void;
}

export function Navbar({
  onSearch,
  searchQuery,
  activeTab,
  setActiveTab,
  favoritesCount,
  historyCount,
  playlistsCount,
  downloadsCount = 0,
  onOpenDirectUrlModal,
  onOpenGuideModal,
  isAudioPlaying,
  isAdBlockActive = true,
  adsBlockedCount = 0,
  isNativePiP = false,
  isAutoPiPEnabled = true,
  onOpenAdShield,
  onToggleNativePiP,
  onToggleAutoPiP,
  onOpenGoogleDrive,
}: NavbarProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Autocomplete fetch
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(inputValue.trim())}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setSuggestions(list);
          }
        }
      } catch (err) {
        console.warn('Suggest error', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setShowSuggestions(false);
      setActiveTab('explore');
    }
  };

  const handleSelectSuggestion = (s: string) => {
    setInputValue(s);
    onSearch(s);
    setShowSuggestions(false);
    setActiveTab('explore');
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            id="brand-logo"
            onClick={() => {
              setActiveTab('explore');
              onSearch('');
            }}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/25 group-hover:scale-105 transition-transform">
                <Youtube className="w-5 h-5 fill-current" />
              </div>
              {isAudioPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight">YouTube</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase tracking-wide">
                  Premium Miễn Phí
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium -mt-0.5 flex items-center gap-1">
                <Radio className="w-3 h-3 text-red-500" />
                Phát Trong Nền & Tắt Màn Hình
              </span>
            </div>
          </div>

          {/* Quick mobile guide & ad shield button */}
          <div className="flex md:hidden items-center gap-1.5">
            {onOpenAdShield && (
              <button
                id="mobile-ad-shield-btn"
                onClick={onOpenAdShield}
                title="Khiên Chặn Quảng Cáo"
                className={`p-2 rounded-xl transition-colors ${
                  isAdBlockActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
            <button
              id="mobile-direct-link-btn"
              onClick={onOpenDirectUrlModal}
              title="Dán link YouTube"
              className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              id="mobile-guide-btn"
              onClick={onOpenGuideModal}
              className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar with Autocomplete */}
        <div ref={searchContainerRef} className="relative w-full md:max-w-xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="main-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Tìm bài hát, ca sĩ, podcast hoặc dán link YouTube..."
              className="w-full pl-10 pr-20 py-2 rounded-full bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
            />
            {inputValue && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => {
                  setInputValue('');
                  setSuggestions([]);
                  onSearch('');
                }}
                className="absolute right-12 text-zinc-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              id="submit-search-btn"
              className="absolute right-1.5 px-3 py-1 bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white text-xs font-semibold rounded-full transition-colors"
            >
              Tìm
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              id="suggestions-dropdown"
              className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900/95 border border-zinc-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in"
            >
              <div className="py-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full px-4 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-red-600/20 flex items-center gap-2.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Utilities */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Ad Shield Button */}
          {onOpenAdShield && (
            <button
              id="nav-ad-shield-btn"
              onClick={onOpenAdShield}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isAdBlockActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title="Khiên Chặn Quảng Cáo: ĐANG BẬT"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chặn QC ({adsBlockedCount})</span>
            </button>
          )}

          {/* Picture-in-Picture Button */}
          {onToggleNativePiP && (
            <button
              id="nav-pip-btn"
              onClick={onToggleNativePiP}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all relative ${
                isNativePiP
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800'
              }`}
              title={
                isAutoPiPEnabled
                  ? 'Mở Picture-in-Picture hệ thống (Tự động mở khi ra ngoài app: ĐANG BẬT)'
                  : 'Mở Picture-in-Picture hệ thống (xem đè ngoài ứng dụng)'
              }
            >
              <PictureInPicture className="w-3.5 h-3.5" />
              <span>PiP</span>
              {isAutoPiPEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Auto PiP đang bật" />
              )}
            </button>
          )}

          <button
            id="nav-direct-link-btn"
            onClick={onOpenDirectUrlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
            title="Dán link YouTube bất kỳ"
          >
            <Link2 className="w-3.5 h-3.5 text-red-500" />
            <span>Dán Link</span>
          </button>

          <button
            id="nav-guide-btn"
            onClick={onOpenGuideModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
            title="Hướng dẫn nghe nhạc nền & tắt màn hình"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phát Trong Nền</span>
          </button>

          {onOpenGoogleDrive && (
            <button
              id="nav-google-drive-btn"
              onClick={onOpenGoogleDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
              title="Xuất mã nguồn Android & sao lưu lên Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive</span>
            </button>
          )}

          <a
            id="nav-download-zip-btn"
            href="/ytmusicplayer-full-project.zip"
            download="ytmusicplayer-full-project.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors"
            title="Tải toàn bộ mã nguồn dự án thành file ZIP"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Tải ZIP</span>
          </a>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          <button
            id="tab-explore-btn"
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'explore'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Khám Phá
          </button>

          <button
            id="tab-favorites-btn"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
            <span>Yêu Thích</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            id="tab-playlists-btn"
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'playlists'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            <span>Playlists</span>
            {playlistsCount > 0 && (
              <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded-full">
                {playlistsCount}
              </span>
            )}
          </button>

          <button
            id="tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Lịch Sử</span>
          </button>

          <button
            id="tab-downloads-btn"
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'downloads'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã Tải</span>
            {downloadsCount > 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">
                {downloadsCount}
              </span>
            )}
          </button>
        </div>
        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto w-full pt-1 pb-0.5 scrollbar-none border-t border-zinc-900 mt-0.5">
          <button
            id="mobile-tab-explore-btn"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'explore'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Khám Phá</span>
          </button>

          <button
            id="mobile-tab-favorites-btn"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'favorites'
                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
            <span>Yêu Thích</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded-full font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            id="mobile-tab-playlists-btn"
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'playlists'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            <span>Playlists</span>
            {playlistsCount > 0 && (
              <span className="text-[10px] bg-zinc-700 text-zinc-300 px-1.5 py-0.2 rounded-full font-bold">
                {playlistsCount}
              </span>
            )}
          </button>

          <button
            id="mobile-tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Lịch Sử</span>
          </button>

          <button
            id="mobile-tab-downloads-btn"
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'downloads'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã Tải</span>
            {downloadsCount > 0 && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">
                {downloadsCount}
              </span>
            )}
          </button>

          {onOpenGoogleDrive && (
            <button
              id="mobile-tab-drive-btn"
              onClick={onOpenGoogleDrive}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:text-white transition-all"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Drive</span>
            </button>
          )}

          <a
            id="mobile-tab-zip-btn"
            href="/ytmusicplayer-full-project.zip"
            download="ytmusicplayer-full-project.zip"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:text-white transition-all"
            title="Tải file ZIP toàn bộ dự án"
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>Tải ZIP</span>
          </a>
        </div>
      </div>
    </header>
  );
}
