import React from 'react';
import { 
  Home, 
  Search, 
  ListFilter, 
  QrCode, 
  User, 
  ShieldCheck,
  Lock
} from 'lucide-react';
import { AppUser } from '../types';

export type ViewerNavTab = 'home' | 'search' | 'equipments' | 'qr' | 'account';

interface ViewerBottomNavProps {
  activeTab: ViewerNavTab;
  onSelectTab: (tab: ViewerNavTab) => void;
  currentUser: AppUser;
  unreadCount?: number;
}

export const ViewerBottomNav: React.FC<ViewerBottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  unreadCount = 0
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navItems: { id: ViewerNavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string | null }[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      badge: null
    },
    {
      id: 'search',
      label: 'Tra cứu',
      icon: Search,
      badge: null
    },
    {
      id: 'equipments',
      label: 'Thiết bị',
      icon: ListFilter,
      badge: null
    },
    {
      id: 'qr',
      label: 'Quét QR',
      icon: QrCode,
      badge: null
    },
    {
      id: 'account',
      label: isAdmin ? 'Admin' : 'Tài khoản',
      icon: isAdmin ? ShieldCheck : User,
      badge: isAdmin ? 'Admin' : null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 select-none md:hidden safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Icon Container with active highlight pill */}
              <div className={`p-1 rounded-lg transition-transform ${
                isActive ? 'bg-blue-50 scale-110' : 'bg-transparent'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              </div>

              {/* Label */}
              <span className={`text-[10.5px] leading-none tracking-tight ${
                isActive ? 'font-bold text-blue-600' : 'text-slate-500'
              }`}>
                {item.label}
              </span>

              {/* Badge Indicator */}
              {item.badge && (
                <span className="absolute top-1 right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
