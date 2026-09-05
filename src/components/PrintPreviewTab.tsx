import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Settings2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Search,
  BookOpen,
  ClipboardList,
  Layers,
  QrCode,
  SlidersHorizontal,
  Table,
  FileSpreadsheet,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { EquipmentData, AppUser } from '../types';
import { generateEquipmentQrDataUrl } from '../utils/qrCodeService';
import { googleDriveDocsService } from '../utils/googleDriveDocsService';
import { pdfExportService } from '../utils/pdfExportService';
import { statisticsExportService } from '../utils/statisticsExportService';
import { TeamInventoryPrintView } from './TeamInventoryPrintView';
import { EquipmentLogbookPrintPages } from './EquipmentLogbookPrintPages';

interface PrintPreviewTabProps {
  data: EquipmentData;
  allEquipments?: EquipmentData[];
  onSelectEquipment?: (id: string) => void;
  currentUser?: AppUser;
  onShowToast?: (msg: string) => void;
}

export const PrintPreviewTab: React.FC<PrintPreviewTabProps> = ({ 
  data, 
  allEquipments, 
  onSelectEquipment,
  currentUser,
  onShowToast
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // View modes:
  // 'single_logbook': Sổ lý lịch 8 trang của thiết bị đang chọn
  // 'team_inventory': Bảng tổng hợp kiểm kê toàn bộ thiết bị hiện có (PDF khổ ngang/dọc)
  // 'all_logbooks': In gộp toàn bộ 8 trang sổ lý lịch của tất cả thiết bị
  const [viewMode, setViewMode] = useState<'single_logbook' | 'team_inventory' | 'all_logbooks'>('single_logbook');

  // Single logbook settings
  const [itemsPerPageMaint, setItemsPerPageMaint] = useState<number>(7);
  const [coverQrUrl, setCoverQrUrl] = useState<string>('');
  const [copiedStandardDoc, setCopiedStandardDoc] = useState<boolean>(false);

  // Team inventory settings
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [inventoryOrientation, setInventoryOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [inventoryRowsPerPage, setInventoryRowsPerPage] = useState<number>(7);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [showQrInInventory, setShowQrInInventory] = useState<boolean>(true);
  const [copiedInventoryTsv, setCopiedInventoryTsv] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // QR Code lookup map for all equipments
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});

  const effectiveEquipments = useMemo(() => {
    return (allEquipments && allEquipments.length > 0) ? allEquipments : [data];
  }, [allEquipments, data]);

  // Generate QR codes for all equipments in inventory
  useEffect(() => {
    let isMounted = true;
    Promise.all(
      effectiveEquipments.map(async (eq) => {
        try {
          const url = await generateEquipmentQrDataUrl(eq, {
            width: 140,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
          });
          return { id: eq.id, url };
        } catch {
          return { id: eq.id, url: '' };
        }
      })
    ).then(results => {
      if (isMounted) {
        const map: Record<string, string> = {};
        results.forEach(r => { map[r.id] = r.url; });
        setQrCodeMap(map);
        if (map[data.id]) {
          setCoverQrUrl(map[data.id]);
        }
      }
    });
    return () => { isMounted = false; };
  }, [effectiveEquipments, data.id]);

  // Unique filter sets
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    effectiveEquipments.forEach(e => {
      if (e.general?.category) set.add(e.general.category);
    });
    return Array.from(set);
  }, [effectiveEquipments]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    effectiveEquipments.forEach(e => {
      if (e.general?.status) set.add(e.general.status);
    });
    return Array.from(set);
  }, [effectiveEquipments]);

  // Filtered inventory list
  const filteredInventoryEquipments = useMemo(() => {
    return effectiveEquipments.filter(e => {
      if (categoryFilter !== 'ALL' && e.general?.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && e.general?.status !== statusFilter) return false;
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchName = e.general?.name?.toLowerCase().includes(q);
        const matchModel = e.general?.model?.toLowerCase().includes(q);
        const matchSerial = e.general?.serial?.toLowerCase().includes(q);
        const matchAsset = (e.general?.assetNo || e.general?.assetCode || '').toLowerCase().includes(q);
        const matchMfr = e.general?.manufacturer?.toLowerCase().includes(q);
        const matchLoc = (e.org?.location || '').toLowerCase().includes(q);
        if (!matchName && !matchModel && !matchSerial && !matchAsset && !matchMfr && !matchLoc) {
          return false;
        }
      }
      return true;
    });
  }, [effectiveEquipments, categoryFilter, statusFilter, inventorySearch]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStandardGoogleDoc = () => {
    googleDriveDocsService.downloadStandardGoogleDocHtml(data);
  };

  const handleCopyStandardGoogleDoc = async () => {
    const success = await googleDriveDocsService.copyStandardHtmlForGoogleDocs(data);
    if (success) {
      setCopiedStandardDoc(true);
      setTimeout(() => setCopiedStandardDoc(false), 2500);
    }
  };

  const handleCopyInventoryTsv = async () => {
    const headers = [
      'STT',
      'Tên thiết bị',
      'Chủng loại',
      'Hãng sản xuất',
      'Model',
      'Số Serial',
      'Mã tài sản',
      'Vị trí lắp đặt',
      'Đơn vị quản lý',
      'Năm SX',
      'Năm SD',
      'Trạng thái kỹ thuật',
      'Mức ưu tiên',
      'Kỹ sư phụ trách',
      'Ghi chú kiểm kê'
    ];
    const rows = filteredInventoryEquipments.map((e, idx) => [
      idx + 1,
      e.general?.name || '',
      e.general?.category || '',
      e.general?.manufacturer || '',
      e.general?.model || '',
      e.general?.serial || '',
      e.general?.assetNo || e.general?.assetCode || '',
      e.org?.location || '',
      e.org?.unit || '',
      e.general?.yearMade || '',
      e.general?.commissioned || '',
      e.general?.status || '',
      e.general?.priority || '',
      e.org?.primaryEngineer || '',
      ''
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedInventoryTsv(true);
      setTimeout(() => setCopiedInventoryTsv(false), 2500);
    } catch (err) {
      console.error('Failed to copy TSV', err);
    }
  };

  const handleDownloadHtml = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const isInventory = viewMode === 'team_inventory';
    const isLandscape = isInventory && inventoryOrientation === 'landscape';
    const todayStr = new Date().toISOString().slice(0, 10);
    const title = isInventory 
      ? `Bao_Cao_Kiem_Ke_Thiet_Bi_CNS_${paperSize}_${todayStr}`
      : viewMode === 'all_logbooks'
      ? `Toan_Bo_So_Ly_Lich_CNS_${paperSize}_${todayStr}`
      : `Ly_Lich_Thiet_Bi_${(data.general?.model || data.general?.serial || 'CNS').replace(/\W/g, '_')}_${paperSize}`;

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { 
  size: ${paperSize === 'A5' 
    ? (isLandscape ? 'A5 landscape' : 'A5 portrait') 
    : (isLandscape ? 'A4 landscape' : 'A4 portrait')
  }; 
  margin: 0; 
}
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
  padding: ${paperSize === 'A5' ? '6mm 8mm 6mm 10mm' : '12mm 15mm 10mm 18mm'}; 
  margin: 0 auto; 
  page-break-after: always; 
  page-break-inside: avoid;
  position: relative; 
  background: #fff; 
  display: flex;
  flex-direction: column;
}
.page-sheet-landscape {
  width: ${paperSize === 'A5' ? '210mm' : '297mm'};
  min-height: ${paperSize === 'A5' ? '148mm' : '210mm'};
  height: ${paperSize === 'A5' ? '148mm' : '210mm'};
  padding: ${paperSize === 'A5' ? '5mm 8mm 5mm 8mm' : '8mm 12mm 8mm 12mm'};
  margin: 0 auto;
  page-break-after: always;
  page-break-inside: avoid;
  position: relative;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.page-sheet:last-child, .page-sheet-landscape:last-child { 
  page-break-after: auto; 
}
.pdf-table {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000;
  font-size: ${paperSize === 'A5' ? (isLandscape ? '7.5pt' : '8pt') : (isLandscape ? '9pt' : '11pt')};
}
.pdf-table th, .pdf-table td {
  border: 1px solid #000;
  padding: ${paperSize === 'A5' ? '3px 4px' : '5px 6px'};
  vertical-align: middle;
}
.pdf-table th {
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
}
.page-num {
  text-align: center;
  font-size: ${paperSize === 'A5' ? '9pt' : '11pt'};
  margin-top: auto;
  padding-top: 4mm;
  font-weight: normal;
}
</style>
</head>
<body>
${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isAdmin = currentUser?.role === 'admin';

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else console.info('[CNS Logbook]', msg);
  };

  const handleDownloadDirectPdf = async () => {
    if (!printRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgress('Đang chuẩn bị trang...');
    try {
      let filename = `So_Ly_Lich_${paperSize}.pdf`;
      let orientation: 'portrait' | 'landscape' = 'portrait';

      if (viewMode === 'team_inventory') {
        orientation = inventoryOrientation;
        filename = `Bang_Kiem_Ke_Thiet_Bi_CNS_${paperSize}_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (viewMode === 'all_logbooks') {
        orientation = 'portrait';
        filename = `Gop_Toan_Bo_${effectiveEquipments.length}_So_Ly_Lich_${paperSize}.pdf`;
      } else {
        orientation = 'portrait';
        const rawName = data.general?.name || data.id;
        const safeName = rawName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').substring(0, 40);
        filename = `So_Ly_Lich_${safeName}_${paperSize}.pdf`;
      }

      await pdfExportService.exportElementToPdf(printRef.current, {
        filename,
        orientation,
        paperSize,
        marginMm: 0,
        onProgress: (current, total) => {
          setExportProgress(`Đang tạo trang ${current}/${total}...`);
        }
      });
      notify(`✓ Đã tải file PDF (${paperSize}) thành công!`);
    } catch (err: any) {
      console.error('Lỗi xuất PDF:', err);
      notify('⚠️ Đang mở hộp thoại in trình duyệt để lưu PDF...');
      window.print();
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  const handleExportStatisticsExcel = () => {
    if (!isAdmin) {
      notify('⚠️ Chức năng xuất file thống kê chỉ dành riêng cho Quản trị viên (Admin)!');
      return;
    }
    try {
      statisticsExportService.exportToExcel(effectiveEquipments, currentUser);
      notify(`✓ Đã xuất file thống kê ${effectiveEquipments.length} sổ lý lịch dạng Excel (.xlsx)!`);
    } catch (err: any) {
      console.error('Lỗi xuất Excel thống kê:', err);
      notify('❌ Có lỗi xảy ra khi tạo file Excel thống kê.');
    }
  };

  const handleExportStatisticsCsv = () => {
    if (!isAdmin) {
      notify('⚠️ Chức năng xuất file thống kê chỉ dành riêng cho Quản trị viên (Admin)!');
      return;
    }
    try {
      statisticsExportService.exportToCsv(effectiveEquipments);
      notify(`✓ Đã xuất file thống kê CSV (UTF-8) thành công!`);
    } catch (err: any) {
      console.error('Lỗi xuất CSV thống kê:', err);
      notify('❌ Có lỗi xảy ra khi tạo file CSV.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar / Action Controls (Hidden on Print) */}
      <div className="p-4 rounded-xl bg-slate-900 text-white space-y-4 no-print shadow-md">
        {/* Row 1: Mode Segmented Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('single_logbook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'single_logbook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sổ Lý Lịch ({data.general?.name || 'Hiện tại'})</span>
            </button>

            <button
              onClick={() => setViewMode('team_inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'team_inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Bảng Kiểm Kê Toàn Đội ({effectiveEquipments.length} Thiết bị)</span>
            </button>

            <button
              onClick={() => setViewMode('all_logbooks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all_logbooks'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>In Gộp Toàn Bộ Sổ ({effectiveEquipments.length} Thiết bị)</span>
            </button>
          </div>

          {/* Quick Info Tag */}
          <div className="text-xs text-slate-400">
            {viewMode === 'team_inventory' ? (
              <span className="text-indigo-300 font-medium">
                Khổ in {paperSize} {inventoryOrientation === 'landscape' ? 'Ngang (297×210mm)' : 'Dọc (210×297mm)'} • {filteredInventoryEquipments.length} thiết bị hiển thị
              </span>
            ) : viewMode === 'all_logbooks' ? (
              <span className="text-emerald-300 font-medium">
                Ghép liên tục {paperSize} toàn bộ {effectiveEquipments.length} thiết bị chuẩn quy định Quản lý Kỹ thuật CNS
              </span>
            ) : (
              <span className="text-blue-300 font-medium">
                Sổ lý lịch biểu mẫu chuẩn Form ({paperSize}) theo quy định Quản lý Kỹ thuật CNS
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Mode-Specific Toolbar Controls */}
        {viewMode === 'team_inventory' ? (
          /* ========================================================================= */
          /* CONTROLS CHO BẢNG KIỂM KÊ TOÀN ĐỘI */
          /* ========================================================================= */
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 flex-wrap">
            {/* Search & Filter Group */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên, serial, model, vị trí..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 w-44 md:w-56 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tất cả chủng loại ({effectiveEquipments.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {uniqueStatuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              {/* Paper Size Selector (A4 vs A5) */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 p-1 rounded-lg">
                <span className="text-[11px] text-slate-400 font-medium px-1">Khổ trang:</span>
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    paperSize === 'A4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy tiêu chuẩn A4 (210 × 297 mm)"
                >
                  A4
                </button>
                <button
                  onClick={() => setPaperSize('A5')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    paperSize === 'A5' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy A5 (148 × 210 mm) - Tối ưu cho sổ tay công tác nhỏ gọn"
                >
                  A5
                </button>
              </div>

              {/* Orientation Switch */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => setInventoryOrientation('landscape')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    inventoryOrientation === 'landscape' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ in A4 Ngang (Tối ưu nhất cho nhiều cột kiểm kê)"
                >
                  Khổ Ngang
                </button>
                <button
                  onClick={() => setInventoryOrientation('portrait')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    inventoryOrientation === 'portrait' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ in A4 Dọc"
                >
                  Khổ Dọc
                </button>
              </div>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2 py-1.5 rounded-lg text-slate-300">
                <span>Dòng/trang:</span>
                <select
                  value={inventoryRowsPerPage}
                  onChange={(e) => setInventoryRowsPerPage(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-bold text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 dòng</option>
                  <option value={7}>7 dòng (Chuẩn)</option>
                  <option value={9}>9 dòng</option>
                  <option value={12}>12 dòng</option>
                </select>
              </div>

              {/* QR Code Toggle */}
              <button
                onClick={() => setShowQrInInventory(!showQrInInventory)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                  showQrInInventory
                    ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Bật/Tắt cột mã QR tra cứu sổ lý lịch trên bảng in"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mã QR: {showQrInInventory ? 'Bật' : 'Tắt'}</span>
              </button>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <button
                    onClick={handleExportStatisticsExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border border-emerald-500/50 shadow-xs transition-colors cursor-pointer"
                    title="Xuất file báo cáo thống kê chuyên sâu toàn bộ sổ lý lịch ra tệp Microsoft Excel đa trang (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xuất Thống Kê Excel</span>
                  </button>
                  <button
                    onClick={handleExportStatisticsCsv}
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                    title="Xuất dữ liệu thống kê ra file CSV (UTF-8 BOM)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV</span>
                  </button>
                </>
              )}

              <button
                onClick={handleCopyInventoryTsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Sao chép dữ liệu danh sách kiểm kê dạng bảng để dán trực tiếp vào Excel hoặc Google Sheets"
              >
                {copiedInventoryTsv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã chép TSV!</span>
                  </>
                ) : (
                  <>
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sao chép (Excel)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadDirectPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                title="Tải bảng kiểm kê thiết bị trực tiếp dưới dạng tệp tin PDF (.pdf) về máy tính"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{exportProgress || 'Đang tạo PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Tải Bảng PDF (.pdf)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHtml}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Tải file HTML bảng kiểm kê hoàn chỉnh để lưu trữ độc lập hoặc mở trên trình duyệt"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tải HTML</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Mở hộp thoại in trình duyệt để in trực tiếp hoặc Lưu dưới dạng PDF (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In A4</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'all_logbooks' ? (
          /* ========================================================================= */
          /* CONTROLS CHO IN GỘP TOÀN BỘ SỔ LÝ LỊCH */
          /* ========================================================================= */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
              <span className="font-semibold text-emerald-400">Chế độ gộp:</span>
              <span>Nối tiếp toàn bộ {effectiveEquipments.length} sổ theo chuẩn Form scan.</span>
              {/* Paper Size Selector (A4 vs A5) */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 p-1 rounded-lg ml-1">
                <span className="text-[11px] text-slate-400 font-medium px-1">Khổ:</span>
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    paperSize === 'A4' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy tiêu chuẩn A4 (210 × 297 mm)"
                >
                  A4 (Chuẩn)
                </button>
                <button
                  onClick={() => setPaperSize('A5')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                    paperSize === 'A5' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy A5 (148 × 210 mm) - Sổ tay công tác cầm tay"
                >
                  A5 (Sổ tay)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <button
                  onClick={handleExportStatisticsExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border border-emerald-500/50 shadow-xs transition-colors cursor-pointer"
                  title="Xuất file báo cáo thống kê toàn bộ sổ lý lịch ra Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất Thống Kê Excel</span>
                </button>
              )}

              <button
                onClick={handleDownloadDirectPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                title={`Tải toàn bộ sổ lý lịch gộp thành một file PDF duy nhất (.pdf) chuẩn ${paperSize}`}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{exportProgress || 'Đang tạo PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Tải PDF Gộp ({paperSize})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHtml}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tải HTML ({paperSize})</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Toàn Bộ ({paperSize})</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CONTROLS CHO SỔ LÝ LỊCH ĐƠN LẺ HIỆN TẠI */
          /* ========================================================================= */
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Paper Size Selector (A4 vs A5) */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 p-1 rounded-lg">
                <span className="text-[11px] text-slate-300 font-medium px-1">Khổ in:</span>
                <button
                  onClick={() => {
                    setPaperSize('A4');
                    if (itemsPerPageMaint === 4) setItemsPerPageMaint(7);
                  }}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    paperSize === 'A4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy tiêu chuẩn A4 (210 × 297 mm) - Chuẩn form hồ sơ kỹ thuật"
                >
                  A4 (Chuẩn)
                </button>
                <button
                  onClick={() => {
                    setPaperSize('A5');
                    if (itemsPerPageMaint === 7) setItemsPerPageMaint(4);
                  }}
                  className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    paperSize === 'A5' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Khổ giấy A5 (148 × 210 mm) - Sổ tay công tác nhỏ gọn chuẩn form"
                >
                  A5 (Sổ tay)
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg">
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Dòng BD/trang:</span>
                <select
                  value={itemsPerPageMaint}
                  onChange={(e) => setItemsPerPageMaint(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-semibold text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value={4}>4 dòng {paperSize === 'A5' ? '(Khuyên dùng A5)' : ''}</option>
                  <option value={5}>5 dòng</option>
                  <option value={7}>7 dòng {paperSize === 'A4' ? '(Chuẩn A4)' : ''}</option>
                  <option value={9}>9 dòng</option>
                </select>
              </div>

              <button
                onClick={() => setViewMode('team_inventory')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-500/30 shadow-2xs transition-colors cursor-pointer"
                title="Chuyển nhanh sang chế độ Bảng kiểm kê toàn đội"
              >
                <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xem Bảng Kiểm Kê Toàn Đội</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadStandardGoogleDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200 shadow-2xs transition-colors cursor-pointer"
                title="Tải file HTML biểu mẫu chuẩn Google Docs (8 trang chuẩn để tải lên hoặc mở bằng Docs)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải Google Docs chuẩn</span>
              </button>

              <button
                onClick={handleCopyStandardGoogleDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Sao chép toàn bộ nội dung chuẩn 8 trang để dán trực tiếp vào Google Docs"
              >
                {copiedStandardDoc ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Sao chép cho Docs</span>
                  </>
                )}
              </button>

              <a
                href={data.googleDocUrl || `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (data.general?.name || data.id))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Mở tài liệu Google Docs trực tuyến"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Docs</span>
              </a>

              {/* Direct PDF Download Button */}
              <button
                onClick={handleDownloadDirectPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                title={`Tải sổ lý lịch thiết bị dưới dạng tệp tin PDF (.pdf) chuẩn ${paperSize}`}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{exportProgress || 'Đang tạo PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Tải Sổ PDF ({paperSize})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHtml}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Tải file HTML nguyên bản để lưu trữ hoặc in độc lập"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Tải HTML Sổ</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Mở hộp thoại in trình duyệt để in ấn trực tiếp hoặc Lưu thành file PDF (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Sổ ({paperSize})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINT STYLES INJECTION */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'A5' 
              ? (viewMode === 'team_inventory' && inventoryOrientation === 'landscape' ? 'A5 landscape' : 'A5 portrait') 
              : (viewMode === 'team_inventory' && inventoryOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait')
            };
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print, header, nav, aside, footer {
            display: none !important;
          }
          .page-sheet {
            width: ${paperSize === 'A5' ? '148mm' : '210mm'} !important;
            height: ${paperSize === 'A5' ? '210mm' : '297mm'} !important;
            min-height: ${paperSize === 'A5' ? '210mm' : '297mm'} !important;
            padding: ${paperSize === 'A5' ? '8mm 10mm 8mm 12mm' : '12mm 15mm 10mm 18mm'} !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: #fff !important;
          }
          .page-sheet-landscape {
            width: ${paperSize === 'A5' ? '210mm' : '297mm'} !important;
            height: ${paperSize === 'A5' ? '148mm' : '210mm'} !important;
            min-height: ${paperSize === 'A5' ? '148mm' : '210mm'} !important;
            padding: ${paperSize === 'A5' ? '5mm 8mm 5mm 8mm' : '8mm 12mm 8mm 12mm'} !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: #fff !important;
          }
          .page-sheet:last-child, .page-sheet-landscape:last-child {
            page-break-after: auto !important;
          }
          .pdf-table {
            border: 1.5px solid #000 !important;
          }
          .pdf-table th, .pdf-table td {
            border: 1px solid #000 !important;
          }
        }
      `}</style>

      {/* Pages Container - Interactive Preview & Print Source */}
      <div 
        ref={printRef}
        className="bg-slate-200/80 p-4 md:p-8 rounded-xl overflow-x-auto space-y-8 print:bg-white print:p-0 print:m-0 print:space-y-0 border border-slate-300"
        style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
      >
        {viewMode === 'team_inventory' ? (
          <TeamInventoryPrintView
            equipments={filteredInventoryEquipments}
            orientation={inventoryOrientation}
            paperSize={paperSize}
            rowsPerPage={inventoryRowsPerPage}
            showQr={showQrInInventory}
            qrCodeMap={qrCodeMap}
            companyName={data.org?.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}
            onSelectEquipment={(id) => {
              if (onSelectEquipment) {
                onSelectEquipment(id);
                setViewMode('single_logbook');
              }
            }}
          />
        ) : viewMode === 'all_logbooks' ? (
          effectiveEquipments.map((eq, i) => (
            <EquipmentLogbookPrintPages
              key={eq.id}
              equipment={eq}
              coverQrUrl={qrCodeMap[eq.id] || coverQrUrl}
              itemsPerPageMaint={itemsPerPageMaint}
              keyPrefix={`all-${eq.id}-${i}`}
              paperSize={paperSize}
            />
          ))
        ) : (
          <EquipmentLogbookPrintPages
            equipment={data}
            coverQrUrl={coverQrUrl}
            itemsPerPageMaint={itemsPerPageMaint}
            keyPrefix="single"
            paperSize={paperSize}
          />
        )}
      </div>
    </div>
  );
};
