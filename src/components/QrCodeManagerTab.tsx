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
  CheckCircle2, 
  RefreshCw,
  Tag,
  Cpu,
  FileText,
  FileSpreadsheet,
  Link,
  Edit3
} from 'lucide-react';
import { EquipmentData } from '../types';
import { 
  generateEquipmentQrDataUrl, 
  buildEquipmentQrData, 
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
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const QrCodeManagerTab: React.FC<QrCodeManagerTabProps> = ({
  currentEquipment,
  allEquipments,
  onSelectEquipment,
  onShowToast,
  onNavigateTab,
  onOpenPdfViewer,
  onUpdateEquipment,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrUrls, setAllQrUrls] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch' | 'scanner'>('single');
  const [targetMode, setTargetMode] = useState<QrTargetMode>('pdf');
  const [copied, setCopied] = useState<boolean>(false);
  const darkColor = '#0f172a';
  const errorLevel = 'M';
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

  // Pre-generate QR for all equipments (only when batch tab is opened)
  useEffect(() => {
    if (activeSubTab !== 'batch') return;
    let isMounted = true;
    const generateAll = async () => {
      const results = await Promise.all(
        allEquipments.map(async (eq) => {
          const url = await generateEquipmentQrDataUrl(eq, {
            width: 250,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M',
            targetMode: targetMode
          });
          return { id: eq.id, url };
        })
      );
      if (isMounted) {
        const urls: Record<string, string> = {};
        for (const item of results) {
          urls[item.id] = item.url;
        }
        setAllQrUrls(urls);
      }
    };
    generateAll();
    return () => { isMounted = false; };
  }, [allEquipments, targetMode, activeSubTab]);

  const { targetUrl, googleDocUrl, summaryText } = buildEquipmentQrData(
    currentEquipment, 
    undefined, 
    targetMode
  );

  const handleSaveDocUrl = () => {
    if (isReadOnly) {
      if (onOpenLoginModal) {
        onOpenLoginModal();
      } else {
        onShowToast('Tài khoản quyền Viewer chỉ có quyền quét và xem.');
      }
      return;
    }
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
      <div className="p-6 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-400/30 shrink-0">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Mã QR In File Google Doc & Hiển Thị PDF Sổ Lý Lịch</h2>
              <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded text-xs font-semibold border border-blue-400/40">
                Tem Nhãn QR
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Quét mã QR để <b>hiển thị trực tiếp file PDF</b> chuẩn A4 của Sổ lý lịch thiết bị hoặc <b>mở nhanh file Google Docs</b> tương ứng để soạn thảo và lưu trữ trên Google Drive.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg border border-slate-700 shrink-0 text-xs">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
              activeSubTab === 'single'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Mã QR Thiết Bị Này
          </button>
          <button
            onClick={() => setActiveSubTab('batch')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'batch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>In Tem Tất Cả ({allEquipments.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('scanner')}
            className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Trình Quét & Xem PDF</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SINGLE EQUIPMENT QR CODE */}
      {activeSubTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: QR Code Visual & Actions */}
          <div className="lg:col-span-5 enterprise-card p-5 flex flex-col items-center justify-between gap-5">
            <div className="w-full text-center border-b border-slate-200 pb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Mã QR Sổ Lý Lịch Thiết Bị
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 truncate">{currentEquipment.general.name}</h3>
              <p className="text-xs text-slate-500">
                Model: <b>{currentEquipment.general.model || 'N/A'}</b> | Serial: <span className="font-mono text-slate-700">{currentEquipment.general.serial || 'N/A'}</span>
              </p>
            </div>

            {/* QR Mode Indicator Badge */}
            <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              {targetMode === 'pdf' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
              {targetMode === 'google_doc' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              {targetMode === 'app' && <Radio className="w-3.5 h-3.5 text-indigo-600" />}
              <span>
                Đích quét: {targetMode === 'pdf' ? 'Hiển Thị File PDF Sổ Lý Lịch' : targetMode === 'google_doc' ? 'Mở File Google Docs' : 'Bảng Điều Khiển Web App'}
              </span>
            </div>

            {/* QR Frame Container */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Equipment QR Code" 
                  className="w-52 h-52 object-contain rounded-lg bg-white p-2 border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-slate-800 text-[11px] font-bold rounded font-mono border border-slate-200 shadow-2xs">
                  <Tag className="w-3 h-3 text-blue-600" />
                  ID: {currentEquipment.id}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenPdfViewer && onOpenPdfViewer(currentEquipment)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xem File PDF Ngay</span>
                </button>
                <a
                  href={googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Google Doc</span>
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQrPng}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải ảnh QR (PNG)</span>
                </button>
                <button
                  onClick={handlePrintSingleTag}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>In Tem Nhãn Decal</span>
                </button>
              </div>

              <button
                onClick={() => handleCopyLink(targetUrl)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                <span>{copied ? 'Đã sao chép liên kết!' : 'Sao chép đường dẫn khi quét QR'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Target Mode Selection & Encoded Details */}
          <div className="lg:col-span-7 space-y-5">
            {/* Target Mode Selector */}
            <div className="enterprise-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Chọn Đích Đến Khi Quét Mã QR
                </h4>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Tùy Chọn Tương Tác
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mode 1: PDF Viewer */}
                <button
                  type="button"
                  onClick={() => setTargetMode('pdf')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'pdf'
                      ? 'bg-blue-50/70 border-blue-600 text-slate-900 shadow-2xs ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FileText className={`w-5 h-5 ${targetMode === 'pdf' ? 'text-blue-600' : 'text-slate-400'}`} />
                    {targetMode === 'pdf' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs text-slate-900">Xem File PDF Sổ Lý Lịch</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Hiển thị ngay tài liệu A4 chuẩn có Quốc hiệu, Bảng I-IV và 3 chữ ký.
                    </div>
                  </div>
                </button>

                {/* Mode 2: Google Docs Direct */}
                <button
                  type="button"
                  onClick={() => setTargetMode('google_doc')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'google_doc'
                      ? 'bg-emerald-50/70 border-emerald-600 text-slate-900 shadow-2xs ring-1 ring-emerald-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FileSpreadsheet className={`w-5 h-5 ${targetMode === 'google_doc' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {targetMode === 'google_doc' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs text-slate-900">Mở File Google Docs</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Dẫn thẳng đến tài liệu Google Docs trực tuyến trên Drive.
                    </div>
                  </div>
                </button>

                {/* Mode 3: Web App Management */}
                <button
                  type="button"
                  onClick={() => setTargetMode('app')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetMode === 'app'
                      ? 'bg-indigo-50/70 border-indigo-600 text-slate-900 shadow-2xs ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Radio className={`w-5 h-5 ${targetMode === 'app' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {targetMode === 'app' && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs text-slate-900">Bảng Quản Lý Web</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Mở giao diện điều khiển chi tiết thiết bị trên Web App.
                    </div>
                  </div>
                </button>
              </div>

              {/* Google Doc URL linking box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-600" />
                    Đường dẫn Google Doc của thiết bị này:
                  </span>
                  <button
                    onClick={() => setIsEditingDocUrl(!isEditingDocUrl)}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1"
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
                      placeholder="Dán link Google Doc tại đây..."
                      className="form-input-standard font-mono"
                    />
                    <button
                      onClick={handleSaveDocUrl}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Lưu
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-slate-700 truncate bg-white p-2 rounded border border-slate-200">
                    {currentEquipment.googleDocUrl || googleDocUrl}
                  </div>
                )}
              </div>
            </div>

            {/* Encoded Data Inspection */}
            <div className="enterprise-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dữ Liệu Tự Động Định Danh Khi Quét Tem QR
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Payload v3.0</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Tên thiết bị & Model</span>
                  <div className="font-bold text-slate-900 truncate">{currentEquipment.general.name}</div>
                  <div className="text-slate-600 text-[11px]">{currentEquipment.general.model} ({currentEquipment.general.category})</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Số Serial & Mã Tài Sản</span>
                  <div className="font-mono font-bold text-slate-900">{currentEquipment.general.serial || 'N/A'}</div>
                  <div className="font-mono text-slate-600 text-[11px]">TS: {currentEquipment.general.assetNo || 'N/A'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Vị trí lắp đặt & Đơn vị</span>
                  <div className="font-semibold text-slate-900 truncate">{currentEquipment.org.unit || '---'}</div>
                  <div className="text-slate-600 text-[11px] truncate">{currentEquipment.org.location || '---'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Kỹ sư phụ trách & Liên hệ</span>
                  <div className="font-semibold text-slate-900">{currentEquipment.org.primaryEngineer || '---'}</div>
                  <div className="text-slate-600 text-[11px]">SĐT: {currentEquipment.org.phoneContact || '---'}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
                <div className="text-blue-400 font-bold mb-1">// Dữ liệu tra cứu chuẩn:</div>
                <pre className="whitespace-pre-wrap text-slate-300">{summaryText}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BATCH PRINTING SHEET FOR ALL EQUIPMENTS */}
      {activeSubTab === 'batch' && (
        <div className="space-y-5">
          <div className="enterprise-card p-4 flex items-center justify-between flex-wrap gap-4 no-print">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Bảng In Tem Decal Mã QR Toàn Bộ Thiết Bị ({allEquipments.length} tem)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tem nhãn kỹ thuật kích thước chuẩn dán mặt máy, tủ Rack và trang bìa sổ lý lịch.
              </p>
            </div>

            <button
              onClick={handlePrintBatchTags}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                  className="bg-white p-4 rounded-lg border-2 border-slate-800 shadow-2xs flex flex-col justify-between gap-3 break-inside-avoid print:border-2 print:border-black print:p-3 text-slate-900"
                >
                  {/* Tag Header */}
                  <div className="border-b border-slate-300 pb-2 text-center">
                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">
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
                    <span className="font-mono font-bold text-blue-700">{eq.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QR SCANNER & LOOKUP SIMULATOR */}
      {activeSubTab === 'scanner' && (
        <div className="max-w-2xl mx-auto enterprise-card p-6 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Trình Quét Mã QR & Hiển Thị File PDF Sổ Lý Lịch</h3>
            <p className="text-xs text-slate-500">
              Nhập mã định danh, số Serial hoặc quét trực tiếp từ tem nhãn trên thiết bị để mở file PDF Sổ lý lịch tương ứng.
            </p>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => handleLookupQr(e.target.value)}
                placeholder="Nhập mã thiết bị (ví dụ: eq-vhf-t6t-01), số Serial hoặc tên máy..."
                className="form-input-standard pl-10"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
              <span>Gợi ý nhanh:</span>
              {allEquipments.slice(0, 4).map(eq => (
                <button
                  key={eq.id}
                  onClick={() => handleLookupQr(eq.id)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {eq.id}
                </button>
              ))}
            </div>
          </div>

          {/* Match Result Display with Direct PDF View button */}
          {scanResult ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Đã Nhận Diện Cuốn Sổ Lý Lịch Tương Ứng:</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold font-mono border border-emerald-200">
                  {scanResult.general.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Tên thiết bị:</span>
                  <div className="font-bold text-slate-900 text-sm">{scanResult.general.name}</div>
                </div>
                <div>
                  <span className="text-slate-500">Model / Serial:</span>
                  <div className="font-bold text-slate-900">{scanResult.general.model} (SN: {scanResult.general.serial})</div>
                </div>
                <div>
                  <span className="text-slate-500">Đơn vị & Vị trí:</span>
                  <div className="font-medium text-slate-800">{scanResult.org.unit} - {scanResult.org.location}</div>
                </div>
                <div>
                  <span className="text-slate-500">Kỹ sư phụ trách:</span>
                  <div className="font-medium text-slate-800">{scanResult.org.primaryEngineer} ({scanResult.org.phoneContact})</div>
                </div>
              </div>

              {/* Action buttons on scan */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onOpenPdfViewer) {
                      onOpenPdfViewer(scanResult);
                    }
                  }}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Hiển Thị File PDF Sổ Lý Lịch</span>
                </button>

                <a
                  href={scanResult.googleDocUrl || `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (scanResult.general.name || scanResult.id))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                  className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Hồ Sơ Thiết Bị</span>
                </button>

                <button
                  onClick={() => {
                    onSelectEquipment(scanResult.id);
                    onNavigateTab('printPreview');
                  }}
                  className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>In Sổ A4 Bản Giấy</span>
                </button>
              </div>
            </div>
          ) : scanInput.trim() !== '' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center">
              Không tìm thấy thiết bị nào khớp với từ khóa "<b>{scanInput}</b>". Vui lòng kiểm tra lại mã ID hoặc Serial.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
