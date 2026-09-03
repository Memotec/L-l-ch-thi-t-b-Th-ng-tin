import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Edit3,
  Filter,
  CheckSquare,
  Square,
  ListFilter
} from 'lucide-react';
import { EquipmentData, AppUser, EquipmentCategory } from '../types';
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
  initialSubTab?: 'single' | 'batch' | 'scanner';
  currentUser?: AppUser;
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
  onOpenLoginModal,
  initialSubTab = 'single',
  currentUser
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrUrls, setAllQrUrls] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'batch' | 'scanner'>(initialSubTab);
  const [targetMode, setTargetMode] = useState<QrTargetMode>('pdf');
  const [copied, setCopied] = useState<boolean>(false);
  const darkColor = '#0f172a';
  const errorLevel = 'M';
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<EquipmentData | null>(null);

  // Batch QR Selection & Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [batchSearchTerm, setBatchSearchTerm] = useState<string>('');
  const [selectedEqIds, setSelectedEqIds] = useState<Set<string>>(() => new Set(allEquipments.map(e => e.id)));
  const [printLayoutFormat, setPrintLayoutFormat] = useState<'decal_standard' | 'decal_compact' | 'a4_catalog'>('decal_standard');
  
  // Custom Google Doc URL editor
  const [customDocUrl, setCustomDocUrl] = useState<string>(currentEquipment.googleDocUrl || '');
  const [isEditingDocUrl, setIsEditingDocUrl] = useState<boolean>(false);

  const printBatchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomDocUrl(currentEquipment.googleDocUrl || '');
  }, [currentEquipment]);

  // Keep selectedEqIds updated if allEquipments length changes
  useEffect(() => {
    setSelectedEqIds(prev => {
      const next = new Set(prev);
      allEquipments.forEach(e => next.add(e.id));
      return next;
    });
  }, [allEquipments]);

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

  // Pre-generate QR for all equipments (when batch tab is opened or targetMode changes)
  useEffect(() => {
    if (activeSubTab !== 'batch') return;
    let isMounted = true;
    const generateAll = async () => {
      const results = await Promise.all(
        allEquipments.map(async (eq) => {
          const url = await generateEquipmentQrDataUrl(eq, {
            width: 300,
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

  // Filter batch equipments based on Category and Search Term
  const filteredBatchEquipments = useMemo(() => {
    return allEquipments.filter(eq => {
      const matchesCategory = selectedCategory === 'all' || eq.general.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!batchSearchTerm.trim()) return true;
      const term = batchSearchTerm.toLowerCase();
      const name = eq.general?.name || '';
      const model = eq.general?.model || '';
      const serial = eq.general?.serial || '';
      const assetNo = eq.general?.assetNo || '';
      const location = eq.org?.location || '';
      return (
        name.toLowerCase().includes(term) ||
        model.toLowerCase().includes(term) ||
        serial.toLowerCase().includes(term) ||
        assetNo.toLowerCase().includes(term) ||
        location.toLowerCase().includes(term) ||
        eq.id.toLowerCase().includes(term)
      );
    });
  }, [allEquipments, selectedCategory, batchSearchTerm]);

  // Toggle single equipment selection in batch mode
  const handleToggleSelectEq = (id: string) => {
    setSelectedEqIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered items
  const handleSelectAllFiltered = () => {
    setSelectedEqIds(prev => {
      const next = new Set(prev);
      filteredBatchEquipments.forEach(e => next.add(e.id));
      return next;
    });
  };

  // Deselect all filtered items
  const handleDeselectAllFiltered = () => {
    setSelectedEqIds(prev => {
      const next = new Set(prev);
      filteredBatchEquipments.forEach(e => next.delete(e.id));
      return next;
    });
  };

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

  // Dedicated Admin Print Window for QR PDF Retrieval List & Stickers
  const handlePrintBatchPdfQrListWindow = async () => {
    const itemsToPrint = allEquipments.filter(eq => selectedEqIds.has(eq.id));
    if (itemsToPrint.length === 0) {
      onShowToast('⚠️ Vui lòng chọn ít nhất 1 thiết bị để in danh sách mã QR!');
      return;
    }

    onShowToast(`🖨️ Đang chuẩn bị bản in cho ${itemsToPrint.length} mã QR truy xuất PDF...`);

    // Ensure all QR code data URLs are generated for itemsToPrint
    const qrMap: Record<string, string> = {};
    await Promise.all(
      itemsToPrint.map(async (eq) => {
        if (allQrUrls[eq.id]) {
          qrMap[eq.id] = allQrUrls[eq.id];
        } else {
          const url = await generateEquipmentQrDataUrl(eq, {
            width: 320,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M',
            targetMode: targetMode
          });
          qrMap[eq.id] = url;
        }
      })
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const companyName = itemsToPrint[0]?.org?.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM';
    const unitName = itemsToPrint[0]?.org?.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT';
    const currentDate = new Date().toLocaleDateString('vi-VN');

    let bodyHtml = '';

    if (printLayoutFormat === 'a4_catalog') {
      // Catalog table format
      bodyHtml = `
        <div class="page-title">
          <h2>${companyName.toUpperCase()} - ${unitName.toUpperCase()}</h2>
          <h1>DANH SÁCH MÃ QR TRUY XUẤT FILE PDF SỔ LÝ LỊCH THIẾT BỊ</h1>
          <p class="sub-info">Ngày lập: ${currentDate} &bull; Chế độ: Truy xuất File PDF A4 &bull; Tổng số: ${itemsToPrint.length} thiết bị</p>
        </div>
        <table class="catalog-table">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 125px;">Mã QR Truy Xuất PDF</th>
              <th>Tên Thiết Bị & Chủng Loại</th>
              <th>Model & Số Serial</th>
              <th>Mã Tài Sản / Vị Trí</th>
              <th>Kỹ Sư Phụ Trách & Hướng Dẫn</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToPrint.map((eq, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="text-align: center; padding: 6px;">
                  <img src="${qrMap[eq.id]}" class="qr-catalog-img" alt="QR ${eq.id}" />
                  <div style="font-size: 7.5pt; font-family: monospace; font-weight: bold; margin-top: 3px; color: #1e3a8a;">${eq.id}</div>
                </td>
                <td>
                  <strong style="text-transform: uppercase; font-size: 9.5pt; color: #0f172a;">${eq.general.name}</strong>
                  <div style="font-size: 8pt; color: #475569; margin-top: 2px;">Phân loại: <strong>${eq.general.category}</strong></div>
                </td>
                <td>
                  <div><strong>Model:</strong> ${eq.general.model || 'N/A'}</div>
                  <div><strong>Serial:</strong> <span style="font-family: monospace; font-weight: bold;">${eq.general.serial || 'N/A'}</span></div>
                </td>
                <td>
                  <div><strong>Mã TS:</strong> <span style="font-family: monospace; font-weight: bold;">${eq.general.assetNo || 'N/A'}</span></div>
                  <div style="font-size: 8pt; color: #334155;"><strong>Vị trí:</strong> ${eq.org.location || '---'}</div>
                </td>
                <td>
                  <div><strong>Kỹ sư:</strong> ${eq.org.primaryEngineer || '---'}</div>
                  <div style="font-size: 7.5pt; color: #2563eb; margin-top: 3px; font-weight: 500;">✓ Quét QR bằng camera để mở trực tiếp File PDF Sổ Lý Lịch A4</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (printLayoutFormat === 'decal_compact') {
      // Compact Decal Stamps (3 items per row)
      bodyHtml = `
        <div class="header-banner">
          <div><strong>${companyName}</strong> - ${unitName}</div>
          <div style="font-size: 9pt; font-weight: bold; color: #1e3a8a;">TEM NHÃN MÃ QR DÁN MẶT MÁY (TRUY XUẤT FILE PDF SỔ LÝ LỊCH)</div>
        </div>
        <div class="decal-grid compact-grid">
          ${itemsToPrint.map((eq) => `
            <div class="decal-card compact-card">
              <div class="card-header">${eq.general.name}</div>
              <div class="card-body">
                <img src="${qrMap[eq.id]}" class="qr-img-compact" alt="QR" />
                <div class="card-info">
                  <div><b>Model:</b> ${eq.general.model || 'N/A'}</div>
                  <div><b>S/N:</b> <span class="mono">${eq.general.serial || 'N/A'}</span></div>
                  <div><b>TS:</b> <span class="mono">${eq.general.assetNo || 'N/A'}</span></div>
                  <div><b>VT:</b> ${eq.org.location || '---'}</div>
                </div>
              </div>
              <div class="card-footer">QUÉT MÃ QR MỞ FILE PDF &bull; ${eq.id}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // Standard Decal Stamps (2 items per row)
      bodyHtml = `
        <div class="header-banner">
          <div><strong>${companyName.toUpperCase()}</strong> &bull; ${unitName.toUpperCase()}</div>
          <div style="font-size: 10pt; font-weight: bold; color: #1e3a8a;">BẢNG TEM DECAL MÃ QR TRUY XUẤT FILE PDF SỔ LÝ LỊCH THIẾT BỊ</div>
        </div>
        <div class="decal-grid standard-grid">
          ${itemsToPrint.map((eq) => `
            <div class="decal-card standard-card">
              <div class="card-top text-center">
                <div style="font-size: 8pt; font-weight: bold; color: #0f172a;">${eq.org.companyName || companyName}</div>
                <div style="font-size: 7.5pt; font-weight: 600; color: #334155;">${eq.org.unit || unitName}</div>
              </div>
              <div class="card-body">
                <img src="${qrMap[eq.id]}" class="qr-img-standard" alt="QR" />
                <div class="card-info">
                  <div class="eq-title">${eq.general.name}</div>
                  <div><b>Chủng loại:</b> ${eq.general.category}</div>
                  <div><b>Model:</b> ${eq.general.model || 'N/A'}</div>
                  <div><b>Số Serial:</b> <span class="mono">${eq.general.serial || 'N/A'}</span></div>
                  <div><b>Mã Tài Sản:</b> <span class="mono">${eq.general.assetNo || 'N/A'}</span></div>
                  <div><b>Vị trí dán:</b> ${eq.org.location || '---'}</div>
                  <div><b>Phụ trách:</b> ${eq.org.primaryEngineer || '---'}</div>
                </div>
              </div>
              <div class="card-footer">
                <span>QUÉT MÃ QR ĐỂ HIỂN THỊ FILE PDF SỔ LÝ LỊCH</span>
                <span class="mono">${eq.id}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>In Tem Mã QR PDF - ${itemsToPrint.length} Thiết Bị</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin: 0; padding: 0; background: #fff; font-size: 9pt; }
          
          .header-banner { text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 12px; }
          .page-title { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .page-title h2 { margin: 0; font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #1e293b; }
          .page-title h1 { margin: 3px 0 0 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a; }
          .sub-info { margin: 3px 0 0 0; font-size: 8pt; color: #475569; }

          /* Catalog Table Styling */
          .catalog-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .catalog-table th, .catalog-table td { border: 1px solid #334155; padding: 6px 7px; vertical-align: middle; }
          .catalog-table th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 8pt; text-align: center; }
          .qr-catalog-img { width: 95px; height: 95px; display: block; margin: 0 auto; }

          /* Decal Grid Styling */
          .decal-grid { display: grid; gap: 10px; width: 100%; }
          .standard-grid { grid-template-columns: repeat(2, 1fr); }
          .compact-grid { grid-template-columns: repeat(3, 1fr); }

          .decal-card { border: 2px solid #000; border-radius: 4px; padding: 6px; background: #fff; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; break-inside: avoid; }
          .card-top { border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 4px; text-transform: uppercase; }
          .card-header { font-weight: bold; font-size: 9pt; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; text-align: center; }
          
          .card-body { display: flex; align-items: center; gap: 8px; flex: 1; }
          .qr-img-standard { width: 105px; height: 105px; shrink: 0; }
          .qr-img-compact { width: 80px; height: 80px; shrink: 0; }
          
          .card-info { flex: 1; font-size: 8pt; line-height: 1.35; }
          .eq-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #0f172a; margin-bottom: 2px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
          .card-footer { border-top: 1px dashed #000; margin-top: 4px; padding-top: 3px; font-size: 7pt; font-weight: bold; display: flex; justify-content: space-between; text-transform: uppercase; color: #334155; }
          .mono { font-family: monospace; font-weight: bold; }

          @media print {
            body { margin: 0; padding: 0; }
            .decal-card { border-color: #000 !important; }
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
          {/* Top Admin Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 space-y-3 no-print">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Tính Năng Quản Trị & In Ấn
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  Tạo danh sách mã QR dán trên vỏ máy & tủ Rack
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chọn tất cả ({filteredBatchEquipments.length})</span>
                </button>
                <button
                  onClick={handleDeselectAllFiltered}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bỏ chọn</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-400" />
                  Danh Sách Mã QR Truy Xuất File PDF Sổ Lý Lịch Tất Cả Thiết Bị
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Mã QR được tự động liên kết với URL xem trực tiếp File PDF Sổ lý lịch (<code className="text-blue-300 font-mono">#eq=...&view=pdf</code>). Kỹ sư chỉ cần dùng camera di động quét tem nhãn trên thiết bị để mở nhanh bản PDF A4 chuẩn.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={handlePrintBatchPdfQrListWindow}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-400/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Danh Sách / Tem QR PDF (A4)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtering & Layout Toolbar */}
          <div className="enterprise-card p-4 space-y-4 no-print bg-slate-50 border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  Phân Loại Thiết Bị
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả chủng loại ({allEquipments.length})</option>
                  <option value="VHF/UHF">VHF/UHF</option>
                  <option value="VIBA">VIBA & Truyền dẫn</option>
                  <option value="VOICE">VOICE (Tổng đài/Ghi âm)</option>
                  <option value="POWER">Nguồn & Phụ Trợ (POWER)</option>
                  <option value="IT">IT & Mạng Dữ Liệu</option>
                  <option value="RADAR_ADS">RADAR & ADS-B</option>
                  <option value="NAV">NAV (Dẫn đường)</option>
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  Tìm Kiếm Thiết Bị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={batchSearchTerm}
                    onChange={(e) => setBatchSearchTerm(e.target.value)}
                    placeholder="Tên, Model, Serial, Mã TS, Vị trí..."
                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Print Layout Format */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  Định Dạng Bố Cục In
                </label>
                <select
                  value={printLayoutFormat}
                  onChange={(e) => setPrintLayoutFormat(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="decal_standard">🏷️ Tem Decal Kỹ Thuật (2 tem/hàng A4)</option>
                  <option value="decal_compact">🔖 Tem Decal Cỡ Vừa (3 tem/hàng A4)</option>
                  <option value="a4_catalog">📋 Bảng Catalog A4 Tổng Hợp (Dạng Bảng)</option>
                </select>
              </div>

              {/* Target QR Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Link className="w-3.5 h-3.5 text-blue-600" />
                  Chế Độ Liên Kết Quét QR
                </label>
                <select
                  value={targetMode}
                  onChange={(e) => setTargetMode(e.target.value as QrTargetMode)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">📄 Truy xuất File PDF Sổ Lý Lịch (Mặc định)</option>
                  <option value="doc">📊 Google Docs Trực Tuyến</option>
                  <option value="app">🌐 Bảng Điều Khiển Web App</option>
                </select>
              </div>
            </div>

            {/* Selection Summary Line */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Đã chọn: <span className="text-blue-700 font-mono text-sm">{selectedEqIds.size}</span> / {allEquipments.length} thiết bị
                </span>
                {filteredBatchEquipments.length < allEquipments.length && (
                  <span className="text-slate-500 text-[11px]">
                    (Hiển thị {filteredBatchEquipments.length} thiết bị theo bộ lọc)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintBatchPdfQrListWindow}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In ngay {selectedEqIds.size} tem nhãn</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Batch Grid Container */}
          <div 
            ref={printBatchRef}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3 print:p-0"
          >
            {filteredBatchEquipments.map((eq) => {
              const eqQr = allQrUrls[eq.id] || qrDataUrl;
              const isSelected = selectedEqIds.has(eq.id);

              return (
                <div 
                  key={eq.id}
                  onClick={() => handleToggleSelectEq(eq.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer break-inside-avoid print:border-2 print:border-black print:p-3 text-slate-900 ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-slate-50/80 border-slate-300 opacity-60 hover:opacity-100 hover:border-slate-400'
                  }`}
                >
                  {/* Selection Checkbox Pill */}
                  <div className="absolute top-3 right-3 no-print z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectEq(eq.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Tag Header */}
                  <div className="border-b border-slate-300 pb-2 text-center pr-8">
                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">
                      {eq.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-600">
                      {eq.org.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT'}
                    </div>
                  </div>

                  {/* Tag Body */}
                  <div className="flex items-center gap-3 my-2">
                    <div className="shrink-0 p-1.5 bg-white border border-slate-300 rounded-lg shadow-2xs">
                      {eqQr ? (
                        <img src={eqQr} alt="QR" className="w-24 h-24 object-contain" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center text-[10px] text-slate-400">Đang tạo...</div>
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
                    <span className="text-blue-700 font-bold">✓ TRUY XUẤT FILE PDF SỔ LÝ LỊCH</span>
                    <span className="font-mono font-bold text-slate-800">{eq.id}</span>
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
