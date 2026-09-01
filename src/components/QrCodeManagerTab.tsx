import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Radio, 
  Camera, 
  Search, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  User,
  MapPin,
  Tag,
  Cpu,
  FileText,
  FileSpreadsheet,
  Link,
  Edit3
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';
import { 
  generateEquipmentQrDataUrl, 
  buildEquipmentQrData, 
  QrRenderOptions, 
  QrTargetMode 
} from '../utils/qrCodeService';

interface QrCodeManagerTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  onSelectEquipment: (id: string) => void;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenPdfViewer?: (equipment: EquipmentData) => void;
  onUpdateEquipment?: (equipment: EquipmentData) => void;
}

export const QrCodeManagerTab: React.FC<QrCodeManagerTabProps> = ({
  currentEquipment,
  allEquipments,
  onSelectEquipment,
  onShowToast,
  onNavigateTab,
  onOpenPdfViewer,
  onUpdateEquipment
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrUrls, setAllQrUrls] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch' | 'scanner'>('single');
  const [targetMode, setTargetMode] = useState<QrTargetMode>('pdf');
  const [copied, setCopied] = useState<boolean>(false);
  const [darkColor, setDarkColor] = useState<string>('#091533');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<EquipmentData | null>(null);
  
  // Custom Google Doc URL editor
  const [customDocUrl, setCustomDocUrl] = useState<string>(currentEquipment.googleDocUrl || '');
  const [isEditingDocUrl, setIsEditingDocUrl] = useState<boolean>(false);

  const printBatchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomDocUrl(currentEquipment.googleDocUrl || '');
  }, [currentEquipment]);

  // Generate QR for current equipment
  useEffect(() => {
    let isMounted = true;
    generateEquipmentQrDataUrl(currentEquipment, {
      width: 400,
      margin: 2,
      color: { dark: darkColor, light: '#ffffff' },
      errorCorrectionLevel: errorLevel,
      targetMode: targetMode
    }).then(url => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => { isMounted = false; };
  }, [currentEquipment, darkColor, errorLevel, targetMode]);

  // Pre-generate QR for all equipments (for batch stickers)
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const urls: Record<string, string> = {};
      for (const eq of allEquipments) {
        urls[eq.id] = await generateEquipmentQrDataUrl(eq, {
          width: 250,
          margin: 1,
          color: { dark: '#091533', light: '#ffffff' },
          errorCorrectionLevel: 'M',
          targetMode: targetMode
        });
      }
      if (isMounted) setAllQrUrls(urls);
    };
    generateAll();
    return () => { isMounted = false; };
  }, [allEquipments, targetMode]);

  const { lookupUrl, targetUrl, googleDocUrl, pdfViewerUrl, summaryText } = buildEquipmentQrData(
    currentEquipment, 
    undefined, 
    targetMode
  );

  const handleSaveDocUrl = () => {
    if (onUpdateEquipment) {
      const updated: EquipmentData = {
        ...currentEquipment,
        googleDocUrl: customDocUrl.trim() || undefined,
        updatedAt: new Date().toISOString()
      };
      onUpdateEquipment(updated);
      setIsEditingDocUrl(false);
      onShowToast('✓ Đã lưu đường dẫn Google Doc cho cuốn sổ lý lịch này!');
    }
  };

  const handleCopyLink = (urlToCopy: string = targetUrl) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    onShowToast('✓ Đã sao chép liên kết mã QR!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_LyLich_${targetMode}_${(currentEquipment.general.serial || currentEquipment.id).replace(/\W/g, '_')}.png`;
    a.click();
    onShowToast('✓ Đã tải ảnh mã QR HD thành công!');
  };

  const handlePrintSingleTag = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tem QR - ${currentEquipment.general.name}</title>
        <style>
          @page { size: 100mm 70mm; margin: 0; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 4mm; color: #000; box-sizing: border-box; }
          .tag-box { border: 2px solid #000; padding: 3mm; height: 58mm; display: flex; flex-direction: column; justify-content: space-between; border-radius: 4px; }
          .header { text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 2mm; margin-bottom: 2mm; }
          .company { font-size: 8pt; font-weight: bold; text-transform: uppercase; }
          .unit { font-size: 7.5pt; font-weight: bold; color: #333; }
          .body { display: flex; align-items: center; gap: 3mm; flex: 1; }
          .qr-img { width: 32mm; height: 32mm; }
          .info { font-size: 7.5pt; line-height: 1.35; flex: 1; }
          .eq-name { font-size: 9pt; font-weight: bold; color: #000; margin-bottom: 1mm; text-transform: uppercase; }
          .footer { font-size: 6.5pt; text-align: center; border-top: 1px dashed #666; padding-top: 1mm; color: #555; }
        </style>
      </head>
      <body>
        <div class="tag-box">
          <div class="header">
            <div class="company">${currentEquipment.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}</div>
            <div class="unit">${currentEquipment.org.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT'}</div>
          </div>
          <div class="body">
            <img class="qr-img" src="${qrDataUrl}" alt="QR" />
            <div class="info">
              <div class="eq-name">${currentEquipment.general.name}</div>
              <div><b>Model:</b> ${currentEquipment.general.model || 'N/A'}</div>
              <div><b>Serial:</b> ${currentEquipment.general.serial || 'N/A'}</div>
              <div><b>Mã TS:</b> ${currentEquipment.general.assetNo || 'N/A'}</div>
              <div><b>Vị trí:</b> ${currentEquipment.org.location || '---'}</div>
              <div><b>Kỹ sư:</b> ${currentEquipment.org.primaryEngineer || '---'}</div>
            </div>
          </div>
          <div class="footer">
            QUÉT MÃ QR ĐỂ HIỂN THỊ FILE PDF SỔ LÝ LỊCH VÀ GOOGLE DOCS
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintBatchTags = () => {
    window.print();
  };

  const handleLookupQr = (query: string) => {
    setScanInput(query);
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setScanResult(null);
      return;
    }
    const match = allEquipments.find(e => 
      e.id.toLowerCase() === clean ||
      clean.includes(e.id.toLowerCase()) ||
      (e.general.serial && e.general.serial.toLowerCase().includes(clean)) ||
      (e.general.assetNo && e.general.assetNo.toLowerCase().includes(clean)) ||
      (e.general.name && e.general.name.toLowerCase().includes(clean))
    );
    setScanResult(match || null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#091533] text-white p-6 rounded-2xl shadow-md border border-[#182d5a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400 border border-sky-400/30 shrink-0">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Mã QR In File Google Doc & Hiển Thị PDF Sổ Lý Lịch</h2>
              <span className="px-2 py-0.5 bg-sky-500/30 text-sky-200 rounded text-xs font-semibold border border-sky-400/40">
                Aviation CNS QR Hub
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
              Quét mã QR để <b>hiển thị trực tiếp file PDF</b> chuẩn A4 của Sổ lý lịch thiết bị hoặc <b>mở nhanh file Google Docs</b> tương ứng để soạn thảo và lưu trữ trên Google Drive.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#060e24] rounded-xl border border-[#1e3c7a] shrink-0 text-xs">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'single'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-sky-200/70 hover:text-white'
            }`}
          >
            Mã QR Thiết Bị Này
          </button>
          <button
            onClick={() => setActiveSubTab('batch')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'batch'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-sky-200/70 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>In Tem Tất Cả ({allEquipments.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('scanner')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'scanner'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-sky-200/70 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Trình Quét & Xem PDF</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SINGLE EQUIPMENT QR CODE */}
      {activeSubTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code Visual & Actions */}
          <div className="lg:col-span-5 bg-[#091533] p-6 rounded-2xl border border-[#182d5a] shadow-md flex flex-col items-center justify-between gap-5">
            <div className="w-full text-center border-b border-[#182d5a] pb-3">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Mã QR Sổ Lý Lịch Thiết Bị
              </span>
              <h3 className="text-base font-bold text-white mt-0.5 truncate">{currentEquipment.general.name}</h3>
              <p className="text-xs text-sky-200/70">
                Model: <b>{currentEquipment.general.model || 'N/A'}</b> | Serial: <span className="font-mono text-sky-300">{currentEquipment.general.serial || 'N/A'}</span>
              </p>
            </div>

            {/* QR Mode Indicator Badge */}
            <div className="px-3 py-1 bg-sky-950/80 border border-sky-700/60 rounded-full text-xs font-semibold text-sky-200 flex items-center gap-1.5">
              {targetMode === 'pdf' && <FileText className="w-3.5 h-3.5 text-sky-400" />}
              {targetMode === 'google_doc' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
              {targetMode === 'app' && <Radio className="w-3.5 h-3.5 text-indigo-400" />}
              <span>
                Đích quét: {targetMode === 'pdf' ? 'Hiển Thị File PDF Sổ Lý Lịch' : targetMode === 'google_doc' ? 'Mở File Google Docs' : 'Bảng Điều Khiển Web App'}
              </span>
            </div>

            {/* QR Frame Container */}
            <div className="p-4 bg-[#060e24] border-2 border-dashed border-[#1e3c7a] rounded-2xl flex flex-col items-center justify-center shadow-inner relative group">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Equipment QR Code" 
                  className="w-56 h-56 object-contain rounded-lg shadow-sm bg-white p-2 border border-slate-200"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#091533] text-sky-300 text-[11px] font-bold rounded-md font-mono border border-[#1e3c7a]">
                  <Tag className="w-3 h-3 text-sky-400" />
                  ID: {currentEquipment.id}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              {/* Primary PDF & Google Doc Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenPdfViewer && onOpenPdfViewer(currentEquipment)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xem File PDF Ngay</span>
                </button>
                <a
                  href={googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Google Doc</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQrPng}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tải ảnh QR (PNG)</span>
                </button>
                <button
                  onClick={handlePrintSingleTag}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>In Tem Nhãn Decal</span>
                </button>
              </div>

              <button
                onClick={() => handleCopyLink(targetUrl)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[#1e3c7a]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                <span>{copied ? 'Đã sao chép liên kết!' : 'Sao chép đường dẫn khi quét QR'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Target Mode Selection & Encoded Details */}
          <div className="lg:col-span-7 space-y-5">
            {/* Target Mode Selector */}
            <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Chọn Đích Đến Khi Người Dùng Quét Mã QR
                </h4>
                <span className="text-[10px] text-sky-300 font-bold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  Tùy Chọn Tương Tác
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mode 1: PDF Viewer */}
                <button
                  type="button"
                  onClick={() => setTargetMode('pdf')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'pdf'
                      ? 'bg-sky-950/80 border-sky-500 text-white shadow-md ring-1 ring-sky-400'
                      : 'bg-[#060e24] border-[#1e3c7a] text-sky-200 hover:border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FileText className={`w-5 h-5 ${targetMode === 'pdf' ? 'text-sky-400' : 'text-slate-400'}`} />
                    {targetMode === 'pdf' && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs">Xem File PDF Sổ Lý Lịch</div>
                    <div className="text-[10px] text-sky-200/70 mt-0.5 leading-snug">
                      Hiển thị ngay tài liệu A4 chuẩn có Quốc hiệu, Bảng I-IV và 3 chữ ký.
                    </div>
                  </div>
                </button>

                {/* Mode 2: Google Docs Direct */}
                <button
                  type="button"
                  onClick={() => setTargetMode('google_doc')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'google_doc'
                      ? 'bg-sky-950/80 border-emerald-500 text-white shadow-md ring-1 ring-emerald-400'
                      : 'bg-[#060e24] border-[#1e3c7a] text-sky-200 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FileSpreadsheet className={`w-5 h-5 ${targetMode === 'google_doc' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {targetMode === 'google_doc' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs">Mở File Google Docs</div>
                    <div className="text-[10px] text-sky-200/70 mt-0.5 leading-snug">
                      Dẫn thẳng đến tài liệu Google Docs trực tuyến trên Drive.
                    </div>
                  </div>
                </button>

                {/* Mode 3: Web App Management */}
                <button
                  type="button"
                  onClick={() => setTargetMode('app')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'app'
                      ? 'bg-sky-950/80 border-indigo-500 text-white shadow-md ring-1 ring-indigo-400'
                      : 'bg-[#060e24] border-[#1e3c7a] text-sky-200 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Radio className={`w-5 h-5 ${targetMode === 'app' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {targetMode === 'app' && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs">Bảng Quản Lý Web</div>
                    <div className="text-[10px] text-sky-200/70 mt-0.5 leading-snug">
                      Mở giao diện điều khiển chi tiết thiết bị trên Web App.
                    </div>
                  </div>
                </button>
              </div>

              {/* Google Doc URL linking box */}
              <div className="p-3 bg-[#060e24] rounded-xl border border-[#1e3c7a] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-200 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-sky-400" />
                    Đường dẫn Google Doc của Sổ lý lịch thiết bị này:
                  </span>
                  <button
                    onClick={() => setIsEditingDocUrl(!isEditingDocUrl)}
                    className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingDocUrl ? 'Thu gọn' : 'Chỉnh sửa liên kết'}</span>
                  </button>
                </div>

                {isEditingDocUrl ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={customDocUrl}
                      onChange={(e) => setCustomDocUrl(e.target.value)}
                      placeholder="Dán link Google Doc tại đây (https://docs.google.com/document/d/...)"
                      className="flex-1 px-3 py-1.5 bg-[#091533] border border-[#1e3c7a] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <button
                      onClick={handleSaveDocUrl}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Lưu
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-sky-300 truncate bg-[#091533] p-2 rounded-lg border border-[#182d5a]">
                    {currentEquipment.googleDocUrl || googleDocUrl}
                  </div>
                )}
              </div>
            </div>

            {/* Encoded Data Inspection */}
            <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Dữ Liệu Tự Động Định Danh Khi Quét Tem QR
                </h4>
                <span className="text-[11px] text-sky-300/70 font-mono">Payload v3.0</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#060e24] rounded-xl border border-[#182d5a]">
                  <span className="text-[10px] text-sky-300/70 uppercase font-bold">Tên thiết bị & Model</span>
                  <div className="font-bold text-white truncate">{currentEquipment.general.name}</div>
                  <div className="text-sky-200/70 text-[11px]">{currentEquipment.general.model} ({currentEquipment.general.category})</div>
                </div>
                <div className="p-2.5 bg-[#060e24] rounded-xl border border-[#182d5a]">
                  <span className="text-[10px] text-sky-300/70 uppercase font-bold">Số Serial & Mã Tài Sản</span>
                  <div className="font-mono font-bold text-white">{currentEquipment.general.serial || 'N/A'}</div>
                  <div className="font-mono text-sky-200/70 text-[11px]">TS: {currentEquipment.general.assetNo || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-[#060e24] rounded-xl border border-[#182d5a]">
                  <span className="text-[10px] text-sky-300/70 uppercase font-bold">Vị trí lắp đặt & Đơn vị</span>
                  <div className="font-semibold text-white truncate">{currentEquipment.org.unit || '---'}</div>
                  <div className="text-sky-200/70 text-[11px] truncate">{currentEquipment.org.location || '---'}</div>
                </div>
                <div className="p-2.5 bg-[#060e24] rounded-xl border border-[#182d5a]">
                  <span className="text-[10px] text-sky-300/70 uppercase font-bold">Kỹ sư phụ trách & Liên hệ</span>
                  <div className="font-semibold text-white">{currentEquipment.org.primaryEngineer || '---'}</div>
                  <div className="text-sky-200/70 text-[11px]">SĐT: {currentEquipment.org.phoneContact || '---'}</div>
                </div>
              </div>

              <div className="p-3 bg-[#040a1c] text-sky-100 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto border border-[#182d5a]">
                <div className="text-sky-400 font-bold mb-1">// Dữ liệu tra cứu chuẩn:</div>
                <pre className="whitespace-pre-wrap">{summaryText}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BATCH PRINTING SHEET FOR ALL EQUIPMENTS */}
      {activeSubTab === 'batch' && (
        <div className="space-y-6">
          <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md flex items-center justify-between flex-wrap gap-4 no-print">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-400" />
                Bảng In Tem Decal Mã QR Toàn Bộ Thiết Bị ({allEquipments.length} tem)
              </h3>
              <p className="text-xs text-sky-200/70 mt-0.5">
                Tem nhãn kỹ thuật kích thước chuẩn dán mặt máy, tủ Rack và trang bìa sổ lý lịch.
              </p>
            </div>

            <button
              onClick={handlePrintBatchTags}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Bảng Tem QR (Trang A4)</span>
            </button>
          </div>

          {/* Printable Batch Grid Container */}
          <div 
            ref={printBatchRef}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3 print:p-0"
          >
            {allEquipments.map((eq) => {
              const eqQr = allQrUrls[eq.id] || qrDataUrl;
              return (
                <div 
                  key={eq.id}
                  className="bg-white p-4 rounded-xl border-2 border-slate-800 shadow-sm flex flex-col justify-between gap-3 break-inside-avoid print:border-2 print:border-black print:p-3 text-slate-900"
                >
                  {/* Tag Header */}
                  <div className="border-b border-slate-300 pb-2 text-center">
                    <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                      {eq.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-600">
                      {eq.org.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT'}
                    </div>
                  </div>

                  {/* Tag Body */}
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 p-1 bg-white border border-slate-300 rounded">
                      {eqQr ? (
                        <img src={eqQr} alt="QR" className="w-24 h-24 object-contain" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center text-[10px] text-slate-400">Loading...</div>
                      )}
                    </div>
                    <div className="text-xs space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-slate-900 uppercase text-[11px] truncate" title={eq.general.name}>
                        {eq.general.name}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        <b>Model:</b> {eq.general.model || 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        <b>Serial:</b> <span className="font-mono font-bold text-slate-900">{eq.general.serial || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-600">
                        <b>Mã TS:</b> <span className="font-mono text-slate-800">{eq.general.assetNo || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        <b>Vị trí:</b> {eq.org.location || '---'}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        <b>Kỹ sư:</b> {eq.org.primaryEngineer || '---'}
                      </div>
                    </div>
                  </div>

                  {/* Tag Footer */}
                  <div className="border-t border-dashed border-slate-300 pt-1.5 text-center text-[9px] text-slate-500 uppercase font-medium flex items-center justify-between">
                    <span>SỔ LÝ LỊCH CNS &bull; PDF / DOC</span>
                    <span className="font-mono font-bold text-sky-700">{eq.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QR SCANNER & LOOKUP SIMULATOR */}
      {activeSubTab === 'scanner' && (
        <div className="max-w-2xl mx-auto bg-[#091533] p-6 rounded-2xl border border-[#182d5a] shadow-md space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-sky-950 text-sky-400 border border-sky-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Trình Quét Mã QR & Hiển Thị File PDF Sổ Lý Lịch</h3>
            <p className="text-xs text-sky-200/70">
              Nhập mã định danh, số Serial hoặc quét trực tiếp từ tem nhãn trên thiết bị để mở file PDF Sổ lý lịch tương ứng.
            </p>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => handleLookupQr(e.target.value)}
                placeholder="Nhập mã thiết bị (ví dụ: eq-vhf-t6t-01), số Serial hoặc tên máy..."
                className="w-full pl-11 pr-4 py-3 bg-[#060e24] border border-[#1e3c7a] rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-sky-200/70">
              <span>Gợi ý nhanh:</span>
              {allEquipments.slice(0, 4).map(eq => (
                <button
                  key={eq.id}
                  onClick={() => handleLookupQr(eq.id)}
                  className="px-2 py-0.5 bg-[#060e24] hover:bg-[#12224d] text-sky-300 border border-[#1e3c7a] rounded font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {eq.id}
                </button>
              ))}
            </div>
          </div>

          {/* Match Result Display with Direct PDF View button */}
          {scanResult ? (
            <div className="p-5 bg-sky-950/70 border border-sky-600/50 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Đã Nhận Diện Cuốn Sổ Lý Lịch Tương Ứng:</span>
                </div>
                <span className="px-2.5 py-0.5 bg-sky-900 text-sky-200 rounded-full text-xs font-bold font-mono border border-sky-600">
                  {scanResult.general.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Tên thiết bị:</span>
                  <div className="font-bold text-white text-sm">{scanResult.general.name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Model / Serial:</span>
                  <div className="font-bold text-white">{scanResult.general.model} (SN: {scanResult.general.serial})</div>
                </div>
                <div>
                  <span className="text-slate-400">Đơn vị & Vị trí:</span>
                  <div className="font-medium text-sky-100">{scanResult.org.unit} - {scanResult.org.location}</div>
                </div>
                <div>
                  <span className="text-slate-400">Kỹ sư phụ trách:</span>
                  <div className="font-medium text-sky-100">{scanResult.org.primaryEngineer} ({scanResult.org.phoneContact})</div>
                </div>
              </div>

              {/* Action buttons on scan */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    if (onOpenPdfViewer) {
                      onOpenPdfViewer(scanResult);
                    }
                  }}
                  className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Hiển Thị File PDF Sổ Lý Lịch</span>
                </button>

                <a
                  href={scanResult.googleDocUrl || `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (scanResult.general.name || scanResult.id))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Mở File Google Docs</span>
                </a>

                <button
                  onClick={() => {
                    onSelectEquipment(scanResult.id);
                    onNavigateTab('general');
                    onShowToast(`✓ Đã chuyển tới hồ sơ: ${scanResult.general.name}`);
                  }}
                  className="py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Hồ Sơ Thiết Bị</span>
                </button>

                <button
                  onClick={() => {
                    onSelectEquipment(scanResult.id);
                    onNavigateTab('printPreview');
                  }}
                  className="py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>In Sổ A4 Bản Giấy</span>
                </button>
              </div>
            </div>
          ) : scanInput.trim() !== '' ? (
            <div className="p-4 bg-amber-950/60 border border-amber-600/50 rounded-xl text-xs text-amber-300 text-center">
              Không tìm thấy thiết bị nào khớp với từ khóa "<b>{scanInput}</b>". Vui lòng kiểm tra lại mã ID hoặc Serial.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
