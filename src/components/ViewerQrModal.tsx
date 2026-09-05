import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Radio, 
  FileText, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { EquipmentData } from '../types';
import { generateEquipmentQrDataUrl, buildEquipmentQrData } from '../utils/qrCodeService';

interface ViewerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentData | null;
  onOpenPdf: (eq: EquipmentData) => void;
}

export const ViewerQrModal: React.FC<ViewerQrModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onOpenPdf
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!equipment) return;
    let isMounted = true;
    generateEquipmentQrDataUrl(equipment, {
      width: 320,
      margin: 1,
      targetMode: 'pdf'
    }).then(url => {
      if (isMounted) setQrUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  const g = equipment.general;
  const o = equipment.org || ({} as any);
  const qrData = buildEquipmentQrData(equipment, undefined, 'pdf');

  const handleCopySummary = () => {
    navigator.clipboard.writeText(qrData.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${(g.serial || equipment.id).replace(/\W/g, '_')}.png`;
    a.click();
  };

  const handlePrintDecal = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Mã QR Định Danh & Tem Nhãn</h3>
              <p className="text-[11px] text-slate-400">Tra cứu nhanh hồ sơ thiết bị CNS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Decal Card */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div 
            ref={printRef}
            className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm space-y-3 text-center"
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              ĐỘI THÔNG TIN - TT BẢO ĐẢM KỸ THUẬT
            </div>

            <div className="text-base font-black text-slate-900 leading-snug">
              {g.name}
            </div>

            {/* QR Image */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 inline-block mx-auto shadow-inner">
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt={`QR Code ${g.name}`}
                  className="w-48 h-48 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Đang khởi tạo mã QR...
                </div>
              )}
            </div>

            {/* Decal Specifications */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Model:</span>
                <span className="font-bold text-slate-800 truncate block">{g.model || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Serial (SN):</span>
                <span className="font-mono font-bold text-slate-900 truncate block">{g.serial || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Mã Tài Sản:</span>
                <span className="font-mono font-medium text-slate-800 truncate block">{g.assetNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Đơn vị:</span>
                <span className="font-medium text-slate-800 truncate block">{o.unit || 'Đội TT'}</span>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-400 italic">
              Quét mã QR bằng Camera điện thoại để mở nhanh Sổ lý lịch điện tử & Bản PDF A4.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Ảnh QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenPdf(equipment);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Xem Bản PDF A4</span>
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(qrData.pdfViewerUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{copied ? '✓ Đã sao chép Link mở PDF!' : 'Sao Chép Link Mở Trực Tiếp File PDF (Không cần đăng nhập)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Sao chép tóm tắt thông số thiết bị</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
