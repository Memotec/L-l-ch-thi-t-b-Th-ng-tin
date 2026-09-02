import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  Layers, 
  BookOpen, 
  Wrench, 
  AlertTriangle, 
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
    { id: 'qrCode', label: 'Mã QR & Tem nhãn', icon: QrCode, isSpecial: true },
    { id: 'printPreview', label: 'In Sổ A4', icon: Printer, isSpecial: true },
    { id: 'settings', label: 'Cài đặt', icon: Settings, isSpecial: true }
  ];

  return (
    <div className="bg-[#08132f] border border-[#162d5a] rounded-xl p-1.5 shadow-md mb-5 overflow-x-auto select-none">
      <div className="flex items-center gap-1 min-w-max">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigateTab(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md border border-sky-400/40'
                  : sec.isSpecial
                  ? 'text-sky-300 hover:bg-[#0f214d] hover:text-white border border-sky-500/20'
                  : 'text-slate-300 hover:bg-[#0d1c42] hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : sec.isSpecial ? 'text-sky-300' : 'text-sky-400/70'}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
