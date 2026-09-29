import React, { useState, useEffect } from 'react';
import { Cloud, Check, AlertCircle, Loader2, ExternalLink, LogOut, FileCode, Database, ShieldCheck, FolderUp } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  exportAndroidKotlinProjectToDrive,
  exportUserDataToDrive,
  UploadResult,
} from '../utils/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    favorites: any[];
    history: any[];
    playlists: any[];
    offlineVideos: any[];
  };
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  userData,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUploadResult, setLastUploadResult] = useState<UploadResult | null>(null);

  // Confirmation dialog state for mandatory explicit confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'android' | 'backup';
    title: string;
    description: string;
  }>({
    open: false,
    type: 'android',
    title: '',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể đăng nhập tài khoản Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setLastUploadResult(null);
  };

  const triggerExportAndroid = () => {
    setErrorMsg(null);
    setLastUploadResult(null);
    setConfirmDialog({
      open: true,
      type: 'android',
      title: 'Xác nhận xuất mã nguồn Android lên Google Drive',
      description:
        'Thao tác này sẽ đóng gói toàn bộ mã nguồn Android Kotlin (Jetpack Compose, Room DB, Media3 Service) thành tệp .ZIP và tải lên thư mục "YTMusic-Android-Source-Export" trên Google Drive của bạn.',
    });
  };

  const triggerExportUserData = () => {
    setErrorMsg(null);
    setLastUploadResult(null);
    setConfirmDialog({
      open: true,
      type: 'backup',
      title: 'Xác nhận sao lưu dữ liệu lên Google Drive',
      description: `Thao tác này sẽ tạo tệp sao lưu JSON chứa ${userData.favorites.length} bài hát yêu thích, ${userData.playlists.length} playlist và ${userData.history.length} lịch sử nghe nhạc vào Google Drive của bạn.`,
    });
  };

  const executeConfirmedAction = async () => {
    const type = confirmDialog.type;
    setConfirmDialog({ open: false, type: 'android', title: '', description: '' });

    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      setErrorMsg('Vui lòng đăng nhập Google Drive trước khi xuất tệp.');
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);

    try {
      if (type === 'android') {
        const result = await exportAndroidKotlinProjectToDrive(token, (msg) => {
          setProgressMsg(msg);
        });
        setLastUploadResult(result);
      } else {
        const result = await exportUserDataToDrive(userData, token, (msg) => {
          setProgressMsg(msg);
        });
        setLastUploadResult(result);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'Quá trình xuất tệp lên Google Drive gặp lỗi');
    } finally {
      setIsExporting(false);
      setProgressMsg('');
    }
  };

  return (
    <div
      id="google-drive-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="google-drive-modal-container"
        className="relative w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Xuất sang Google Drive</h2>
              <p className="text-xs text-zinc-400">Tích hợp Google Workspace & Drive OAuth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* User auth state */}
          {!user ? (
            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <FolderUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Kết nối Google Drive</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Đăng nhập để cho phép ứng dụng xuất mã nguồn Android Kotlin và sao lưu dữ liệu trực tiếp vào Drive của bạn.
                </p>
              </div>

              {/* Official Google Sign In Button */}
              <button
                id="google-signin-btn"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full max-w-xs flex items-center justify-center gap-3 py-2.5 px-4 bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98] rounded-xl font-medium text-sm transition shadow-md disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Đang kết nối Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Đăng nhập với Google</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <span>{user.displayName || user.email}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Export Options (only when signed in) */}
          {user && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Lựa chọn xuất tệp lên Drive
              </div>

              {/* Action 1: Export Android Kotlin Source ZIP */}
              <button
                id="export-android-drive-btn"
                onClick={triggerExportAndroid}
                disabled={isExporting}
                className="w-full p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition flex items-start justify-between group disabled:opacity-50"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                      Xuất mã nguồn Android Kotlin (.ZIP)
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Đóng gói trọn vẹn dự án Android (Jetpack Compose, Room DB, Media3, Gradle) và đẩy lên thư mục Google Drive của bạn để mở ngay trong Android Studio.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0 ml-2">
                  Xuất ZIP
                </div>
              </button>

              {/* Action 2: Export User Playlists & Favorites Backup */}
              <button
                id="export-backup-drive-btn"
                onClick={triggerExportUserData}
                disabled={isExporting}
                className="w-full p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition flex items-start justify-between group disabled:opacity-50"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition">
                      Sao lưu Dữ liệu & Playlists (.JSON)
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Lưu trữ {userData.favorites.length} bài hát yêu thích, {userData.playlists.length} danh sách phát và lịch sử nghe nhạc của bạn lên Google Drive.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-purple-400 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 shrink-0 ml-2">
                  Sao lưu
                </div>
              </button>
            </div>
          )}

          {/* In-progress state */}
          {isExporting && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
              <div className="text-xs text-blue-200">
                <span className="font-semibold block">Đang xử lý xuất dữ liệu...</span>
                <span>{progressMsg || 'Đang kết nối Google Drive API...'}</span>
              </div>
            </div>
          )}

          {/* Success state */}
          {lastUploadResult && !isExporting && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-emerald-300">Xuất tệp thành công!</h5>
                  <p className="text-xs text-zinc-400 truncate max-w-[240px]">{lastUploadResult.name}</p>
                </div>
              </div>
              {lastUploadResult.webViewLink && (
                <a
                  href={lastUploadResult.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                >
                  <span>Mở trên Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/50 flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Thông báo lỗi:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#202024] border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{confirmDialog.description}</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog({ open: false, type: 'android', title: '', description: '' })}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md"
              >
                Xác nhận tải lên Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
