import { useState, DragEvent } from 'react';
import {
  Play,
  Trash2,
  Heart,
  History,
  ListMusic,
  Plus,
  Shuffle,
  Pencil,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Download,
  WifiOff,
  Check,
  X,
  HardDrive
} from 'lucide-react';
import { VideoItem, Playlist, OfflineVideoItem } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';
import { formatBytes } from '../utils/offlineStorage';

interface PlaylistsViewProps {
  activeTab: 'favorites' | 'playlists' | 'history' | 'downloads';
  favorites: VideoItem[];
  history: VideoItem[];
  playlists: Playlist[];
  offlineVideos?: OfflineVideoItem[];
  onPlayVideo: (video: VideoItem, queue?: VideoItem[]) => void;
  onPlayAll: (videos: VideoItem[], shuffle?: boolean) => void;
  onToggleFavorite: (video: VideoItem) => void;
  onOpenPlaylistModal: (video?: VideoItem) => void;
  onDeletePlaylist: (id: string) => void;
  onRenamePlaylist: (id: string, newTitle: string, newDesc?: string) => void;
  onReorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void;
  onClearHistory: () => void;
  onRemoveFromPlaylist: (playlistId: string, videoId: string) => void;
  onPlayOfflineVideo?: (videoItem: OfflineVideoItem) => void;
  onDeleteOfflineVideo?: (id: string) => void;
  onOpenDownloadModal?: (video: VideoItem) => void;
}

export function PlaylistsView({
  activeTab,
  favorites,
  history,
  playlists,
  offlineVideos = [],
  onPlayVideo,
  onPlayAll,
  onToggleFavorite,
  onOpenPlaylistModal,
  onDeletePlaylist,
  onRenamePlaylist,
  onReorderPlaylist,
  onClearHistory,
  onRemoveFromPlaylist,
  onPlayOfflineVideo,
  onDeleteOfflineVideo,
  onOpenDownloadModal,
}: PlaylistsViewProps) {
  // Editing playlist state
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Drag-and-drop state for playlist reordering
  const [draggedItem, setDraggedItem] = useState<{ playlistId: string; index: number } | null>(null);

  const startEditing = (pl: Playlist) => {
    setEditingPlaylistId(pl.id);
    setEditTitle(pl.title);
    setEditDesc(pl.description || '');
  };

  const saveEditing = (playlistId: string) => {
    if (editTitle.trim()) {
      onRenamePlaylist(playlistId, editTitle.trim(), editDesc.trim());
    }
    setEditingPlaylistId(null);
  };

  const handleDragStart = (playlistId: string, index: number) => {
    setDraggedItem({ playlistId, index });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPlaylistId: string, targetIndex: number) => {
    if (!draggedItem || draggedItem.playlistId !== targetPlaylistId || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      return;
    }
    onReorderPlaylist(targetPlaylistId, draggedItem.index, targetIndex);
    setDraggedItem(null);
  };

  // 1. Favorites Tab
  if (activeTab === 'favorites') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bài Hát Yêu Thích</h2>
              <p className="text-xs text-zinc-400">{favorites.length} bài hát đã lưu</p>
            </div>
          </div>

          {favorites.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                id="play-all-favs-btn"
                onClick={() => onPlayAll(favorites, false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Tất Cả</span>
              </button>
              <button
                onClick={() => onPlayAll(favorites, true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                title="Xáo trộn và phát"
              >
                <Shuffle className="w-4 h-4" />
                <span>Xáo Trộn</span>
              </button>
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Heart className="w-12 h-12 mx-auto mb-3 stroke-1 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">Bạn chưa thêm bài hát nào vào mục yêu thích</p>
            <p className="text-xs text-zinc-600 mt-1">Bấm biểu tượng trái tim trên bất kỳ video nào để lưu lại</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all text-xs group"
              >
                <div
                  onClick={() => onPlayVideo(item, favorites)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="w-6 text-center text-zinc-500 font-semibold">{idx + 1}</span>
                  <img
                    src={getReliableThumbnail(item.id, item.thumbnail)}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-950 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100 group-hover:text-red-400 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-zinc-400 text-[11px] truncate mt-0.5">{item.channelTitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenDownloadModal && (
                    <button
                      onClick={() => onOpenDownloadModal(item)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Tải video này về máy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onPlayVideo(item, favorites)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors"
                    title="Phát"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onToggleFavorite(item)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Bỏ thích"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Playlists Tab (Create, Manage, Reorder, Rename)
  if (activeTab === 'playlists') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Danh Sách Phát Cá Nhân</h2>
              <p className="text-xs text-zinc-400">
                {playlists.length} danh sách • Tạo, đổi tên và sắp xếp thứ tự bài hát dễ dàng
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenPlaylistModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Playlist Mới</span>
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <ListMusic className="w-12 h-12 mx-auto mb-3 stroke-1 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">Bạn chưa tạo danh sách phát nào</p>
            <button
              onClick={() => onOpenPlaylistModal()}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Tạo danh sách đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4"
              >
                {/* Playlist Header & Rename Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  {editingPlaylistId === pl.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Tên danh sách..."
                        className="px-3 py-1.5 bg-zinc-950 border border-red-500 rounded-xl text-sm text-white focus:outline-none flex-1"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Mô tả (tùy chọn)..."
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-300 focus:outline-none flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveEditing(pl.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu</span>
                        </button>
                        <button
                          onClick={() => setEditingPlaylistId(null)}
                          className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{pl.title}</h3>
                        <button
                          onClick={() => startEditing(pl)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Đổi tên danh sách phát"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {pl.description && <p className="text-xs text-zinc-400 mt-0.5">{pl.description}</p>}
                      <p className="text-[11px] text-zinc-500 mt-0.5">{pl.videos.length} bài hát</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {pl.videos.length > 0 && (
                      <>
                        <button
                          onClick={() => onPlayAll(pl.videos, false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-all active:scale-95"
                          title="Phát tất cả bài hát"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Phát Tất Cả</span>
                        </button>

                        <button
                          onClick={() => onPlayAll(pl.videos, true)}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                          title="Xáo trộn và phát"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Xóa danh sách này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Playlist Tracks list with Reorder Buttons & Drag Handles */}
                {pl.videos.length === 0 ? (
                  <div className="py-6 text-center text-zinc-500 text-xs">
                    <p>Danh sách này chưa có bài hát nào.</p>
                    <p className="text-zinc-600 mt-1">Bấm nút "Lưu vào Playlist" từ bất kỳ video nào để thêm vào đây.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {pl.videos.map((vid, vIdx) => {
                      const isFirst = vIdx === 0;
                      const isLast = vIdx === pl.videos.length - 1;

                      return (
                        <div
                          key={`${vid.id}-${vIdx}`}
                          draggable
                          onDragStart={() => handleDragStart(pl.id, vIdx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(pl.id, vIdx)}
                          className="flex items-center justify-between p-2 sm:p-2.5 rounded-2xl bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-zinc-700 transition-all text-xs group"
                        >
                          {/* Drag handle & Index */}
                          <div className="flex items-center gap-2 pl-1 text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                            <span className="w-4 text-center font-bold text-zinc-500">{vIdx + 1}</span>
                          </div>

                          {/* Track info */}
                          <div
                            onClick={() => onPlayVideo(vid, pl.videos)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer ml-2"
                          >
                            <img
                              src={getReliableThumbnail(vid.id, vid.thumbnail)}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover bg-zinc-900 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-zinc-200 group-hover:text-red-400 truncate">
                                {vid.title}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate">{vid.channelTitle}</p>
                            </div>
                          </div>

                          {/* Reordering Controls & Actions */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {/* Move Up */}
                            <button
                              disabled={isFirst}
                              onClick={() => onReorderPlaylist(pl.id, vIdx, vIdx - 1)}
                              className={`p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors ${
                                isFirst ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                              title="Chuyển lên vị trí trước"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              disabled={isLast}
                              onClick={() => onReorderPlaylist(pl.id, vIdx, vIdx + 1)}
                              className={`p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors ${
                                isLast ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                              title="Chuyển xuống vị trí sau"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Download */}
                            {onOpenDownloadModal && (
                              <button
                                onClick={() => onOpenDownloadModal(vid)}
                                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                                title="Tải về máy"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Play */}
                            <button
                              onClick={() => onPlayVideo(vid, pl.videos)}
                              className="p-1.5 text-zinc-300 hover:text-red-400 rounded-lg transition-colors"
                              title="Phát bài này"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>

                            {/* Remove from playlist */}
                            <button
                              onClick={() => onRemoveFromPlaylist(pl.id, vid.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                              title="Xóa khỏi playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Downloads / Ngoại Tuyến Tab
  if (activeTab === 'downloads') {
    const totalStorageBytes = offlineVideos.reduce((acc, cur) => acc + (cur.sizeBytes || 0), 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Video Đã Tải Ngoại Tuyến</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {offlineVideos.length} video
                </span>
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Đã lưu trữ: {formatBytes(totalStorageBytes)} trong bộ nhớ offline</span>
              </p>
            </div>
          </div>
        </div>

        {offlineVideos.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 space-y-2">
            <WifiOff className="w-12 h-12 mx-auto stroke-1 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-300">Chưa có video nào được lưu ngoại tuyến</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Bấm biểu tượng <strong>Tải Về</strong> trên bất kỳ video nào để tải với các độ phân giải (1080p, 720p, 480p, 360p, MP3) để nghe & xem khi không có mạng.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {offlineVideos.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all text-xs group"
              >
                <div
                  onClick={() => onPlayOfflineVideo && onPlayOfflineVideo(item)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="w-6 text-center text-zinc-500 font-semibold">{idx + 1}</span>
                  <img
                    src={getReliableThumbnail(item.video.id, item.video.thumbnail)}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-950 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                        {item.video.title}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">
                        {item.resolution}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-[11px] mt-0.5">
                      <span>{item.video.channelTitle}</span>
                      <span>•</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Sẵn sàng phát offline
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayOfflineVideo && onPlayOfflineVideo(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md active:scale-95"
                    title="Phát ngoại tuyến ngay"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Phát</span>
                  </button>

                  {onDeleteOfflineVideo && (
                    <button
                      onClick={() => onDeleteOfflineVideo(item.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Xóa khỏi bộ nhớ ngoại tuyến"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. History Tab
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Lịch Sử Đã Nghe</h2>
            <p className="text-xs text-zinc-400">{history.length} video đã phát gần đây</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Toàn Bộ Lịch Sử</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <History className="w-12 h-12 mx-auto mb-3 stroke-1 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-400">Chưa có lịch sử nghe nhạc</p>
          <p className="text-xs text-zinc-600 mt-1">Các bài hát bạn phát sẽ xuất hiện tại đây</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all text-xs group"
            >
              <div
                onClick={() => onPlayVideo(item, history)}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
              >
                <img
                  src={getReliableThumbnail(item.id, item.thumbnail)}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-950 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100 group-hover:text-red-400 transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-zinc-400 text-[11px] truncate mt-0.5">{item.channelTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenDownloadModal && (
                  <button
                    onClick={() => onOpenDownloadModal(item)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Tải về máy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onPlayVideo(item, history)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors"
                  title="Phát lại"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
