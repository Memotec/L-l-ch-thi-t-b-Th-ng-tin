import { EquipmentData, MaintenanceCycle, AppNotification } from '../types';
import { notificationService } from './notificationService';

export interface BrowserNotifConfig {
  enabled: boolean;
  maintAlerts: boolean;
  syncAlerts: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEYS = {
  ENABLED: 'cns_browser_notif_enabled_v1',
  MAINT_ALERTS: 'cns_browser_notif_maint_v1',
  SYNC_ALERTS: 'cns_browser_notif_sync_v1',
  SOUND: 'cns_browser_notif_sound_v1',
  THROTTLE_PREFIX: 'cns_notif_throttle_'
};

type ClickHandler = (equipmentId?: string, tabName?: string) => void;

class BrowserNotificationService {
  private clickListeners: Set<ClickHandler> = new Set();
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('cns-navigate-from-notification', (e: any) => {
        const { equipmentId, tabName } = e.detail || {};
        this.clickListeners.forEach(fn => fn(equipmentId, tabName));
      });
    }
  }

  /**
   * Check if the browser supports Notification API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state: 'granted' | 'denied' | 'default' | 'unsupported'
   */
  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        this.setConfig({ enabled: true });
        this.playChime();
        this.sendNotification({
          title: '✓ Đã kích hoạt Thông Báo Trình Duyệt CNS',
          body: 'Hệ thống Sổ Lý Lịch Thiết Bị sẽ tự động gửi cảnh báo bảo trì và thông báo đồng bộ từ thiết bị khác.',
          tag: 'cns-welcome-notif'
        });
      }
      return perm;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Get notification configuration preferences
   */
  public getConfig(): BrowserNotifConfig {
    if (typeof window === 'undefined') {
      return { enabled: false, maintAlerts: true, syncAlerts: true, soundEnabled: true };
    }
    const perm = this.getPermission();
    const storedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);
    const enabled = perm === 'granted' && storedEnabled !== 'false';
    const maintAlerts = localStorage.getItem(STORAGE_KEYS.MAINT_ALERTS) !== 'false';
    const syncAlerts = localStorage.getItem(STORAGE_KEYS.SYNC_ALERTS) !== 'false';
    const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false';

    return { enabled, maintAlerts, syncAlerts, soundEnabled };
  }

  /**
   * Save configuration preferences
   */
  public setConfig(partial: Partial<BrowserNotifConfig>) {
    if (typeof window === 'undefined') return;
    if (partial.enabled !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ENABLED, String(partial.enabled));
    }
    if (partial.maintAlerts !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MAINT_ALERTS, String(partial.maintAlerts));
    }
    if (partial.syncAlerts !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SYNC_ALERTS, String(partial.syncAlerts));
    }
    if (partial.soundEnabled !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(partial.soundEnabled));
    }
  }

  /**
   * Subscribe to notification click events to navigate
   */
  public onNotificationClick(fn: ClickHandler): () => void {
    this.clickListeners.add(fn);
    return () => {
      this.clickListeners.delete(fn);
    };
  }

  /**
   * Play a pleasant electronic chime via Web Audio API
   */
  public playChime() {
    try {
      const config = this.getConfig();
      if (!config.soundEnabled) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;
      
      // Tone 1 (587.33 Hz - D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (880.00 Hz - A5)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0.09, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // Ignore audio synthesis errors on strict autoplay policies
    }
  }

  /**
   * Send a Browser Push Notification
   */
  public sendNotification(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    equipmentId?: string;
    tabName?: string;
    requireInteraction?: boolean;
    force?: boolean;
  }): Notification | null {
    if (!this.isSupported()) return null;
    const config = this.getConfig();
    if (!options.force && (!config.enabled || this.getPermission() !== 'granted')) {
      return null;
    }

    try {
      this.playChime();

      const notif = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || `cns-${Date.now()}`,
        badge: '/favicon.ico',
        requireInteraction: options.requireInteraction ?? false
      });

      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.equipmentId || options.tabName) {
          this.clickListeners.forEach(fn => fn(options.equipmentId, options.tabName));
        }
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('Could not display browser notification:', err);
      return null;
    }
  }

  /**
   * Trigger Browser Push Notification when data is synchronized from another device / cloud
   */
  public notifyCloudSyncReceived(params: {
    count: number;
    source?: string;
    message?: string;
  }) {
    const config = this.getConfig();
    if (!config.enabled || !config.syncAlerts || this.getPermission() !== 'granted') {
      return;
    }

    const title = 'Đồng bộ Sổ Lý Lịch CNS từ Đám Mây';
    const body = params.message || `✓ Đã tự động đồng bộ ${params.count} thiết bị mới nhất từ thiết bị khác. Dữ liệu đã cập nhật sẵn sàng.`;

    this.sendNotification({
      title,
      body,
      tag: `cns-sync-${Date.now()}`,
      tabName: 'dashboard'
    });
  }

  /**
   * Calculate due days based on maintenance cycle
   */
  private getCycleDays(cycle?: MaintenanceCycle | string): number {
    switch (cycle) {
      case 'Hàng tuần': return 7;
      case 'Hàng tháng': return 30;
      case 'Hàng quý': return 90;
      case '6 tháng': return 180;
      case 'Hàng năm': return 365;
      default: return 90;
    }
  }

  /**
   * Check equipment list for maintenance dues and expiration alerts
   */
  public checkEquipmentMaintenanceDues(equipments: EquipmentData[], forceNotify: boolean = false) {
    if (!Array.isArray(equipments) || equipments.length === 0) return;
    const config = this.getConfig();
    const canSendBrowserNotif = forceNotify || (config.enabled && config.maintAlerts && this.getPermission() === 'granted');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    equipments.forEach(eq => {
      const name = eq.general?.name || 'Thiết bị';
      const eqId = eq.id;

      // 1. Check calibration due (Hạn kiểm định / hiệu chuẩn)
      if (eq.general?.nextCalDate) {
        const calDate = new Date(eq.general.nextCalDate);
        if (!isNaN(calDate.getTime())) {
          const diffDays = Math.ceil((calDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            const throttleKey = `${STORAGE_KEYS.THROTTLE_PREFIX}cal_${eqId}_${eq.general.nextCalDate}_${todayStr}`;
            const shouldSend = forceNotify || !localStorage.getItem(throttleKey);

            if (shouldSend) {
              const statusText = diffDays < 0 
                ? `ĐÃ QUÁ HẠN ${Math.abs(diffDays)} ngày` 
                : diffDays === 0 
                ? 'ĐẾN HẠN HÔM NAY' 
                : `còn ${diffDays} ngày nữa đến hạn (${eq.general.nextCalDate})`;

              const title = `⚠️ Cảnh báo kiểm chuẩn: ${name}`;
              const body = `Thiết bị ${statusText}. Vui lòng lên kế hoạch kiểm định/hiệu chuẩn kỹ thuật.`;

              if (canSendBrowserNotif) {
                this.sendNotification({
                  title,
                  body,
                  tag: `cns-cal-${eqId}`,
                  equipmentId: eqId,
                  tabName: 'general',
                  requireInteraction: diffDays <= 7
                });
              }

              notificationService.notify({
                title,
                message: body,
                type: 'warning',
                targetEquipmentId: eqId,
                targetEquipmentName: name,
                targetTab: 'general',
                actor: 'Giám sát kiểm chuẩn'
              });

              localStorage.setItem(throttleKey, 'true');
            }
          }
        }
      }

      // 2. Check periodic maintenance due based on previous maintenance cycle
      const maintLogs = eq.maintenance || [];
      if (maintLogs.length > 0) {
        // Sort by date descending
        const sorted = [...maintLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const lastLog = sorted[0];
        if (lastLog && lastLog.date) {
          const lastDate = new Date(lastLog.date);
          if (!isNaN(lastDate.getTime())) {
            const cycleDays = this.getCycleDays(lastLog.cycle);
            const nextMaintDate = new Date(lastDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
            const diffDays = Math.ceil((nextMaintDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Alert if due within 7 days or overdue
            if (diffDays <= 7) {
              const nextMaintStr = nextMaintDate.toISOString().split('T')[0];
              const throttleKey = `${STORAGE_KEYS.THROTTLE_PREFIX}maint_${eqId}_${nextMaintStr}_${todayStr}`;
              const shouldSend = forceNotify || !localStorage.getItem(throttleKey);

              if (shouldSend) {
                const statusText = diffDays < 0 
                  ? `ĐÃ QUÁ HẠN BẢO DƯỠNG ${Math.abs(diffDays)} ngày` 
                  : diffDays === 0 
                  ? 'ĐẾN HẠN BẢO DƯỠNG HÔM NAY' 
                  : `còn ${diffDays} ngày nữa đến hạn bảo dưỡng định kỳ (${lastLog.cycle || 'Hàng quý'})`;

                const title = `🔧 Cảnh báo bảo trì thiết bị: ${name}`;
                const body = `Thiết bị ${statusText}. Lần bảo dưỡng gần nhất: ${lastLog.date}.`;

                if (canSendBrowserNotif) {
                  this.sendNotification({
                    title,
                    body,
                    tag: `cns-maint-${eqId}`,
                    equipmentId: eqId,
                    tabName: 'maintenance',
                    requireInteraction: diffDays <= 3
                  });
                }

                notificationService.notify({
                  title,
                  message: body,
                  type: 'maintenance',
                  targetEquipmentId: eqId,
                  targetEquipmentName: name,
                  targetTab: 'maintenance',
                  actor: 'Giám sát bảo dưỡng định kỳ'
                });

                localStorage.setItem(throttleKey, 'true');
              }
            }
          }
        }
      }

      // 3. Check Warranty expiration
      if (eq.general?.warrantyDate) {
        const warDate = new Date(eq.general.warrantyDate);
        if (!isNaN(warDate.getTime())) {
          const diffDays = Math.ceil((warDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 15 && diffDays >= -15) {
            const throttleKey = `${STORAGE_KEYS.THROTTLE_PREFIX}war_${eqId}_${eq.general.warrantyDate}_${todayStr}`;
            const shouldSend = forceNotify || !localStorage.getItem(throttleKey);

            if (shouldSend) {
              const statusText = diffDays < 0 
                ? `đã hết hạn bảo hành ${Math.abs(diffDays)} ngày` 
                : `sắp hết hạn bảo hành vào ngày ${eq.general.warrantyDate}`;

              const title = `🛡️ Hạn bảo hành thiết bị: ${name}`;
              const body = `Hồ sơ ${name} ${statusText}.`;

              if (canSendBrowserNotif) {
                this.sendNotification({
                  title,
                  body,
                  tag: `cns-war-${eqId}`,
                  equipmentId: eqId,
                  tabName: 'general'
                });
              }

              notificationService.notify({
                title,
                message: body,
                type: 'warning',
                targetEquipmentId: eqId,
                targetEquipmentName: name,
                targetTab: 'general',
                actor: 'Quản lý bảo hành'
              });

              localStorage.setItem(throttleKey, 'true');
            }
          }
        }
      }
    });
  }

  /**
   * Send a test browser notification to verify permissions and audio
   */
  public sendTestNotification() {
    this.sendNotification({
      title: '🔔 Thông báo thử nghiệm thành công!',
      body: 'Hệ thống Sổ Lý Lịch CNS đã kết nối thành công với tính năng Thông báo đẩy của trình duyệt.',
      tag: `cns-test-${Date.now()}`,
      tabName: 'dashboard',
      force: true
    });
  }
}

export const browserNotificationService = new BrowserNotificationService();
