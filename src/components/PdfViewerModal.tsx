import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Copy,
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

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentData;
  onShowToast: (msg: string) => void;
  onOpenGoogleDoc?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onShowToast,
  onOpenGoogleDoc
}) => {
  const [zoom, setZoom] = useState<number>(85);
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<string>('');
  const docPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !equipment) return;
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
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const { googleDocUrl, pdfViewerUrl } = buildEquipmentQrData(equipment);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!docPrintRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfExportProgress('Đang chuẩn bị các trang...');
    try {
      const rawName = equipment.general?.name || equipment.id;
      const safeName = rawName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
      const filename = `So_Ly_Lich_${safeName}_${paperSize}.pdf`;

      await pdfExportService.exportElementToPdf(docPrintRef.current, {
        filename,
        orientation: 'portrait',
        paperSize,
        marginMm: 0,
        onProgress: (current, total) => {
          setPdfExportProgress(`Đang tạo trang ${current}/${total}...`);
        }
      });
      onShowToast(`✓ Đã tải file PDF Sổ lý lịch (${paperSize}) thành công!`);
    } catch (err: any) {
      console.error('Lỗi xuất PDF:', err);
      onShowToast('⚠️ Đang mở hộp thoại in trình duyệt để lưu file PDF...');
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
<title>Sổ Lý Lịch Thiết Bị - ${equipment.general.name || equipment.id} (${paperSize})</title>
<style>
@page { size: ${paperSize === 'A5' ? 'A5 portrait' : 'A4 portrait'}; margin: 0; }
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
  width: ${paperSize === 'A5' ? '148mm' : '210mm'}; 
  min-height: ${paperSize === 'A5' ? '210mm' : '297mm'}; 
  height: ${paperSize === 'A5' ? '210mm' : '297mm'};
  padding: ${paperSize === 'A5' ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm'}; 
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
.pdf-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: ${paperSize === 'A5' ? '8pt' : '11pt'}; }
.pdf-table th, .pdf-table td { border: 1px solid #000; padding: ${paperSize === 'A5' ? '3px 4px' : '6px 8px'}; vertical-align: middle; }
.pdf-table th { background: #dfe1e2; font-weight: bold; text-align: center; text-transform: uppercase; }
.page-num { text-align: center; font-size: ${paperSize === 'A5' ? '9pt' : '12pt'}; margin-top: auto; padding-top: 6mm; font-weight: normal; }
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
    a.download = `So_Ly_Lich_${(equipment.general.name || equipment.id).replace(/\W/g, '_')}_${paperSize}.html`;
    a.click();
    onShowToast(`✓ Đã tải tệp tài liệu Sổ lý lịch (Chuẩn ${paperSize}) thành công!`);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Xem File PDF Sổ Lý Lịch Thiết Bị</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold border border-emerald-400/40 uppercase">
                Chuẩn Form 100% Scan
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {g.name} &bull; Model: <b>{g.model || 'N/A'}</b> &bull; Serial: <span className="font-mono text-blue-400 font-bold">{g.serial || 'N/A'}</span> &bull; Mã TS: <span className="font-mono text-blue-400">{g.assetNo || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Paper Size Selector (A4 vs A5) */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 p-1 text-xs">
            <span className="text-[11px] text-slate-400 font-medium px-1">Khổ in:</span>
            <button
              onClick={() => setPaperSize('A4')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                paperSize === 'A4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Khổ giấy tiêu chuẩn A4 (210 × 297 mm)"
            >
              A4
            </button>
            <button
              onClick={() => setPaperSize('A5')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                paperSize === 'A5' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Khổ giấy A5 (148 × 210 mm) - Sổ tay công tác chuẩn form"
            >
              A5
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg border border-slate-700 p-1 text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 10, 50))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-200 font-bold">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 10, 150))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={googleDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-300 hover:text-emerald-100 rounded-lg text-xs font-semibold border border-emerald-700/50 transition-all cursor-pointer"
            title="Mở tài liệu Google Docs trực tuyến"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Docs</span>
          </a>

          <button
            onClick={handleCopyPdfLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Sao chép link xem PDF trực tuyến"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Đã sao chép!' : 'Copy Link PDF'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
            title={`Tải sổ lý lịch dưới dạng tệp tin PDF (.pdf) chuẩn ${paperSize}`}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>{pdfExportProgress || 'Đang tạo PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Tải File PDF ({paperSize})</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPdfHtml}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title={`Tải về file HTML Sổ chuẩn ${paperSize}`}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Tải HTML</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Mở hộp thoại in hoặc lưu PDF trình duyệt"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In ({paperSize})</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded-lg border border-slate-700 transition-colors ml-1 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main PDF Viewport with zoom */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-900/90">
        <div 
          ref={docPrintRef}
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif'
          }}
          className="transition-transform duration-150 ease-out text-black space-y-8 select-text"
        >
          <EquipmentLogbookPrintPages
            equipment={equipment}
            coverQrUrl={qrUrl}
            itemsPerPageMaint={paperSize === 'A5' ? 4 : 7}
            keyPrefix="modal-pdf"
            paperSize={paperSize}
          />
        </div>
      </div>
    </div>
  );
};
