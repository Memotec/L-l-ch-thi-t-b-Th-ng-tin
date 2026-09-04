import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Printer, 
  Download, 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Copy,
  Maximize2,
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  QrCode,
  ShieldCheck,
  Share2,
  Loader2
} from 'lucide-react';
import { 
  EquipmentData, 
  ComponentRow, 
  DocRow, 
  MaintenanceRow, 
  RepairRow, 
  OrgTransferRow,
  SimpleLicenseRow 
} from '../types';
import { generateEquipmentQrDataUrl, buildEquipmentQrData } from '../utils/qrCodeService';
import { pdfExportService } from '../utils/pdfExportService';
import { EquipmentLogbookPrintPages } from './EquipmentLogbookPrintPages';

interface FullScreenPdfViewerProps {
  equipment: EquipmentData;
  allEquipments?: EquipmentData[];
  onSelectEquipment?: (id: string) => void;
  onExitToAdmin?: () => void;
  onShowToast: (msg: string) => void;
}

export const FullScreenPdfViewer: React.FC<FullScreenPdfViewerProps> = ({
  equipment,
  allEquipments,
  onSelectEquipment,
  onExitToAdmin,
  onShowToast
}) => {
  // Compute initial zoom based on screen width for mobile auto-fit
  const getOptimalZoom = useCallback(() => {
    if (typeof window === 'undefined') return 85;
    const width = window.innerWidth;
    if (width < 500) {
      // Mobile screen: ~360px - 450px -> fit 794px A4 (210mm)
      return Math.min(Math.max(Math.floor((width - 32) / 7.94), 40), 60);
    } else if (width < 800) {
      // Tablet screen
      return Math.min(Math.floor((width - 48) / 7.94), 85);
    } else if (width < 1200) {
      return 85;
    } else {
      return 100;
    }
  }, []);

  const [zoom, setZoom] = useState<number>(getOptimalZoom);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<string>('');
  const docPrintRef = useRef<HTMLDivElement>(null);

  // Auto-adjust zoom on window resize
  useEffect(() => {
    const handleResize = () => {
      // only auto-adjust if on mobile
      if (window.innerWidth < 640) {
        setZoom(getOptimalZoom());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getOptimalZoom]);

  // Generate QR for embedding in PDF Page 1
  useEffect(() => {
    if (!equipment) return;
    let isMounted = true;
    generateEquipmentQrDataUrl(equipment, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
      targetMode: 'pdf'
    }).then(url => {
      if (isMounted) setQrUrl(url);
    });
    return () => { isMounted = false; };
  }, [equipment]);

  const { googleDocUrl, pdfViewerUrl } = buildEquipmentQrData(equipment);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!docPrintRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfExportProgress('Đang chuẩn bị trang...');
    try {
      const rawName = equipment.general?.name || equipment.id;
      const safeName = rawName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
      const filename = `So_Ly_Lich_${safeName}.pdf`;

      await pdfExportService.exportElementToPdf(docPrintRef.current, {
        filename,
        orientation: 'portrait',
        marginMm: 0,
        onProgress: (current, total) => {
          setPdfExportProgress(`Đang tạo trang ${current}/${total}...`);
        }
      });
      onShowToast('✓ Đã tải file PDF Sổ lý lịch thành công!');
    } catch (err: any) {
      console.error('Lỗi xuất PDF:', err);
      onShowToast('⚠️ Đang mở hộp thoại in trình duyệt để lưu PDF...');
      window.print();
    } finally {
      setIsExportingPdf(false);
      setPdfExportProgress('');
    }
  };

  const handleCopyPdfLink = () => {
    navigator.clipboard.writeText(pdfViewerUrl);
    setCopiedLink(true);
    onShowToast('✓ Đã sao chép liên kết xem trực tiếp PDF Sổ lý lịch!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPdfHtml = () => {
    if (!docPrintRef.current) return;
    const content = docPrintRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Sổ Lý Lịch Thiết Bị - ${equipment.general?.name || equipment.id}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body { 
  margin: 0; 
  padding: 0; 
  font-family: "Times New Roman", Times, "Liberation Serif", serif; 
  color: #000; 
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page-sheet { 
  width: 210mm; 
  min-height: 297mm; 
  height: 297mm;
  padding: 14mm 15mm 12mm 18mm; 
  margin: 0 auto; 
  page-break-after: always; 
  page-break-inside: avoid;
  position: relative; 
  background: #fff; 
  display: flex;
  flex-direction: column;
}
.page-sheet:last-child {
  page-break-after: auto;
}
.pdf-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 11pt; }
.pdf-table th, .pdf-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
.pdf-table th { background: #f8fafc; font-weight: bold; text-align: center; text-transform: uppercase; }
.page-num { text-align: center; font-size: 12pt; margin-top: auto; padding-top: 6mm; font-weight: normal; }
</style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_Ly_Lich_${(equipment.general?.name || equipment.id).replace(/\W/g, '_')}.html`;
    a.click();
    onShowToast('✓ Đã tải tệp tài liệu Sổ lý lịch (Chuẩn A4) thành công!');
  };

  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const s = equipment.spec || ({} as any);

  const companyName = o.companyName || (typeof window !== 'undefined' ? localStorage.getItem('cns_default_company_name') || '' : '');
  const coverNote = o.coverNote || '';

  function padList<T>(arr: T[] | undefined, targetLength: number): (T | null)[] {
    const safeArr = arr || [];
    const result: (T | null)[] = [...safeArr];
    while (result.length < targetLength) {
      result.push(null);
    }
    return result;
  }

  const maxLicenses = Math.max(
    (equipment.freqLicenses || []).length, 
    (equipment.exploitLicenses || []).length, 
    10
  );
  const paddedFreq = padList<SimpleLicenseRow>(equipment.freqLicenses, maxLicenses);
  const paddedExploit = padList<SimpleLicenseRow>(equipment.exploitLicenses, maxLicenses);

  // Group Maintenance into Pages of 7 rows
  const itemsPerPageMaint = 7;
  const maintList = equipment.maintenance || [];
  const maintPages: MaintenanceRow[][] = [];
  if (maintList.length === 0) {
    maintPages.push([]);
  } else {
    for (let i = 0; i < maintList.length; i += itemsPerPageMaint) {
      maintPages.push(maintList.slice(i, i + itemsPerPageMaint));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060b18] text-slate-100 overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* SLICK FULLSCREEN CONTROL HEADER */}
      {/* ========================================================================= */}
      <header className="no-print bg-[#08132f]/95 backdrop-blur-md border-b border-[#182d5a] px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xl z-20">
        {/* Left: Identification Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="p-2 bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 rounded-xl border border-sky-400/30 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-xs sm:text-sm text-white truncate max-w-[180px] sm:max-w-md">
                {g.name || 'Sổ Lý Lịch Thiết Bị CNS'}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold border border-emerald-400/40 uppercase shrink-0">
                Chuẩn A4 Toàn Màn Hình
              </span>
            </div>
            <p className="text-[11px] text-sky-200/70 truncate">
              Model: <b className="text-white">{g.model || 'N/A'}</b> &bull; SN: <span className="font-mono text-sky-300 font-bold">{g.serial || 'N/A'}</span> &bull; Mã TS: <span className="font-mono text-sky-300">{g.assetNo || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#050c1e] rounded-xl border border-[#1e3c7a] p-0.5 sm:p-1 text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 10, 35))}
              className="p-1 sm:p-1.5 hover:bg-[#10224d] rounded text-slate-300 hover:text-white transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(getOptimalZoom())}
              className="px-1.5 sm:px-2 font-mono text-[11px] text-sky-200 font-bold hover:text-white"
              title="Nhấp để vừa màn hình"
            >
              {zoom}%
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 10, 160))}
              className="p-1 sm:p-1.5 hover:bg-[#10224d] rounded text-slate-300 hover:text-white transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Google Docs link if available */}
          {googleDocUrl && (
            <a
              href={googleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#082218] hover:bg-[#0c3324] text-emerald-300 hover:text-emerald-100 rounded-lg text-xs font-semibold border border-emerald-600/40 transition-all cursor-pointer"
              title="Mở tài liệu Google Docs trực tuyến"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Docs</span>
            </a>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopyPdfLink}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
            title="Sao chép link xem PDF trực tuyến"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{copiedLink ? 'Đã sao chép!' : 'Copy Link PDF'}</span>
          </button>

          {/* Direct PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-md border border-emerald-400/40 transition-all cursor-pointer"
            title="Tải sổ lý lịch trực tiếp dưới dạng tệp tin PDF (.pdf) về máy tính"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>{pdfExportProgress || 'Đang tạo PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Tải File PDF Chuẩn Form (.pdf)</span>
              </>
            )}
          </button>

          {/* Download HTML */}
          <button
            onClick={handleDownloadPdfHtml}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
            title="Tải về file HTML Sổ chuẩn A4"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Tải HTML</span>
          </button>

          {/* Primary Print / Save as PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-lg border border-sky-400/40 transition-all cursor-pointer"
            title="In ấn hoặc Lưu thành PDF chuẩn A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In A4</span>
          </button>

          {/* Switch to Full Management Dashboard */}
          {onExitToAdmin && (
            <button
              onClick={onExitToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-600 transition-all cursor-pointer ml-1"
              title="Truy cập Bảng điều khiển quản lý CNS Multi-Manager"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Vào Hệ thống Quản trị</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN FULLSCREEN PDF SCROLL VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-auto p-2 sm:p-6 lg:p-8 flex justify-center bg-[#040817] custom-scrollbar">
        <div 
          ref={docPrintRef}
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif'
          }}
          className="transition-transform duration-150 ease-out text-black space-y-8 select-text pb-16"
        >
          {/* ========================================================================= */}
          <EquipmentLogbookPrintPages
            equipment={equipment}
            coverQrUrl={qrUrl}
            itemsPerPageMaint={7}
            keyPrefix="fullscreen-pdf"
          />
        </div>
      </div>
    </div>
  );
};
