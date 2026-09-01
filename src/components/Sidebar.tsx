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
  Cloud
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';

interface SidebarProps {
  equipments: EquipmentData[];
  currentEquipmentId: string;
  activeTab: string;
  onSelectEquipment: (id: string) => void;
  onSelectTab: (tab: string) => void;
  onNewEquipment: () => void;
  onCloneEquipment: () => void;
  onDeleteEquipment: () => void;
  onExportCurrent: () => void;
  onExportAll: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveData: () => void;
  lastSaved: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  equipments,
  currentEquipmentId,
  activeTab,
  onSelectEquipment,
  onSelectTab,
  onNewEquipment,
  onCloneEquipment,
  onDeleteEquipment,
  onExportCurrent,
  onExportAll,
  onImportFile,
  onSaveData,
  lastSaved
}) => {
  const currentEquipment = equipments.find(e => e.id === currentEquipmentId) || equipments[0];

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-4 h-4 text-sky-400" />;
      case 'VIBA': return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'VOICE': return <PhoneCall className="w-4 h-4 text-amber-400" />;
      case 'POWER': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'IT': return <Server className="w-4 h-4 text-indigo-400" />;
      default: return <HardDrive className="w-4 h-4 text-slate-400" />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan & Đơn vị', icon: LayoutDashboard, badge: null },
    { id: 'general', label: '1. Sơ lược & Giấy phép', icon: FileText, badge: currentEquipment?.licenses?.length || 0 },
    { id: 'spec', label: '2. Đặc tính & Cấu hình', icon: Cpu, badge: null },
    { id: 'components', label: '3. Thành phần & Linh kiện', icon: Layers, badge: currentEquipment?.components?.length || 0 },
    { id: 'docs', label: '4. Tài liệu kỹ thuật', icon: BookOpen, badge: currentEquipment?.docs?.length || 0 },
    { id: 'maintenance', label: '5. Lịch sử Bảo dưỡng', icon: Wrench, badge: currentEquipment?.maintenance?.length || 0 },
    { id: 'repair', label: '6. Sửa chữa & Biến động', icon: AlertTriangle, badge: currentEquipment?.repair?.length || 0 },
    { id: 'qrCode', label: 'Mã QR Code Lý Lịch', icon: QrCode, badge: 'QR' },
    { id: 'googleWorkspace', label: 'Google Apps Script & Drive', icon: Cloud, badge: 'GAS' },
    { id: 'printPreview', label: 'Xem & In Sổ Lý Lịch', icon: Printer, badge: 'A4' }
  ];

  return (
    <aside className="w-72 bg-[#060e24] text-slate-100 flex flex-col h-screen sticky top-0 border-r border-[#152a57] shadow-2xl select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#152a57] bg-[#040a1c]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg text-white shadow-md shadow-blue-950/60 ring-1 ring-cyan-400/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
              Sổ Lý Lịch Thiết Bị
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">v2.5</span>
            </div>
            <p className="text-[11px] text-sky-300/70 leading-tight mt-0.5">Sổ Lý Lịch & Vòng Đời Thiết Bị</p>
          </div>
        </div>
      </div>

      {/* Equipment Selector */}
      <div className="p-3 border-b border-[#152a57] bg-[#08132f]">
        <div className="flex items-center justify-between text-xs font-semibold text-sky-200/80 mb-1.5">
          <span className="uppercase tracking-wider text-[10px] text-sky-300 font-bold">Thiết bị đang quản lý ({equipments.length})</span>
          <button
            onClick={onNewEquipment}
            className="p-1 hover:bg-[#10224d] text-sky-400 hover:text-sky-200 rounded transition-colors"
            title="Thêm thiết bị mới"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <select
            id="equipment-select"
            value={currentEquipmentId}
            onChange={(e) => onSelectEquipment(e.target.value)}
            className="w-full bg-[#0d1c42] text-slate-100 text-xs font-medium rounded-lg border border-[#1e3c7a] p-2.5 pr-8 truncate focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all cursor-pointer shadow-inner"
          >
            {equipments.map(eq => (
              <option key={eq.id} value={eq.id} className="bg-[#091533] text-slate-100">
                [{eq.general.category}] {eq.general.name || 'Thiết bị chưa đặt tên'} ({eq.general.assetNo || eq.general.serial || 'No ID'})
              </option>
            ))}
          </select>
        </div>

        {currentEquipment && (
          <div className="mt-2.5 p-2 bg-[#050c1e] rounded-md border border-[#152a57] text-[11px]">
            <div className="flex items-center justify-between text-slate-200">
              <span className="font-semibold flex items-center gap-1.5 truncate">
                {getCategoryIcon(currentEquipment.general.category)}
                <span className="truncate text-slate-100">{currentEquipment.general.model || 'Chưa rõ Model'}</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                currentEquipment.general.status === 'Đang khai thác' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentEquipment.general.status === 'Dự phòng sẵn sàng'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {currentEquipment.general.status}
              </span>
            </div>
            <div className="text-slate-400 mt-1 flex items-center justify-between text-[10px]">
              <span>SN: <span className="font-mono text-sky-200">{currentEquipment.general.serial || '---'}</span></span>
              <span>Asset: <span className="font-mono text-sky-200">{currentEquipment.general.assetNo || '---'}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] font-bold text-sky-300/70 uppercase tracking-wider px-2 pt-2 pb-1">
          Các Mục Sổ Lý Lịch
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-950/80 font-semibold border border-sky-400/40'
                  : 'text-slate-300 hover:bg-[#0e1d44] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-400/70'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#10224d] text-sky-300 border border-[#1e3c7a]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions & Persistence Footer */}
      <div className="p-3 border-t border-[#152a57] bg-[#040a1c] space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onNewEquipment}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-slate-200 rounded border border-[#1e3c7a] text-[11px] transition-colors"
            title="Thêm thiết bị mới"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Thêm mới</span>
          </button>
          <button
            onClick={onCloneEquipment}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-slate-200 rounded border border-[#1e3c7a] text-[11px] transition-colors"
            title="Nhân bản thiết bị hiện tại (Tạo kênh dự phòng)"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhân bản</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onExportCurrent}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0a1738] hover:bg-[#122452] text-slate-300 rounded border border-[#172e5e] text-[11px] transition-colors"
            title="Xuất file JSON của thiết bị này"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Xuất JSON</span>
          </button>
          <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0a1738] hover:bg-[#122452] text-slate-300 rounded border border-[#172e5e] text-[11px] cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
          </label>
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <button
            onClick={onExportAll}
            className="hover:text-sky-300 flex items-center gap-1 transition-colors"
            title="Xuất toàn bộ cơ sở dữ liệu các thiết bị"
          >
            <FolderDown className="w-3 h-3 text-sky-400" />
            <span>Sao lưu tất cả</span>
          </button>
          <button
            onClick={onDeleteEquipment}
            disabled={equipments.length <= 1}
            className="hover:text-red-400 flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-rose-400"
            title="Xóa thiết bị này khỏi danh sách"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa hồ sơ</span>
          </button>
        </div>

        <div className="pt-1.5 border-t border-[#152a57] flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate">Lưu: {lastSaved || 'Tự động'}</span>
          <button
            onClick={onSaveData}
            className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-sky-300 rounded border border-blue-500/40 transition-colors font-semibold"
          >
            Lưu ngay
          </button>
        </div>
      </div>
    </aside>
  );
};
