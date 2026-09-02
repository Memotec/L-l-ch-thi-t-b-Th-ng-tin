import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Layers, 
  Radio, 
  HardDrive, 
  PhoneCall, 
  Zap, 
  Server, 
  Radar, 
  Compass, 
  Box, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Cpu, 
  Sliders, 
  Building2, 
  MapPin, 
  Printer, 
  QrCode, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Tag
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';

export type SearchFilterType = 'ALL' | 'EQUIPMENT' | 'COMPONENT' | 'MAINTENANCE' | 'REPAIR' | 'DOC' | 'SPEC' | 'LOCATION';
export type EquipmentCategoryFilter = 'ALL' | EquipmentCategory;
export type StatusFilterType = 'ALL' | 'Đang khai thác tốt' | 'Dự phòng sẵn sàng' | 'Đang bảo dưỡng/sửa chữa' | 'Tạm dừng khai thác';

export interface SearchResultItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSerial: string;
  equipmentCategory: EquipmentCategory;
  equipmentStatus: string;
  categoryType: 'EQUIPMENT' | 'COMPONENT' | 'MAINTENANCE' | 'REPAIR' | 'DOC' | 'SPEC' | 'LOCATION';
  title: string;
  snippet: string;
  targetTab: string;
  highlightText?: string;
  date?: string;
  extraMeta?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentData[];
  initialQuery?: string;
  onSelectResult: (equipmentId: string, targetTab: string) => void;
  onOpenPdfModal?: (equipment: EquipmentData) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  equipments,
  initialQuery = '',
  onSelectResult,
  onOpenPdfModal
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<SearchFilterType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategoryFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cns_recent_searches');
      return saved ? JSON.parse(saved) : ['VHF', 'T6T', 'SITTI', 'Bảo dưỡng', 'Nguồn điện'];
    } catch {
      return ['VHF', 'T6T', 'SITTI', 'Bảo dưỡng', 'Nguồn điện'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query & auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Save recent search
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem('cns_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Helper category icons
  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-3.5 h-3.5 text-sky-400" />;
      case 'VIBA': return <HardDrive className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VOICE': return <PhoneCall className="w-3.5 h-3.5 text-amber-400" />;
      case 'POWER': return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case 'IT': return <Server className="w-3.5 h-3.5 text-purple-400" />;
      case 'RADAR_ADS': return <Radar className="w-3.5 h-3.5 text-rose-400" />;
      case 'NAV': return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <Box className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Helper type badge
  const getTypeBadge = (type: SearchResultItem['categoryType']) => {
    switch (type) {
      case 'EQUIPMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Sổ Thiết Bị
          </span>
        );
      case 'COMPONENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Linh Kiện / Bo Mạch
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Nhật Ký Bảo Dưỡng
          </span>
        );
      case 'REPAIR':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Sự Cố & Sửa Chữa
          </span>
        );
      case 'DOC':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Hồ Sơ & Bản Vẽ
          </span>
        );
      case 'SPEC':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Thông Số Kỹ Thuật
          </span>
        );
      case 'LOCATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Vị Trí & Đài Trạm
          </span>
        );
    }
  };

  // Helper text highlight
  const highlightMatch = (text: string, q: string) => {
    if (!text) return '';
    if (!q || !q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/30 text-amber-200 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Comprehensive Search Indexing Engine
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    equipments.forEach(eq => {
      const g = eq.general;
      const o = eq.org;
      const s = eq.spec;

      // 1. Check General Equipment Metadata
      const eqMatches = 
        g.name?.toLowerCase().includes(q) ||
        g.model?.toLowerCase().includes(q) ||
        g.serial?.toLowerCase().includes(q) ||
        g.assetNo?.toLowerCase().includes(q) ||
        g.assetCode?.toLowerCase().includes(q) ||
        g.manufacturer?.toLowerCase().includes(q) ||
        g.origin?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.status?.toLowerCase().includes(q) ||
        g.priority?.toLowerCase().includes(q) ||
        g.notes?.toLowerCase().includes(q);

      if (eqMatches) {
        results.push({
          id: `eq-${eq.id}`,
          equipmentId: eq.id,
          equipmentName: g.name || 'Hồ sơ thiết bị',
          equipmentModel: g.model || 'N/A',
          equipmentSerial: g.serial || 'N/A',
          equipmentCategory: g.category,
          equipmentStatus: g.status,
          categoryType: 'EQUIPMENT',
          title: g.name,
          snippet: `Model: ${g.model || 'N/A'} • Serial: ${g.serial || 'N/A'} • Mã TS: ${g.assetNo || g.assetCode || 'N/A'} • Hãng SX: ${g.manufacturer || 'N/A'} • Nơi SX: ${g.origin || 'N/A'}`,
          targetTab: 'general',
          extraMeta: `Trạng thái: ${g.status}`
        });
      }

      // 2. Check Organization & Location
      const orgMatches = 
        o.unit?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q) ||
        o.primaryEngineer?.toLowerCase().includes(q) ||
        o.phoneContact?.toLowerCase().includes(q) ||
        o.supervisor?.toLowerCase().includes(q) ||
        o.coverNote?.toLowerCase().includes(q);

      if (orgMatches) {
        results.push({
          id: `org-${eq.id}`,
          equipmentId: eq.id,
          equipmentName: g.name,
          equipmentModel: g.model,
          equipmentSerial: g.serial,
          equipmentCategory: g.category,
          equipmentStatus: g.status,
          categoryType: 'LOCATION',
          title: `${o.location || 'Vị trí'} (${o.unit || 'Đơn vị'})`,
          snippet: `Vị trí lắp đặt: ${o.location || 'N/A'} • Đơn vị quản lý: ${o.unit || 'N/A'} • Kỹ sư phụ trách: ${o.primaryEngineer || 'N/A'} • SĐT: ${o.phoneContact || 'N/A'}`,
          targetTab: 'dashboard',
          extraMeta: o.unit
        });
      }

      // 3. Check Components / Spare Parts
      if (eq.components && Array.isArray(eq.components)) {
        eq.components.forEach((comp, idx) => {
          const compMatch = 
            comp.name?.toLowerCase().includes(q) ||
            comp.partNo?.toLowerCase().includes(q) ||
            comp.serial?.toLowerCase().includes(q) ||
            comp.note?.toLowerCase().includes(q) ||
            comp.healthStatus?.toLowerCase().includes(q);

          if (compMatch) {
            results.push({
              id: `comp-${eq.id}-${comp.id || idx}`,
              equipmentId: eq.id,
              equipmentName: g.name,
              equipmentModel: g.model,
              equipmentSerial: g.serial,
              equipmentCategory: g.category,
              equipmentStatus: g.status,
              categoryType: 'COMPONENT',
              title: comp.name || `Linh kiện #${idx + 1}`,
              snippet: `Part No: ${comp.partNo || 'N/A'} • Serial: ${comp.serial || 'N/A'} • Tình trạng: ${comp.healthStatus || 'Tốt'} • SL: ${comp.qty} ${comp.unit || ''} ${comp.note ? `• Ghi chú: ${comp.note}` : ''}`,
              targetTab: 'components',
              extraMeta: `Tình trạng: ${comp.healthStatus || 'Tốt'}`
            });
          }
        });
      }

      // 4. Check Technical Specs
      if (s) {
        const specMatches = 
          s.text?.toLowerCase().includes(q) ||
          s.channelFreq?.toLowerCase().includes(q) ||
          s.power?.toLowerCase().includes(q) ||
          s.output?.toLowerCase().includes(q) ||
          s.mgmtIp?.toLowerCase().includes(q) ||
          s.subnetMask?.toLowerCase().includes(q) ||
          s.gateway?.toLowerCase().includes(q) ||
          s.vlanId?.toLowerCase().includes(q) ||
          s.firmware?.toLowerCase().includes(q) ||
          s.interface?.toLowerCase().includes(q) ||
          s.snmpCommunity?.toLowerCase().includes(q);

        if (specMatches) {
          results.push({
            id: `spec-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: g.name,
            equipmentModel: g.model,
            equipmentSerial: g.serial,
            equipmentCategory: g.category,
            equipmentStatus: g.status,
            categoryType: 'SPEC',
            title: `Thông số kỹ thuật & IP cấu hình`,
            snippet: `${s.channelFreq ? `Tần số: ${s.channelFreq} • ` : ''}${s.mgmtIp ? `IP: ${s.mgmtIp} • ` : ''}${s.firmware ? `Firmware: ${s.firmware} • ` : ''}${s.power ? `Công suất: ${s.power} • ` : ''}${s.text ? `Đặc tính: ${s.text.slice(0, 120)}...` : ''}`,
            targetTab: 'spec',
            extraMeta: s.mgmtIp ? `IP: ${s.mgmtIp}` : undefined
          });
        }
      }

      // 5. Check Maintenance History
      if (eq.maintenance && Array.isArray(eq.maintenance)) {
        eq.maintenance.forEach((m, idx) => {
          const maintMatch = 
            m.content?.toLowerCase().includes(q) ||
            m.measuredParams?.toLowerCase().includes(q) ||
            m.person?.toLowerCase().includes(q) ||
            m.supervisor?.toLowerCase().includes(q) ||
            m.result?.toLowerCase().includes(q) ||
            m.cycle?.toLowerCase().includes(q) ||
            m.date?.toLowerCase().includes(q);

          if (maintMatch) {
            results.push({
              id: `maint-${eq.id}-${m.id || idx}`,
              equipmentId: eq.id,
              equipmentName: g.name,
              equipmentModel: g.model,
              equipmentSerial: g.serial,
              equipmentCategory: g.category,
              equipmentStatus: g.status,
              categoryType: 'MAINTENANCE',
              title: `Bảo dưỡng: ${m.content || 'Công việc bảo dưỡng'}`,
              snippet: `Kỳ BD: ${m.cycle || 'Định kỳ'} • Ngày: ${m.date || 'N/A'} • Kết quả: ${m.result || 'Đạt'} • Người thực hiện: ${m.person || 'N/A'} ${m.measuredParams ? `• Đo đạc: ${m.measuredParams}` : ''}`,
              targetTab: 'maintenance',
              date: m.date,
              extraMeta: m.result
            });
          }
        });
      }

      // 6. Check Repair & Incident History
      if (eq.repair && Array.isArray(eq.repair)) {
        eq.repair.forEach((r, idx) => {
          const repMatch = 
            r.incidentDescription?.toLowerCase().includes(q) ||
            r.rootCause?.toLowerCase().includes(q) ||
            r.actionTaken?.toLowerCase().includes(q) ||
            r.replacedParts?.toLowerCase().includes(q) ||
            r.person?.toLowerCase().includes(q) ||
            r.type?.toLowerCase().includes(q) ||
            r.status?.toLowerCase().includes(q) ||
            r.date?.toLowerCase().includes(q);

          if (repMatch) {
            results.push({
              id: `rep-${eq.id}-${r.id || idx}`,
              equipmentId: eq.id,
              equipmentName: g.name,
              equipmentModel: g.model,
              equipmentSerial: g.serial,
              equipmentCategory: g.category,
              equipmentStatus: g.status,
              categoryType: 'REPAIR',
              title: `Sự cố & SC: ${r.incidentDescription || r.type || 'Sửa chữa khắc phục'}`,
              snippet: `Nguyên nhân: ${r.rootCause || 'N/A'} • Xử lý: ${r.actionTaken || 'N/A'} • Vật tư thay thế: ${r.replacedParts || 'Không'} • Trạng thái: ${r.status || 'Đã xử lý'}`,
              targetTab: 'repair',
              date: r.date,
              extraMeta: r.status
            });
          }
        });
      }

      // 7. Check Documents & Drawings
      if (eq.docs && Array.isArray(eq.docs)) {
        eq.docs.forEach((doc, idx) => {
          const docMatch = 
            doc.name?.toLowerCase().includes(q) ||
            doc.format?.toLowerCase().includes(q) ||
            doc.lang?.toLowerCase().includes(q) ||
            doc.location?.toLowerCase().includes(q) ||
            doc.note?.toLowerCase().includes(q);

          if (docMatch) {
            results.push({
              id: `doc-${eq.id}-${doc.id || idx}`,
              equipmentId: eq.id,
              equipmentName: g.name,
              equipmentModel: g.model,
              equipmentSerial: g.serial,
              equipmentCategory: g.category,
              equipmentStatus: g.status,
              categoryType: 'DOC',
              title: doc.name || `Tài liệu #${idx + 1}`,
              snippet: `Dạng tài liệu: ${doc.format || 'Bản in'} • Ngôn ngữ: ${doc.lang || 'VN'} • Nơi lưu: ${doc.location || 'Tủ hồ sơ'} • Số lượng: ${doc.qty || 1} ${doc.note ? `• Ghi chú: ${doc.note}` : ''}`,
              targetTab: 'docs',
              extraMeta: doc.format
            });
          }
        });
      }
    });

    return results;
  }, [equipments, query]);

  // Filtered by selected category chip, equipment category and status
  const filteredResults = useMemo(() => {
    let list = searchResults;

    if (filterType !== 'ALL') {
      list = list.filter(item => item.categoryType === filterType);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter(item => item.equipmentCategory === categoryFilter);
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(item => item.equipmentStatus === statusFilter);
    }

    if (sortBy === 'date') {
      list = [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [searchResults, filterType, categoryFilter, statusFilter, sortBy]);

  // Counts by category
  const countStats = useMemo(() => {
    return {
      ALL: searchResults.length,
      EQUIPMENT: searchResults.filter(i => i.categoryType === 'EQUIPMENT').length,
      COMPONENT: searchResults.filter(i => i.categoryType === 'COMPONENT').length,
      MAINTENANCE: searchResults.filter(i => i.categoryType === 'MAINTENANCE').length,
      REPAIR: searchResults.filter(i => i.categoryType === 'REPAIR').length,
      DOC: searchResults.filter(i => i.categoryType === 'DOC').length,
      SPEC: searchResults.filter(i => i.categoryType === 'SPEC').length,
      LOCATION: searchResults.filter(i => i.categoryType === 'LOCATION').length,
    };
  }, [searchResults]);

  const handleSelect = (item: SearchResultItem) => {
    saveRecentSearch(query);
    onSelectResult(item.equipmentId, item.targetTab);
    onClose();
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 px-3 sm:px-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Search Modal Card */}
      <div 
        className="w-full max-w-4xl cns-glass-card rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Search Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1e47] via-[#091533] to-[#0d1e47] border-b border-[#182d5a] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl text-white shadow-lg border border-sky-400/40 shrink-0">
              <Search className="w-5 h-5" />
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredResults.length > 0) {
                    handleSelect(filteredResults[0]);
                  }
                }}
                placeholder="Tìm kiếm: Tên thiết bị, Serial, Linh kiện, Lịch sử bảo dưỡng, Sự cố, IP, Tần số, Vị trí..."
                className="w-full bg-[#050c1e] text-white text-sm sm:text-base font-semibold placeholder-slate-400 pl-4 pr-10 py-3 rounded-xl border border-[#1e3c7a] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-inner"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md bg-[#0e1d44] hover:bg-[#162d66] transition-colors cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white bg-[#060e24] hover:bg-[#162d66] border border-[#1e3c7a] rounded-xl transition-all cursor-pointer shrink-0"
              title="Đóng cửa sổ tìm kiếm (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Layer 1: Data Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <span>Tất cả mục</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono font-bold">
                {countStats.ALL}
              </span>
            </button>

            <button
              onClick={() => setFilterType('EQUIPMENT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'EQUIPMENT'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-300" />
              <span>Sổ Thiết Bị</span>
              {countStats.EQUIPMENT > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 text-[10px] font-mono font-bold">
                  {countStats.EQUIPMENT}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('COMPONENT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'COMPONENT'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-300" />
              <span>Linh Kiện</span>
              {countStats.COMPONENT > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono font-bold">
                  {countStats.COMPONENT}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('MAINTENANCE')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'MAINTENANCE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bảo Dưỡng</span>
              {countStats.MAINTENANCE > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">
                  {countStats.MAINTENANCE}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('REPAIR')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'REPAIR'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Sự Cố & Sửa Chữa</span>
              {countStats.REPAIR > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono font-bold">
                  {countStats.REPAIR}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('SPEC')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'SPEC'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-300" />
              <span>Thông Số & IP</span>
              {countStats.SPEC > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold">
                  {countStats.SPEC}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('DOC')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'DOC'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#060e24] text-slate-300 hover:text-white hover:bg-[#0e1d44] border border-[#182d5a]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Tài Liệu</span>
              {countStats.DOC > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 text-[10px] font-mono font-bold">
                  {countStats.DOC}
                </span>
              )}
            </button>
          </div>

          {/* Layer 2: Equipment Category & Sorting Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#182d5a]/60 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider shrink-0">Chủng loại:</span>
              {(['ALL', 'VHF/UHF', 'VIBA', 'VOICE', 'POWER', 'IT', 'RADAR_ADS', 'NAV'] as EquipmentCategoryFilter[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-[#060e24] text-sky-200/70 hover:text-white border border-[#182d5a]'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả nhóm' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-sky-300/80">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sắp xếp kết quả tìm kiếm"
                className="px-2 py-1 bg-[#060e24] border border-[#1e3c7a] rounded text-[11px] text-sky-200 focus:outline-none cursor-pointer"
              >
                <option value="relevance">Độ liên quan</option>
                <option value="date">Ngày gần nhất</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Results & Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#060e24]">
          {/* Recent Searches / Fast Keyword Chips when no query */}
          {!query.trim() && (
            <div className="space-y-5 py-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-sky-200 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      Tìm kiếm gần đây & Từ khóa phổ biến:
                    </span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem('cns_recent_searches');
                        } catch {}
                      }}
                      className="text-[11px] text-slate-400 hover:text-sky-300 cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(term)}
                        className="px-3 py-1.5 bg-[#0b1739] hover:bg-[#12285a] text-sky-200 hover:text-white rounded-xl border border-[#1e3c7a] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Search className="w-3 h-3 text-sky-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions / Shortcuts */}
              <div className="p-4 cns-glass-card rounded-xl space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Mẹo tra cứu nhanh toàn diện hệ thống:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-bold">•</span>
                    <span>Gõ <b>Tần số</b> (ví dụ: <code className="text-amber-300">125.6</code>) để tìm đài phát VHF tương ứng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-bold">•</span>
                    <span>Gõ <b>Địa chỉ IP</b> (ví dụ: <code className="text-amber-300">192.168</code>) để tra cứu thiết bị mạng & máy chủ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-bold">•</span>
                    <span>Gõ <b>Mã bo mạch</b> (ví dụ: <code className="text-amber-300">PA-</code>, <code className="text-amber-300">MOD-</code>) để tìm linh kiện & phụ tùng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-bold">•</span>
                    <span>Gõ <b>Tên kỹ sư / Đài trạm</b> (ví dụ: <code className="text-amber-300">Tân Sơn Nhất</code>, <code className="text-amber-300">C2</code>) để lọc thiết bị</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump to all registered books */}
              <div>
                <div className="text-xs font-bold text-slate-300 mb-2">
                  Danh mục toàn bộ {equipments.length} sổ lý lịch trong hệ thống:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {equipments.slice(0, 6).map(eq => (
                    <div
                      key={eq.id}
                      onClick={() => {
                        onSelectResult(eq.id, 'general');
                        onClose();
                      }}
                      className="p-3 cns-glass-card hover:border-sky-400/50 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[#060e24] border border-[#1e3c7a]">
                          {getCategoryIcon(eq.general.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{eq.general.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">SN: {eq.general.serial || 'N/A'} • {eq.org.location || 'N/A'}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-sky-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {query.trim() && (
            <div className="space-y-2.5">
              {filteredResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#0b1739] border border-[#1e3c7a] flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    Không tìm thấy thông tin nào phù hợp với từ khóa "{query}"
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Thử tìm kiếm với từ khóa ngắn hơn, kiểm tra lại số Serial, mã Part No hoặc bỏ các bộ lọc đang chọn.
                  </p>
                </div>
              ) : (
                filteredResults.map((item) => {
                  const targetEq = equipments.find(e => e.id === item.equipmentId);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="p-3.5 cns-glass-card hover:border-sky-400/60 rounded-xl transition-all cursor-pointer flex flex-col gap-2 group shadow-sm"
                    >
                      {/* Item Top Meta */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTypeBadge(item.categoryType)}
                          <div className="flex items-center gap-1 text-[11px] text-sky-300/80 font-mono">
                            <span>Sổ: <b className="text-white font-semibold">{item.equipmentName}</b></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {item.date && (
                            <span className="text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.date}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#060e24] text-sky-200 border border-[#1e3c7a]">
                            Mục: {item.targetTab.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Item Title & Match Highlight */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            {highlightMatch(item.title, query)}
                          </h4>
                          <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                            {highlightMatch(item.snippet, query)}
                          </p>
                        </div>

                        {/* Direct Jump Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <span>Mở ngay</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Equipment parent info footer */}
                      <div className="pt-2 border-t border-[#122550] flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span>Chủng loại: <b className="text-sky-300">{item.equipmentCategory}</b></span>
                          <span>•</span>
                          <span>Model: <b className="text-slate-200">{item.equipmentModel}</b></span>
                          <span>•</span>
                          <span>SN: <b className="text-sky-300">{item.equipmentSerial}</b></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {targetEq && onOpenPdfModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPdfModal(targetEq);
                              }}
                              className="px-2 py-0.5 bg-[#060e24] hover:bg-[#12285a] text-amber-300 rounded border border-[#1e3c7a] text-[10.5px] font-semibold transition-colors cursor-pointer"
                              title="Xem nhanh bản PDF chuẩn A4"
                            >
                              PDF A4
                            </button>
                          )}
                          {targetEq?.googleDocUrl && (
                            <a
                              href={targetEq.googleDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-0.5 bg-[#060e24] hover:bg-[#12285a] text-emerald-300 rounded border border-[#1e3c7a] text-[10.5px] font-semibold transition-colors flex items-center gap-1"
                              title="Mở Google Doc"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>Doc</span>
                            </a>
                          )}
                          <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform">
                            Chuyển đến tab {item.targetTab} →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls & Keyboard Shortcuts */}
        <div className="p-3.5 bg-[#050c1e] border-t border-[#182d5a] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#0c1836] border border-[#1e3c7a] rounded text-[10px] font-mono text-sky-300">Esc</kbd>
              <span>Đóng</span>
            </span>
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 bg-[#0c1836] border border-[#1e3c7a] rounded text-[10px] font-mono text-sky-300">Enter</kbd>
              <span>Mở kết quả đầu</span>
            </span>
          </div>

          <div className="text-[11.5px] text-sky-300 font-medium">
            {query.trim() ? (
              <span>Tìm thấy <b>{filteredResults.length}</b> kết quả cho "<b>{query}</b>"</span>
            ) : (
              <span>Đang tra cứu trên <b>{equipments.length}</b> sổ lý lịch CNS</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
