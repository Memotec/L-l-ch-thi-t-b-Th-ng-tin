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
  Filter,
  Volume2,
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { AppNotification, NotificationType, NotificationCategory } from '../types';
import { notificationService } from '../utils/notificationService';
import { browserNotificationService } from '../utils/browserNotificationService';

interface NotificationBellProps {
  onNavigateToEquipment?: (equipmentId: string, tabName?: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToEquipment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifications(updated);
    });
    setBrowserPerm(browserNotificationService.getPermission());
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
      setBrowserPerm(browserNotificationService.getPermission());
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenToggle = () => {
    setIsOpen(prev => !prev);
    setBrowserPerm(browserNotificationService.getPermission());
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

  const handleRequestBrowserPermission = async () => {
    const perm = await browserNotificationService.requestPermission();
    setBrowserPerm(perm);
  };

  const handleTestBrowserPush = () => {
    browserNotificationService.sendTestNotification();
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
      const now = Date.now();
      const time = new Date(isoString).getTime();
      const diffSec = Math.floor((now - time) / 1000);

      if (diffSec < 60) return 'Vừa xong';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
      return `${Math.floor(diffSec / 86400)} ngày trước`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleOpenToggle}
        className={`relative p-2 rounded-lg transition-all cursor-pointer border ${
          unreadCount > 0
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-xs shadow-amber-500/20 animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
        }`}
        title={`Thông báo & Cảnh báo (${unreadCount} chưa đọc)`}
        aria-label="Cảnh báo & Sự kiện"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[440px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
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
                <p className="text-[11px] text-slate-400">Theo dõi bảo trì, kiểm định & đồng bộ đám mây</p>
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

          {/* Browser Push Notification Permission Quick Bar */}
          <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] text-slate-300 truncate">
                Thông báo trình duyệt:
              </span>
              {browserPerm === 'granted' ? (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Đang BẬT
                </span>
              ) : browserPerm === 'denied' ? (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  Bị chặn
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Chưa bật
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {browserPerm === 'granted' ? (
                <button
                  onClick={handleTestBrowserPush}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Thử gửi 1 thông báo đẩy trình duyệt kiểm tra"
                >
                  <Volume2 className="w-2.5 h-2.5 text-blue-400" />
                  <span>Test Push</span>
                </button>
              ) : (
                <button
                  onClick={handleRequestBrowserPermission}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Cấp quyền Push</span>
                </button>
              )}
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
              onClick={() => setActiveCategory('maintenance_repair')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'maintenance_repair'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Bảo dưỡng / Kiểm định
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
                    : 'Các cảnh báo đến hạn bảo dưỡng, kiểm định hoặc đồng bộ mới sẽ hiển thị tại đây.'}
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
            <span className="text-emerald-400 font-mono">Push Notification v2.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
