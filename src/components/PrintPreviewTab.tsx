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
  Table
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';
import { generateEquipmentQrDataUrl } from '../utils/qrCodeService';
import { googleDriveDocsService } from '../utils/googleDriveDocsService';
import { TeamInventoryPrintView } from './TeamInventoryPrintView';
import { EquipmentLogbookPrintPages } from './EquipmentLogbookPrintPages';
import { StatsReportPrintView } from './StatsReportPrintView';

interface PrintPreviewTabProps {
  data: EquipmentData;
  allEquipments?: EquipmentData[];
  onSelectEquipment?: (id: string) => void;
}

export const PrintPreviewTab: React.FC<PrintPreviewTabProps> = ({ 
  data, 
  allEquipments, 
  onSelectEquipment 
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // View modes:
  // 'single_logbook': Sổ lý lịch 8 trang của thiết bị đang chọn
  // 'team_inventory': Bảng tổng hợp kiểm kê toàn bộ thiết bị hiện có (PDF khổ ngang/dọc)
  // 'all_logbooks': In gộp toàn bộ 8 trang sổ lý lịch của tất cả thiết bị
  // 'logbook_stats': Báo cáo thống kê tổng hợp sổ lý lịch và trang thiết bị CNS
  const [viewMode, setViewMode] = useState<'single_logbook' | 'team_inventory' | 'all_logbooks' | 'logbook_stats'>('single_logbook');

  // Single logbook settings
  const [itemsPerPageMaint, setItemsPerPageMaint] = useState<number>(7);
  const [coverQrUrl, setCoverQrUrl] = useState<string>('');
  const [copiedStandardDoc, setCopiedStandardDoc] = useState<boolean>(false);

  // Team inventory settings
  const [inventoryOrientation, setInventoryOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [inventoryRowsPerPage, setInventoryRowsPerPage] = useState<number>(7);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [showQrInInventory, setShowQrInInventory] = useState<boolean>(true);
  const [copiedInventoryTsv, setCopiedInventoryTsv] = useState<boolean>(false);
  const [copiedStatsTsv, setCopiedStatsTsv] = useState<boolean>(false);

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

  const handleCopyStatsTsv = async () => {
    const lines: string[] = [];
    lines.push('THỐNG KÊ SỔ LÝ LỊCH THIẾT BỊ CNS');
    lines.push(`Thời gian xuất:\t${new Date().toLocaleString('vi-VN')}`);
    lines.push('');
    
    lines.push('I. TRẠNG THÁI HOẠT ĐỘNG CHUNG');
    lines.push('Trạng thái kỹ thuật\tSố lượng\tTỷ lệ');
    const total = effectiveEquipments.length;
    let active = 0, standby = 0, maint = 0, tempOff = 0;
    effectiveEquipments.forEach(eq => {
      const s = eq.general?.status;
      if (s === 'Đang khai thác') active++;
      else if (s === 'Dự phòng sẵn sàng') standby++;
      else if (s === 'Đang bảo dưỡng/sửa chữa') maint++;
      else if (s === 'Tạm ngừng khai thác') tempOff++;
    });
    lines.push(`Đang khai thác trực tuyến\t${active}\t${total > 0 ? Math.round((active/total)*100) : 0}%`);
    lines.push(`Dự phòng sẵn sàng (Standby)\t${standby}\t${total > 0 ? Math.round((standby/total)*100) : 0}%`);
    lines.push(`Đang sửa chữa / Tạm ngưng\t${maint + tempOff}\t${total > 0 ? Math.round(((maint + tempOff)/total)*100) : 0}%`);
    lines.push(`TỔNG CỘNG HỒ SƠ\t${total}\t100%`);
    lines.push('');
    
    lines.push('II. CƠ CẤU THIẾT BỊ THEO CHUYÊN NGÀNH KỸ THUẬT');
    lines.push('Chủng loại thiết bị\tTổng số\tĐang khai thác\tDự phòng\tĐang bảo dưỡng/SC\tTỷ lệ');
    const categories: EquipmentCategory[] = ['VHF/UHF', 'VCCS', 'VIBA', 'POWER', 'IT', 'RADAR_ADS', 'NAV'];
    categories.forEach(cat => {
      let t = 0, a = 0, s = 0, m = 0;
      effectiveEquipments.forEach(eq => {
        if (eq.general?.category === cat) {
          t++;
          const st = eq.general?.status;
          if (st === 'Đang khai thác') a++;
          else if (st === 'Dự phòng sẵn sàng') s++;
          else m++;
        }
      });
      lines.push(`${cat}\t${t}\t${a}\t${s}\t${m}\t${total > 0 ? Math.round((t/total)*100) : 0}%`);
    });
    lines.push('');
    
    lines.push('III. CƠ CẤU THEO MỨC ĐỘ QUAN TRỌNG');
    lines.push('Mức độ ưu tiên\tSố lượng\tTỷ lệ');
    let l1 = 0, l2 = 0, l3 = 0;
    effectiveEquipments.forEach(eq => {
      const p = eq.general?.priority;
      if (p === 'Hệ thống chính (Level 1)') l1++;
      else if (p === 'Hệ thống dự phòng nóng (Level 2)') l2++;
      else if (p === 'Hệ thống phụ trợ (Level 3)') l3++;
    });
    const sumP = l1 + l2 + l3;
    lines.push(`Hệ thống chính (Level 1)\t${l1}\t${sumP > 0 ? Math.round((l1/sumP)*100) : 0}%`);
    lines.push(`Hệ thống dự phòng nóng (Level 2)\t${l2}\t${sumP > 0 ? Math.round((l2/sumP)*100) : 0}%`);
    lines.push(`Hệ thống phụ trợ (Level 3)\t${l3}\t${sumP > 0 ? Math.round((l3/sumP)*100) : 0}%`);
    
    const tsv = lines.join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedStatsTsv(true);
      setTimeout(() => setCopiedStatsTsv(false), 2500);
    } catch (err) {
      console.error('Failed to copy statistics TSV', err);
    }
  };

  const handleDownloadHtml = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const isInventory = viewMode === 'team_inventory';
    const isLandscape = isInventory && inventoryOrientation === 'landscape';
    const todayStr = new Date().toISOString().slice(0, 10);
    const title = isInventory 
      ? `Bao_Cao_Kiem_Ke_Thiet_Bi_CNS_${todayStr}`
      : viewMode === 'logbook_stats'
      ? `Bao_Cao_Thong_Ke_So_Ly_Lich_CNS_${todayStr}`
      : viewMode === 'all_logbooks'
      ? `Toan_Bo_So_Ly_Lich_CNS_${todayStr}`
      : `Ly_Lich_Thiet_Bi_${(data.general?.model || data.general?.serial || 'CNS').replace(/\W/g, '_')}`;

    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page { 
  size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'}; 
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
  width: 210mm; 
  min-height: 297mm; 
  height: 297mm;
  padding: 12mm 15mm 10mm 18mm; 
  margin: 0 auto; 
  page-break-after: always; 
  page-break-inside: avoid;
  position: relative; 
  background: #fff; 
  display: flex;
  flex-direction: column;
}
.page-sheet-landscape {
  width: 297mm;
  min-height: 210mm;
  height: 210mm;
  padding: 8mm 12mm 8mm 12mm;
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
  font-size: ${isLandscape ? '9pt' : '11pt'};
}
.pdf-table th, .pdf-table td {
  border: 1px solid #000;
  padding: 5px 6px;
  vertical-align: middle;
}
.pdf-table th {
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
}
.page-num {
  text-align: center;
  font-size: 11pt;
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

            <button
              onClick={() => setViewMode('logbook_stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'logbook_stats'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Báo Cáo Thống Kê Sổ ({effectiveEquipments.length} Thiết bị)</span>
            </button>
          </div>

          {/* Quick Info Tag */}
          <div className="text-xs text-slate-400">
            {viewMode === 'team_inventory' ? (
              <span className="text-indigo-300 font-medium">
                Khổ in {inventoryOrientation === 'landscape' ? 'A4 Ngang (297×210mm)' : 'A4 Dọc (210×297mm)'} • {filteredInventoryEquipments.length} thiết bị hiển thị
              </span>
            ) : viewMode === 'logbook_stats' ? (
              <span className="text-amber-300 font-medium">
                Báo cáo tổng hợp số liệu kỹ thuật, chủng loại, vòng đời & nhật ký vận hành CNS
              </span>
            ) : viewMode === 'all_logbooks' ? (
              <span className="text-emerald-300 font-medium">
                Ghép liên tục 8 trang của {effectiveEquipments.length} thiết bị (~{effectiveEquipments.length * 8} trang A4)
              </span>
            ) : (
              <span className="text-blue-300 font-medium">
                Sổ lý lịch 8 trang chuẩn theo quy định Quản lý Kỹ thuật CNS
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
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Tải file HTML bảng kiểm kê hoàn chỉnh để lưu trữ độc lập hoặc mở trên trình duyệt"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tải HTML Báo Cáo</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Mở hộp thoại in trình duyệt để in trực tiếp hoặc Lưu dưới dạng PDF (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / Xuất PDF Toàn Đội</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'logbook_stats' ? (
          /* ========================================================================= */
          /* CONTROLS CHO BÁO CÁO THỐNG KÊ SỔ LÝ LỊCH */
          /* ========================================================================= */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-amber-400">Thống kê sổ lý lịch:</span>
              <span>Xuất dữ liệu tổng hợp CNS, phân loại chuyên ngành & chất lượng vận hành toàn đội.</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyStatsTsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Sao chép bảng thống kê tổng hợp để dán nhanh vào Microsoft Excel hoặc Google Sheets"
              >
                {copiedStatsTsv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã chép TSV!</span>
                  </>
                ) : (
                  <>
                    <Table className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sao chép Excel (TSV)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Tải tệp HTML báo cáo thống kê độc lập"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Tải HTML Báo Cáo</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="In báo cáo trực tiếp hoặc lưu dưới dạng PDF khổ đứng A4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / Xuất PDF Thống Kê</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'all_logbooks' ? (
          /* ========================================================================= */
          /* CONTROLS CHO IN GỘP TOÀN BỘ SỔ LÝ LỊCH */
          /* ========================================================================= */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Chế độ gộp:</span>
              <span>In nối tiếp toàn bộ {effectiveEquipments.length} sổ lý lịch theo chuẩn Form scan 8 trang/sổ.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tải HTML Toàn Bộ Sổ</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / Xuất PDF Gộp ({effectiveEquipments.length} Sổ)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CONTROLS CHO SỔ LÝ LỊCH ĐƠN LẺ HIỆN TẠI */
          /* ========================================================================= */
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg">
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Dòng bảo dưỡng/trang:</span>
                <select
                  value={itemsPerPageMaint}
                  onChange={(e) => setItemsPerPageMaint(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-semibold text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 dòng</option>
                  <option value={7}>7 dòng (Chuẩn)</option>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Mở tài liệu Google Docs trực tuyến"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Google Docs</span>
              </a>

              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Tải file HTML nguyên bản để lưu trữ hoặc in độc lập"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Tải HTML Sổ</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / Xuất PDF (Ctrl+P)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINT STYLES INJECTION */}
      <style>{`
        @media print {
          @page {
            size: ${viewMode === 'team_inventory' && inventoryOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
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
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            padding: 12mm 15mm 10mm 18mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: #fff !important;
          }
          .page-sheet-landscape {
            width: 297mm !important;
            height: 210mm !important;
            min-height: 210mm !important;
            padding: 8mm 12mm 8mm 12mm !important;
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
        ) : viewMode === 'logbook_stats' ? (
          <StatsReportPrintView
            equipments={effectiveEquipments}
            companyName={data.org?.companyName}
          />
        ) : viewMode === 'all_logbooks' ? (
          effectiveEquipments.map((eq, i) => (
            <EquipmentLogbookPrintPages
              key={eq.id}
              equipment={eq}
              coverQrUrl={qrCodeMap[eq.id] || coverQrUrl}
              itemsPerPageMaint={itemsPerPageMaint}
              keyPrefix={`all-${eq.id}-${i}`}
            />
          ))
        ) : (
          <EquipmentLogbookPrintPages
            equipment={data}
            coverQrUrl={coverQrUrl}
            itemsPerPageMaint={itemsPerPageMaint}
            keyPrefix="single"
          />
        )}
      </div>
    </div>
  );
};
