import { useState, FormEvent } from 'react';
import { ListPlus, Plus, FolderPlus, Check, X, Trash2 } from 'lucide-react';
import { Playlist, VideoItem } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoToAdd: VideoItem | null;
  playlists: Playlist[];
  onCreatePlaylist: (title: string) => void;
  onToggleVideoInPlaylist: (playlistId: string, video: VideoItem) => void;
  onDeletePlaylist?: (playlistId: string) => void;
}

export function PlaylistModal({
  isOpen,
  onClose,
  videoToAdd,
  playlists,
  onCreatePlaylist,
  onToggleVideoInPlaylist,
  onDeletePlaylist,
}: PlaylistModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim());
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div id="playlist-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div id="playlist-modal" className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {videoToAdd ? 'Lưu vào Playlist' : 'Danh Sách Phát'}
              </h3>
              <p className="text-xs text-zinc-400">
                {videoToAdd ? `Chọn playlist cho "${videoToAdd.title.slice(0, 30)}..."` : 'Quản lý các playlist cá nhân của bạn'}
              </p>
            </div>
          </div>
          <button
            id="close-playlist-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create playlist input toggle */}
        <div className="mt-4">
          {isCreating ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tên danh sách phát..."
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium disabled:opacity-50"
              >
                Tạo
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-xs"
              >
                Hủy
              </button>
            </form>
          ) : (
            <button
              id="new-playlist-btn"
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-red-500 text-zinc-300 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 transition-colors text-xs font-medium"
            >
              <FolderPlus className="w-4 h-4 text-red-500" />
              <span>Tạo danh sách phát mới</span>
            </button>
          )}
        </div>

        {/* Existing Playlists */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {playlists.length === 0 ? (
            <p className="text-center py-6 text-xs text-zinc-500">Chưa có danh sách phát nào. Hãy tạo mới!</p>
          ) : (
            playlists.map((pl) => {
              const contains = videoToAdd ? pl.videos.some((v) => v.id === videoToAdd.id) : false;
              return (
                <div
                  key={pl.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-zinc-200 truncate">{pl.title}</p>
                    <p className="text-[11px] text-zinc-400">{pl.videos.length} bài hát</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {videoToAdd && (
                      <button
                        onClick={() => onToggleVideoInPlaylist(pl.id, videoToAdd)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 text-[11px] ${
                          contains
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        }`}
                      >
                        {contains ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Đã lưu</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Thêm vào</span>
                          </>
                        )}
                      </button>
                    )}

                    {onDeletePlaylist && (
                      <button
                        title="Xóa danh sách"
                        onClick={() => onDeletePlaylist(pl.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
