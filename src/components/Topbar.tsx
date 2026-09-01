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
  Cloud,
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';

interface TopbarProps {
  currentEquipment: EquipmentData;
  onSaveData: () => void;
  onShowPrint: () => void;
  onPrintDirect: () => void;
  onOpenQr?: () => void;
  onOpenGas?: () => void;
  onOpenPdfModal?: () => void;
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
  onOpenPdfModal,
  onResetDefaults,
  searchTerm,
  onSearchChange
}) => {
  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-5 h-5 text-sky-400" />;
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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Dự phòng sẵn sàng':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'Đang bảo dưỡng/sửa chữa':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Tạm ngừng khai thác':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <header className="bg-[#08132f] border-b border-[#162d5a] px-5 py-3 sticky top-0 z-10 shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0">
      {/* Left: Current Equipment Profile Badge */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2.5 bg-[#0d1f4a] rounded-xl border border-[#1e3c7a] shrink-0 shadow-inner">
          {getCategoryIcon(currentEquipment.general.category)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-extrabold text-white truncate tracking-tight">
              {currentEquipment.general.name || 'Hồ sơ Thiết bị Kỹ thuật'}
            </h1>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadge(currentEquipment.general.status)}`}>
              {currentEquipment.general.status}
            </span>
            {currentEquipment.general.priority && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#0f214f] text-sky-300 border border-[#204285]">
                {currentEquipment.general.priority}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-sky-200/75 flex items-center gap-2.5 mt-0.5 flex-wrap">
            <span>Model: <b className="text-white font-semibold">{currentEquipment.general.model || 'N/A'}</b></span>
            <span className="text-sky-500/40">•</span>
            <span>Hãng SX: <b className="text-white font-semibold">{currentEquipment.general.manufacturer || 'N/A'}</b></span>
            <span className="text-sky-500/40">•</span>
            <span>Serial: <b className="font-mono text-sky-300 font-bold">{currentEquipment.general.serial || 'N/A'}</b></span>
            <span className="text-sky-500/40">•</span>
            <span>Mã TS: <b className="font-mono text-sky-300 font-bold">{currentEquipment.general.assetNo || 'N/A'}</b></span>
          </div>
        </div>
      </div>

      {/* Right: Organized Action Clusters */}
      <div className="flex items-center gap-2 flex-wrap xl:justify-end">
        {/* Search Field */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60" />
          <input
            type="text"
            placeholder="Tìm kiếm mục sổ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg w-40 focus:w-56 focus:bg-[#0c1a3b] text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-inner"
          />
        </div>

        {/* Group A: Electronic & Document Outputs */}
        <div className="flex items-center gap-1.5 bg-[#050d22] p-1 rounded-xl border border-[#162d5a]">
          {onOpenQr && (
            <button
              onClick={onOpenQr}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-700 via-sky-600 to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950/60 transition-all cursor-pointer border border-sky-400/40"
              title="Quản lý mã QR Code tra cứu & in tem định danh thiết bị"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-100" />
              <span>Mã QR Lý Lịch</span>
            </button>
          )}

          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1f48] hover:bg-[#16306e] text-sky-200 hover:text-white rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
              title="Xem trực tiếp bản PDF Sổ lý lịch chuẩn mẫu A4"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Xem PDF</span>
            </button>
          )}

          <a
            href={currentEquipment.googleDocUrl || `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (currentEquipment.general.name || currentEquipment.id))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#082218] hover:bg-[#0c3324] text-emerald-300 hover:text-emerald-100 rounded-lg text-xs font-semibold border border-emerald-600/40 transition-all cursor-pointer"
            title="Mở tài liệu Google Docs trực tuyến"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Docs</span>
          </a>

          <button
            onClick={onShowPrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-slate-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            title="Xem trước định dạng in A4"
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Mẫu In</span>
          </button>

          <button
            onClick={onPrintDirect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#091433] hover:bg-[#102252] text-white rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            title="In sổ hoặc Lưu dưới dạng PDF (Ctrl + P)"
          >
            <Printer className="w-3.5 h-3.5 text-sky-300" />
            <span>In A4</span>
          </button>
        </div>

        {/* Group B: System & Synchronization */}
        <div className="flex items-center gap-1.5">
          {onOpenGas && (
            <button
              onClick={onOpenGas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
              title="Đồng bộ Google Sheets & Drive qua Apps Script"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Apps Script</span>
            </button>
          )}

          <button
            onClick={onSaveData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-950/60 transition-colors cursor-pointer"
            title="Lưu tất cả thay đổi vào cơ sở dữ liệu"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu hồ sơ</span>
          </button>
        </div>
      </div>
    </header>
  );
};

