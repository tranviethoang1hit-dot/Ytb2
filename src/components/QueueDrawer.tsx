import { ListOrdered, Play, Trash2, X, Music, Shuffle } from 'lucide-react';
import { VideoItem } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: VideoItem[];
  queueIndex: number;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearQueue: () => void;
  onShuffleQueue: () => void;
}

export function QueueDrawer({
  isOpen,
  onClose,
  queue,
  queueIndex,
  onSelectTrack,
  onRemoveTrack,
  onClearQueue,
  onShuffleQueue,
}: QueueDrawerProps) {
  if (!isOpen) return null;

  return (
    <div id="queue-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div id="queue-drawer-content" className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Hàng Đợi Phát (Up Next)</h3>
              <p className="text-[11px] text-zinc-400">{queue.length} bài hát trong danh sách</p>
            </div>
          </div>
          <button
            id="close-queue-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        {queue.length > 0 && (
          <div className="py-2.5 flex items-center justify-between border-b border-zinc-900 text-xs">
            <button
              onClick={onShuffleQueue}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo trộn danh sách</span>
            </button>
            <button
              onClick={onClearQueue}
              className="flex items-center gap-1 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hàng đợi</span>
            </button>
          </div>
        )}

        {/* List of items */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3 custom-scrollbar">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500">
              <Music className="w-10 h-10 mb-2 stroke-1 text-zinc-600" />
              <p className="text-xs">Chưa có bài hát nào trong hàng đợi.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Bấm nút dấu (+) trên các bài hát để thêm vào đây.
              </p>
            </div>
          ) : (
            queue.map((item, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                    isCurrent
                      ? 'bg-red-600/15 border-red-500/40 text-white'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/80'
                  }`}
                >
                  <div
                    onClick={() => onSelectTrack(idx)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="w-4 text-center text-[10px] text-zinc-500 font-semibold">
                      {idx + 1}
                    </span>
                    <img
                      src={getReliableThumbnail(item.id, item.thumbnail)}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate ${isCurrent ? 'text-red-400' : 'text-zinc-200'}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.channelTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pl-2">
                    {isCurrent ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800">
                        Đang phát
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectTrack(idx)}
                        className="p-1 rounded text-zinc-400 hover:text-white"
                        title="Phát ngay"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveTrack(idx)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
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
    </div>
  );
}
