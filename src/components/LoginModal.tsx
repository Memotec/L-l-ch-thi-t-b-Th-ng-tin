import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogOut,
  ArrowRight,
  Cloud,
  RefreshCw,
  CheckCircle2
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg text-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Đăng Nhập Quản Trị</h3>
              <p className="text-[11px] text-slate-300">Xác thực quyền & Đồng bộ dữ liệu Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Status (if already admin, offer quick logout & sync) */}
        {isAdmin ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
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
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất Quản trị</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Tài khoản</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản"
                required
                autoFocus
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="form-input-standard pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cloud Auto-Load & Synchronization toggle */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none bg-blue-50/70 p-2.5 rounded-lg border border-blue-200/60 hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoLoadCloud}
                  onChange={(e) => {
                    setAutoLoadCloud(e.target.checked);
                    cloudSyncService.setAutoLoadOnLogin(e.target.checked);
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Tự động nạp & đồng bộ dữ liệu từ Cloud
                  </span>
                  <p className="text-[11px] text-blue-700/85 mt-0.5 leading-relaxed">
                    Khi đăng nhập ở thiết bị khác, dữ liệu sẽ được tự động load về và đồng bộ với Cloud.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
