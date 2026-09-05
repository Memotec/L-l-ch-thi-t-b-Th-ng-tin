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
  MapPin, 
  ChevronRight, 
  Clock, 
  Sparkles,
  ArrowRight,
  ExternalLink
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
      case 'VHF/UHF': return <Radio className="w-3.5 h-3.5 text-blue-600" />;
      case 'Ghép Kênh': return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case 'VIBA': return <HardDrive className="w-3.5 h-3.5 text-emerald-600" />;
      case 'VOICE': return <PhoneCall className="w-3.5 h-3.5 text-amber-600" />;
      case 'POWER': return <Zap className="w-3.5 h-3.5 text-yellow-600" />;
      case 'IT': return <Server className="w-3.5 h-3.5 text-purple-600" />;
      case 'RADAR_ADS': return <Radar className="w-3.5 h-3.5 text-rose-600" />;
      case 'NAV': return <Compass className="w-3.5 h-3.5 text-cyan-600" />;
      default: return <Box className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Helper type badge
  const getTypeBadge = (type: SearchResultItem['categoryType']) => {
    switch (type) {
      case 'EQUIPMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-600" /> Sổ Thiết Bị
          </span>
        );
      case 'COMPONENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-600" /> Linh Kiện / Bo Mạch
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-emerald-600" /> Nhật Ký Bảo Dưỡng
          </span>
        );
      case 'REPAIR':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Sự Cố & Sửa Chữa
          </span>
        );
      case 'DOC':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-600" /> Hồ Sơ & Bản Vẽ
          </span>
        );
      case 'SPEC':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-600" /> Thông Số Kỹ Thuật
          </span>
        );
      case 'LOCATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-600" /> Vị Trí & Đài Trạm
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
            <mark key={i} className="bg-amber-100 text-amber-900 font-bold px-0.5 rounded">
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 px-3 sm:px-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Search Modal Card */}
      <div 
        className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Search Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white shadow-xs shrink-0">
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
                className="w-full bg-slate-800 text-white text-sm sm:text-base font-semibold placeholder-slate-400 pl-4 pr-10 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer shrink-0"
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
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>Tất cả mục</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 text-[10px] font-mono font-bold">
                {countStats.ALL}
              </span>
            </button>

            <button
              onClick={() => setFilterType('EQUIPMENT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'EQUIPMENT'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Sổ Thiết Bị</span>
              {countStats.EQUIPMENT > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-blue-400 text-[10px] font-mono font-bold">
                  {countStats.EQUIPMENT}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('COMPONENT')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'COMPONENT'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Linh Kiện</span>
              {countStats.COMPONENT > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-purple-400 text-[10px] font-mono font-bold">
                  {countStats.COMPONENT}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('MAINTENANCE')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'MAINTENANCE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo Dưỡng</span>
              {countStats.MAINTENANCE > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-400 text-[10px] font-mono font-bold">
                  {countStats.MAINTENANCE}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('REPAIR')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'REPAIR'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sự Cố & Sửa Chữa</span>
              {countStats.REPAIR > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-400 text-[10px] font-mono font-bold">
                  {countStats.REPAIR}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('SPEC')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'SPEC'
                  ? 'bg-cyan-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thông Số & IP</span>
              {countStats.SPEC > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-cyan-400 text-[10px] font-mono font-bold">
                  {countStats.SPEC}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterType('DOC')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                filterType === 'DOC'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>Tài Liệu</span>
              {countStats.DOC > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 text-[10px] font-mono font-bold">
                  {countStats.DOC}
                </span>
              )}
            </button>
          </div>

          {/* Layer 2: Equipment Category & Sorting Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Chủng loại:</span>
              {(['ALL', 'VHF/UHF', 'Ghép Kênh', 'VIBA', 'VOICE', 'POWER', 'IT', 'RADAR_ADS', 'NAV'] as EquipmentCategoryFilter[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả nhóm' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sắp xếp kết quả tìm kiếm"
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="relevance">Độ liên quan</option>
                <option value="date">Ngày gần nhất</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Results & Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50">
          {/* Recent Searches / Fast Keyword Chips when no query */}
          {!query.trim() && (
            <div className="space-y-5 py-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Tìm kiếm gần đây & Từ khóa phổ biến:
                    </span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem('cns_recent_searches');
                        } catch {}
                      }}
                      className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickSearch(term)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Search className="w-3 h-3 text-blue-600" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions / Shortcuts */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Mẹo tra cứu nhanh toàn diện hệ thống:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-blue-600 font-bold">•</span>
                    <span>Gõ <b>Tần số</b> (ví dụ: <code className="text-amber-700 font-semibold">125.6</code>) để tìm đài phát VHF tương ứng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-blue-600 font-bold">•</span>
                    <span>Gõ <b>Địa chỉ IP</b> (ví dụ: <code className="text-amber-700 font-semibold">192.168</code>) để tra cứu thiết bị mạng & máy chủ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-blue-600 font-bold">•</span>
                    <span>Gõ <b>Mã bo mạch</b> (ví dụ: <code className="text-amber-700 font-semibold">PA-</code>, <code className="text-amber-700 font-semibold">MOD-</code>) để tìm linh kiện & phụ tùng</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-blue-600 font-bold">•</span>
                    <span>Gõ <b>Tên kỹ sư / Đài trạm</b> (ví dụ: <code className="text-amber-700 font-semibold">Tân Sơn Nhất</code>, <code className="text-amber-700 font-semibold">C2</code>) để lọc thiết bị</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump to all registered books */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">
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
                      className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                          {getCategoryIcon(eq.general.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{eq.general.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">SN: {eq.general.serial || 'N/A'} • {eq.org.location || 'N/A'}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
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
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center mx-auto text-slate-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Không tìm thấy thông tin nào phù hợp với từ khóa "{query}"
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
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
                      className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer flex flex-col gap-2 group shadow-2xs"
                    >
                      {/* Item Top Meta */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTypeBadge(item.categoryType)}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                            <span>Sổ: <b className="text-slate-900 font-semibold">{item.equipmentName}</b></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {item.date && (
                            <span className="text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.date}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Mục: {item.targetTab.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Item Title & Match Highlight */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {highlightMatch(item.title, query)}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {highlightMatch(item.snippet, query)}
                          </p>
                        </div>

                        {/* Direct Jump Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Mở ngay</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Equipment parent info footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span>Chủng loại: <b className="text-slate-800">{item.equipmentCategory}</b></span>
                          <span>•</span>
                          <span>Model: <b className="text-slate-800">{item.equipmentModel}</b></span>
                          <span>•</span>
                          <span>SN: <b className="text-blue-700">{item.equipmentSerial}</b></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {targetEq && onOpenPdfModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPdfModal(targetEq);
                              }}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-amber-800 rounded border border-slate-200 text-[10.5px] font-semibold transition-colors cursor-pointer"
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
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-emerald-800 rounded border border-slate-200 text-[10.5px] font-semibold transition-colors flex items-center gap-1"
                              title="Mở Google Doc"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>Doc</span>
                            </a>
                          )}
                          <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
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
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">Esc</kbd>
              <span>Đóng</span>
            </span>
            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">Enter</kbd>
              <span>Mở kết quả đầu</span>
            </span>
          </div>

          <div className="text-[11.5px] text-slate-700 font-medium">
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
