import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Radio, 
  MapPin, 
  Calendar, 
  Cpu, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  QrCode, 
  Printer, 
  ExternalLink,
  Zap,
  Tag
} from 'lucide-react';
import { EquipmentData } from '../types';

export interface QuickLookupBarProps {
  equipment: EquipmentData;
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onOpenPdfModal?: () => void;
  onOpenQr?: () => void;
}

export const QuickLookupBar: React.FC<QuickLookupBarProps> = ({
  equipment,
  activeTab,
  onNavigateTab,
  onOpenPdfModal,
  onOpenQr
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Đang khai thác':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500 ring-2 ring-emerald-300'
        };
      case 'Dự phòng sẵn sàng':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500 ring-2 ring-blue-300'
        };
      case 'Đang bảo dưỡng/sửa chữa':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 ring-2 ring-amber-300 animate-pulse'
        };
      case 'Tạm ngừng khai thác':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500 ring-2 ring-rose-300'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400'
        };
    }
  };

  const statusStyle = getStatusStyle(equipment.general.status);
  const freqValue = equipment.spec?.channelFreq || equipment.spec?.range;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-5 overflow-hidden transition-all">
      {/* Upper Bar: Quick Copy Badges & Status HUD */}
      <div className="p-3 sm:px-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Status and Name overview */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            <span>{equipment.general.status}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{equipment.org?.location || 'Trạm kỹ thuật'}</span>
            {equipment.org?.unit && (
              <span className="text-slate-500 text-[11px]">({equipment.org.unit})</span>
            )}
          </div>
        </div>

        {/* 1-Click Copy Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Serial */}
          {equipment.general.serial && (
            <button
              onClick={() => handleCopy(equipment.general.serial, 'serial')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer ${
                copiedKey === 'serial'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Nhấp để sao chép số Serial"
            >
              <span className="text-slate-400 font-sans text-[10px]">SN:</span>
              <span className="font-bold">{equipment.general.serial}</span>
              {copiedKey === 'serial' ? (
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}

          {/* Model */}
          {equipment.general.model && (
            <button
              onClick={() => handleCopy(equipment.general.model, 'model')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer ${
                copiedKey === 'model'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Nhấp để sao chép Kiểu loại (Model)"
            >
              <span className="text-slate-400 font-sans text-[10px]">Model:</span>
              <span className="font-semibold">{equipment.general.model}</span>
              {copiedKey === 'model' ? (
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}

          {/* Asset No / Asset Code */}
          {(equipment.general.assetNo || equipment.general.assetCode) && (
            <button
              onClick={() => handleCopy(equipment.general.assetNo || equipment.general.assetCode, 'asset')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer ${
                copiedKey === 'asset'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Nhấp để sao chép Mã Tài Sản"
            >
              <span className="text-slate-400 font-sans text-[10px]">Mã TS:</span>
              <span className="font-bold">{equipment.general.assetNo || equipment.general.assetCode}</span>
              {copiedKey === 'asset' ? (
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}

          {/* Frequency / Specs */}
          {freqValue && (
            <button
              onClick={() => handleCopy(freqValue, 'freq')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border cursor-pointer ${
                copiedKey === 'freq'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Nhấp để sao chép Tần số / Kênh công tác"
            >
              <span className="text-slate-400 font-sans text-[10px]">Freq:</span>
              <span className="font-semibold text-blue-700">{freqValue}</span>
              {copiedKey === 'freq' ? (
                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          )}

          {/* Next Calibration Date Tag */}
          {equipment.general.nextCalDate && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Hạn KĐ: <b>{equipment.general.nextCalDate}</b></span>
            </div>
          )}

          {/* Quick PDF Action */}
          {onOpenPdfModal && (
            <button
              onClick={onOpenPdfModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              title="Xem bản PDF Sổ lý lịch điện tử"
            >
              <ExternalLink className="w-3 h-3 text-red-600" />
              <span>Xem PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
