import { useState, useEffect } from 'react';
import { Download, X, Check, HardDrive, Smartphone, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { VideoItem, VideoResolutionId, VideoResolutionOption } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';
import { saveOfflineVideo } from '../utils/offlineStorage';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoItem | null;
  onDownloadComplete?: (videoId: string, resolution: VideoResolutionId) => void;
  onNavigateToDownloads?: () => void;
}

const DEFAULT_OPTIONS: VideoResolutionOption[] = [
  {
    id: '1080p',
    label: '1080p Full HD',
    resolution: '1920x1080',
    format: 'mp4',
    approxSizeMb: 48.5,
    isHd: true,
    bitrate: 'High (4.5 Mbps)'
  },
  {
    id: '720p',
    label: '720p HD (Chuẩn)',
    resolution: '1280x720',
    format: 'mp4',
    approxSizeMb: 26.2,
    isHd: true,
    bitrate: 'Standard HD (2.5 Mbps)'
  },
  {
    id: '480p',
    label: '480p SD',
    resolution: '854x480',
    format: 'mp4',
    approxSizeMb: 14.8,
    isHd: false,
    bitrate: 'Medium (1.2 Mbps)'
  },
  {
    id: '360p',
    label: '360p Tiết Kiệm',
    resolution: '640x360',
    format: 'mp4',
    approxSizeMb: 8.4,
    isHd: false,
    bitrate: 'Data Saver (600 Kbps)'
  },
  {
    id: 'mp3',
    label: 'Chỉ Âm Thanh (MP3)',
    resolution: 'Audio 320kbps',
    format: 'mp3',
    approxSizeMb: 5.2,
    isHd: false,
    bitrate: 'Ultra Audio (320 Kbps)'
  }
];

export function DownloadModal({
  isOpen,
  onClose,
  video,
  onDownloadComplete,
  onNavigateToDownloads,
}: DownloadModalProps) {
  const [selectedResolution, setSelectedResolution] = useState<VideoResolutionId>('720p');
  const [downloadMode, setDownloadMode] = useState<'both' | 'file' | 'offline'>('both');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadStatus('');
      setIsSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen, video?.id]);

  if (!isOpen || !video) return null;

  const currentOption = DEFAULT_OPTIONS.find((o) => o.id === selectedResolution) || DEFAULT_OPTIONS[1];

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    setDownloadProgress(0);
    setDownloadStatus('Đang khởi tạo luồng dữ liệu...');

    try {
      const url = `/api/download/file?id=${video.id}&quality=${selectedResolution}&format=${currentOption.format}&title=${encodeURIComponent(video.title)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Tải dữ liệu thất bại (${response.status})`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : currentOption.approxSizeMb * 1024 * 1024;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Không thể tạo bộ đọc luồng tải xuống');
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
        setDownloadProgress(percent);
        const receivedMb = (receivedBytes / (1024 * 1024)).toFixed(1);
        const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
        setDownloadStatus(`Đang tải: ${receivedMb} MB / ${totalMb} MB (${percent}%)`);
      }

      setDownloadProgress(100);
      setDownloadStatus('Đang hoàn thiện file media...');

      // Combine chunks into single Blob
      const mimeType = currentOption.format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob(chunks, { type: mimeType });

      // Save to IndexedDB for offline app viewing if requested
      if (downloadMode === 'both' || downloadMode === 'offline') {
        setDownloadStatus('Đang lưu vào bộ nhớ ngoại tuyến của ứng dụng...');
        await saveOfflineVideo(video, selectedResolution, currentOption.format, blob);
      }

      // Trigger browser file download if requested
      if (downloadMode === 'both' || downloadMode === 'file') {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const safeTitle = video.title.replace(/[^\w\s\u00C0-\u1EF9.-]/gi, '_').slice(0, 60);
        a.download = `${safeTitle}_${selectedResolution}.${currentOption.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }

      setIsSuccess(true);
      setIsDownloading(false);
      setDownloadStatus('Tải xuống & lưu ngoại tuyến thành công!');
      if (onDownloadComplete) {
        onDownloadComplete(video.id, selectedResolution);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setIsDownloading(false);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình tải');
    }
  };

  return (
    <div
      id="download-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="download-modal"
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tải Video & Xem Ngoại Tuyến</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold border border-red-500/30 uppercase">
                  Miễn phí
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Chọn độ phân giải phù hợp với thiết bị của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Video Summary Card */}
        <div className="mt-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-3">
          <img
            src={getReliableThumbnail(video.id, video.thumbnail)}
            alt=""
            className="w-16 h-12 rounded-xl object-cover bg-zinc-900 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 line-clamp-1">{video.title}</p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
              <span>{video.channelTitle}</span>
              {video.duration && <span>• {video.duration}</span>}
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>Chọn Độ Phân Giải (Resolution):</span>
            <span className="text-[11px] text-zinc-500 font-normal">Dung lượng ước tính</span>
          </label>

          <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {DEFAULT_OPTIONS.map((opt) => {
              const isSelected = selectedResolution === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => !isDownloading && setSelectedResolution(opt.id)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-600/15 border-red-500/80 text-white shadow-sm'
                      : 'bg-zinc-800/50 border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-800/80'
                  } ${isDownloading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-red-500 bg-red-600 text-white' : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{opt.label}</span>
                        {opt.isHd && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            HD
                          </span>
                        )}
                        {opt.id === '720p' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Khuyên dùng
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {opt.resolution} • {opt.bitrate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-200">~{opt.approxSizeMb} MB</span>
                    <p className="text-[10px] text-zinc-500 uppercase">{opt.format}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Destination Selection */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Chế Độ Lưu Trữ:</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              disabled={isDownloading}
              onClick={() => setDownloadMode('both')}
              className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                downloadMode === 'both'
                  ? 'bg-zinc-800 border-red-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-4 h-4 mb-1 text-amber-400" />
              <span className="font-semibold text-[11px]">Tải & Lưu App</span>
              <span className="text-[9px] text-zinc-500">Tiện lợi nhất</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={() => setDownloadMode('offline')}
              className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                downloadMode === 'offline'
                  ? 'bg-zinc-800 border-red-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-4 h-4 mb-1 text-emerald-400" />
              <span className="font-semibold text-[11px]">Lưu Ngoại Tuyến</span>
              <span className="text-[9px] text-zinc-500">Xem trong app</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={() => setDownloadMode('file')}
              className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                downloadMode === 'file'
                  ? 'bg-zinc-800 border-red-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <HardDrive className="w-4 h-4 mb-1 text-blue-400" />
              <span className="font-semibold text-[11px]">Tải File Về Máy</span>
              <span className="text-[9px] text-zinc-500">Lưu vào ổ đĩa</span>
            </button>
          </div>
        </div>

        {/* Progress or Status */}
        {isDownloading && (
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                <span>{downloadStatus}</span>
              </span>
              <span className="font-bold text-red-400">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-150"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã tải xong! Bạn có thể xem ngoại tuyến bất kỳ lúc nào.</span>
            </div>
            {onNavigateToDownloads && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDownloads();
                }}
                className="px-2.5 py-1 bg-emerald-500 text-black font-bold rounded-lg text-[11px] hover:bg-emerald-400 transition-colors shrink-0 ml-2"
              >
                Mở Đã Tải
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isDownloading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isSuccess ? 'Đóng' : 'Hủy'}
          </button>

          {!isSuccess && (
            <button
              type="button"
              id="start-download-btn"
              disabled={isDownloading}
              onClick={handleStartDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải {currentOption.label}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
