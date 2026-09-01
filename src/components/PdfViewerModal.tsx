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
  Copy
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
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
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
<title>Sổ Lý Lịch Thiết Bị - ${equipment.general.name || equipment.id}</title>
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
    a.download = `So_Ly_Lich_${(equipment.general.name || equipment.id).replace(/\W/g, '_')}.html`;
    a.click();
    onShowToast('✓ Đã tải tệp tài liệu Sổ lý lịch (Chuẩn A4) thành công!');
  };

  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const s = equipment.spec || ({} as any);

  const companyName = o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM';
  const coverNote = o.coverNote || '120.9 TxM';

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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-[#08132f] border-b border-[#182d5a] px-5 py-3 flex items-center justify-between text-white shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Xem File PDF Sổ Lý Lịch Thiết Bị</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold border border-emerald-400/40 uppercase">
                Chuẩn Form 100% Scan
              </span>
            </div>
            <p className="text-xs text-sky-200/70">
              {g.name} &bull; Model: <b>{g.model || 'N/A'}</b> &bull; Serial: <span className="font-mono text-sky-300 font-bold">{g.serial || 'N/A'}</span> &bull; Mã TS: <span className="font-mono text-sky-300">{g.assetNo || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-[#050c1e] rounded-xl border border-[#1e3c7a] p-1 text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 10, 50))}
              className="p-1.5 hover:bg-[#10224d] rounded text-slate-300 hover:text-white transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-sky-200 font-bold">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 10, 150))}
              className="p-1.5 hover:bg-[#10224d] rounded text-slate-300 hover:text-white transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={googleDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#082218] hover:bg-[#0c3324] text-emerald-300 hover:text-emerald-100 rounded-lg text-xs font-semibold border border-emerald-600/40 transition-all cursor-pointer"
            title="Mở tài liệu Google Docs trực tuyến"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Docs</span>
          </a>

          <button
            onClick={handleCopyPdfLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
            title="Sao chép link xem PDF trực tuyến"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Đã sao chép!' : 'Copy Link PDF'}</span>
          </button>

          <button
            onClick={handleDownloadPdfHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-all cursor-pointer"
            title="Tải về file HTML Sổ chuẩn A4"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Tải File</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold shadow-md border border-sky-400/40 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In A4 (Ctrl+P)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#0e1d44] hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded-lg border border-[#1e3c7a] transition-colors ml-1 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main PDF Viewport with zoom */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#040817]">
        <div 
          ref={docPrintRef}
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif'
          }}
          className="transition-transform duration-150 ease-out text-black space-y-8 select-text"
        >
          {/* ========================================================================= */}
          {/* TRANG 1: BÌA SỔ LÝ LỊCH (EXACT SCAN PAGE 1) */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div 
              className="h-full flex flex-col justify-between"
              style={{
                border: '3.5px double #000',
                padding: '14mm 12mm 12mm',
                minHeight: '271mm'
              }}
            >
              {/* Top Unit */}
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-full text-center">
                    <h1 
                      className="text-xl font-bold uppercase tracking-wider text-black"
                      style={{ fontSize: '15pt', lineHeight: 1.4 }}
                    >
                      {companyName}
                    </h1>
                  </div>
                  {coverNote && (
                    <div className="absolute right-8 top-8 text-right font-semibold text-xs text-black opacity-80">
                      {coverNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Title Center */}
              <div className="text-center my-auto space-y-8">
                <div 
                  className="font-bold uppercase tracking-widest text-black"
                  style={{ fontSize: '28pt', letterSpacing: '3px' }}
                >
                  LÝ LỊCH THIẾT BỊ
                </div>

                <div className="w-3/4 mx-auto border-b border-dotted border-black pt-4"></div>

                <div className="w-4/5 mx-auto text-left space-y-4 pt-4 text-base" style={{ fontSize: '13pt' }}>
                  <div className="flex items-baseline">
                    <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                    <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                      {g.name || 'VHF PARK AIR T6T'}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                    <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                      {g.manufacturer || 'PARK AIR'}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-semibold whitespace-nowrap">Số hiệu:</span>
                    <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                      {g.model || 'T6T'}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-semibold whitespace-nowrap">Mã số:</span>
                    <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                      {g.serial || '6U11654'}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-semibold whitespace-nowrap">Mã TS:</span>
                    <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                      {g.assetNo || '10314082501470'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Box & QR Code */}
              <div className="flex items-end justify-between px-6 pb-2 pt-4">
                <div className="text-left">
                  {qrUrl ? (
                    <div className="flex items-center gap-3">
                      <img 
                        src={qrUrl} 
                        alt="Passport QR" 
                        className="w-20 h-20 border border-black p-0.5 object-contain"
                      />
                      <div className="text-[9pt] leading-tight text-black">
                        <div className="font-bold uppercase tracking-tight">MÃ QR ĐỊNH DANH</div>
                        <div className="text-[8pt] text-gray-700">Quét tra cứu sổ điện tử</div>
                        <div className="font-mono text-[8pt] font-semibold mt-0.5">ID: {equipment.id}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-dashed border-gray-400 flex items-center justify-center text-[8pt]">
                      QR Code
                    </div>
                  )}
                </div>

                <div 
                  className="border border-black px-6 py-2 text-center"
                  style={{ minWidth: '150px' }}
                >
                  <span className="font-semibold text-sm">Số: </span>
                  <span className="font-bold text-sm font-mono">{g.assetNo || g.serial || '....................'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-8">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-6" style={{ fontSize: '14pt' }}>
                  MỤC LỤC
                </h2>

                <div className="space-y-2 text-left font-bold text-black" style={{ fontSize: '11.5pt', lineHeight: 1.8 }}>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                    <span>1. Cơ quan, đơn vị quản lý</span>
                    <span className="font-mono">2</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                    <span>2. Sơ lược thiết bị</span>
                    <span className="font-mono">3</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
                    <span>2.1. Đặc tính kỹ thuật</span>
                    <span className="font-mono">4</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
                    <span>2.2. Thành phần thiết bị</span>
                    <span className="font-mono">5</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
                    <span>2.3. Tài liệu kỹ thuật kèm theo</span>
                    <span className="font-mono">6</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                    <span>3. Bảo dưỡng</span>
                    <span className="font-mono">7</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                    <span>4. Kiểm tra - Sửa chữa - Thay thế - Thay đổi</span>
                    <span className="font-mono">8</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12 mb-4">
                <h3 className="text-base font-bold uppercase tracking-wide text-black" style={{ fontSize: '13pt' }}>
                  1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ
                </h3>
              </div>

              <table className="pdf-table w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '22%', border: '1px solid #000', padding: '8px' }}>
                      NGÀY THÁNG
                    </th>
                    <th style={{ width: '53%', border: '1px solid #000', padding: '8px' }}>
                      ĐƠN VỊ
                    </th>
                    <th style={{ width: '25%', border: '1px solid #000', padding: '8px' }}>
                      TÌNH TRẠNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {padList<OrgTransferRow>(equipment.orgRows, 14).map((row, i) => (
                    <tr key={i} style={{ height: '32px' }}>
                      <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {row ? row.date : '\u00A0'}
                      </td>
                      <td className="font-semibold" style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {row ? row.unit : '\u00A0'}
                      </td>
                      <td className="text-center" style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {row ? row.status : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="page-num">2</div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 3: 2 - SƠ LƯỢC THIẾT BỊ */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                  2 - SƠ LƯỢC THIẾT BỊ
                </h2>
              </div>

              <div className="space-y-3.5 text-black mb-6" style={{ fontSize: '12pt', lineHeight: 1.8 }}>
                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.name || 'Máy phát VHF liên lạc không địa T6T'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.manufacturer || 'PARK AIR'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Ký hiệu (Model):</span>
                  <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.model || 'T6T'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Mã số (S/N):</span>
                  <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.serial || '6U11654'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Năm sản xuất:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.yearMade || '2014'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Nước sản xuất:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.origin || 'ENGLAND'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Thời gian sử dụng:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.commissioned ? `Sử dụng từ ${g.commissioned}` : 'Sử dụng từ 11/2014'}
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="font-semibold whitespace-nowrap">Thời gian bảo hành:</span>
                  <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                    {g.warrantyDate || ''}
                  </span>
                </div>
              </div>

              {/* Dual License Table */}
              <table className="pdf-table w-full border-collapse border border-black text-black mt-4">
                <thead>
                  <tr>
                    <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: '6px' }}>
                      Giấy phép sử dụng tần số<br />và thiết bị VTĐ
                    </th>
                    <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: '6px' }}>
                      Giấy phép khai thác<br />hệ thống kỹ thuật, thiết bị
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-xs">
                    <th style={{ width: '26%', border: '1px solid #000', padding: '4px' }}>Số</th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: '4px' }}>Ngày hết hạn</th>
                    <th style={{ width: '26%', border: '1px solid #000', padding: '4px' }}>Số</th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: '4px' }}>Ngày hết hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedFreq.map((freqItem, i) => {
                    const expItem = paddedExploit[i];
                    return (
                      <tr key={i} style={{ height: '30px' }}>
                        <td className="font-mono font-semibold text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          {freqItem ? freqItem.no : '\u00A0'}
                        </td>
                        <td className="font-mono text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          {freqItem ? freqItem.expiryDate : '\u00A0'}
                        </td>
                        <td className="font-mono font-semibold text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          {expItem ? expItem.no : '\u00A0'}
                        </td>
                        <td className="font-mono text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          {expItem ? expItem.expiryDate : '\u00A0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="page-num">3</div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 4: 2.1 - ĐẶC TÍNH KỸ THUẬT */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                  2.1 - ĐẶC TÍNH KỸ THUẬT
                </h2>
              </div>

              <div 
                className="w-full space-y-0 text-black leading-relaxed"
                style={{ fontSize: '12pt', lineHeight: '30px' }}
              >
                <div className="border-b border-dotted border-black pb-0.5 font-medium">
                  {s.text || 'Liên lạc thoại không địa; điều chế AM; Tần số: VHF; Dải tần 118 – 136.975 MHz; Phân cực đứng; Công suất 50W; Công nghệ bán dẫn; Nguồn điện: AC 220 / 50Hz; DC: 24 – 31V.'}
                </div>

                {s.power && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Nguồn điện cấp: <b>{s.power}</b>
                  </div>
                )}
                {s.output && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Công suất phát danh định: <b>{s.output}</b>
                  </div>
                )}
                {s.range && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Dải tần số công tác: <b>{s.range}</b>
                  </div>
                )}
                {s.channelFreq && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Kênh tần số làm việc: <b>{s.channelFreq}</b>
                  </div>
                )}
                {s.interface && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Giao diện kết nối & điều chế: <b>{s.interface}</b>
                  </div>
                )}
                {s.mgmtIp && (
                  <div className="border-b border-dotted border-black pb-0.5">
                    - Địa chỉ IP & Cấu hình mạng: <b>{s.mgmtIp}</b> (Subnet: {s.subnetMask || '255.255.255.0'}, VLAN: {s.vlanId || 'Default'})
                  </div>
                )}

                {Array.from({ length: 18 }).map((_, idx) => (
                  <div key={idx} className="border-b border-dotted border-black min-h-[30px]">&nbsp;</div>
                ))}
              </div>
            </div>

            <div className="page-num">4</div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 5: 2.2 - THÀNH PHẦN THIẾT BỊ */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                  2.2 - THÀNH PHẦN THIẾT BỊ
                </h2>
              </div>

              <table className="pdf-table w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '8%', border: '1px solid #000', padding: '8px 4px' }}>TT</th>
                    <th style={{ width: '48%', border: '1px solid #000', padding: '8px 6px' }}>TÊN THIẾT BỊ</th>
                    <th style={{ width: '12%', border: '1px solid #000', padding: '8px 4px' }}>ĐVT</th>
                    <th style={{ width: '12%', border: '1px solid #000', padding: '8px 4px' }}>SL</th>
                    <th style={{ width: '20%', border: '1px solid #000', padding: '8px 6px' }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {padList<ComponentRow>(equipment.components, 20).map((comp, i) => (
                    <tr key={i} style={{ height: '30px' }}>
                      <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                        {comp ? (comp.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                      </td>
                      <td className="font-semibold" style={{ border: '1px solid #000', padding: '4px 8px' }}>
                        {comp ? comp.name : '\u00A0'}
                      </td>
                      <td className="text-center" style={{ border: '1px solid #000', padding: '4px' }}>
                        {comp ? comp.unit : '\u00A0'}
                      </td>
                      <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                        {comp ? comp.qty : '\u00A0'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                        {comp ? comp.note : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="page-num">5</div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 6: 2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                  2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO
                </h2>
              </div>

              <table className="pdf-table w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '8%', border: '1px solid #000', padding: '8px 4px' }}>TT</th>
                    <th style={{ width: '54%', border: '1px solid #000', padding: '8px 6px' }}>TÊN TÀI LIỆU</th>
                    <th style={{ width: '14%', border: '1px solid #000', padding: '8px 4px' }}>SL</th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: '8px 6px' }}>GHI CHÚ</th>
                  </tr>
                </thead>
                <tbody>
                  {padList<DocRow>(equipment.docs, 20).map((doc, i) => (
                    <tr key={i} style={{ height: '30px' }}>
                      <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                        {doc ? (doc.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                      </td>
                      <td className="font-semibold" style={{ border: '1px solid #000', padding: '4px 8px' }}>
                        {doc ? doc.name : '\u00A0'}
                      </td>
                      <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                        {doc ? doc.qty : '\u00A0'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                        {doc ? (doc.note || doc.location) : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="page-num">6</div>
          </div>

          {/* ========================================================================= */}
          {/* TRANG 7, 8, 9...: 3 - BẢO DƯỠNG */}
          {/* ========================================================================= */}
          {maintPages.map((pageRows, pageIdx) => {
            const paddedMaint = padList<MaintenanceRow>(pageRows, itemsPerPageMaint);
            const pageNum = 7 + pageIdx;

            return (
              <div 
                key={`modal-maint-page-${pageIdx}`}
                className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
              >
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                      3 - BẢO DƯỠNG
                    </h2>
                  </div>

                  <table className="pdf-table w-full border-collapse border border-black text-black text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th style={{ width: '20%', border: '1px solid #000', padding: '8px 4px' }}>
                          THỜI GIAN
                        </th>
                        <th style={{ width: '56%', border: '1px solid #000', padding: '8px 6px' }}>
                          KẾT LUẬN KẾT QUẢ BẢO DƯỠNG
                        </th>
                        <th style={{ width: '24%', border: '1px solid #000', padding: '8px 4px' }}>
                          NGƯỜI THỰC HIỆN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paddedMaint.map((mt, i) => (
                        <tr key={i} style={{ height: '70px' }}>
                          <td 
                            className="text-center font-bold align-middle text-xs" 
                            style={{ border: '1px solid #000', padding: '6px 4px' }}
                          >
                            {mt ? mt.date : '\u00A0'}
                          </td>
                          <td 
                            className="align-middle text-xs leading-relaxed" 
                            style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'pre-line' }}
                          >
                            {mt ? mt.content : '\u00A0'}
                          </td>
                          <td 
                            className="text-center font-semibold align-middle text-xs" 
                            style={{ border: '1px solid #000', padding: '6px 4px' }}
                          >
                            {mt ? mt.person : '\u00A0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="page-num">{pageNum}</div>
              </div>
            );
          })}

          {/* ========================================================================= */}
          {/* TRANG CUỐI: 4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI */}
          {/* ========================================================================= */}
          <div 
            className="w-[210mm] min-h-[297mm] bg-white p-[14mm_15mm_12mm_18mm] shadow-2xl flex flex-col justify-between select-text"
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '13.5pt' }}>
                  4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI
                </h2>
              </div>

              <table className="pdf-table w-full border-collapse border border-black text-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '20%', border: '1px solid #000', padding: '8px 4px' }}>
                      THỜI GIAN
                    </th>
                    <th style={{ width: '56%', border: '1px solid #000', padding: '8px 6px' }}>
                      NỘI DUNG THỰC HIỆN
                    </th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: '8px 4px' }}>
                      NGƯỜI THỰC HIỆN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {padList<RepairRow>(equipment.repair, 12).map((rp, i) => (
                    <tr key={i} style={{ height: '45px' }}>
                      <td 
                        className="text-center font-bold align-middle text-xs" 
                        style={{ border: '1px solid #000', padding: '6px 4px' }}
                      >
                        {rp ? rp.date : '\u00A0'}
                      </td>
                      <td 
                        className="align-middle text-xs leading-relaxed" 
                        style={{ border: '1px solid #000', padding: '6px 8px' }}
                      >
                        {rp ? (
                          <div>
                            <div className="font-semibold">{rp.incidentDescription || rp.actionTaken}</div>
                            {rp.actionTaken && rp.actionTaken !== rp.incidentDescription && (
                              <div className="text-slate-700 mt-0.5">{rp.actionTaken}</div>
                            )}
                          </div>
                        ) : '\u00A0'}
                      </td>
                      <td 
                        className="text-center font-semibold align-middle text-xs" 
                        style={{ border: '1px solid #000', padding: '6px 4px' }}
                      >
                        {rp ? rp.person : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="page-num">{7 + maintPages.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
