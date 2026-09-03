import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  PlusCircle, 
  RotateCcw, 
  FileEdit, 
  Wrench, 
  AlertTriangle, 
  Cloud, 
  Info, 
  ExternalLink,
  X,
  Filter
} from 'lucide-react';
import { AppNotification, NotificationType, NotificationCategory } from '../types';
import { notificationService } from '../utils/notificationService';

interface NotificationBellProps {
  onNavigateToEquipment?: (equipmentId: string, tabName?: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToEquipment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifications(updated);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      notificationService.markAsRead(notif.id);
    }
    if (notif.targetEquipmentId && onNavigateToEquipment) {
      onNavigateToEquipment(notif.targetEquipmentId, notif.targetTab);
      setIsOpen(false);
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'unread') return !n.isRead;
    if (activeCategory === 'ledger') return n.type === 'create' || n.type === 'delete' || n.type === 'restore';
    if (activeCategory === 'maintenance_repair') return n.type === 'maintenance' || n.type === 'repair' || n.type === 'warning';
    if (activeCategory === 'sync') return n.type === 'sync';
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'create':
        return (
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
      case 'delete':
        return (
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="w-4 h-4" />
          </div>
        );
      case 'restore':
        return (
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <RotateCcw className="w-4 h-4" />
          </div>
        );
      case 'update':
        return (
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileEdit className="w-4 h-4" />
          </div>
        );
      case 'maintenance':
        return (
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wrench className="w-4 h-4" />
          </div>
        );
      case 'repair':
        return (
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'sync':
        return (
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cloud className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-lg bg-slate-700 text-slate-300 border border-slate-600">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 45) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay === 1) return 'Hôm qua';
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpenToggle}
        className={`relative flex items-center justify-center p-2 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/30'
            : unreadCount > 0
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 hover:border-amber-400'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
        }`}
        title={
          unreadCount > 0
            ? `Có ${unreadCount} cảnh báo & thông báo sự kiện mới! (Nhấn để xem)`
            : 'Trung tâm Cảnh báo & Thông báo Sự kiện'
        }
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4 text-slate-300" />
        )}

        {/* Badge counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center px-1.5 py-0.5 min-w-[18px] h-[18px] bg-rose-600 text-white font-extrabold text-[10px] rounded-full border-2 border-[#0F172A] shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  Cảnh báo & Sự kiện
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                      {unreadCount} mới
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Theo dõi thêm, xóa sổ & cập nhật thiết bị</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đã đọc</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                  title="Dọn sạch toàn bộ thông báo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa hết</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setActiveCategory('unread')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'unread'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              onClick={() => setActiveCategory('ledger')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'ledger'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Thêm / Xóa sổ
            </button>
            <button
              onClick={() => setActiveCategory('maintenance_repair')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'maintenance_repair'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Bảo dưỡng / Sự cố
            </button>
            <button
              onClick={() => setActiveCategory('sync')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'sync'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Đồng bộ Cloud
            </button>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[360px] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-2 text-slate-500">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeCategory === 'unread' 
                    ? 'Bạn đã đọc toàn bộ các cảnh báo sự kiện!' 
                    : 'Các sự kiện thêm, xóa sổ hoặc bảo dưỡng mới sẽ hiển thị tại đây.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.isRead
                      ? 'hover:bg-slate-800/50 opacity-80 hover:opacity-100'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-l-2 border-amber-400'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold truncate ${
                        notif.isRead ? 'text-slate-300' : 'text-white'
                      }`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/40 text-[10px]">
                      <div className="flex items-center gap-2 text-slate-400">
                        {notif.actor && (
                          <span className="bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-medium">
                            {notif.actor}
                          </span>
                        )}
                        {notif.targetEquipmentName && (
                          <span className="text-blue-400 font-medium truncate max-w-[150px]">
                            {notif.targetEquipmentName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {notif.targetEquipmentId && onNavigateToEquipment && (
                          <span className="text-blue-400 group-hover:text-blue-300 font-semibold flex items-center gap-0.5">
                            Xem sổ <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteItem(e, notif.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-700/50 transition-colors"
                          title="Xóa thông báo này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer status */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-between">
            <span>Tự động phát hiện & cảnh báo mọi thay đổi dữ liệu</span>
            <span className="text-emerald-400 font-mono">Real-time Alert v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
