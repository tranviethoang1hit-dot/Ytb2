import { useState, FormEvent } from 'react';
import { Link2, Play, X, AlertCircle } from 'lucide-react';
import { extractYouTubeId } from '../utils/formatters';
import { VideoItem } from '../types';

interface DirectUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayVideo: (video: VideoItem) => void;
}

export function DirectUrlModal({ isOpen, onClose, onPlayVideo }: DirectUrlModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePlayDirect = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const id = extractYouTubeId(urlInput);

    if (!id) {
      setErrorMsg('Vui lòng nhập link YouTube hoặc Video ID hợp lệ (VD: https://youtu.be/...)');
      return;
    }

    setIsLoading(true);
    try {
      // Try fetching title info via backend oEmbed
      const res = await fetch(`/api/youtube/info?id=${id}`);
      let info: VideoItem;
      if (res.ok) {
        info = await res.json();
      } else {
        info = {
          id,
          title: `YouTube Video (${id})`,
          channelTitle: 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          duration: 'Đang phát'
        };
      }

      onPlayVideo(info);
      setUrlInput('');
      onClose();
    } catch {
      // Fallback
      onPlayVideo({
        id,
        title: `YouTube Video (${id})`,
        channelTitle: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 'Đang phát'
      });
      setUrlInput('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="direct-url-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div id="direct-url-modal" className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dán Link YouTube Bất Kỳ</h3>
              <p className="text-xs text-zinc-400">Phát ngay video, shorts hoặc bài nhạc bạn yêu thích</p>
            </div>
          </div>
          <button
            id="close-direct-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePlayDirect} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Đường dẫn YouTube / ID video:
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="VD: https://youtu.be/abPmZCZZrFA hoặc abPmZCZZrFA"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
            <p className="font-semibold text-zinc-300">Định dạng hỗ trợ:</p>
            <p>• <code className="text-zinc-400">https://www.youtube.com/watch?v=...</code></p>
            <p>• <code className="text-zinc-400">https://youtu.be/...</code></p>
            <p>• <code className="text-zinc-400">https://www.youtube.com/shorts/...</code></p>
            <p>• Mã ID 11 ký tự của video</p>
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Phát Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
