import { AppNotification, NotificationType, EquipmentData } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'cns_equipment_notifications_v1';
const MAX_NOTIFICATIONS = 50;

type NotificationListener = (notifications: AppNotification[]) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private notifications: AppNotification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        // Initial welcome/system notification
        this.notifications = [
          {
            id: `notif-init-${Date.now()}`,
            title: 'Hệ thống Sổ Lý Lịch CNS trực tuyến',
            message: 'Hệ thống đã sẵn sàng theo dõi và cảnh báo tự động các sự kiện thêm, xóa sổ và nhật ký bảo dưỡng thiết bị.',
            timestamp: new Date().toISOString(),
            type: 'info',
            isRead: false,
            actor: 'Hệ thống'
          }
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
      this.notifications = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Error saving notifications:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn([...this.notifications]);
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    });
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public notify(params: {
    title: string;
    message: string;
    type?: NotificationType;
    targetEquipmentId?: string;
    targetEquipmentName?: string;
    targetTab?: string;
    actor?: string;
  }): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: params.title,
      message: params.message,
      timestamp: new Date().toISOString(),
      type: params.type || 'info',
      isRead: false,
      targetEquipmentId: params.targetEquipmentId,
      targetEquipmentName: params.targetEquipmentName,
      targetTab: params.targetTab,
      actor: params.actor || 'Hệ thống'
    };

    // Prepend and cap at MAX_NOTIFICATIONS
    this.notifications = [newNotif, ...this.notifications].slice(0, MAX_NOTIFICATIONS);
    this.saveToStorage();
    this.notifyListeners();
    return newNotif;
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  public clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Scan equipments for auto maintenance, warranty, or license expiration alerts
  public checkEquipmentHealthAlerts(equipments: EquipmentData[]) {
    if (!Array.isArray(equipments) || equipments.length === 0) return;
    
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    equipments.forEach(eq => {
      // 1. Check next calibration date
      if (eq.general?.nextCalDate) {
        const calDate = new Date(eq.general.nextCalDate);
        if (!isNaN(calDate.getTime()) && calDate <= thirtyDaysAhead && calDate >= now) {
          const key = `cal-${eq.id}-${eq.general.nextCalDate}`;
          if (!this.hasNotificationKey(key)) {
            this.notify({
              title: `Hạn kiểm định / hiệu chuẩn sắp đến`,
              message: `Thiết bị "${eq.general.name}" có hạn kiểm chuẩn vào ngày ${eq.general.nextCalDate}. Vui lòng lên kế hoạch kiểm định.`,
              type: 'warning',
              targetEquipmentId: eq.id,
              targetEquipmentName: eq.general.name,
              targetTab: 'general',
              actor: 'Giám sát kỹ thuật'
            });
          }
        }
      }

      // 2. Check warranty date
      if (eq.general?.warrantyDate) {
        const warDate = new Date(eq.general.warrantyDate);
        if (!isNaN(warDate.getTime()) && warDate <= thirtyDaysAhead && warDate >= now) {
          const key = `war-${eq.id}-${eq.general.warrantyDate}`;
          if (!this.hasNotificationKey(key)) {
            this.notify({
              title: `Hạn bảo hành sắp hết`,
              message: `Thiết bị "${eq.general.name}" sẽ hết hạn bảo hành vào ngày ${eq.general.warrantyDate}.`,
              type: 'warning',
              targetEquipmentId: eq.id,
              targetEquipmentName: eq.general.name,
              targetTab: 'general',
              actor: 'Hệ thống Quản lý'
            });
          }
        }
      }
    });
  }

  private hasNotificationKey(searchStr: string): boolean {
    return this.notifications.some(n => n.message.includes(searchStr));
  }
}

export const notificationService = new NotificationService();
