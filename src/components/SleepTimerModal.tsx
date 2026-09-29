import { Clock, Moon, Check, X, AlertCircle } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerSeconds: number | null;
  sleepTimerMode: 'time' | 'end_of_track' | null;
  onSetTimer: (minutes: number | 'end_of_track' | null) => void;
}

export function SleepTimerModal({
  isOpen,
  onClose,
  sleepTimerSeconds,
  sleepTimerMode,
  onSetTimer,
}: SleepTimerModalProps) {
  if (!isOpen) return null;

  const timerOptions = [
    { label: '15 phút', minutes: 15 },
    { label: '30 phút', minutes: 30 },
    { label: '45 phút', minutes: 45 },
    { label: '60 phút (1 giờ)', minutes: 60 },
    { label: '90 phút', minutes: 90 },
  ];

  return (
    <div id="sleep-timer-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div id="sleep-timer-modal" className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hẹn Giờ Tắt Nhạc (Sleep Timer)</h3>
              <p className="text-xs text-zinc-400">Tự động dừng phát nhạc để bạn an tâm đi ngủ</p>
            </div>
          </div>
          <button
            id="close-timer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer status */}
        {(sleepTimerSeconds !== null || sleepTimerMode === 'end_of_track') && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Đang hẹn giờ:</p>
                <p className="text-lg font-bold text-white tracking-wide">
                  {sleepTimerMode === 'end_of_track' ? 'Dừng khi hết bài này' : formatTime(sleepTimerSeconds || 0)}
                </p>
              </div>
            </div>
            <button
              id="cancel-sleep-timer-btn"
              onClick={() => onSetTimer(null)}
              className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded-lg border border-zinc-700 transition-colors"
            >
              Hủy hẹn giờ
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Chọn thời gian tắt:</p>
          
          <button
            id="timer-option-end-track"
            onClick={() => {
              onSetTimer('end_of_track');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-medium ${
              sleepTimerMode === 'end_of_track'
                ? 'bg-red-600/20 border-red-500/50 text-white'
                : 'bg-zinc-800/60 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Khi kết thúc bài hát hiện tại</span>
            </div>
            {sleepTimerMode === 'end_of_track' && <Check className="w-4 h-4 text-red-400" />}
          </button>

          {timerOptions.map((opt) => {
            const isSelected = sleepTimerMode === 'time' && sleepTimerSeconds !== null && Math.abs(sleepTimerSeconds - opt.minutes * 60) < 5;
            return (
              <button
                key={opt.minutes}
                id={`timer-option-${opt.minutes}`}
                onClick={() => {
                  onSetTimer(opt.minutes);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-medium ${
                  isSelected
                    ? 'bg-red-600/20 border-red-500/50 text-white'
                    : 'bg-zinc-800/60 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-red-400" />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
          <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>Âm lượng sẽ tự động dừng êm dịu khi đồng hồ đếm ngược về 0.</span>
        </div>
      </div>
    </div>
  );
}
