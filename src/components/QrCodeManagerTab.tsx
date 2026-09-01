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
  Cpu
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';
import { generateEquipmentQrDataUrl, buildEquipmentQrData, QrRenderOptions } from '../utils/qrCodeService';

interface QrCodeManagerTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  onSelectEquipment: (id: string) => void;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const QrCodeManagerTab: React.FC<QrCodeManagerTabProps> = ({
  currentEquipment,
  allEquipments,
  onSelectEquipment,
  onShowToast,
  onNavigateTab
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrUrls, setAllQrUrls] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch' | 'scanner'>('single');
  const [copied, setCopied] = useState<boolean>(false);
  const [darkColor, setDarkColor] = useState<string>('#0f172a');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<EquipmentData | null>(null);

  const printBatchRef = useRef<HTMLDivElement>(null);
  const printSingleTagRef = useRef<HTMLDivElement>(null);

  // Generate QR for current equipment
  useEffect(() => {
    let isMounted = true;
    generateEquipmentQrDataUrl(currentEquipment, {
      width: 400,
      margin: 2,
      color: { dark: darkColor, light: '#ffffff' },
      errorCorrectionLevel: errorLevel
    }).then(url => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => { isMounted = false; };
  }, [currentEquipment, darkColor, errorLevel]);

  // Pre-generate QR for all equipments (for batch stickers)
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const urls: Record<string, string> = {};
      for (const eq of allEquipments) {
        urls[eq.id] = await generateEquipmentQrDataUrl(eq, {
          width: 250,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        });
      }
      if (isMounted) setAllQrUrls(urls);
    };
    generateAll();
    return () => { isMounted = false; };
  }, [allEquipments]);

  const { lookupUrl, summaryText } = buildEquipmentQrData(currentEquipment);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(lookupUrl);
    setCopied(true);
    onShowToast('✓ Đã sao chép liên kết tra cứu mã QR!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_LyLich_${(currentEquipment.general.serial || currentEquipment.id).replace(/\W/g, '_')}.png`;
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
            QUÉT MÃ QR ĐỂ XEM SỔ LÝ LỊCH VÀ NHẬT KÝ BẢO DƯỠNG ĐIỆN TỬ
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
      <div className="bg-gradient-to-r from-[#040a1c] via-[#091533] to-[#0c183a] text-white p-6 rounded-2xl shadow-md border border-[#182d5a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-300 border border-sky-400/30 shrink-0">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Hệ Thống Quản Lý Mã QR Code Cho Từng Cuốn Sổ Lý Lịch</h2>
              <span className="px-2 py-0.5 bg-sky-500/30 text-sky-200 rounded text-xs font-semibold border border-sky-400/40">
                Nhãn QR Định Danh CNS
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
              Mỗi thiết bị trong hệ thống được cấp một mã <b>QR Code kỹ thuật số độc nhất</b>. Kỹ sư và nhân viên đài/trạm có thể dán tem QR lên mặt máy, tủ Rack hoặc bìa sổ lý lịch giấy để quét và tra cứu tức thì toàn bộ thông số, linh kiện và nhật ký bảo dưỡng.
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
            <span>Tra Cứu QR</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SINGLE EQUIPMENT QR CODE */}
      {activeSubTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code Visual & Actions */}
          <div className="lg:col-span-5 bg-[#091533] p-6 rounded-2xl border border-[#182d5a] shadow-md flex flex-col items-center justify-between gap-5">
            <div className="w-full text-center border-b border-[#182d5a] pb-3">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Mã QR Định Danh Chính Thức</span>
              <h3 className="text-base font-bold text-white mt-0.5 truncate">{currentEquipment.general.name}</h3>
              <p className="text-xs text-sky-200/70">
                Model: <b>{currentEquipment.general.model || 'N/A'}</b> | Serial: <span className="font-mono text-sky-300">{currentEquipment.general.serial || 'N/A'}</span>
              </p>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQrPng}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải ảnh QR (PNG)</span>
                </button>
                <button
                  onClick={handlePrintSingleTag}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#060e24] hover:bg-[#12224d] text-white border border-[#1e3c7a] rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>In Tem Nhãn Decal</span>
                </button>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[#1e3c7a]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                <span>{copied ? 'Đã sao chép liên kết!' : 'Sao chép đường dẫn tra cứu'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: QR Info, Customization & Encoded Details */}
          <div className="lg:col-span-7 space-y-5">
            {/* Customization Options */}
            <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Tùy Chỉnh Hiển Thị Mã QR
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-sky-200 font-medium mb-1">Màu sắc mã QR:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDarkColor('#0f172a')}
                      className={`w-7 h-7 rounded-full bg-slate-900 border-2 transition-all cursor-pointer ${darkColor === '#0f172a' ? 'border-sky-400 scale-110' : 'border-slate-700'}`}
                      title="Đen / Xanh đen (Chuẩn)"
                    />
                    <button
                      onClick={() => setDarkColor('#0369a1')}
                      className={`w-7 h-7 rounded-full bg-sky-700 border-2 transition-all cursor-pointer ${darkColor === '#0369a1' ? 'border-sky-400 scale-110' : 'border-slate-700'}`}
                      title="Xanh Dương Hàng Không"
                    />
                    <button
                      onClick={() => setDarkColor('#047857')}
                      className={`w-7 h-7 rounded-full bg-emerald-700 border-2 transition-all cursor-pointer ${darkColor === '#047857' ? 'border-sky-400 scale-110' : 'border-slate-700'}`}
                      title="Xanh Lá Cây Kỹ Thuật"
                    />
                    <button
                      onClick={() => setDarkColor('#4338ca')}
                      className={`w-7 h-7 rounded-full bg-indigo-700 border-2 transition-all cursor-pointer ${darkColor === '#4338ca' ? 'border-sky-400 scale-110' : 'border-slate-700'}`}
                      title="Tím Than Đậm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sky-200 font-medium mb-1">Mức độ sửa lỗi (Error Correction):</label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as any)}
                    className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  >
                    <option value="L">Mức L (7% - Nhẹ, quét nhanh)</option>
                    <option value="M">Mức M (15% - Tiêu chuẩn khuyến nghị)</option>
                    <option value="Q">Mức Q (25% - Bền bỉ khi dán ngoài trời)</option>
                    <option value="H">Mức H (30% - Chống trầy xước tem tốt nhất)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Encoded Data Inspection */}
            <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Dữ Liệu Được Tự Động Định Danh Khi Quét Mã
                </h4>
                <span className="text-[11px] text-sky-300/70 font-mono">Payload v2.5</span>
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

            {/* Quick Links */}
            <div className="flex items-center justify-between text-xs text-sky-200 bg-[#060e24] p-4 rounded-xl border border-sky-500/30">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Mã QR này cũng được tự động in trên <b>Trang Bìa A4</b> của Sổ Lý Lịch.</span>
              </div>
              <button
                onClick={() => onNavigateTab('printPreview')}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-md transition-colors shrink-0 cursor-pointer"
              >
                Xem Trang Bìa A4
              </button>
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
                Bố cục chuẩn A4 gồm nhiều tem nhãn dán kỹ thuật. Nhấn nút in để dán đồng loạt lên toàn bộ tủ máy trong đài/trạm.
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
                    <span>SỔ LÝ LỊCH CNS</span>
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
            <h3 className="text-base font-bold text-white">Trình Tra Cứu & Quét Mã QR Thiết Bị</h3>
            <p className="text-xs text-sky-200/70">
              Nhập mã định danh, số Serial hoặc quét trực tiếp từ tem nhãn dán trên thiết bị để mở cuốn sổ lý lịch tương ứng.
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
                placeholder="Nhập mã thiết bị (ví dụ: eq-vhf-01), số Serial hoặc tên máy..."
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

          {/* Match Result Display */}
          {scanResult ? (
            <div className="p-5 bg-emerald-950/60 border border-emerald-700/50 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Đã Tìm Thấy Cuốn Sổ Lý Lịch Tương Ứng:</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-900 text-emerald-200 rounded-full text-xs font-bold font-mono border border-emerald-600">
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

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    onSelectEquipment(scanResult.id);
                    onNavigateTab('general');
                    onShowToast(`✓ Đã chuyển tới hồ sơ: ${scanResult.general.name}`);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Mở Xem Chi Tiết Cuốn Sổ Này</span>
                </button>
                <button
                  onClick={() => {
                    onSelectEquipment(scanResult.id);
                    onNavigateTab('printPreview');
                  }}
                  className="py-2.5 px-4 bg-[#060e24] hover:bg-[#0e1d44] text-emerald-300 border border-emerald-600/50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Xem Bản In A4
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
