import React, { useState } from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  Lock,
  Cloud,
  Printer,
  QrCode,
  Download,
  Upload,
  Copy,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Building2,
  User,
  KeyRound,
  ExternalLink,
  RefreshCw,
  HardDrive,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { EquipmentData, AppUser } from '../types';
import { GoogleWorkspaceTab } from './GoogleWorkspaceTab';

interface SettingsTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  currentUser: AppUser;
  lastSaved: string;
  onOpenLoginModal: () => void;
  onSaveData: () => void;
  onCloneEquipment: () => void;
  onDeleteEquipment: () => void;
  onExportCurrent: () => void;
  onExportAll: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
  onUpdateEquipment: (eq: EquipmentData) => void;
  onSyncFromGas: (equipments: EquipmentData[]) => void;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentEquipment,
  allEquipments,
  currentUser,
  lastSaved,
  onOpenLoginModal,
  onSaveData,
  onCloneEquipment,
  onDeleteEquipment,
  onExportCurrent,
  onExportAll,
  onImportFile,
  onResetDefaults,
  onUpdateEquipment,
  onSyncFromGas,
  onShowToast,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'database' | 'security' | 'google' | 'organization' | 'qr'>('database');
  const isAdmin = currentUser.role === 'admin';

  // State for Organization defaults
  const [orgCompanyName, setOrgCompanyName] = useState<string>(
    () => localStorage.getItem('cns_default_company_name') || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'
  );
  const [orgUnitName, setOrgUnitName] = useState<string>(
    () => localStorage.getItem('cns_default_unit_name') || 'ĐỘI THÔNG TIN - TRUNG TÂM BẢO ĐẢM KỸ THUẬT'
  );
  const [defaultSupervisor, setDefaultSupervisor] = useState<string>(
    () => localStorage.getItem('cns_default_supervisor') || 'Trưởng Trung tâm BĐKT'
  );

  const handleSaveOrgDefaults = () => {
    localStorage.setItem('cns_default_company_name', orgCompanyName);
    localStorage.setItem('cns_default_unit_name', orgUnitName);
    localStorage.setItem('cns_default_supervisor', defaultSupervisor);
    onShowToast('✓ Đã lưu cài đặt thông tin đơn vị mặc định thành công!');
  };

  const handleApplyOrgToCurrent = () => {
    onUpdateEquipment({
      ...currentEquipment,
      org: {
        ...currentEquipment.org,
        companyName: orgCompanyName,
        unit: orgUnitName,
        supervisor: defaultSupervisor
      }
    });
    onShowToast('✓ Đã áp dụng thông tin đơn vị vào hồ sơ thiết bị hiện tại!');
  };

  // Estimate storage usage
  const calculateStorageSize = () => {
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length * 2);
        }
      }
      return (total / 1024).toFixed(1) + ' KB';
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1c45] via-[#10245c] to-[#0a183d] border border-[#1e3c7a] rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl shadow-lg shadow-blue-950/80 border border-sky-300/40 shrink-0">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Trung Tâm Cài Đặt & Quản Trị Hệ Thống</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  Settings Hub
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1 max-w-2xl">
                Quản lý tập trung toàn bộ cấu hình: Sao lưu & phục hồi dữ liệu, phân quyền bảo mật, đồng bộ Google Workspace, thông tin đơn vị và mẫu in tem nhãn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSaveData}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-950/60 transition-all cursor-pointer border border-sky-400/40"
            >
              <Save className="w-4 h-4" />
              <span>Lưu toàn bộ dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation Ribbon */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sky-500/20 overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'database'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-[#162d66] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cơ sở dữ liệu & Sao lưu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'security'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-[#162d66] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phân quyền & Tài khoản</span>
            {isAdmin && (
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('google')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'google'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-[#162d66] hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive & Docs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('organization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'organization'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-[#162d66] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Thông tin Đơn vị & Mẫu In</span>
          </button>

          <button
            onClick={() => setActiveSubTab('qr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'qr'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-[#162d66] hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Cấu hình QR & Tra cứu</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DATABASE & BACKUP */}
      {activeSubTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status & Overview Card */}
          <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Trạng thái Cơ sở dữ liệu</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                Sẵn sàng
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Tổng số thiết bị trong hệ thống:</span>
                <span className="text-sm font-extrabold text-sky-300 font-mono">{allEquipments.length} thiết bị</span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Thiết bị đang chọn:</span>
                <span className="text-xs font-bold text-white truncate max-w-[160px]" title={currentEquipment.general.name}>
                  {currentEquipment.general.name || '---'}
                </span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Dung lượng bộ nhớ (LocalStorage):</span>
                <span className="text-xs font-mono font-bold text-amber-300">{calculateStorageSize()}</span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Trạng thái lưu:</span>
                <span className="text-xs font-medium text-slate-400">{lastSaved}</span>
              </div>
            </div>

            <button
              onClick={onSaveData}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Ghi đè & Lưu ngay lập tức</span>
            </button>
          </div>

          {/* Backup & Export/Import Controls */}
          <div className="lg:col-span-2 bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-sky-400" />
                <span>Sao Lưu & Nhập/Xuất Dữ Liệu An Toàn</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Xuất file định dạng JSON tiêu chuẩn để lưu trữ an toàn hoặc chia sẻ giữa các máy tính trong đài/trạm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export All */}
              <div className="p-4 bg-[#071129] border border-[#193366] rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Sao lưu toàn bộ ({allEquipments.length} thiết bị)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tải về một file JSON duy nhất chứa toàn bộ cơ sở dữ liệu hồ sơ kỹ thuật của tất cả thiết bị.
                  </p>
                </div>
                <button
                  onClick={onExportAll}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Toàn Bộ Database</span>
                </button>
              </div>

              {/* Export Current */}
              <div className="p-4 bg-[#071129] border border-[#193366] rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Xuất hồ sơ đang chọn</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tải về file JSON riêng của thiết bị: <b>{currentEquipment.general.name}</b> (SN: {currentEquipment.general.serial || 'N/A'}).
                  </p>
                </div>
                <button
                  onClick={onExportCurrent}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#0d2252] hover:bg-[#15347a] text-sky-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-sky-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Thiết Bị Này</span>
                </button>
              </div>
            </div>

            {/* Import JSON Section */}
            <div className="p-4 bg-[#071129] border border-[#193366] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Nhập file sao lưu JSON (Khôi phục / Bổ sung)</span>
                </div>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cần quyền Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Hệ thống tự động phát hiện file sao lưu chứa 1 thiết bị hoặc toàn bộ danh sách để cập nhật an toàn.
              </p>

              {isAdmin ? (
                <label className="flex items-center justify-center gap-2 py-2.5 bg-[#12285a] hover:bg-[#1a387d] text-amber-300 hover:text-amber-100 rounded-xl text-xs font-bold border border-amber-400/40 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Chọn File JSON từ máy tính để Nhập</span>
                  <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
                </label>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#12285a]/60 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Đăng nhập Admin để mở khóa tính năng Nhập JSON</span>
                </button>
              )}
            </div>

            {/* Danger Zone: Factory Reset & Delete */}
            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Thao tác nhạy cảm (Quản trị viên)</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={onCloneEquipment}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0d1d42] hover:bg-[#17306b] text-sky-200 rounded-lg text-xs font-semibold border border-sky-500/30 transition-all cursor-pointer"
                  title="Nhân bản thiết bị hiện tại"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nhân bản thiết bị</span>
                </button>

                <button
                  onClick={onDeleteEquipment}
                  disabled={isAdmin && allEquipments.length <= 1}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-900/30 hover:bg-rose-900/50 text-rose-200 rounded-lg text-xs font-semibold border border-rose-500/40 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Xóa hồ sơ thiết bị hiện tại"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Xóa hồ sơ thiết bị</span>
                </button>

                <button
                  onClick={onResetDefaults}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/40 transition-all cursor-pointer"
                  title="Khôi phục lại dữ liệu mẫu của hệ thống"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Khôi phục dữ liệu gốc</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SECURITY & ROLE PERMISSIONS */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current User Role Card */}
          <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">Tài khoản hiện tại</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                isAdmin 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              }`}>
                {isAdmin ? 'Quản Trị Viên (Admin)' : 'Kỹ Thuật Viên (Mặc định)'}
              </span>
            </div>

            <div className="p-4 bg-[#060e24] rounded-xl border border-[#162d5a] text-center space-y-2">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border shadow-inner ${
                isAdmin 
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                  : 'bg-sky-950 text-sky-300 border-sky-500/50'
              }`}>
                {isAdmin ? <ShieldCheck className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>
              <div className="font-bold text-white text-base">{currentUser.displayName}</div>
              <div className="text-xs text-slate-400 font-mono">@{currentUser.username}</div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenLoginModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isAdmin ? 'Chuyển đổi / Quản lý tài khoản' : 'Đăng nhập Quyền Admin'}</span>
              </button>
            </div>
          </div>

            {/* Permissions Matrix */}
          <div className="lg:col-span-2 cns-glass-card p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Bảng Phân Quyền Thao Tác (Role Permissions Matrix)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Chi tiết quyền hạn được cấp cho vai trò hiện tại trong ứng dụng Sổ Lý Lịch CNS. Mặc định tài khoản là Người Xem (Viewer) - Chỉ đọc và Quét mã QR.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#193366]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#081533] text-sky-300 border-b border-[#193366]">
                  <tr>
                    <th className="p-3">Tính năng / Quyền hạn</th>
                    <th className="p-3 text-center">Người Xem (Viewer - Mặc định)</th>
                    <th className="p-3 text-center">Quản Trị Viên (Admin)</th>
                    <th className="p-3 text-center">Trạng thái của bạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152a57] bg-[#060e24] text-slate-200">
                  <tr>
                    <td className="p-3 font-medium">Xem & Tra cứu hồ sơ thiết bị</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Quét mã QR tra cứu thiết bị</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">In sổ A4 & Xuất file JSON/PDF</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-400 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Thêm thiết bị mới & Chỉnh sửa thông số</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canCreateEquipment ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canCreateEquipment ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Ghi nhật ký bảo dưỡng & sửa chữa</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canEditDetails ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canEditDetails ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Nhân bản thiết bị (Clone)</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canClone ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canClone ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Xóa hồ sơ thiết bị</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canDelete ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canDelete ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Nhập dữ liệu sao lưu JSON</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canImportData ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canImportData ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Khôi phục dữ liệu gốc (Factory Reset)</td>
                    <td className="p-3 text-center text-slate-500 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canResetDatabase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {currentUser.permissions.canResetDatabase ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GOOGLE DRIVE & DOCS WORKSPACE */}
      {activeSubTab === 'google' && (
        <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-6 shadow-xl">
          <GoogleWorkspaceTab
            currentEquipment={currentEquipment}
            allEquipments={allEquipments}
            onSyncFromGas={onSyncFromGas}
            onUpdateCurrentEquipment={onUpdateEquipment}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* SUB-TAB 4: ORGANIZATION & PRINT TEMPLATE DEFAULTS */}
      {activeSubTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Thông Tin Cơ Quan Quản Lý Mặc Định</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Các thông tin này sẽ xuất hiện tự động trên Trang Bìa và Quốc hiệu tiêu đề khi in ấn Sổ Lý Lịch chuẩn A4.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-sky-200 mb-1">
                  Tên Tổng Công ty / Công ty quản lý:
                </label>
                <input
                  type="text"
                  value={orgCompanyName}
                  onChange={(e) => setOrgCompanyName(e.target.value)}
                  placeholder="CÔNG TY QUẢN LÝ BAY MIỀN NAM"
                  className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sky-200 mb-1">
                  Tên Đơn vị kỹ thuật trực tiếp:
                </label>
                <input
                  type="text"
                  value={orgUnitName}
                  onChange={(e) => setOrgUnitName(e.target.value)}
                  placeholder="ĐỘI THÔNG TIN - TRUNG TÂM BẢO ĐẢM KỸ THUẬT"
                  className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sky-200 mb-1">
                  Chức danh duyệt biên bản / Trưởng đơn vị:
                </label>
                <input
                  type="text"
                  value={defaultSupervisor}
                  onChange={(e) => setDefaultSupervisor(e.target.value)}
                  placeholder="Trưởng Trung tâm BĐKT"
                  className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveOrgDefaults}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Lưu làm Mặc định
              </button>
              <button
                onClick={handleApplyOrgToCurrent}
                className="px-4 py-2.5 bg-[#12285a] hover:bg-[#1a387d] text-sky-200 rounded-xl font-bold text-xs border border-sky-400/30 transition-all cursor-pointer"
              >
                Áp dụng cho thiết bị này
              </button>
            </div>
          </div>

          <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Tiêu Chuẩn In Ấn Sổ Lý Lịch A4</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Định dạng in ấn tuân thủ thể thức văn bản kỹ thuật quản lý chuyên ngành Hàng không Việt Nam (VATM).
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span>Khổ giấy tiêu chuẩn:</span>
                <span className="font-bold text-sky-300">A4 (210mm x 297mm) Dọc</span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span>Phông chữ tiêu chuẩn in ấn:</span>
                <span className="font-bold text-sky-300">Times New Roman (12pt - 14pt)</span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span>Định dạng xuất:</span>
                <span className="font-bold text-sky-300">In trực tiếp / Xuất PDF sắc nét</span>
              </div>

              <div className="p-3 bg-[#060e24] rounded-xl border border-[#162d5a] flex items-center justify-between">
                <span>Trang Bìa có Logo & Quốc hiệu:</span>
                <span className="font-bold text-emerald-400">Đã tích hợp đầy đủ</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('printPreview')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Xem Trước Mẫu In A4 Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: QR CODE & MOBILE LOOKUP */}
      {activeSubTab === 'qr' && (
        <div className="bg-[#0b1739] border border-[#1e3c7a] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-400" />
                <span>Cấu Hình Nhãn Tem & Tra Cứu Mã QR Di Động</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tự động sinh mã QR Vector có logo CNS để dán trực tiếp lên mặt máy, tủ rack trạm kỹ thuật.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('qrCode')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Đi đến Quản lý Mã QR & In Tem Nhãn</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#060e24] rounded-xl border border-[#162d5a] space-y-2">
              <span className="text-xs font-bold text-sky-300">Chế độ 1: Mở PDF trực tiếp</span>
              <p className="text-[11px] text-slate-400">
                Khi kỹ sư quét mã QR bằng camera điện thoại, hệ thống sẽ tự động mở xem ngay toàn bộ file PDF Sổ Lý Lịch của thiết bị.
              </p>
            </div>

            <div className="p-4 bg-[#060e24] rounded-xl border border-[#162d5a] space-y-2">
              <span className="text-xs font-bold text-sky-300">Chế độ 2: Mở Hồ sơ Điện tử</span>
              <p className="text-[11px] text-slate-400">
                Tự động kích hoạt hồ sơ thiết bị trên ứng dụng Web với đầy đủ 6 mục thông tin, lịch sử bảo dưỡng và linh kiện.
              </p>
            </div>

            <div className="p-4 bg-[#060e24] rounded-xl border border-[#162d5a] space-y-2">
              <span className="text-xs font-bold text-sky-300">Chế độ 3: Mở Google Docs</span>
              <p className="text-[11px] text-slate-400">
                Chuyển thẳng đến tài liệu Google Docs trực tuyến được lưu trữ tập trung trên Google Drive của đài trạm.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
