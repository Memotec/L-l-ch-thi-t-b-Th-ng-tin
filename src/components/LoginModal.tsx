import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  LogOut,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUser } from '../types';
import { authService } from '../utils/authService';
import { cloudSyncService } from '../utils/cloudSyncService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onLoginSuccess: (user: AppUser, message: string, options?: { autoLoadCloud?: boolean }) => void;
  onTriggerCloudSync?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onTriggerCloudSync
}) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoLoadCloud, setAutoLoadCloud] = useState<boolean>(() => cloudSyncService.getAutoLoadOnLogin());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = authService.login(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user, res.message, { autoLoadCloud });
      onClose();
      setPassword('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSwitchToDefault = () => {
    const user = authService.switchToDefault();
    onLoginSuccess(user, 'Đã đăng xuất về tài khoản mặc định.');
    onClose();
    setPassword('');
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white rounded-2xl w-full max-w-[390px] p-7 sm:p-8 shadow-2xl border border-slate-100 text-slate-900 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header matching provided design */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          {/* Blue Shield Icon */}
          <div className="w-7 h-7 shrink-0 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 2L4 5.5V11.5C4 16.5 7.5 21.1 12 22.3C16.5 21.1 20 16.5 20 11.5V5.5L12 2Z" 
                fill="#2563EB" 
              />
              <path 
                d="M12 3.8L18.5 6.6V11.5C18.5 15.6 15.7 19.3 12 20.4V3.8Z" 
                fill="#3B82F6" 
              />
              <path 
                d="M10 2.9L5.5 5.9V11.5C5.5 15.6 8.3 19.3 12 20.4V3.8L10 2.9Z" 
                fill="#1D4ED8" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Đăng Nhập Hệ Thống
          </h2>
        </div>

        {/* Current User Status (if already admin) */}
        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-2xs text-xs">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser.displayName}</div>
                <div className="text-[11px] text-emerald-700 font-medium">Đang có toàn quyền Quản trị viên</div>
              </div>
            </div>

            {onTriggerCloudSync && (
              <button
                type="button"
                onClick={() => {
                  onTriggerCloudSync();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải về & Đồng bộ dữ liệu mới nhất từ Cloud</span>
              </button>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSwitchToDefault}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất Quản trị</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer shadow-sm hover:shadow"
              >
                Đăng Nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
