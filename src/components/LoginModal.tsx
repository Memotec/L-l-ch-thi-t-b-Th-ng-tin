import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert,
  Sparkles,
  Users
} from 'lucide-react';
import { AppUser } from '../types';
import { authService, ADMIN_USER, DEFAULT_USER } from '../utils/authService';

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

  const handleQuickFillAdmin = () => {
    setUsername('admin');
    setPassword('Aa123456');
    setErrorMsg(null);
  };

  const handleSwitchToDefault = () => {
    const user = authService.switchToDefault();
    onLoginSuccess(user, 'Đã chuyển về Tài khoản Mặc Định (Quyền xem & thêm mới thiết bị).');
    onClose();
    setPassword('');
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d1f4a] via-[#102761] to-[#091533] px-6 py-4 border-b border-[#1b356b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Xác Thực & Phân Quyền</h3>
              <p className="text-xs text-sky-200/70">Hệ thống Quản lý Sổ Lý Lịch Thiết Bị CNS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="px-6 pt-5 pb-3">
          <div className="p-3.5 rounded-xl border bg-[#060e24] border-[#162d5a] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm ${
                isAdmin ? 'bg-gradient-to-tr from-rose-600 to-amber-500 ring-2 ring-rose-400/50' : 'bg-gradient-to-tr from-sky-600 to-blue-500 ring-2 ring-sky-400/50'
              }`}>
                {isAdmin ? 'AD' : 'NV'}
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Tài khoản đang đăng nhập:</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{currentUser.displayName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${
                    isAdmin 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' 
                      : 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                  }`}>
                    {isAdmin ? 'Toàn Quyền' : 'Xem & Thêm Mới'}
                  </span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={handleSwitchToDefault}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#12224d] hover:bg-[#1a3370] text-sky-200 rounded-lg border border-[#20448a] transition-colors cursor-pointer"
                title="Đăng xuất về quyền mặc định"
              >
                Đăng xuất
              </button>
            )}
          </div>
        </div>

        {/* Role Explanations Table */}
        <div className="px-6 py-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-3 rounded-xl border transition-all ${
              isAdmin 
                ? 'bg-rose-950/30 border-rose-500/40 ring-1 ring-rose-500/30' 
                : 'bg-[#08132f] border-[#162d5a]'
            }`}>
              <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin (Toàn quyền)</span>
              </div>
              <ul className="text-[10.5px] text-slate-300 space-y-0.5">
                <li>• Tài khoản: <code className="text-sky-300 font-bold">admin</code></li>
                <li>• Mật khẩu: <code className="text-amber-300 font-bold">Aa123456</code></li>
                <li>• Quyền: <b>Toàn quyền hệ thống</b> (Xem, Thêm, Sửa, Xóa, Nhân bản, Khôi phục DB)</li>
              </ul>
            </div>

            <div className={`p-3 rounded-xl border transition-all ${
              !isAdmin 
                ? 'bg-sky-950/30 border-sky-500/40 ring-1 ring-sky-500/30' 
                : 'bg-[#08132f] border-[#162d5a]'
            }`}>
              <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Tài khoản Mặc Định</span>
              </div>
              <ul className="text-[10.5px] text-slate-300 space-y-0.5">
                <li>• Kỹ thuật viên / Khai thác</li>
                <li>• Quyền: <b>Xem & Thêm mới</b></li>
                <li>• Tra cứu thông tin, in A4, xem PDF, quét mã QR</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-sky-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                Tên đăng nhập
              </span>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-[10.5px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer underline"
              >
                <Sparkles className="w-3 h-3" />
                Điền sẵn Admin (Aa123456)
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (admin)"
                required
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-400" />
              Mật khẩu Admin
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Aa123456)"
                required
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950/60 border border-sky-400/40 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đăng nhập quyền Admin</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>

            {!isAdmin ? (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 bg-[#0e1d44] hover:bg-[#152c63] text-slate-300 rounded-xl text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
              >
                Hủy
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSwitchToDefault}
                className="px-3.5 py-2.5 bg-[#1a0f1d] hover:bg-[#2e132c] text-rose-300 rounded-xl text-xs font-semibold border border-rose-900/50 transition-colors cursor-pointer"
              >
                Về Mặc Định
              </button>
            )}
          </div>
        </form>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#050b1c] border-t border-[#162d5a] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Tài khoản mặc định được phép xem & thêm mới</span>
          <span className="font-mono text-sky-400 text-[10px]">CNS Security v3.0</span>
        </div>
      </div>
    </div>
  );
};
