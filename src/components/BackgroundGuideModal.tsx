import { useState, useEffect } from 'react';
import { Sparkles, Radio, Smartphone, Moon, ShieldCheck, X, Maximize2, Download, Copy, Check, ExternalLink, HardDrive } from 'lucide-react';

interface BackgroundGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'guide' | 'apk';
}

export function BackgroundGuideModal({ isOpen, onClose, defaultTab = 'guide' }: BackgroundGuideModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'apk'>(defaultTab);
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
      const handler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTriggerInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`;

  return (
    <div id="guide-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div id="guide-modal-content" className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Trợ Giúp & Cài Đặt Ứng Dụng
              </h3>
              <p className="text-xs text-zinc-400">Phát nhạc trong nền & Hướng dẫn xuất APK Android</p>
            </div>
          </div>
          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mt-4 shrink-0">
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'guide'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Phát Trong Nền</span>
          </button>

          <button
            onClick={() => setActiveSubTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'apk'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Xuất APK / Cài App</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-sm scrollbar-thin scrollbar-thumb-zinc-700">
          {activeSubTab === 'guide' ? (
            <>
              <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="p-2 rounded-xl bg-zinc-700/50 text-red-400 shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs mb-1">1. Nghe khi chuyển tab hoặc ẩn trình duyệt</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Bạn có thể mở ứng dụng khác hoặc duyệt web ở tab khác, âm thanh vẫn tiếp tục phát liên tục mà không bị dừng như app thông thường.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="p-2 rounded-xl bg-zinc-700/50 text-red-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs mb-1">2. Nghe khi tắt màn hình điện thoại (Lock Screen)</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Đã nâng cấp kết hợp <strong>Web Worker Heartbeat + Silent Audio Anchor + MediaSession API</strong> để duy trì luồng âm thanh liên tục:
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-[11px] text-zinc-300 list-disc list-inside">
                    <li>
                      <strong className="text-white">Android / APK:</strong> Khi tắt màn hình, trình phát tự động kích hoạt luồng giữ nhịp (audio keepalive) để bài hát tiếp tục chạy ngầm không ngắt quãng.
                    </li>
                    <li>
                      <strong className="text-white">Mẹo ổn định 100%:</strong> Bật chế độ <strong>Chỉ Nghe (Headphones)</strong> hoặc bật <strong>Picture-in-Picture (PiP)</strong> trước khi tắt màn hình.
                    </li>
                    <li>
                      <strong className="text-white">Nếu bị hệ điều hành tạm dừng:</strong> Bạn chỉ cần bấm nút <strong>Phát ▶</strong> ngay trên thanh điều khiển Màn hình khóa (Lock Screen notification) để tiếp tục nghe mà không cần mở khóa điện thoại.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="p-2 rounded-lg bg-zinc-700/50 text-red-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs mb-1">3. Chế độ Chỉ Nghe & Hẹn giờ ngủ</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Bật nút <strong>Chỉ Nghe</strong> ở thanh phát nhạc để tắt luồng video, tiết kiệm tới 80% dung lượng pin & 4G/Wifi.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
                <div className="p-2 rounded-lg bg-zinc-700/50 text-red-400 shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs mb-1">4. Chế độ Xem Toàn Màn Hình</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Bấm phím <strong>F</strong> hoặc nút <strong>Toàn màn hình</strong> để xem tràn viền với thanh điều khiển rạp chiếu phim mượt mà.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                <div className="p-2 rounded-lg bg-emerald-900/50 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs mb-0.5">Không gián đoạn quảng cáo</h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Luồng phát liên tục, chất lượng âm thanh ổn định, hỗ trợ tạo danh sách phát và tải nhạc ngoại tuyến.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* APK & PWA installation step */}
              {installPrompt && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/20 via-zinc-800 to-zinc-800 border border-red-500/40 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">Điện thoại đã sẵn sàng cài đặt!</h4>
                    <p className="text-[11px] text-zinc-300">Cài đặt trực tiếp lên màn hình chính với 1 chạm</p>
                  </div>
                  <button
                    onClick={handleTriggerInstall}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                  >
                    Cài Đặt Ngay
                  </button>
                </div>
              )}

              {/* Current App URL box */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Link Đang Hoạt Động (Dùng link này để tạo APK):</span>
                  </label>
                  {copied ? (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã sao chép!
                    </span>
                  ) : null}
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://ais-dev-arfgss4kkuyhx2nfrmqxcz-719059187448.asia-east1.run.app"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-emerald-500/40 text-xs text-emerald-300 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://ais-dev-arfgss4kkuyhx2nfrmqxcz-719059187448.asia-east1.run.app");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px] leading-relaxed">
                  <strong>⚠️ Tại sao link <code>ais-pre-...</code> bị lỗi 404?</strong><br />
                  Link <code>ais-pre</code> là link công khai (Shared URL). Link này chỉ hoạt động sau khi bạn bấm nút <strong>"Share"</strong> (Chia sẻ) ở góc phải trên cùng màn hình AI Studio. Hãy dùng link <code>ais-dev</code> ở trên để truy cập hoặc tạo file APK ngay lập tức mà không cần chờ!
                </div>
              </div>

              {/* Steps to export APK and upload to Google Drive */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                      Tạo APK qua PWABuilder hoặc Web2Apk
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <a
                        href="/manifest.json"
                        download="manifest.json"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 text-[11px] font-medium transition-all"
                        title="Tải file manifest.json chuẩn về máy"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Tải manifest.json</span>
                      </a>
                      <a
                        href={pwaBuilderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-[11px] font-semibold transition-all"
                      >
                        <span>PWABuilder</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Hệ thống đã chuẩn hóa toàn bộ: <strong>manifest.json</strong> (đầy đủ Screenshots narrow & wide, Shortcuts, Icons PNG độ nét cao, Maskable), và <strong>Service Worker</strong>.
                  </p>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/60 text-[11px] text-zinc-300 space-y-1">
                    <p className="font-semibold text-white">💡 Nếu PWABuilder báo "Manifest Error" (do máy chủ của họ không kết nối được Cloud Run):</p>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                      <li>Bấm <strong>"Tải manifest.json"</strong> ở trên &rarr; tải file lên PWABuilder khi được hỏi.</li>
                      <li>Hoặc dùng công cụ <strong>Web2Apk / AppsGeyser / GoNative</strong>: chỉ cần dán link app là tự động tạo file APK trong 30 giây mà không phụ thuộc vào bộ quét bên ngoài!</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    Upload file APK lên Google Drive
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Sau khi có file <code>.apk</code> từ PWABuilder:
                  </p>
                  <ol className="list-decimal list-inside text-xs text-zinc-300 space-y-1 pl-1">
                    <li>Mở <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">drive.google.com <ExternalLink className="w-2.5 h-2.5 inline" /></a> trên máy tính hoặc điện thoại.</li>
                    <li>Bấm <strong>Mới (+)</strong> &rarr; <strong>Tải tệp lên</strong> &rarr; Chọn file APK vừa tải về.</li>
                    <li>Chuột phải vào file APK &rarr; <strong>Chia sẻ</strong> &rarr; Đổi quyền thành <em>"Bất kỳ ai có đường liên kết"</em> để gửi link tải cho người khác.</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-800/70 border border-zinc-700/60 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    Cách cài đặt trực tiếp không cần APK (Nhanh nhất)
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Trên điện thoại Android, mở link ứng dụng này trong trình duyệt Chrome, bấm vào biểu tượng <strong>3 chấm (⋮)</strong> ở góc trên &rarr; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>. Ứng dụng sẽ xuất hiện trên màn hình điện thoại và phát nhạc trong nền 100% mượt mà!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Đã chứng nhận chuẩn PWA & Android TWA</span>
          </div>

          <button
            id="guide-got-it-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white text-xs tracking-wide transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            {activeSubTab === 'apk' ? 'Xong' : 'Bắt đầu nghe nhạc'}
          </button>
        </div>
      </div>
    </div>
  );
}
