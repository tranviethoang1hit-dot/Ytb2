import { Play, Plus, Heart, ListPlus, Volume2, Download } from 'lucide-react';
import { VideoItem } from '../types';
import { getReliableThumbnail } from '../data/mockVideos';

interface VideoCardProps {
  key?: string | number;
  video: VideoItem;
  isCurrentlyPlaying: boolean;
  isPlayingStatus: boolean;
  isFavorite: boolean;
  onPlay: (video: VideoItem) => void;
  onAddToQueue: (video: VideoItem) => void;
  onToggleFavorite: (video: VideoItem) => void;
  onOpenPlaylistModal: (video?: VideoItem) => void;
  onDownload?: (video: VideoItem) => void;
}

export function VideoCard({
  video,
  isCurrentlyPlaying,
  isPlayingStatus,
  isFavorite,
  onPlay,
  onAddToQueue,
  onToggleFavorite,
  onOpenPlaylistModal,
  onDownload,
}: VideoCardProps) {
  const thumbUrl = getReliableThumbnail(video.id, video.thumbnail);

  return (
    <div
      id={`video-card-${video.id}`}
      className={`group relative flex flex-col rounded-2xl bg-zinc-900/60 border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 ${
        isCurrentlyPlaying
          ? 'border-red-600/60 bg-red-950/10 shadow-lg shadow-red-900/20 ring-1 ring-red-500/40'
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => onPlay(video)}>
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
          }}
        />

        {/* Gradient dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Duration pill */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-zinc-200 tracking-wider">
            {video.duration}
          </div>
        )}

        {/* Playing Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-bold tracking-wide shadow-md">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>{isPlayingStatus ? 'ĐANG PHÁT' : 'TẠM DỪNG'}</span>
          </div>
        )}

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Info & Action Bar */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h4
            onClick={() => onPlay(video)}
            className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug hover:text-red-400 cursor-pointer transition-colors"
            title={video.title}
          >
            {video.title}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-1 truncate hover:text-zinc-300 font-medium">
            {video.channelTitle}
          </p>
          {(video.views || video.publishedAt) && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {[video.views, video.publishedAt].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        {/* Bottom Card Actions */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
          <button
            id={`play-now-${video.id}`}
            onClick={() => onPlay(video)}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Phát</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              id={`add-queue-${video.id}`}
              onClick={() => onAddToQueue(video)}
              title="Thêm vào hàng đợi"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              id={`toggle-fav-${video.id}`}
              onClick={() => onToggleFavorite(video)}
              title={isFavorite ? 'Bỏ thích' : 'Yêu thích'}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              id={`add-playlist-${video.id}`}
              onClick={() => onOpenPlaylistModal(video)}
              title="Lưu vào playlist"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <ListPlus className="w-3.5 h-3.5" />
            </button>

            {onDownload && (
              <button
                id={`download-btn-${video.id}`}
                onClick={() => onDownload(video)}
                title="Tải video này về máy / xem ngoại tuyến"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
