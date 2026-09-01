import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  Layers, 
  BookOpen, 
  Wrench, 
  AlertTriangle, 
  Printer, 
  QrCode, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Radio, 
  HardDrive, 
  PhoneCall, 
  Zap, 
  Server, 
  Activity,
  FolderDown,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Save,
  RotateCcw,
  Lock,
  UserCheck
} from 'lucide-react';
import { EquipmentData, EquipmentCategory, AppUser } from '../types';

interface SidebarProps {
  equipments: EquipmentData[];
  currentEquipmentId: string;
  activeTab: string;
  currentUser: AppUser;
  onOpenLoginModal: () => void;
  onSelectEquipment: (id: string) => void;
  onSelectTab: (tab: string) => void;
  onNewEquipment: () => void;
  onCloneEquipment: () => void;
  onDeleteEquipment: () => void;
  onExportCurrent: () => void;
  onExportAll: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveData: () => void;
  onResetDefaults?: () => void;
  lastSaved: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  equipments,
  currentEquipmentId,
  activeTab,
  currentUser,
  onOpenLoginModal,
  onSelectEquipment,
  onSelectTab,
  onNewEquipment,
  onCloneEquipment,
  onDeleteEquipment,
  onExportCurrent,
  onExportAll,
  onImportFile,
  onSaveData,
  onResetDefaults,
  lastSaved
}) => {
  const currentEquipment = equipments.find(e => e.id === currentEquipmentId) || equipments[0];
  const isAdmin = currentUser.role === 'admin';

  const handleCloneClick = () => {
    if (!currentUser.permissions.canClone) {
      onOpenLoginModal();
      return;
    }
    onCloneEquipment();
  };

  const handleDeleteClick = () => {
    if (!currentUser.permissions.canDelete) {
      onOpenLoginModal();
      return;
    }
    onDeleteEquipment();
  };

  const handleResetClick = () => {
    if (!currentUser.permissions.canResetDatabase) {
      onOpenLoginModal();
      return;
    }
    if (onResetDefaults) {
      onResetDefaults();
    }
  };


  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-4 h-4 text-sky-400" />;
      case 'VIBA': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'VOICE': return <PhoneCall className="w-4 h-4 text-amber-400" />;
      case 'POWER': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'IT': return <Server className="w-4 h-4 text-indigo-400" />;
      case 'RADAR_ADS': return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'NAV': return <Radio className="w-4 h-4 text-purple-400" />;
      default: return <HardDrive className="w-4 h-4 text-slate-400" />;
    }
  };

  // Structured menu categories
  const menuSections = [
    {
      groupTitle: 'TỔNG QUAN HỆ THỐNG',
      items: [
        { 
          id: 'dashboard', 
          label: 'Tổng quan & Đơn vị', 
          sub: 'Thông tin chung & KPI',
          icon: LayoutDashboard, 
          badge: null 
        }
      ]
    },
    {
      groupTitle: 'CÁC MỤC SỔ LÝ LỊCH (MỤC I - VI)',
      items: [
        { 
          id: 'general', 
          label: 'Mục I: Sơ lược & Pháp lý', 
          sub: 'Giấy phép & Vị trí đặt máy',
          icon: FileText, 
          badge: currentEquipment?.licenses?.length ? `${currentEquipment.licenses.length} GP` : null 
        },
        { 
          id: 'spec', 
          label: 'Mục II: Đặc tính & Cấu hình', 
          sub: 'Dải tần, công suất & IP',
          icon: Cpu, 
          badge: null 
        },
        { 
          id: 'components', 
          label: 'Mục III: Khối & Linh kiện', 
          sub: 'Danh mục module & bo mạch',
          icon: Layers, 
          badge: currentEquipment?.components?.length || 0 
        },
        { 
          id: 'docs', 
          label: 'Mục IV: Tài liệu kỹ thuật', 
          sub: 'Sơ đồ, hướng dẫn & tài liệu',
          icon: BookOpen, 
          badge: currentEquipment?.docs?.length || 0 
        },
        { 
          id: 'maintenance', 
          label: 'Mục V: Lịch sử Bảo dưỡng', 
          sub: 'Nhật ký BD định kỳ',
          icon: Wrench, 
          badge: currentEquipment?.maintenance?.length || 0 
        },
        { 
          id: 'repair', 
          label: 'Mục VI: Sửa chữa & Biến động', 
          sub: 'Sự cố, hỏng hóc & thay thế',
          icon: AlertTriangle, 
          badge: currentEquipment?.repair?.length || 0 
        }
      ]
    },
    {
      groupTitle: 'CÔNG CỤ XUẤT & ĐIỆN TỬ',
      items: [
        { 
          id: 'qrCode', 
          label: 'Mã QR & Tem Nhãn', 
          sub: 'Tra cứu & Mở File PDF / Docs',
          icon: QrCode, 
          badge: 'QR',
          badgeColor: 'bg-sky-500/30 text-sky-200 border-sky-400/40' 
        },
        { 
          id: 'printPreview', 
          label: 'Xem & In Sổ Chuẩn A4', 
          sub: 'Mẫu in có Quốc hiệu & Chữ ký',
          icon: Printer, 
          badge: 'A4',
          badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40' 
        },
        { 
          id: 'googleWorkspace', 
          label: 'Google Docs & Sheets', 
          sub: 'Đồng bộ Apps Script & Drive',
          icon: Cloud, 
          badge: 'GAS',
          badgeColor: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40' 
        }
      ]
    }
  ];

  return (
    <aside className="w-72 bg-[#060e24] text-slate-100 flex flex-col h-screen sticky top-0 border-r border-[#152a57] shadow-2xl select-none z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#152a57] bg-[#040a1c]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 rounded-xl text-white shadow-lg shadow-blue-950/80 ring-1 ring-cyan-400/40">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
              <span>Sổ Lý Lịch Thiết Bị</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                CNS v3.0
              </span>
            </div>
            <p className="text-[11px] text-sky-300/70 leading-tight mt-0.5 font-medium">Đội Thông Tin &bull; Quản lý điện tử</p>
          </div>
        </div>
      </div>

      {/* Equipment Selector Card */}
      <div className="p-3 border-b border-[#152a57] bg-[#08132f] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-sky-200">
          <span className="uppercase tracking-wider text-[10px] text-sky-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            Thiết bị ({equipments.length})
          </span>
          <button
            onClick={onNewEquipment}
            className="flex items-center gap-1 px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            title="Thêm thiết bị mới"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm</span>
          </button>
        </div>

        <div className="relative">
          <select
            id="equipment-select"
            value={currentEquipmentId}
            onChange={(e) => onSelectEquipment(e.target.value)}
            className="w-full bg-[#0d1c42] text-slate-100 text-xs font-semibold rounded-lg border border-[#1e3c7a] p-2 pr-7 truncate focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all cursor-pointer shadow-inner"
          >
            {equipments.map(eq => (
              <option key={eq.id} value={eq.id} className="bg-[#091533] text-slate-100">
                [{eq.general.category}] {eq.general.name || 'Thiết bị'} ({eq.general.serial || eq.id})
              </option>
            ))}
          </select>
        </div>

        {currentEquipment && (
          <div className="p-2.5 bg-[#050c1e] rounded-lg border border-[#152a57] text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 truncate text-white">
                {getCategoryIcon(currentEquipment.general.category)}
                <span className="truncate">{currentEquipment.general.model || 'Model N/A'}</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold shrink-0 ${
                currentEquipment.general.status === 'Đang khai thác' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentEquipment.general.status === 'Dự phòng sẵn sàng'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {currentEquipment.general.status}
              </span>
            </div>
            <div className="text-slate-400 flex items-center justify-between text-[10px] pt-0.5">
              <span>SN: <b className="font-mono text-sky-200">{currentEquipment.general.serial || '---'}</b></span>
              <span>TS: <b className="font-mono text-sky-200">{currentEquipment.general.assetNo || '---'}</b></span>
            </div>
          </div>
        )}
      </div>

      {/* Structured Categorized Menu Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="text-[10px] font-extrabold text-sky-400/70 uppercase tracking-wider px-2 pt-1 pb-0.5 flex items-center justify-between">
              <span>{section.groupTitle}</span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-sky-500 text-white shadow-md shadow-blue-950/80 font-bold border border-sky-400/40'
                        : 'text-slate-300 hover:bg-[#0e1d44] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#0a1533] text-sky-400 group-hover:bg-[#12224d]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold leading-tight">{item.label}</div>
                        <div className={`text-[10px] truncate leading-tight mt-0.5 ${
                          isActive ? 'text-sky-100/90' : 'text-slate-400 group-hover:text-slate-300'
                        }`}>
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    {item.badge !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1.5 border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-[#0f214d] text-sky-300 border-[#1e3c7a]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions & Persistence Footer */}
      <div className="p-3 border-t border-[#152a57] bg-[#040a1c] space-y-2 text-xs">
        {/* User Role Indicator Bar */}
        <div 
          onClick={onOpenLoginModal}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
            isAdmin 
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/50' 
              : 'bg-sky-950/40 border-sky-500/40 text-sky-200 hover:bg-sky-900/50'
          }`}
          title="Nhấn để đăng nhập / chuyển đổi quyền quản trị"
        >
          <div className="flex items-center gap-1.5 truncate">
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}
            <span className="truncate text-[11px] font-bold">
              {isAdmin ? 'Admin: Toàn quyền' : 'KTV: Xem & Thêm mới'}
            </span>
          </div>
          <span className="text-[10px] underline font-semibold text-slate-300">
            {isAdmin ? 'Đổi' : 'Đăng nhập'}
          </span>
        </div>

        {/* Row 1: Fast Operations */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={handleCloneClick}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg border border-[#1e3c7a] text-[11px] font-semibold transition-colors cursor-pointer"
            title={isAdmin ? "Nhân bản thiết bị hiện tại" : "Cần quyền Admin để nhân bản"}
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhân bản</span>
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isAdmin && equipments.length <= 1}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#1a0f1d] hover:bg-[#2b142f] text-rose-300 rounded-lg border border-rose-900/50 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={isAdmin ? "Xóa hồ sơ thiết bị này" : "Cần quyền Admin để xóa"}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa hồ sơ</span>
            {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
          </button>
        </div>

        {/* Row 2: Backup & Restore */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onExportCurrent}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0a1738] hover:bg-[#122452] text-slate-300 rounded-lg border border-[#172e5e] text-[11px] font-medium transition-colors cursor-pointer"
            title="Xuất file JSON của thiết bị này"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Xuất JSON</span>
          </button>
          {isAdmin ? (
            <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0a1738] hover:bg-[#122452] text-slate-300 rounded-lg border border-[#172e5e] text-[11px] font-medium cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhập JSON</span>
              <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
            </label>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0a1738] hover:bg-[#122452] text-slate-300 rounded-lg border border-[#172e5e] text-[11px] font-medium cursor-pointer transition-colors"
              title="Đăng nhập Admin để nhập file JSON"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhập JSON</span>
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Row 3: All Backup & Reset */}
        <div className="flex items-center justify-between pt-1 text-[10.5px] text-slate-400">
          <button
            onClick={onExportAll}
            className="hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer font-medium"
            title="Xuất toàn bộ cơ sở dữ liệu các thiết bị"
          >
            <FolderDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Sao lưu ({equipments.length})</span>
          </button>
          {onResetDefaults && (
            <button
              onClick={handleResetClick}
              className="hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              title={isAdmin ? "Khôi phục dữ liệu mẫu ban đầu" : "Cần quyền Admin để khôi phục dữ liệu gốc"}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Dữ liệu gốc</span>
              {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
            </button>
          )}
        </div>

        {/* Save Status & Action */}
        <div className="pt-2 border-t border-[#152a57] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 truncate text-[10px]">
            {lastSaved || 'Tự động lưu'}
          </span>
          <button
            onClick={onSaveData}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors font-bold text-xs shadow-sm cursor-pointer"
          >
            <Save className="w-3 h-3" />
            <span>Lưu ngay</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

