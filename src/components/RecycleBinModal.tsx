import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  Search, 
  Info,
  Calendar,
  Clock,
  HardDrive,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { TrashEquipmentItem, AppUser, GeneralInfo } from '../types';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashList: TrashEquipmentItem[];
  onRestoreItem: (eqId: string) => void;
  onPermanentDeleteItem: (eqId: string) => void;
  onEmptyTrash: () => void;
  currentUser: AppUser;
  onOpenLoginModal?: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  trashList,
  onRestoreItem,
  onPermanentDeleteItem,
  onEmptyTrash,
  currentUser,
  onOpenLoginModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  // Strict Security Access Screen: Non-admin users cannot see trash items
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Khu Vực Quản Trị Bảo Mật</span>
            </div>
            <h3 className="font-bold text-lg text-slate-900">Quyền Truy Cập Bị Giới Hạn</h3>
            <p className="text-xs text-slate-600 leading-relaxed px-2">
              Chỉ có <b>Quản trị viên (Admin)</b> mới có quyền truy cập, xem danh sách và khôi phục các sổ lý lịch thiết bị đã xóa trong Thùng rác.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
            {onOpenLoginModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLoginModal();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Đăng nhập Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredTrash = trashList.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const g: Partial<GeneralInfo> = item.equipment.general || {};
    return (
      (g.name || '').toLowerCase().includes(term) ||
      (g.model || '').toLowerCase().includes(term) ||
      (g.serial || '').toLowerCase().includes(term) ||
      (g.assetNo || '').toLowerCase().includes(term) ||
      (g.category || '').toLowerCase().includes(term)
    );
  });

  const getDaysRemaining = (deletedAtStr: string) => {
    const deletedTime = new Date(deletedAtStr).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24));
    const remaining = 30 - elapsedDays;
    return Math.max(remaining, 0);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Thùng Rác & Khôi Phục Sổ Lý Lịch</h3>
                <span className="px-2 py-0.5 bg-slate-800 text-rose-300 rounded-full text-xs font-semibold border border-rose-500/30">
                  {trashList.length} sổ đã xóa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Các sổ lý lịch đã xóa sẽ được lưu giữ tối đa <span className="text-amber-300 font-bold">30 ngày</span> trước khi hệ thống tự động dọn dẹp vĩnh viễn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashList.length > 0 && (
              <button
                onClick={onEmptyTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-semibold border border-rose-700 transition-all cursor-pointer"
                title="Xóa vĩnh viễn toàn bộ vật phẩm trong thùng rác"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Dọn sạch thùng rác</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Chỉ <b>Quản trị viên (Admin)</b> mới có quyền thực hiện khôi phục hoặc xóa vĩnh viễn các sổ lý lịch trong thùng rác.
            </span>
          </div>
          <span className="font-mono text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200 shrink-0">
            Thời hạn lưu trữ: 30 Ngày
          </span>
        </div>

        {/* Controls Bar: Search */}
        {trashList.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lọc theo tên thiết bị, model, serial, mã tài sản..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <b>{filteredTrash.length}</b> / <b>{trashList.length}</b> sổ lý lịch
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
          {trashList.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                <Trash2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Thùng rác trống</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hiện không có sổ lý lịch thiết bị nào trong thùng rác. Khi Admin xóa một thiết bị, hồ sơ sẽ chuyển vào đây và được lưu tạm trong 30 ngày.
                </p>
              </div>
            </div>
          ) : filteredTrash.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
              Không tìm thấy sổ lý lịch khớp với từ khóa tìm kiếm "{searchTerm}".
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrash.map((item) => {
                const g: Partial<GeneralInfo> = item.equipment.general || {};
                const daysRemaining = getDaysRemaining(item.deletedAt);
                const isUrgent = daysRemaining <= 5;

                return (
                  <div 
                    key={item.equipment.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Equipment Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200 uppercase">
                          {g.category || 'Khác'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {g.name || 'Thiết bị không tên'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-600 flex-wrap">
                        <span>Model: <b className="text-slate-800 font-semibold">{g.model || 'N/A'}</b></span>
                        <span>Serial: <b className="font-mono text-blue-600 font-semibold">{g.serial || 'N/A'}</b></span>
                        <span>Mã TS: <b className="font-mono text-slate-800">{g.assetNo || 'N/A'}</b></span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Đã xóa: <b>{formatDate(item.deletedAt)}</b>
                        </span>
                        {item.deletedBy && (
                          <span>Bởi: <b>{item.deletedBy}</b></span>
                        )}
                        <span className={`flex items-center gap-1 font-semibold ${isUrgent ? 'text-rose-600 font-bold' : 'text-amber-600'}`}>
                          <Calendar className="w-3 h-3" />
                          Thời hạn khôi phục: {daysRemaining} ngày nữa
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onRestoreItem(item.equipment.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Khôi phục sổ lý lịch này về danh sách chính"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </button>

                      <button
                        onClick={() => onPermanentDeleteItem(item.equipment.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                        title="Xóa vĩnh viễn khỏi hệ thống ngay lập tức"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Xóa vĩnh viễn</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Hệ thống tự động quét và thu gom dữ liệu hết hạn 30 ngày.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
