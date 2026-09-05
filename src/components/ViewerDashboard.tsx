import React, { useState, useMemo, useCallback } from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';
import { 
  Search, 
  QrCode, 
  Radio, 
  Activity, 
  PhoneCall, 
  Zap, 
  Server, 
  HardDrive, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  LayoutGrid, 
  List, 
  Filter, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  User, 
  Copy, 
  Check, 
  ChevronRight,
  Gauge,
  MapPin, 
  Wrench,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { EquipmentData, EquipmentCategory, EquipmentStatus, AppUser } from '../types';
import { NotificationBell } from './NotificationBell';
import { ViewerEquipmentDetail } from './ViewerEquipmentDetail';

interface ViewerDashboardProps {
  equipments: EquipmentData[];
  currentUser: AppUser;
  onOpenLoginModal: () => void;
  onOpenSearchModal: () => void;
  onOpenQrScanner: () => void;
  onOpenPdfModal: (equipment: EquipmentData) => void;
  onOpenQrModal: (equipment: EquipmentData) => void;
  onNavigateToEquipment?: (equipmentId: string, tabName?: string) => void;
  selectedEquipmentId?: string;
  onSelectEquipmentId?: (id: string) => void;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
  onCloseDetail?: () => void;
}

export const ViewerDashboard: React.FC<ViewerDashboardProps> = ({
  equipments,
  currentUser,
  onOpenLoginModal,
  onOpenSearchModal,
  onOpenQrScanner,
  onOpenPdfModal,
  onOpenQrModal,
  onNavigateToEquipment,
  selectedEquipmentId,
  onSelectEquipmentId,
  activeTab = 'home',
  onSelectTab,
  onCloseDetail
}) => {
  // Navigation between Catalog and Single Equipment Detail
  const [viewingEquipmentId, setViewingEquipmentId] = useState<string | null>(null);

  // Synchronize state with selectedEquipmentId prop (supporting deep links and QR Scans)
  React.useEffect(() => {
    if (selectedEquipmentId) {
      setViewingEquipmentId(selectedEquipmentId);
    } else {
      setViewingEquipmentId(null);
    }
  }, [selectedEquipmentId]);

  // Handle local back/close detail action
  const handleBackFromDetail = useCallback(() => {
    setViewingEquipmentId(null);
    if (onSelectEquipmentId) {
      onSelectEquipmentId('');
    }
    if (onCloseDetail) {
      onCloseDetail();
    }
  }, [onSelectEquipmentId, onCloseDetail]);

  const handleSelectEquipment = useCallback((id: string) => {
    setViewingEquipmentId(id);
    if (onSelectEquipmentId) {
      onSelectEquipmentId(id);
    }
  }, [onSelectEquipmentId]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // Active viewing equipment
  const activeViewingEquipment = useMemo(() => {
    if (!viewingEquipmentId) return null;
    return equipments.find(e => e.id === viewingEquipmentId) || null;
  }, [equipments, viewingEquipmentId]);

  // Statistics KPI calculations
  const stats = useMemo(() => {
    const total = equipments.length;
    const operational = equipments.filter(e => e.general.status === 'Đang khai thác').length;
    const standby = equipments.filter(e => e.general.status === 'Dự phòng sẵn sàng').length;
    const maintenance = equipments.filter(e => e.general.status === 'Đang bảo dưỡng/sửa chữa').length;
    const paused = equipments.filter(e => e.general.status === 'Tạm ngừng khai thác' || e.general.status === 'Đã thanh lý').length;

    return { total, operational, standby, maintenance, paused };
  }, [equipments]);

  // Filtered equipments based on Search Query & Filters
  const filteredEquipments = useMemo(() => {
    return equipments.filter(item => {
      const g = item.general;
      const o = item.org || ({} as any);

      // Category filter
      if (selectedCategory !== 'ALL') {
        const isMatch = g.category === selectedCategory ||
          (selectedCategory === 'VHF/ HF' && (g.category === 'VHF/ HF' || g.category === 'VHF/UHF')) ||
          (selectedCategory === 'VIBA/VSAT/Cáp Quang' && (g.category === 'VIBA/VSAT/Cáp Quang' || g.category === 'VIBA' || g.category === 'VSAT'));
        if (!isMatch) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && g.status !== selectedStatus) {
        return false;
      }

      // Search query filter (matches name, model, serial, assetNo, location, unit, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = g.name.toLowerCase().includes(q);
        const matchModel = (g.model || '').toLowerCase().includes(q);
        const matchSerial = (g.serial || '').toLowerCase().includes(q);
        const matchAsset = (g.assetNo || '').toLowerCase().includes(q);
        const matchUnit = (o.unit || '').toLowerCase().includes(q);
        const matchLocation = (o.location || '').toLowerCase().includes(q);
        const matchCategory = (g.category || '').toLowerCase().includes(q);
        const matchOrigin = (g.origin || '').toLowerCase().includes(q);
        const matchManufacturer = (g.manufacturer || '').toLowerCase().includes(q);

        return matchName || matchModel || matchSerial || matchAsset || matchUnit || matchLocation || matchCategory || matchOrigin || matchManufacturer;
      }

      return true;
    });
  }, [equipments, selectedCategory, selectedStatus, searchQuery]);

  const handleCopySerial = useCallback((serial: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!serial) return;
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  }, []);

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/ HF':
      case 'VHF/UHF': return <Radio className="w-4 h-4 text-blue-500" />;
      case 'Ghép Kênh': return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'VIBA/VSAT/Cáp Quang':
      case 'VIBA': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'Thiết bị đo': return <Gauge className="w-4 h-4 text-amber-500" />;
      case 'VOICE': return <PhoneCall className="w-4 h-4 text-amber-500" />;
      case 'POWER': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'IT': return <Server className="w-4 h-4 text-indigo-500" />;
      case 'RADAR_ADS': return <Activity className="w-4 h-4 text-cyan-500" />;
      case 'NAV': return <Radio className="w-4 h-4 text-purple-500" />;
      default: return <HardDrive className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status: EquipmentStatus) => {
    switch (status) {
      case 'Đang khai thác':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Dự phòng sẵn sàng':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Đang bảo dưỡng/sửa chữa':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Tạm ngừng khai thác':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  const categories = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'VHF/ HF', label: 'VHF/ HF' },
    { id: 'VIBA/VSAT/Cáp Quang', label: 'VIBA/VSAT/Cáp Quang' },
    { id: 'Thiết bị đo', label: 'Thiết bị đo' },
    { id: 'Ghép Kênh', label: 'Ghép kênh' },
    { id: 'VOICE', label: 'Chuyển mạch thoại' },
    { id: 'POWER', label: 'Nguồn điện' },
    { id: 'IT', label: 'Mạng & IT' },
    { id: 'RADAR_ADS', label: 'Ra-đa / ADS-B' },
    { id: 'NAV', label: 'Dẫn đường' }
  ];

  // If viewing single equipment detail
  if (activeViewingEquipment) {
    return (
      <div className="max-w-6xl mx-auto w-full px-3 py-4 md:px-6 md:py-6">
        <ViewerEquipmentDetail
          equipment={activeViewingEquipment}
          onBack={handleBackFromDetail}
          onOpenPdf={onOpenPdfModal}
          onOpenQr={onOpenQrModal}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-3 py-4 md:px-6 md:py-6 space-y-6 pb-24 md:pb-12 text-slate-900">
      {/* 1. Top Compact Header */}
      <header className="bg-slate-900 text-white rounded-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <img 
            src={doiThongTinLogoImg} 
            alt="Logo Đội Thông Tin" 
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-400/80 shadow-md bg-slate-950 shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                ĐỘI THÔNG TIN - TT BẢO ĐẢM KỸ THUẬT
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CNS v3.0
              </span>
            </div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-white mt-0.5">
              SỔ LÝ LỊCH THIẾT BỊ CNS
            </h1>
          </div>
        </div>

        {/* User Role & Login trigger */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <NotificationBell />

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-200">
                {currentUser.displayName || 'Người Xem'}
              </div>
              <div className="text-[10px] text-slate-400">
                {isAdmin ? 'Quản trị viên (Admin)' : 'Quyền: Người Xem (Mặc định)'}
              </div>
            </div>

            <button
              onClick={onOpenLoginModal}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isAdmin
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
              }`}
              title={isAdmin ? 'Đang ở quyền Quản trị viên' : 'Đăng nhập Quản trị viên (Admin)'}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdmin ? 'Quản Trị' : 'Đăng nhập'}</span>
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'account' ? (
        /* 5. Account Screen */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-md mx-auto space-y-6 text-slate-900 mt-4 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-750 text-xl font-black mx-auto border-2 border-slate-200">
              {currentUser.displayName?.substring(0, 2).toUpperCase() || 'VI'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{currentUser.displayName || 'Người xem'}</h3>
              <p className="text-xs text-slate-500 font-medium">{currentUser.username || 'viewer'}</p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              Quyền: Người Xem (Viewer)
            </span>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Vai trò hệ thống</span>
              <span className="font-bold text-slate-800">Người xem mặc định</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Đội quản lý</span>
              <span className="font-bold text-slate-800">Đội Thông Tin</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Trạng thái bảo mật</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Đang bảo vệ
              </span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={onOpenLoginModal}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Đăng nhập Quản Trị Viên</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Hero Quick Search & Instant Lookup Area */}
          {(activeTab === 'home' || activeTab === 'search') && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                    Tra Cứu & Tìm Kiếm Hồ Sơ Thiết Bị
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                  Tìm theo Tên, Serial, Model, Mã TS, Vị trí...
                </span>
              </div>

              {/* Large Search Input & Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Nhập tên thiết bị, Asset ID, Serial Number, Model, Vị trí, Đơn vị..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenQrScanner}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <QrCode className="w-4 h-4 text-blue-400" />
                    <span>Quét Mã QR</span>
                  </button>

                  <button
                    onClick={onOpenSearchModal}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs md:text-sm font-semibold transition-colors cursor-pointer"
                    title="Tra cứu nâng cao toàn diện (Ctrl+K)"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden md:inline">Tra cứu sâu</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs select-none">
                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
                  Loại:
                </span>
                {categories.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isCatActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
                  Trạng thái:
                </span>
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'Đang khai thác', label: '🟢 Đang khai thác' },
                  { id: 'Dự phòng sẵn sàng', label: '🔵 Dự phòng' },
                  { id: 'Đang bảo dưỡng/sửa chữa', label: '🟠 Đang bảo dưỡng' },
                  { id: 'Tạm ngừng khai thác', label: '🔴 Tạm ngừng' }
                ].map((st) => {
                  const isStActive = selectedStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                        isStActive
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Overview KPI Cards (4 Cards) */}
          {(activeTab === 'home' || activeTab === 'equipments') && (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-in fade-in duration-200">
              {/* KPI 1: Tổng thiết bị */}
              <div 
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Thiết Bị</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900">
                  {stats.total}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Hồ sơ sổ lý lịch CNS</p>
              </div>

              {/* KPI 2: Đang hoạt động */}
              <div 
                onClick={() => setSelectedStatus('Đang khai thác')}
                className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs hover:border-emerald-400 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đang Khai Thác</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-emerald-700">
                  {stats.operational}
                </div>
                <p className="text-[11px] text-emerald-600/80 mt-1">Hoạt động ổn định</p>
              </div>

              {/* KPI 3: Đang bảo dưỡng */}
              <div 
                onClick={() => setSelectedStatus('Đang bảo dưỡng/sửa chữa')}
                className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs hover:border-amber-400 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Đang Bảo Dưỡng</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-amber-700">
                  {stats.maintenance}
                </div>
                <p className="text-[11px] text-amber-600/80 mt-1">Đang kiểm tra / hiệu chuẩn</p>
              </div>

              {/* KPI 4: Dự phòng / Tạm dừng */}
              <div 
                onClick={() => setSelectedStatus('Dự phòng sẵn sàng')}
                className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Dự Phòng Sẵn Sàng</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-blue-700">
                  {stats.standby}
                </div>
                <p className="text-[11px] text-blue-600/80 mt-1">Sẵn sàng thay thế</p>
              </div>
            </section>
          )}

      {/* 4. Equipment Catalog & List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Danh Sách Hồ Sơ Thiết Bị
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filteredEquipments.length} / {equipments.length}
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Dạng lưới thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Dạng danh sách bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty Search Fallback */}
        {filteredEquipments.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Không tìm thấy thiết bị nào phù hợp
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ danh mục thiết bị.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Xóa bộ lọc & Hiển thị tất cả
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredEquipments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipments.map((eq) => {
              const g = eq.general;
              const o = eq.org || ({} as any);

              return (
                <div
                  key={eq.id}
                  onClick={() => handleSelectEquipment(eq.id)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header: Category & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700">
                        {getCategoryIcon(g.category)}
                        <span>{g.category}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${getStatusBadgeClass(g.status)}`}>
                        {g.status}
                      </span>
                    </div>

                    {/* Equipment Name */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {g.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {g.manufacturer || 'Hãng N/A'} • {g.origin || 'N/A'}
                      </p>
                    </div>

                    {/* Meta specs info */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Model:</span>
                        <span className="font-semibold text-slate-800 truncate block">{g.model || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Serial:</span>
                        <span className="font-mono font-bold text-slate-900 truncate flex items-center gap-1">
                          {g.serial || 'N/A'}
                          {g.serial && (
                            <button
                              onClick={(e) => handleCopySerial(g.serial, e)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer"
                              title="Sao chép Serial"
                            >
                              {copiedSerial === g.serial ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mã Tài Sản:</span>
                        <span className="font-mono font-medium text-slate-800 truncate block">{g.assetNo || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Vị trí:</span>
                        <span className="font-medium text-slate-800 truncate block">{o.location || 'TT BĐKT'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEquipment(eq.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Xem Chi Tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPdfModal(eq);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Xem bản PDF A4"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrModal(eq);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Mở mã QR & Tem nhãn"
                    >
                      <QrCode className="w-4 h-4 text-slate-800" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List / Table View */}
        {viewMode === 'list' && filteredEquipments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Tên Thiết Bị</th>
                    <th className="p-3.5">Chủng Loại</th>
                    <th className="p-3.5">Model / Serial</th>
                    <th className="p-3.5">Mã Tài Sản</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5">Vị Trí / Đơn Vị</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEquipments.map((eq) => {
                    const g = eq.general;
                    const o = eq.org || ({} as any);

                    return (
                      <tr
                        key={eq.id}
                        onClick={() => handleSelectEquipment(eq.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(g.category)}
                            <span className="hover:text-blue-600">{g.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{g.category}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{g.model || '---'}</div>
                          <div className="font-mono text-slate-500 text-[11px]">{g.serial || '---'}</div>
                        </td>
                        <td className="p-3.5 font-mono font-medium text-slate-700">{g.assetNo || '---'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(g.status)}`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{o.unit || 'Đội TT'} - {o.location || 'TT BĐKT'}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectEquipment(eq.id);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Xem Chi Tiết
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPdfModal(eq);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                              title="Xem PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
};
