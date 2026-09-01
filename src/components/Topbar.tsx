import React from 'react';
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
  Cloud
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';

interface TopbarProps {
  currentEquipment: EquipmentData;
  onSaveData: () => void;
  onShowPrint: () => void;
  onPrintDirect: () => void;
  onOpenQr?: () => void;
  onOpenGas?: () => void;
  onResetDefaults: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentEquipment,
  onSaveData,
  onShowPrint,
  onPrintDirect,
  onOpenQr,
  onOpenGas,
  onResetDefaults,
  searchTerm,
  onSearchChange
}) => {
  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-5 h-5 text-sky-600" />;
      case 'VIBA': return <Activity className="w-5 h-5 text-emerald-600" />;
      case 'VOICE': return <PhoneCall className="w-5 h-5 text-amber-600" />;
      case 'POWER': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'IT': return <Server className="w-5 h-5 text-indigo-600" />;
      default: return <HardDrive className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đang khai thác':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Dự phòng sẵn sàng':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Đang bảo dưỡng/sửa chữa':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Tạm ngừng khai thác':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-[#08132f] border-b border-[#162d5a] px-6 py-3.5 sticky top-0 z-10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Title & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 bg-[#0d1f4a] rounded-xl border border-[#1e3c7a] shrink-0 shadow-inner">
          {getCategoryIcon(currentEquipment.general.category)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white truncate">
              {currentEquipment.general.name || 'Hồ sơ Thiết bị Kỹ thuật CNS'}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(currentEquipment.general.status)}`}>
              {currentEquipment.general.status}
            </span>
            {currentEquipment.general.priority && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#0f214f] text-sky-300 border border-[#204285]">
                {currentEquipment.general.priority}
              </span>
            )}
          </div>
          <p className="text-xs text-sky-200/70 flex items-center gap-3 mt-0.5 flex-wrap">
            <span>Model: <b className="text-white">{currentEquipment.general.model || 'N/A'}</b></span>
            <span className="text-blue-400/40">•</span>
            <span>Hãng SX: <b className="text-white">{currentEquipment.general.manufacturer || 'N/A'}</b></span>
            <span className="text-blue-400/40">•</span>
            <span>Serial: <span className="font-mono text-sky-300 font-semibold">{currentEquipment.general.serial || 'N/A'}</span></span>
            <span className="text-blue-400/40">•</span>
            <span>Mã TS: <span className="font-mono text-sky-300 font-semibold">{currentEquipment.general.assetNo || 'N/A'}</span></span>
          </p>
        </div>
      </div>

      {/* Global Filter / Search & Quick Buttons */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60" />
          <input
            type="text"
            placeholder="Tìm nhanh trường dữ liệu..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg w-44 focus:w-60 focus:bg-[#0c1a3b] text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
          />
        </div>

        {onOpenQr && (
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-700 to-sky-700 hover:from-blue-600 hover:to-sky-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-950/50 transition-all cursor-pointer border border-sky-400/40"
            title="Quản lý mã QR Code định danh cuốn sổ lý lịch này"
          >
            <QrCode className="w-4 h-4 text-sky-200" />
            <span>Mã QR Lý Lịch</span>
          </button>
        )}

        {onOpenGas && (
          <button
            onClick={onOpenGas}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer border border-[#1e3c7a]"
            title="Đồng bộ Google Sheets & Drive qua Apps Script"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Google Apps Script</span>
          </button>
        )}

        <button
          onClick={onSaveData}
          className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-sky-950/60 transition-colors cursor-pointer"
          title="Lưu tất cả dữ liệu vào bộ nhớ hệ thống"
        >
          <Save className="w-4 h-4" />
          <span>Lưu hồ sơ</span>
        </button>

        <button
          onClick={onShowPrint}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0e1d44] hover:bg-[#162d66] text-slate-200 border border-[#1e3c7a] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="Xem trước mẫu sổ lý lịch chuẩn A4"
        >
          <FileCheck className="w-4 h-4 text-sky-400" />
          <span>Xem bản in</span>
        </button>

        <button
          onClick={onPrintDirect}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#040919] hover:bg-[#0a1533] text-white rounded-lg text-xs font-semibold shadow-md border border-[#1e3c7a] transition-colors cursor-pointer"
          title="Mở hộp thoại In / Xuất PDF"
        >
          <Printer className="w-4 h-4 text-sky-400" />
          <span>In / Xuất PDF</span>
        </button>
      </div>
    </header>
  );
};
