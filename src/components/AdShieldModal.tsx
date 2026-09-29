import { ShieldCheck, ShieldAlert, Zap, Clock, CheckCircle2, Lock, X, Play, PictureInPicture } from 'lucide-react';

interface AdShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdBlockActive: boolean;
  adsBlockedCount: number;
  adCurrentlyDetected: boolean;
  isAutoPiPEnabled?: boolean;
  onToggleAdBlock: () => void;
  onSkipCurrentAd: () => void;
  onToggleAutoPiP?: () => void;
}

export function AdShieldModal({
  isOpen,
  onClose,
  isAdBlockActive,
  adsBlockedCount,
  adCurrentlyDetected,
  isAutoPiPEnabled = true,
  onToggleAdBlock,
  onSkipCurrentAd,
  onToggleAutoPiP,
}: AdShieldModalProps) {
  if (!isOpen) return null;

  // Estimate: avg YouTube ad is ~15 seconds
  const timeSavedSeconds = adsBlockedCount * 15;
  const minutesSaved = Math.floor(timeSavedSeconds / 60);
  const secondsRemainder = timeSavedSeconds % 60;

  return (
    <div
      id="ad-shield-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="ad-shield-modal-content"
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isAdBlockActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Tính Năng Premium VIP</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Hoàn Toàn Free
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Chặn quảng cáo, phát ngầm khi khóa máy và tự động mở PiP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toggle Card 1: AdBlock */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Khiên Chặn Quảng Cáo</span>
            </p>
            <p className="text-xs text-zinc-400">
              {isAdBlockActive
                ? 'Đang chặn tự động 100% quảng cáo YouTube'
                : 'Đã tạm dừng chặn quảng cáo'}
            </p>
          </div>
          <button
            onClick={onToggleAdBlock}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isAdBlockActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {isAdBlockActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
          </button>
        </div>

        {/* Status Toggle Card 2: Auto Picture-in-Picture */}
        {onToggleAutoPiP && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <PictureInPicture className="w-4 h-4 text-blue-400" />
                <span>Tự Động Mở PiP Khi Ra Ngoài</span>
              </p>
              <p className="text-xs text-zinc-400">
                {isAutoPiPEnabled
                  ? 'Chuyển tab hoặc đổi ứng dụng: Tự bật khung nổi PiP'
                  : 'Tắt tự động bật PiP khi rời ứng dụng'}
              </p>
            </div>
            <button
              onClick={onToggleAutoPiP}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isAutoPiPEnabled
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {isAutoPiPEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
            </button>
          </div>
        )}

        {/* Live Detected Ad Action */}
        {adCurrentlyDetected && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 animate-pulse">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Phát hiện phân đoạn quảng cáo!</p>
                <p className="text-zinc-300">Đang tự động tua nhanh qua quảng cáo...</p>
              </div>
            </div>
            <button
              onClick={onSkipCurrentAd}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow"
            >
              Bỏ qua ngay
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/15 text-red-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{adsBlockedCount}</p>
              <p className="text-[11px] text-zinc-400">Quảng cáo đã chặn</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {minutesSaved > 0 ? `${minutesSaved}p ` : ''}
                {secondsRemainder}s
              </p>
              <p className="text-[11px] text-zinc-400">Thời gian tiết kiệm</p>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-2 text-xs">
          <p className="text-zinc-400 font-semibold mb-2">Công nghệ bảo vệ người dùng:</p>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Tự Động Mở PiP Ra Ngoài App</strong>: Khi bạn vuốt về màn hình chính hoặc chuyển sang Facebook, Zalo,... video vẫn hiển thị trong khung nổi nhỏ.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Chặn Pre-roll & Mid-roll</strong>: Tự động loại bỏ quảng cáo trước khi phát và quảng cáo chen giữa video.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Chế độ Bảo Mật Không Cookie</strong>: Sử dụng máy chủ <code>youtube-nocookie.com</code> ngăn YouTube thu thập hồ sơ quảng cáo hành vi.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Phát trong nền & Khóa màn hình</strong>: Xem tiếp hoặc nghe nhạc ngay cả khi chuyển ứng dụng khác hay tắt màn hình.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
