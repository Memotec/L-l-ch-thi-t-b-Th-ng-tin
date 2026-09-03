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
  KeyRound
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
  onOpenTrash?: () => void;
  trashCount?: number;
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
  onNavigateTab,
  onOpenTrash,
  trashCount = 0
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

  // Auto backup option state
  const [autoBackupDrive, setAutoBackupDrive] = useState<boolean>(
    () => localStorage.getItem('cns_auto_backup_drive') === 'true'
  );

  const handleToggleAutoBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoBackupDrive(val);
    localStorage.setItem('cns_auto_backup_drive', val ? 'true' : 'false');
    onShowToast(val ? '✓ Đã BẬT tự động sao lưu JSON lên Google Drive!' : '✓ Đã TẮT tự động sao lưu.');
  };

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="enterprise-card p-6 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Trung Tâm Cài Đặt & Quản Trị Hệ Thống</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Settings Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Quản lý tập trung toàn bộ cấu hình: Sao lưu & phục hồi dữ liệu, phân quyền bảo mật, đồng bộ Google Workspace, thông tin đơn vị và mẫu in tem nhãn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onSaveData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu toàn bộ dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation Ribbon */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'database'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cơ sở dữ liệu & Sao lưu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'security'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phân quyền & Tài khoản</span>
            {isAdmin && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('google')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'google'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive & Docs</span>
          </button>

          <button
            onClick={() => setActiveSubTab('organization')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'organization'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Thông tin Đơn vị & Mẫu In</span>
          </button>

          <button
            onClick={() => setActiveSubTab('qr')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'qr'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
          <div className="enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Trạng thái Cơ sở dữ liệu</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Sẵn sàng
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Tổng số thiết bị trong hệ thống:</span>
                <span className="font-bold text-slate-900 font-mono">{allEquipments.length} thiết bị</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Thiết bị đang chọn:</span>
                <span className="font-bold text-slate-900 truncate max-w-[160px]" title={currentEquipment.general.name}>
                  {currentEquipment.general.name || '---'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Dung lượng bộ nhớ (LocalStorage):</span>
                <span className="font-mono font-bold text-blue-600">{calculateStorageSize()}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Trạng thái lưu:</span>
                <span className="font-medium text-slate-500">{lastSaved}</span>
              </div>
            </div>

            {/* Auto Google Drive Backup Toggle */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="auto-backup-toggle" className="text-xs font-semibold text-blue-900 cursor-pointer flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Tự động sao lưu JSON lên Google Drive</span>
                </label>
                <input
                  id="auto-backup-toggle"
                  type="checkbox"
                  checked={autoBackupDrive}
                  onChange={handleToggleAutoBackup}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-blue-700/80 leading-relaxed">
                Khi kích hoạt, mỗi khi có thay đổi thông tin quan trọng, hệ thống sẽ tự động đồng bộ bản sao lưu JSON lên Google Drive cá nhân của bạn.
              </p>
            </div>

            <button
              onClick={onSaveData}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Ghi đè & Lưu ngay lập tức</span>
            </button>
          </div>

          {/* Backup & Export/Import Controls */}
          <div className="lg:col-span-2 enterprise-card p-5 space-y-5">
            <div>
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-blue-600" />
                <span>Sao Lưu & Nhập/Xuất Dữ Liệu An Toàn</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Xuất file định dạng JSON tiêu chuẩn để lưu trữ an toàn hoặc chia sẻ giữa các máy tính trong đài/trạm.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export All */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Sao lưu toàn bộ ({allEquipments.length} thiết bị)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tải về một file JSON duy nhất chứa toàn bộ cơ sở dữ liệu hồ sơ kỹ thuật của tất cả thiết bị.
                  </p>
                </div>
                <button
                  onClick={onExportAll}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Toàn Bộ Database</span>
                </button>
              </div>

              {/* Export Current */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Xuất hồ sơ đang chọn</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tải về file JSON riêng của thiết bị: <b>{currentEquipment.general.name}</b> (SN: {currentEquipment.general.serial || 'N/A'}).
                  </p>
                </div>
                <button
                  onClick={onExportCurrent}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Thiết Bị Này</span>
                </button>
              </div>
            </div>

            {/* Import JSON Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>Nhập file sao lưu JSON (Khôi phục / Bổ sung)</span>
                </div>
                {!isAdmin && (
                  <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Cần quyền Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Hệ thống tự động phát hiện file sao lưu chứa 1 thiết bị hoặc toàn bộ danh sách để cập nhật an toàn.
              </p>

              {isAdmin ? (
                <label className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Chọn File JSON từ máy tính để Nhập</span>
                  <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
                </label>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Đăng nhập Admin để mở khóa tính năng Nhập JSON</span>
                </button>
              )}
            </div>

            {/* Danger Zone: Factory Reset & Delete */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Thao tác nhạy cảm (Quản trị viên)</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={onCloneEquipment}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-medium border border-slate-200 transition-all cursor-pointer shadow-xs"
                  title="Nhân bản thiết bị hiện tại"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nhân bản thiết bị</span>
                </button>

                {onOpenTrash && (
                  <button
                    onClick={onOpenTrash}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs"
                    title="Mở Thùng Rác (Phục hồi sổ lý lịch đã xóa trong 30 ngày)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thùng Rác ({trashCount})</span>
                  </button>
                )}

                <button
                  onClick={onDeleteEquipment}
                  disabled={isAdmin && allEquipments.length <= 1}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Chuyển sổ lý lịch thiết bị vào Thùng rác"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa vào Thùng rác</span>
                </button>

                <button
                  onClick={onResetDefaults}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs"
                  title="Khôi phục lại dữ liệu mẫu của hệ thống"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
          <div className="enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản hiện tại</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isAdmin 
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isAdmin ? 'Quản Trị Viên (Admin)' : 'Kỹ Thuật Viên (Mặc định)'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-2">
              <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center border shadow-xs ${
                isAdmin 
                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {isAdmin ? <ShieldCheck className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>
              <div className="font-bold text-slate-900 text-base">{currentUser.displayName}</div>
              <div className="text-xs text-slate-500 font-mono">@{currentUser.username}</div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenLoginModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isAdmin ? 'Chuyển đổi / Quản lý tài khoản' : 'Đăng nhập Quyền Admin'}</span>
              </button>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-2 enterprise-card p-5 space-y-4">
            <div>
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Bảng Phân Quyền Thao Tác (Role Permissions Matrix)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Chi tiết quyền hạn được cấp cho vai trò hiện tại trong ứng dụng Sổ Lý Lịch CNS. Mặc định tài khoản là Người Xem (Viewer) - Chỉ đọc và Quét mã QR.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Tính năng / Quyền hạn</th>
                    <th className="p-3 text-center">Người Xem (Viewer - Mặc định)</th>
                    <th className="p-3 text-center">Quản Trị Viên (Admin)</th>
                    <th className="p-3 text-center">Trạng thái của bạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
                  <tr>
                    <td className="p-3 font-medium">Xem & Tra cứu hồ sơ thiết bị</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Quét mã QR tra cứu thiết bị</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">In sổ A4 & Xuất file JSON/PDF</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className="p-3 text-center text-emerald-600 font-bold">Cho phép</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Thêm thiết bị mới & Chỉnh sửa thông số</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canCreateEquipment ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser.permissions.canCreateEquipment ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Ghi nhật ký bảo dưỡng & sửa chữa</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canEditDetails ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser.permissions.canEditDetails ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Nhân bản thiết bị (Clone)</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canClone ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser.permissions.canClone ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Xóa hồ sơ thiết bị</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canDelete ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser.permissions.canDelete ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Nhập dữ liệu sao lưu JSON</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canImportData ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {currentUser.permissions.canImportData ? 'Cho phép' : 'Khóa'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Khôi phục dữ liệu gốc (Factory Reset)</td>
                    <td className="p-3 text-center text-slate-400 font-mono">--</td>
                    <td className="p-3 text-center text-emerald-600"><CheckCircle2 className="w-4 h-4 mx-auto" /></td>
                    <td className={`p-3 text-center font-bold ${currentUser.permissions.canResetDatabase ? 'text-emerald-600' : 'text-slate-400'}`}>
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
        <div className="enterprise-card p-6">
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
          <div className="enterprise-card p-5 space-y-4">
            <div>
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Cơ Quan Quản Lý Mặc Định</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Các thông tin này sẽ xuất hiện tự động trên Trang Bìa và Quốc hiệu tiêu đề khi in ấn Sổ Lý Lịch chuẩn A4.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên Tổng Công ty / Công ty quản lý:
                </label>
                <input
                  type="text"
                  value={orgCompanyName}
                  onChange={(e) => setOrgCompanyName(e.target.value)}
                  placeholder="CÔNG TY QUẢN LÝ BAY MIỀN NAM"
                  className="form-input-standard font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên Đơn vị kỹ thuật trực tiếp:
                </label>
                <input
                  type="text"
                  value={orgUnitName}
                  onChange={(e) => setOrgUnitName(e.target.value)}
                  placeholder="ĐỘI THÔNG TIN - TRUNG TÂM BẢO ĐẢM KỸ THUẬT"
                  className="form-input-standard font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chức danh duyệt biên bản / Trưởng đơn vị:
                </label>
                <input
                  type="text"
                  value={defaultSupervisor}
                  onChange={(e) => setDefaultSupervisor(e.target.value)}
                  placeholder="Trưởng Trung tâm BĐKT"
                  className="form-input-standard font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveOrgDefaults}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                Lưu làm Mặc định
              </button>
              <button
                onClick={handleApplyOrgToCurrent}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs border border-slate-200 transition-all cursor-pointer"
              >
                Áp dụng cho thiết bị này
              </button>
            </div>
          </div>

          <div className="enterprise-card p-5 space-y-4">
            <div>
              <h2 className="text-slate-900 font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>Tiêu Chuẩn In Ấn Sổ Lý Lịch A4</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Định dạng in ấn tuân thủ thể thức văn bản kỹ thuật quản lý chuyên ngành Hàng không Việt Nam (VATM).
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Khổ giấy tiêu chuẩn:</span>
                <span className="font-bold text-slate-900">A4 (210mm x 297mm) Dọc</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Phông chữ tiêu chuẩn in ấn:</span>
                <span className="font-bold text-slate-900">Times New Roman (12pt - 14pt)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Định dạng xuất:</span>
                <span className="font-bold text-slate-900">In trực tiếp / Xuất PDF sắc nét</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>Trang Bìa có Logo & Quốc hiệu:</span>
                <span className="font-bold text-emerald-700">Đã tích hợp đầy đủ</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('printPreview')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Xem Trước Mẫu In A4 Ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: QR CODE & MOBILE LOOKUP */}
      {activeSubTab === 'qr' && (
        <div className="enterprise-card p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-slate-900 font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Cấu Hình Nhãn Tem & Tra Cứu Mã QR Di Động</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tự động sinh mã QR Vector có logo CNS để dán trực tiếp lên mặt máy, tủ rack trạm kỹ thuật.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('qrCode')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Đi đến Quản lý Mã QR & In Tem Nhãn</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-700">Chế độ 1: Mở PDF trực tiếp</span>
              <p className="text-[11px] text-slate-500">
                Khi kỹ sư quét mã QR bằng camera điện thoại, hệ thống sẽ tự động mở xem ngay toàn bộ file PDF Sổ Lý Lịch của thiết bị.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-700">Chế độ 2: Mở Hồ sơ Điện tử</span>
              <p className="text-[11px] text-slate-500">
                Tự động kích hoạt hồ sơ thiết bị trên ứng dụng Web với đầy đủ 6 mục thông tin, lịch sử bảo dưỡng và linh kiện.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-700">Chế độ 3: Mở Google Docs</span>
              <p className="text-[11px] text-slate-500">
                Chuyển thẳng đến tài liệu Google Docs trực tuyến được lưu trữ tập trung trên Google Drive của đài trạm.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
