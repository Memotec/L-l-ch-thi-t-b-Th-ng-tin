import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Radio, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Cpu, 
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft
} from 'lucide-react';
import { EquipmentData, EquipmentCategory } from '../types';

interface InstantSearchResult {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSerial: string;
  equipmentCategory: EquipmentCategory;
  categoryType: 'EQUIPMENT' | 'COMPONENT' | 'MAINTENANCE' | 'REPAIR' | 'DOC' | 'SPEC';
  title: string;
  snippet: string;
  targetTab: string;
  badge: string;
}

interface InstantSearchDropdownProps {
  equipments: EquipmentData[];
  onSelectResult: (equipmentId: string, targetTab: string) => void;
  onOpenAdvancedSearch: () => void;
}

export const InstantSearchDropdown: React.FC<InstantSearchDropdownProps> = ({
  equipments,
  onSelectResult,
  onOpenAdvancedSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut `/` or `Ctrl+K` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search indexing and matching logic
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];

    const results: InstantSearchResult[] = [];

    equipments.forEach(eq => {
      const name = eq.general?.name || '';
      const model = eq.general?.model || '';
      const serial = eq.general?.serial || '';
      const assetNo = eq.general?.assetNo || eq.general?.assetCode || '';
      const location = eq.org?.location || '';
      const unit = eq.org?.unit || '';
      const cat: EquipmentCategory = eq.general?.category || 'Thiết Bị Khác';

      // 1. Equipment General info match
      if (
        name.toLowerCase().includes(q) ||
        model.toLowerCase().includes(q) ||
        serial.toLowerCase().includes(q) ||
        assetNo.toLowerCase().includes(q) ||
        location.toLowerCase().includes(q) ||
        unit.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      ) {
        results.push({
          id: `eq-${eq.id}`,
          equipmentId: eq.id,
          equipmentName: name,
          equipmentModel: model,
          equipmentSerial: serial,
          equipmentCategory: cat,
          categoryType: 'EQUIPMENT',
          title: name,
          snippet: `Model: ${model} | SN: ${serial || '---'} | Vị trí: ${location || '---'}`,
          targetTab: 'general',
          badge: 'Sổ thiết bị'
        });
      }

      // 2. Components match
      eq.components?.forEach(cp => {
        const cpName = cp.name || '';
        const cpPart = cp.partNo || '';
        const cpSerial = cp.serial || '';
        const cpNote = cp.note || '';
        if (
          cpName.toLowerCase().includes(q) ||
          cpPart.toLowerCase().includes(q) ||
          cpSerial.toLowerCase().includes(q) ||
          cpNote.toLowerCase().includes(q)
        ) {
          results.push({
            id: `cp-${eq.id}-${cp.id}`,
            equipmentId: eq.id,
            equipmentName: name,
            equipmentModel: model,
            equipmentSerial: serial,
            equipmentCategory: cat,
            categoryType: 'COMPONENT',
            title: `Linh kiện: ${cpName}`,
            snippet: `Part No: ${cpPart || 'N/A'} | SN: ${cpSerial || 'N/A'} (${name})`,
            targetTab: 'components',
            badge: 'Mục 3. Linh kiện'
          });
        }
      });

      // 3. Maintenance logs match
      eq.maintenance?.forEach(m => {
        const content = m.content || '';
        const person = m.person || '';
        const params = m.measuredParams || '';
        if (content.toLowerCase().includes(q) || person.toLowerCase().includes(q) || params.toLowerCase().includes(q) || m.date?.includes(q)) {
          results.push({
            id: `maint-${eq.id}-${m.id}`,
            equipmentId: eq.id,
            equipmentName: name,
            equipmentModel: model,
            equipmentSerial: serial,
            equipmentCategory: cat,
            categoryType: 'MAINTENANCE',
            title: `Bảo dưỡng: ${m.cycle || 'Định kỳ'} (${m.date || ''})`,
            snippet: `${content.substring(0, 75)}... - KTV: ${person}`,
            targetTab: 'maintenance',
            badge: 'Mục 5. Bảo dưỡng'
          });
        }
      });

      // 4. Repair logs match
      eq.repair?.forEach(r => {
        const desc = r.incidentDescription || '';
        const cause = r.rootCause || '';
        const action = r.actionTaken || '';
        const person = r.person || '';
        if (
          desc.toLowerCase().includes(q) || 
          cause.toLowerCase().includes(q) || 
          action.toLowerCase().includes(q) ||
          person.toLowerCase().includes(q) ||
          r.date?.includes(q)
        ) {
          results.push({
            id: `rep-${eq.id}-${r.id}`,
            equipmentId: eq.id,
            equipmentName: name,
            equipmentModel: model,
            equipmentSerial: serial,
            equipmentCategory: cat,
            categoryType: 'REPAIR',
            title: `Sự cố/Sửa chữa: ${r.type || 'Sự vụ kỹ thuật'} (${r.date || ''})`,
            snippet: `${(desc || action).substring(0, 75)}... [${r.status || 'Đã xử lý'}]`,
            targetTab: 'repair',
            badge: 'Mục 6. Sửa chữa'
          });
        }
      });

      // 5. Specs match (IP, Frequency, Interfaces)
      if (eq.spec) {
        const ip = eq.spec.mgmtIp || '';
        const freq = eq.spec.channelFreq || eq.spec.range || '';
        const iface = eq.spec.interface || '';
        const text = eq.spec.text || '';
        if (
          ip.toLowerCase().includes(q) ||
          freq.toLowerCase().includes(q) ||
          iface.toLowerCase().includes(q) ||
          text.toLowerCase().includes(q)
        ) {
          results.push({
            id: `spec-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: name,
            equipmentModel: model,
            equipmentSerial: serial,
            equipmentCategory: cat,
            categoryType: 'SPEC',
            title: `Thông số & Cấu hình mạng (${name})`,
            snippet: `IP: ${ip || '---'} | Tần số: ${freq || '---'} | Chuẩn: ${iface || '---'}`,
            targetTab: 'spec',
            badge: 'Mục 2. Cấu hình'
          });
        }
      }
    });

    return results.slice(0, 10);
  }, [equipments, searchTerm]);

  // Keyboard navigation within dropdown results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      } else {
        onOpenAdvancedSearch();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (result: InstantSearchResult) => {
    onSelectResult(result.equipmentId, result.targetTab);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getResultIcon = (type: InstantSearchResult['categoryType']) => {
    switch (type) {
      case 'EQUIPMENT':
        return <Radio className="w-4 h-4 text-blue-600" />;
      case 'COMPONENT':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'MAINTENANCE':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'REPAIR':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'SPEC':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm nhanh Serial, Model, IP, Linh kiện..."
          className="w-full pl-9 pr-14 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-slate-100 placeholder-slate-400 border border-slate-700/80 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
        />

        {searchTerm ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-2 p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2 flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none hidden sm:flex">
            <span>/</span>
          </div>
        )}
      </div>

      {/* Dropdown Floating Results Panel */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs max-h-96 flex flex-col">
          {/* Header of results */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Kết quả tra cứu ({searchResults.length})
            </span>
            <span className="text-[10px]">Dùng phím ↑ ↓ và Enter để chọn</span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-slate-500 font-medium">Không tìm thấy kết quả phù hợp với "{searchTerm}"</p>
                <p className="text-[11px] text-slate-400 mt-1">Thử tìm theo tên thiết bị, mã số serial, part no linh kiện hoặc IP</p>
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 text-blue-950' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                      {getResultIcon(item.categoryType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.snippet}
                      </p>
                    </div>

                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-600 shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer of Dropdown */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Tra cứu nâng cao & Bộ lọc tổng thể?</span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAdvancedSearch();
              }}
              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              <span>Mở Tìm kiếm chi tiết (Ctrl+K)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
