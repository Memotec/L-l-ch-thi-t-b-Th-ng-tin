import React, { useState, useMemo, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  FileBadge,
  Layers,
  Wrench,
  AlertOctagon,
  ArrowRightLeft,
  Cloud,
  FileSpreadsheet,
  FileText,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  HardDrive,
  PhoneCall,
  Zap,
  Server,
  Radar,
  Compass,
  Box,
  Printer,
  ChevronRight,
  Eye,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  Activity
} from 'lucide-react';
import { EquipmentData, OrgTransferRow, EquipmentCategory, EquipmentStatus, EquipmentPriority } from '../types';

interface DashboardTabProps {
  data: EquipmentData;
  allEquipments?: EquipmentData[];
  onChange: (updated: EquipmentData) => void;
  onNavigateTab: (tab: string) => void;
  onSelectEquipment?: (id: string) => void;
  onNewEquipment?: () => void;
  onOpenPdfModal?: (eq: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  data, 
  allEquipments = [], 
  onChange, 
  onNavigateTab, 
  onSelectEquipment,
  onNewEquipment,
  onOpenPdfModal,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  // Search & Filter state for the equipment list
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const updateGeneral = (field: string, value: any) => {
    onChange({
      ...data,
      general: {
        ...data.general,
        [field]: value
      }
    });
  };

  const updateOrg = (field: string, value: any) => {
    onChange({
      ...data,
      org: {
        ...data.org,
        [field]: value
      }
    });
  };

  const addOrgRow = () => {
    const newRow: OrgTransferRow = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      unit: '',
      handoverDocNo: '',
      status: 'Bàn giao nguyên trạng hoạt động tốt',
      note: ''
    };
    onChange({
      ...data,
      orgRows: [...data.orgRows, newRow]
    });
  };

  const updateOrgRow = (index: number, field: keyof OrgTransferRow, value: string) => {
    const newRows = [...data.orgRows];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange({ ...data, orgRows: newRows });
  };

  const removeOrgRow = (index: number) => {
    const newRows = data.orgRows.filter((_, i) => i !== index);
    onChange({ ...data, orgRows: newRows });
  };

  // Helper icon for equipment categories
  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-4 h-4 text-sky-400" />;
      case 'VIBA': return <HardDrive className="w-4 h-4 text-emerald-400" />;
      case 'VOICE': return <PhoneCall className="w-4 h-4 text-amber-400" />;
      case 'POWER': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'IT': return <Server className="w-4 h-4 text-purple-400" />;
      case 'RADAR_ADS': return <Radar className="w-4 h-4 text-rose-400" />;
      case 'NAV': return <Compass className="w-4 h-4 text-cyan-400" />;
      default: return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'Đang khai thác':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Đang khai thác
          </span>
        );
      case 'Dự phòng sẵn sàng':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Dự phòng sẵn sàng
          </span>
        );
      case 'Đang bảo dưỡng/sửa chữa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Đang bảo dưỡng/SC
          </span>
        );
      case 'Tạm ngừng khai thác':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Tạm ngừng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600">
            {status}
          </span>
        );
    }
  };

  // Filtered equipments list
  const filteredEquipments = useMemo(() => {
    return allEquipments.filter(eq => {
      const matchText = filterText.trim() === '' || 
        eq.general.name.toLowerCase().includes(filterText.toLowerCase()) ||
        eq.general.model.toLowerCase().includes(filterText.toLowerCase()) ||
        eq.general.serial.toLowerCase().includes(filterText.toLowerCase()) ||
        (eq.general.assetNo && eq.general.assetNo.toLowerCase().includes(filterText.toLowerCase())) ||
        (eq.general.assetCode && eq.general.assetCode.toLowerCase().includes(filterText.toLowerCase())) ||
        eq.org.unit.toLowerCase().includes(filterText.toLowerCase()) ||
        eq.org.location.toLowerCase().includes(filterText.toLowerCase());

      const matchCat = selectedCategory === 'ALL' || eq.general.category === selectedCategory;
      const matchStat = selectedStatus === 'ALL' || eq.general.status === selectedStatus;
      const matchPri = selectedPriority === 'ALL' || eq.general.priority === selectedPriority;

      return matchText && matchCat && matchStat && matchPri;
    });
  }, [allEquipments, filterText, selectedCategory, selectedStatus, selectedPriority]);

  // System-wide KPI counts (memoized)
  const { totalEquipmentsCount, activeCount, standbyCount, maintenanceCount, totalSystemComponents, totalSystemMaintenance } = useMemo(() => {
    let active = 0;
    let standby = 0;
    let maintenance = 0;
    let comps = 0;
    let maints = 0;

    for (let i = 0; i < allEquipments.length; i++) {
      const eq = allEquipments[i];
      const st = eq.general.status;
      if (st === 'Đang khai thác') active++;
      else if (st === 'Dự phòng sẵn sàng') standby++;
      else if (st === 'Đang bảo dưỡng/sửa chữa' || st === 'Tạm ngừng khai thác') maintenance++;

      comps += eq.components?.length || 0;
      maints += eq.maintenance?.length || 0;
    }

    return {
      totalEquipmentsCount: allEquipments.length,
      activeCount: active,
      standbyCount: standby,
      maintenanceCount: maintenance,
      totalSystemComponents: comps,
      totalSystemMaintenance: maints
    };
  }, [allEquipments]);

  // Stats for currently selected equipment (memoized)
  const { commissionedYear, serviceYears, totalComponents, goodComponents, totalMaintenance, totalRepairs } = useMemo(() => {
    const commYear = data.general.commissioned ? new Date(data.general.commissioned).getFullYear() : null;
    const curYear = new Date().getFullYear();
    return {
      commissionedYear: commYear,
      serviceYears: commYear ? Math.max(0, curYear - commYear) : 0,
      totalComponents: data.components?.length || 0,
      goodComponents: data.components?.filter(c => c.healthStatus === 'Tốt').length || 0,
      totalMaintenance: data.maintenance?.length || 0,
      totalRepairs: data.repair?.length || 0
    };
  }, [data]);

  const handleSelectAndOpen = useCallback((eqId: string, targetTab: string = 'general') => {
    if (onSelectEquipment) {
      onSelectEquipment(eqId);
    }
    onNavigateTab(targetTab);
  }, [onSelectEquipment, onNavigateTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION 1: SYSTEM KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cns-glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">Tổng số sổ thiết bị</div>
            <div className="text-2xl font-extrabold text-white mt-1 font-mono">{totalEquipmentsCount} <span className="text-xs font-normal text-slate-300">hồ sơ</span></div>
            <div className="text-[11px] text-slate-400 mt-1">Đã chuẩn hóa định danh</div>
          </div>
          <div className="p-3 bg-blue-950/60 text-sky-400 rounded-xl border border-blue-500/40">
            <FileBadge className="w-6 h-6" />
          </div>
        </div>

        <div className="cns-glass-card-emerald p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Đang khai thác</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{activeCount} <span className="text-xs font-normal text-slate-300">thiết bị</span></div>
            <div className="text-[11px] text-emerald-300/80 mt-1">Hoạt động bình thường 24/7</div>
          </div>
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-500/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="cns-glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">Dự phòng sẵn sàng</div>
            <div className="text-2xl font-extrabold text-sky-400 mt-1 font-mono">{standbyCount} <span className="text-xs font-normal text-slate-300">thiết bị</span></div>
            <div className="text-[11px] text-sky-300/80 mt-1">Chế độ Hot/Cold Standby</div>
          </div>
          <div className="p-3 bg-sky-950/60 text-sky-400 rounded-xl border border-sky-500/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="cns-glass-card-amber p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Bảo dưỡng / Tạm dừng</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">{maintenanceCount} <span className="text-xs font-normal text-slate-300">thiết bị</span></div>
            <div className="text-[11px] text-amber-300/80 mt-1">Cần theo dõi & kiểm tra</div>
          </div>
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-500/40">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 2: MAIN EQUIPMENT REGISTRY & MANAGEMENT (DANH SÁCH TẤT CẢ SỔ THIẾT BỊ) */}
      <div className="cns-glass-card rounded-2xl overflow-hidden">
        {/* Header with Title and Action buttons */}
        <div className="p-5 border-b border-[#182d5a] bg-gradient-to-r from-[#0d1e47] via-[#091533] to-[#0d1e47] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl text-white shadow-lg border border-sky-400/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Danh Sách Các Sổ Lý Lịch Thiết Bị Đã Thêm
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  {allEquipments.length} sổ
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Quan sát tổng thể, tra cứu nhanh, kích hoạt xem và quản trị hồ sơ kỹ thuật các đài/trạm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#060e24] border border-[#1e3c7a] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hiển thị dạng thẻ (Card View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dạng thẻ</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hiển thị dạng bảng (Table View)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dạng bảng</span>
              </button>
            </div>

            {/* Add New Equipment Button */}
            {onNewEquipment && (
              <button
                onClick={isReadOnly ? onOpenLoginModal : onNewEquipment}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  isReadOnly
                    ? 'bg-[#0e1d44] hover:bg-[#162d66] text-slate-300 border-[#1e3c7a]'
                    : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-lg shadow-sky-950/60 border-sky-400/40'
                }`}
                title={isReadOnly ? 'Đăng nhập để thêm sổ mới' : 'Thêm sổ thiết bị mới'}
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sổ Thiết Bị Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Multi-filter Controls Bar */}
        <div className="p-4 bg-[#08132f] border-b border-[#182d5a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/70" />
            <input
              type="text"
              placeholder="Tìm theo tên, model, serial, số tài sản, vị trí..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#050c1e] border border-[#1e3c7a] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all font-medium"
            />
            {filterText && (
              <button 
                onClick={() => setFilterText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#050c1e] border border-[#1e3c7a] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="ALL">-- Tất cả chủng loại --</option>
              <option value="VHF/UHF">VHF/UHF Air-Ground</option>
              <option value="VIBA">Viba / Truyền dẫn số</option>
              <option value="VOICE">Chuyển mạch thoại / Ghi âm</option>
              <option value="POWER">Nguồn điện / UPS / Máy nổ</option>
              <option value="IT">Mạng máy tính / Server CNS</option>
              <option value="RADAR_ADS">Ra-đa / ADS-B / MLAT</option>
              <option value="NAV">Dẫn đường (ILS/DVOR/DME)</option>
              <option value="OTHER">Chuyên ngành khác</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#050c1e] border border-[#1e3c7a] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="Đang khai thác">Đang khai thác</option>
              <option value="Dự phòng sẵn sàng">Dự phòng sẵn sàng</option>
              <option value="Đang bảo dưỡng/sửa chữa">Đang bảo dưỡng/sửa chữa</option>
              <option value="Tạm ngừng khai thác">Tạm ngừng khai thác</option>
              <option value="Đã thanh lý">Đã thanh lý</option>
            </select>
          </div>

          {/* Priority / Level Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-[#050c1e] border border-[#1e3c7a] rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="ALL">-- Tất cả phân nhóm --</option>
              <option value="Hệ thống chính (Level 1)">Nhóm 1 (Level 1 - Thiết bị chính)</option>
              <option value="Hệ thống dự phòng nóng (Level 2)">Nhóm 2 (Level 2 - Dự phòng)</option>
              <option value="Hệ thống phụ trợ (Level 3)">Nhóm 3 (Level 3 - Phụ trợ)</option>
            </select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="px-5 py-2 bg-[#060e24] border-b border-[#182d5a] flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Hiển thị <span className="font-bold text-sky-300">{filteredEquipments.length}</span> trên tổng số <span className="font-bold text-white">{allEquipments.length}</span> sổ thiết bị
            {filterText && <span> cho từ khóa "<span className="text-amber-300 font-medium">{filterText}</span>"</span>}
          </div>
          {(filterText || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
            <button
              onClick={() => {
                setFilterText('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
              }}
              className="text-sky-400 hover:text-sky-200 underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Equipment Content: GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipments.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-sky-950/60 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                  <Search className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">Không tìm thấy sổ thiết bị nào phù hợp</div>
                <p className="text-xs text-slate-400">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bớt bộ lọc.</p>
              </div>
            ) : (
              filteredEquipments.map((eq) => {
                const isSelected = eq.id === data.id;
                const eqComponentsCount = eq.components?.length || 0;
                const eqMaintCount = eq.maintenance?.length || 0;
                const eqRepairCount = eq.repair?.length || 0;

                return (
                  <div
                    key={eq.id}
                    className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#0f2452] to-[#0b1739] border-sky-400 ring-2 ring-sky-400/30 shadow-sky-950/50'
                        : 'bg-[#08132f] border-[#182d5a] hover:border-sky-500/50 hover:bg-[#0c1c45]'
                    }`}
                  >
                    {/* Top Tag & Status Header */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="p-1.5 rounded-lg bg-[#060e24] border border-[#1e3c7a]">
                            {getCategoryIcon(eq.general.category)}
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#0e1d44] text-sky-300 border border-[#1e3c7a]">
                            {eq.general.category}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Đang chọn
                            </span>
                          )}
                        </div>

                        <div>
                          {getStatusBadge(eq.general.status)}
                        </div>
                      </div>

                      {/* Equipment Name & Model */}
                      <div>
                        <h3 
                          onClick={() => handleSelectAndOpen(eq.id, 'general')}
                          className="font-bold text-sm text-white hover:text-sky-300 cursor-pointer line-clamp-2 leading-snug transition-colors"
                          title={eq.general.name}
                        >
                          {eq.general.name || 'Chưa đặt tên thiết bị'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-sky-200/70 mt-1 font-mono">
                          <span>Model: <b className="text-slate-200">{eq.general.model || 'N/A'}</b></span>
                          <span>•</span>
                          <span>SN: <b className="text-sky-300">{eq.general.serial || 'N/A'}</b></span>
                        </div>
                      </div>

                      {/* Location & Unit */}
                      <div className="space-y-1 text-xs text-slate-300 pt-1 border-t border-[#162d5a]">
                        <div className="flex items-center gap-1.5 truncate text-[11.5px]">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate" title={eq.org.location}>{eq.org.location || 'Chưa gán vị trí'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate text-[11px] text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-sky-400/70 shrink-0" />
                          <span className="truncate" title={eq.org.unit}>{eq.org.unit || 'Chưa gán đơn vị'}</span>
                        </div>
                      </div>

                      {/* Micro Stats (Linh kiện, bảo dưỡng, sửa chữa) */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10.5px]">
                        <div className="p-1.5 bg-[#060e24] rounded-lg border border-[#162d5a]">
                          <div className="text-slate-400">Linh kiện</div>
                          <div className="font-bold text-sky-300 font-mono">{eqComponentsCount}</div>
                        </div>
                        <div className="p-1.5 bg-[#060e24] rounded-lg border border-[#162d5a]">
                          <div className="text-slate-400">Bảo dưỡng</div>
                          <div className="font-bold text-emerald-300 font-mono">{eqMaintCount}</div>
                        </div>
                        <div className="p-1.5 bg-[#060e24] rounded-lg border border-[#162d5a]">
                          <div className="text-slate-400">Sự cố/SC</div>
                          <div className="font-bold text-amber-300 font-mono">{eqRepairCount}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-3 bg-[#060e24] border-t border-[#182d5a] flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleSelectAndOpen(eq.id, 'general')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mở Sổ Chi Tiết</span>
                      </button>

                      <button
                        onClick={() => handleSelectAndOpen(eq.id, 'printPreview')}
                        className="p-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-emerald-300 hover:text-emerald-100 rounded-lg border border-[#1e3c7a] transition-colors cursor-pointer"
                        title="In Sổ A4 / Xuất PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSelectAndOpen(eq.id, 'qrCode')}
                        className="p-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-300 hover:text-sky-100 rounded-lg border border-[#1e3c7a] transition-colors cursor-pointer"
                        title="Mã QR tra cứu di động"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {onOpenPdfModal && (
                        <button
                          onClick={() => onOpenPdfModal(eq)}
                          className="p-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-amber-300 hover:text-amber-100 rounded-lg border border-[#1e3c7a] transition-colors cursor-pointer"
                          title="Xem nhanh bản PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Equipment Content: TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Tên Thiết Bị & Model</th>
                  <th className="p-3 w-36">Chủng Loại</th>
                  <th className="p-3 w-36">Serial / Mã TS</th>
                  <th className="p-3">Đơn Vị & Vị Trí Lắp Đặt</th>
                  <th className="p-3 w-36 text-center">Trạng Thái</th>
                  <th className="p-3 w-28 text-center">Linh Kiện / BD</th>
                  <th className="p-3 w-36 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182d5a] bg-[#060e24] text-slate-200">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                      Không tìm thấy sổ thiết bị nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((eq, idx) => {
                    const isSelected = eq.id === data.id;
                    return (
                      <tr 
                        key={eq.id} 
                        className={`hover:bg-[#0c183a] transition-colors ${
                          isSelected ? 'bg-sky-950/40 font-medium' : ''
                        }`}
                      >
                        <td className="p-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-[#091533] border border-[#1e3c7a] shrink-0">
                              {getCategoryIcon(eq.general.category)}
                            </div>
                            <div>
                              <div 
                                onClick={() => handleSelectAndOpen(eq.id, 'general')}
                                className="font-bold text-white hover:text-sky-300 cursor-pointer transition-colors"
                              >
                                {eq.general.name || 'Chưa đặt tên'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Model: {eq.general.model || 'N/A'} • Hãng: {eq.general.manufacturer || 'N/A'}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                Đang xem
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-sky-200">
                          {eq.general.category}
                        </td>
                        <td className="p-3 font-mono">
                          <div className="text-sky-300 font-bold">{eq.general.serial || '---'}</div>
                          <div className="text-[10px] text-slate-400">{eq.general.assetNo || eq.general.assetCode || ''}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div className="font-medium truncate max-w-xs">{eq.org.location || '---'}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{eq.org.unit || '---'}</div>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(eq.general.status)}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-sky-300 font-bold">{eq.components?.length || 0} LK</span> / <span className="text-emerald-300 font-bold">{eq.maintenance?.length || 0} BD</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSelectAndOpen(eq.id, 'general')}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                              title="Mở hồ sơ sổ này"
                            >
                              Mở Sổ
                            </button>
                            <button
                              onClick={() => handleSelectAndOpen(eq.id, 'printPreview')}
                              className="p-1 bg-[#0e1d44] hover:bg-[#162d66] text-emerald-300 rounded border border-[#1e3c7a] cursor-pointer"
                              title="In Sổ A4"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSelectAndOpen(eq.id, 'qrCode')}
                              className="p-1 bg-[#0e1d44] hover:bg-[#162d66] text-sky-300 rounded border border-[#1e3c7a] cursor-pointer"
                              title="Mã QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: CURRENT EQUIPMENT OVERVIEW & QUICK EDIT (HỒ SƠ ĐANG CHỌN) */}
      <div className="space-y-6 pt-4 border-t border-[#182d5a]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-extrabold text-white">
              Chi Tiết Hồ Sơ Đang Chọn: <span className="text-sky-300">{data.general.name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('general')}
              className="flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-white px-3 py-1.5 bg-[#091533] hover:bg-[#12285a] rounded-xl border border-[#1e3c7a] transition-all cursor-pointer"
            >
              <span>Xem Mục 1: Tổng quan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Identification & Categorization Section */}
        <div className="cns-glass-card rounded-xl p-6">
          <div className="border-b border-[#182d5a] pb-3 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-sky-400" />
                Thông tin định danh & Phân loại chủng loại thiết bị
              </h2>
              <p className="text-xs text-sky-200/70 mt-0.5">Xác lập các thuộc tính cơ sở, mã định danh tài sản và mức độ ưu tiên khai thác</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Chủng loại thiết bị CNS *</label>
              <select
                id="cat-select"
                disabled={isReadOnly}
                value={data.general.category}
                onChange={(e) => updateGeneral('category', e.target.value as EquipmentCategory)}
                className={`w-full text-xs rounded-lg p-2.5 font-medium border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-slate-100 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              >
                <option value="VHF/UHF" className="bg-[#091533]">VHF/UHF Air-Ground Radio (T6T, Jotron, Rohde&Schwarz)</option>
                <option value="VIBA" className="bg-[#091533]">Viba / Truyền dẫn số (Ceragon, Nokia, SIAE)</option>
                <option value="VOICE" className="bg-[#091533]">Hệ thống chuyển mạch thoại / Ghi âm (SITTI, Frequentis, Rohill)</option>
                <option value="POWER" className="bg-[#091533]">Hệ thống Nguồn điện (UPS, DC Rectifier, Máy nổ phát điện)</option>
                <option value="IT" className="bg-[#091533]">Thiết bị Mạng & Máy chủ (Switch, Router, Server CNS)</option>
                <option value="RADAR_ADS" className="bg-[#091533]">Ra-đa / Giám sát bay (MSSR, PSR, ADS-B, MLAT)</option>
                <option value="NAV" className="bg-[#091533]">Dẫn đường hàng không (ILS, DVOR, DME, NDB)</option>
                <option value="OTHER" className="bg-[#091533]">Chủng loại thiết bị kỹ thuật chuyên ngành khác</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-sky-200">Tên thiết bị đầy đủ *</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: Máy thu phát VHF Air-Ground Park Air T6T Kênh Chính"
                value={data.general.name}
                onChange={(e) => updateGeneral('name', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 font-semibold border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Trạng thái hiện tại *</label>
              <select
                disabled={isReadOnly}
                value={data.general.status}
                onChange={(e) => updateGeneral('status', e.target.value as EquipmentStatus)}
                className={`w-full text-xs rounded-lg p-2.5 font-semibold border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              >
                <option value="Đang khai thác" className="bg-[#091533]">Đang khai thác (Active)</option>
                <option value="Dự phòng sẵn sàng" className="bg-[#091533]">Dự phòng sẵn sàng (Standby)</option>
                <option value="Đang bảo dưỡng/sửa chữa" className="bg-[#091533]">Đang bảo dưỡng / sửa chữa (Maintenance)</option>
                <option value="Tạm ngừng khai thác" className="bg-[#091533]">Tạm ngừng khai thác (Suspended)</option>
                <option value="Đã thanh lý" className="bg-[#091533]">Đã thanh lý (Liquidated)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Hãng sản xuất</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: Park Air Systems / SITTI / Ceragon"
                value={data.general.manufacturer}
                onChange={(e) => updateGeneral('manufacturer', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Kiểu loại / Model</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: T6TRV 50W / M800IP"
                value={data.general.model}
                onChange={(e) => updateGeneral('model', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 font-mono border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Số Serial / Part No</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: PA-T6T-2019-88341"
                value={data.general.serial}
                onChange={(e) => updateGeneral('serial', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 font-mono border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-sky-400/70 font-bold cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-sky-300 font-bold focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Mã tài sản quản lý (Asset No)</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: TS-CNS-VHF-001"
                value={data.general.assetNo}
                onChange={(e) => updateGeneral('assetNo', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 font-mono border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-sky-400/70 font-bold cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-sky-300 font-bold focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Mã nội bộ trạm / Đài</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: VHF-APP-125.6-M"
                value={data.general.assetCode}
                onChange={(e) => updateGeneral('assetCode', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 font-mono border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Phân Nhóm Thiết Bị</label>
              <select
                disabled={isReadOnly}
                value={data.general.priority}
                onChange={(e) => updateGeneral('priority', e.target.value as EquipmentPriority)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              >
                <option value="Hệ thống chính (Level 1)" className="bg-[#091533]">Thiết Bị Nhóm 1 (Level 1 - VHF, VCCS, ADS-B)</option>
                <option value="Hệ thống dự phòng nóng (Level 2)" className="bg-[#091533]">Hệ thiết Bị Nhóm 2 (Level 2 - VSAT, VIBA, Cáp Quang)</option>
                <option value="Hệ thống phụ trợ (Level 3)" className="bg-[#091533]">Thiết Bị Nhóm 3 (Level 3 - Hỗ trợ kỹ thuật)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Tuổi thọ thiết kế (Năm)</label>
              <input
                type="number"
                min="1"
                max="50"
                disabled={isReadOnly}
                placeholder="15"
                value={data.general.estimatedLifespanYears || ''}
                onChange={(e) => updateGeneral('estimatedLifespanYears', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Ghi chú mục đích sử dụng</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Đảm bảo điều hành bay ACC/APP..."
                value={data.general.notes || ''}
                onChange={(e) => updateGeneral('notes', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Organization & Location Section */}
        <div className="cns-glass-card rounded-xl p-6">
          <div className="border-b border-[#182d5a] pb-3 mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              Cơ cấu tổ chức quản lý & Vị trí lắp đặt chi tiết
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">Xác định đơn vị chịu trách nhiệm kỹ thuật và địa điểm vật lý của thiết bị</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Đơn vị quản lý trực tiếp *
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: Đội Thông Tin - Dẫn Đường / Đài KLL Tân Sơn Nhất"
                value={data.org.unit}
                onChange={(e) => updateOrg('unit', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                Vị trí lắp đặt / Trạm / Phòng máy / Rack U *
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: Trạm VHF Đồi C2 / Phòng máy Tầng 2 / Rack số 02 - U14-U16"
                value={data.org.location}
                onChange={(e) => updateOrg('location', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                Kỹ sư / Cán bộ kỹ thuật phụ trách chính
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: Kỹ sư Nguyễn Văn Hùng"
                value={data.org.primaryEngineer || ''}
                onChange={(e) => updateOrg('primaryEngineer', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                Số điện thoại / Kênh liên lạc trực ban
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="Ví dụ: 0912.345.678 / Máy lẻ 104"
                value={data.org.phoneContact || ''}
                onChange={(e) => updateOrg('phoneContact', e.target.value)}
                className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none transition-all ${
                  isReadOnly
                    ? 'bg-[#050c1e]/60 border-[#182d5a] text-slate-300 cursor-not-allowed'
                    : 'bg-[#050c1e] border-[#1e3c7a] text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400'
                }`}
              />
            </div>
          </div>

          {/* Handover and Transfer Process Table */}
          <div className="mt-6 pt-5 border-t border-[#182d5a]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                  Quá trình luân chuyển & Bàn giao đơn vị quản lý qua các thời kỳ
                </h3>
                <p className="text-xs text-sky-200/70">Ghi lại các mốc tiếp nhận, điều chuyển địa điểm hoặc bàn giao trạm</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={addOrgRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 border border-[#1e3c7a] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Thêm dòng luân chuyển</span>
                </button>
              )}
            </div>

            <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
                  <tr>
                    <th className="p-2.5 w-32">Ngày tháng</th>
                    <th className="p-2.5">Đơn vị bàn giao / Tiếp nhận</th>
                    <th className="p-2.5 w-44">Số biên bản / Quyết định</th>
                    <th className="p-2.5">Tình trạng thiết bị</th>
                    {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182d5a]">
                  {data.orgRows.length === 0 ? (
                    <tr>
                      <td colSpan={isReadOnly ? 4 : 5} className="p-4 text-center text-slate-400 italic bg-[#050c1e]">
                        Chưa có dữ liệu luân chuyển.
                      </td>
                    </tr>
                  ) : (
                    data.orgRows.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-[#0c183a] bg-[#060e24]">
                        <td className="p-2">
                          <input
                            type="date"
                            disabled={isReadOnly}
                            value={row.date}
                            onChange={(e) => updateOrgRow(idx, 'date', e.target.value)}
                            className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white disabled:bg-[#050c1e]/60 disabled:border-[#182d5a] disabled:text-slate-300"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="Đơn vị bàn giao / nhận..."
                            value={row.unit}
                            onChange={(e) => updateOrgRow(idx, 'unit', e.target.value)}
                            className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white font-medium disabled:bg-[#050c1e]/60 disabled:border-[#182d5a] disabled:text-slate-300"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="BB-NT-01/QĐ..."
                            value={row.handoverDocNo}
                            onChange={(e) => updateOrgRow(idx, 'handoverDocNo', e.target.value)}
                            className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono text-sky-300 disabled:bg-[#050c1e]/60 disabled:border-[#182d5a] disabled:text-sky-400/70"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={isReadOnly}
                            placeholder="Tình trạng kỹ thuật khi bàn giao..."
                            value={row.status}
                            onChange={(e) => updateOrgRow(idx, 'status', e.target.value)}
                            className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white disabled:bg-[#050c1e]/60 disabled:border-[#182d5a] disabled:text-slate-300"
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeOrgRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
