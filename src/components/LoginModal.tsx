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
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import { authService } from '../utils/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onLoginSuccess: (user: AppUser, message: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = authService.login(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user, res.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Simple Header */}
        <div className="bg-gradient-to-r from-[#1e40af] to-[#1d4ed8] px-5 py-4 border-b border-[#2563eb]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Đăng Nhập Quản Trị</h3>
              <p className="text-[11px] text-sky-200/70">Xác thực quyền quản trị hệ thống</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Status (if already admin, offer quick logout) */}
        {isAdmin ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md text-xs">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentUser.displayName}</div>
                <div className="text-[11px] text-emerald-300 font-medium">Đang có toàn quyền Quản trị viên</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSwitchToDefault}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất Quản trị</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#0e1d44] hover:bg-[#152c63] text-slate-300 rounded-xl text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-sky-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Tài khoản</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản"
                required
                autoFocus
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-sky-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-400" />
                <span>Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 bg-[#0e1d44] hover:bg-[#152c63] text-slate-300 rounded-xl text-xs font-medium border border-[#1e3c7a] transition-colors cursor-pointer"
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
