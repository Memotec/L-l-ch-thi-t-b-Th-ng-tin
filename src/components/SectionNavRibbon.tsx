import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  Layers, 
  BookOpen, 
  Wrench, 
  AlertTriangle, 
  MessageSquare,
  Printer, 
  QrCode, 
  Settings
} from 'lucide-react';

interface SectionNavRibbonProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
}

export const SectionNavRibbon: React.FC<SectionNavRibbonProps> = ({
  activeTab,
  onNavigateTab
}) => {
  const sections = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'general', label: '1. Sơ lược & Pháp lý', icon: FileText },
    { id: 'spec', label: '2. Đặc tính & Cấu hình', icon: Cpu },
    { id: 'components', label: '3. Khối & Linh kiện', icon: Layers },
    { id: 'docs', label: '4. Tài liệu', icon: BookOpen },
    { id: 'maintenance', label: '5. Bảo dưỡng', icon: Wrench },
    { id: 'repair', label: '6. Sửa chữa', icon: AlertTriangle },
    { id: 'notes', label: '7. Ghi chú', icon: MessageSquare },
    { id: 'qrCode', label: 'Mã QR & Tem nhãn', icon: QrCode, isSpecial: true },
    { id: 'printPreview', label: 'In Sổ A4', icon: Printer, isSpecial: true },
    { id: 'settings', label: 'Cài đặt', icon: Settings, isSpecial: true }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs mb-5 overflow-x-auto select-none">
      <div className="flex items-center gap-1 min-w-max">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigateTab(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : sec.isSpecial
                  ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : sec.isSpecial ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
