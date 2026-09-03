import React from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';
import { 
  Save, 
  Printer, 
  QrCode, 
  Radio, 
  Activity, 
  PhoneCall, 
  Zap, 
  Server, 
  HardDrive, 
  FileCheck, 
  Search, 
  Cloud, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Settings, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { EquipmentData, EquipmentCategory, AppUser } from '../types';
import { CloudSyncState } from '../utils/cloudSyncService';
import { NotificationBell } from './NotificationBell';
import { InstantSearchDropdown } from './InstantSearchDropdown';

interface TopbarProps {
  currentEquipment: EquipmentData;
  equipments?: EquipmentData[];
  currentUser: AppUser;
  onOpenLoginModal: () => void;
  onSaveData: () => void;
  onShowPrint: () => void;
  onPrintDirect: () => void;
  onOpenQr?: () => void;
  onOpenGas?: () => void;
  onOpenSettings?: () => void;
  onOpenPdfModal?: () => void;
  onDeleteEquipment?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onResetDefaults: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onOpenSearchModal?: () => void;
  cloudSyncState?: CloudSyncState;
  onTriggerCloudSync?: () => void;
  onNavigateToEquipment?: (equipmentId: string, tabName?: string) => void;
}

export const Topbar: React.FC<TopbarProps> = React.memo(({
  currentEquipment,
  equipments = [],
  currentUser,
  onOpenLoginModal,
  onSaveData,
  onShowPrint,
  onPrintDirect,
  onOpenQr,
  onOpenGas,
  onOpenSettings,
  onOpenPdfModal,
  onDeleteEquipment,
  onOpenTrash,
  trashCount = 0,
  searchTerm = '',
  onOpenSearchModal,
  cloudSyncState,
  onTriggerCloudSync,
  onNavigateToEquipment
}) => {
  const isAdmin = currentUser.role === 'admin';

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-5 h-5 text-blue-400" />;
      case 'VIBA': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'VOICE': return <PhoneCall className="w-5 h-5 text-amber-400" />;
      case 'POWER': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'IT': return <Server className="w-5 h-5 text-indigo-400" />;
      case 'RADAR_ADS': return <Activity className="w-5 h-5 text-cyan-400" />;
      case 'NAV': return <Radio className="w-5 h-5 text-purple-400" />;
      default: return <HardDrive className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đang khai thác':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Dự phòng sẵn sàng':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Đang bảo dưỡng/sửa chữa':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Tạm ngừng khai thác':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <header className="bg-[#0F172A] border-b border-slate-800 px-5 py-3 sticky top-0 z-10 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0 text-slate-100">
      {/* Left: Current Equipment Profile Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative group shrink-0">
          <img 
            src={doiThongTinLogoImg} 
            alt="Logo Đội Thông Tin - TT BĐKT"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-400/60 shadow-md bg-slate-900"
            title="Đội Thông Tin - Trung Tâm Bảo Đảm Kỹ Thuật"
          />
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 rounded-full">
            {getCategoryIcon(currentEquipment.general.category)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-white truncate tracking-tight">
              {currentEquipment.general.name || 'Hồ sơ Thiết bị Kỹ thuật'}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(currentEquipment.general.status)}`}>
              {currentEquipment.general.status}
            </span>
            {currentEquipment.general.priority && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {currentEquipment.general.priority}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2.5 mt-0.5 flex-wrap">
            <span>Model: <b className="text-slate-200 font-semibold">{currentEquipment.general.model || 'N/A'}</b></span>
            <span className="text-slate-600">•</span>
            <span>Hãng SX: <b className="text-slate-200 font-semibold">{currentEquipment.general.manufacturer || 'N/A'}</b></span>
            <span className="text-slate-600">•</span>
            <span>Serial: <b className="font-mono text-slate-200 font-medium">{currentEquipment.general.serial || 'N/A'}</b></span>
            <span className="text-slate-600">•</span>
            <span>Mã TS: <b className="font-mono text-slate-200 font-medium">{currentEquipment.general.assetNo || 'N/A'}</b></span>
          </div>
        </div>
      </div>

      {/* Right: Organized Action Clusters */}
      <div className="flex items-center gap-2 flex-wrap xl:justify-end">
        {/* Instant Fast Search with Dropdown & Autocomplete */}
        <InstantSearchDropdown
          equipments={equipments}
          onSelectResult={(eqId, targetTab) => {
            if (onNavigateToEquipment) {
              onNavigateToEquipment(eqId, targetTab);
            }
          }}
          onOpenAdvancedSearch={() => {
            if (onOpenSearchModal) onOpenSearchModal();
          }}
        />

        {/* Group A: Electronic & Document Outputs */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
          {onOpenQr && (
            <button
              onClick={onOpenQr}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium shadow-xs transition-all cursor-pointer"
              title="Quản lý mã QR Code tra cứu & in tem định danh thiết bị"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>Mã QR Lý Lịch</span>
            </button>
          )}

          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Xem trực tiếp bản PDF Sổ lý lịch chuẩn mẫu A4"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Xem PDF</span>
            </button>
          )}

          <a
            href={currentEquipment.googleDocUrl || `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (currentEquipment.general.name || currentEquipment.id))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-md text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Mở tài liệu Google Docs trực tuyến"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Docs</span>
          </a>

          <button
            onClick={onShowPrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Xem trước định dạng in A4"
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Mẫu In</span>
          </button>

          <button
            onClick={onPrintDirect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="In sổ hoặc Lưu dưới dạng PDF (Ctrl + P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>In A4</span>
          </button>
        </div>

        {/* Group B: System & Synchronization & Auth */}
        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Mở Trung tâm Cài đặt & Quản trị hệ thống"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Cài đặt</span>
            </button>
          )}

          {onOpenGas && (
            <button
              onClick={onOpenGas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Đồng bộ Google Sheets & Drive qua Apps Script"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Apps Script</span>
            </button>
          )}

          {/* Cloud Sync Status & Trigger */}
          {onTriggerCloudSync && (
            <button
              onClick={onTriggerCloudSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${
                cloudSyncState?.status === 'syncing'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/50'
                  : cloudSyncState?.status === 'error'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={
                cloudSyncState?.status === 'syncing'
                  ? 'Đang đồng bộ dữ liệu với Cloud...'
                  : cloudSyncState?.lastSyncedAt
                  ? `Cloud: Đã đồng bộ lúc ${new Date(cloudSyncState.lastSyncedAt).toLocaleTimeString('vi-VN')} (${cloudSyncState.cloudCount} thiết bị). Nhấn để tải về / đồng bộ lại.`
                  : 'Đồng bộ Cloud đa thiết bị - Nhấn để đồng bộ ngay'
              }
            >
              {cloudSyncState?.status === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : (
                <Cloud className={`w-3.5 h-3.5 ${
                  cloudSyncState?.status === 'error' ? 'text-amber-400' : 'text-emerald-400'
                }`} />
              )}
              <span className="hidden sm:inline">
                {cloudSyncState?.status === 'syncing'
                  ? 'Đang đồng bộ...'
                  : cloudSyncState?.lastSyncedAt
                  ? `Cloud (${cloudSyncState.cloudCount || 'OK'})`
                  : 'Đồng bộ Cloud'}
              </span>
            </button>
          )}

          <button
            onClick={onSaveData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Lưu tất cả thay đổi vào cơ sở dữ liệu"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu hồ sơ</span>
          </button>

          {/* Delete Equipment Button (Admin Only or Login Trigger) */}
          {onDeleteEquipment && (
            <button
              onClick={onDeleteEquipment}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/50 transition-all cursor-pointer"
              title="Chuyển sổ lý lịch thiết bị này vào Thùng rác"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Xóa sổ</span>
            </button>
          )}

          {/* Recycle Bin / Trash Button */}
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Mở Thùng Rác (Phục hồi sổ lý lịch đã xóa trong 30 ngày)"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Thùng Rác</span>
              {trashCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white font-bold rounded-full text-[10px]">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {/* Notification Bell with alerts for Add, Delete, Updates */}
          <NotificationBell onNavigateToEquipment={onNavigateToEquipment} />

          {/* User Account / Role Badge */}
          <button
            onClick={onOpenLoginModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${
              isAdmin
                ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isAdmin ? 'Tài khoản Admin (Toàn quyền) - Nhấn để quản lý' : 'Tài khoản Mặc định (Xem & Thêm mới) - Nhấn để đăng nhập Admin'}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Admin (Toàn quyền)</span>
                <span className="sm:hidden">Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Đăng nhập Admin</span>
                <span className="sm:hidden">Đăng nhập</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});
