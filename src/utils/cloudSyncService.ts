import { EquipmentData, TrashEquipmentItem, AppUser } from '../types';
import { storageService } from './storageService';

export interface CloudSyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncedAt: string | null;
  cloudCount: number;
  lastModified: string | null;
  updatedBy: string;
  errorMessage?: string | null;
  isAutoSyncEnabled: boolean;
}

const CLOUD_LAST_SYNC_KEY = 'cns_cloud_last_synced_time_v1';
const AUTO_LOAD_ON_LOGIN_KEY = 'cns_auto_load_cloud_on_login_v1';
const CROSS_DEVICE_AUTO_SYNC_KEY = 'cns_cross_device_auto_sync_v1';
const GAS_URL_STORAGE_KEY = 'cns_gas_webapp_url_v1';

type SyncListener = (state: CloudSyncState) => void;
const listeners = new Set<SyncListener>();

let currentState: CloudSyncState = {
  status: 'idle',
  lastSyncedAt: typeof window !== 'undefined' ? localStorage.getItem(CLOUD_LAST_SYNC_KEY) : null,
  cloudCount: 0,
  lastModified: null,
  updatedBy: '',
  errorMessage: null,
  isAutoSyncEnabled: typeof window !== 'undefined' ? localStorage.getItem(CROSS_DEVICE_AUTO_SYNC_KEY) !== 'false' : true
};

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn({ ...currentState });
    } catch (err) {
      console.error('Error notifying sync listener:', err);
    }
  });
}

function updateState(partial: Partial<CloudSyncState>) {
  currentState = { ...currentState, ...partial };
  notifyListeners();
}

let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const cloudSyncService = {
  /**
   * Returns current sync state
   */
  getState(): CloudSyncState {
    return { ...currentState };
  },

  /**
   * Subscribe to sync state changes
   */
  subscribe(fn: SyncListener): () => void {
    listeners.add(fn);
    fn({ ...currentState });
    return () => {
      listeners.delete(fn);
    };
  },

  /**
   * Check if auto-load on login is enabled (default: true)
   */
  getAutoLoadOnLogin(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(AUTO_LOAD_ON_LOGIN_KEY) !== 'false';
  },

  /**
   * Set auto-load on login preference
   */
  setAutoLoadOnLogin(val: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTO_LOAD_ON_LOGIN_KEY, String(val));
  },

  /**
   * Check if background cross-device auto-sync is enabled (default: true)
   */
  getCrossDeviceAutoSync(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(CROSS_DEVICE_AUTO_SYNC_KEY) !== 'false';
  },

  /**
   * Toggle cross-device auto-sync
   */
  setCrossDeviceAutoSync(val: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CROSS_DEVICE_AUTO_SYNC_KEY, String(val));
    updateState({ isAutoSyncEnabled: val });
  },

  /**
   * Quick status check with server
   */
  async checkCloudStatus(): Promise<{
    hasNewData: boolean;
    cloudModified: string | null;
    count: number;
    gasUrl?: string;
  }> {
    try {
      const res = await fetch('/api/cloud-sync/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      if (data.success && data.lastModified) {
        const localLastSync = currentState.lastSyncedAt 
          ? new Date(currentState.lastSyncedAt).getTime() 
          : 0;
        const cloudModifiedTime = new Date(data.lastModified).getTime();
        
        const hasNewData = cloudModifiedTime > (localLastSync + 2000); // 2-second tolerance
        
        updateState({
          cloudCount: data.count || 0,
          lastModified: data.lastModified,
          updatedBy: data.updatedBy || ''
        });

        // If server has GAS URL and local doesn't, sync it
        if (data.gasUrl && typeof window !== 'undefined' && !localStorage.getItem(GAS_URL_STORAGE_KEY)) {
          localStorage.setItem(GAS_URL_STORAGE_KEY, data.gasUrl);
        }

        return {
          hasNewData,
          cloudModified: data.lastModified,
          count: data.count || 0,
          gasUrl: data.gasUrl
        };
      }
    } catch (err: any) {
      console.warn('Cloud status check failed:', err.message);
    }

    return {
      hasNewData: false,
      cloudModified: null,
      count: 0
    };
  },

  /**
   * Pulls latest equipment and trash data from Cloud (Server DB + Google Sheets fallback)
   */
  async pullFromCloud(options?: {
    reason?: string;
    force?: boolean;
  }): Promise<{
    success: boolean;
    equipments?: EquipmentData[];
    trash?: TrashEquipmentItem[];
    gasUrl?: string;
    message: string;
    source: 'server' | 'gas' | 'none';
  }> {
    updateState({ status: 'syncing', errorMessage: null });

    try {
      // 1. Try pulling from Server Cloud DB
      const res = await fetch('/api/cloud-sync/data');
      if (res.ok) {
        const serverResult = await res.json();
        
        if (serverResult.success && Array.isArray(serverResult.equipments) && serverResult.equipments.length > 0) {
          const nowStr = new Date().toISOString();
          localStorage.setItem(CLOUD_LAST_SYNC_KEY, nowStr);

          if (serverResult.gasUrl && !localStorage.getItem(GAS_URL_STORAGE_KEY)) {
            localStorage.setItem(GAS_URL_STORAGE_KEY, serverResult.gasUrl);
          }

          updateState({
            status: 'synced',
            lastSyncedAt: nowStr,
            cloudCount: serverResult.equipments.length,
            lastModified: serverResult.lastModified || nowStr,
            updatedBy: serverResult.updatedBy || 'admin'
          });

          return {
            success: true,
            equipments: serverResult.equipments,
            trash: serverResult.trash || [],
            gasUrl: serverResult.gasUrl,
            message: `Đã tải về thành công ${serverResult.equipments.length} thiết bị từ Cloud.`,
            source: 'server'
          };
        }
      }

      // 2. Fallback: If server has no saved data yet, check Google Apps Script Web App if configured
      const gasUrl = typeof window !== 'undefined' ? localStorage.getItem(GAS_URL_STORAGE_KEY) : '';
      if (gasUrl && gasUrl.trim().startsWith('https://script.google.com')) {
        const pullUrl = gasUrl.includes('?') 
          ? `${gasUrl}&action=getAllEquipments` 
          : `${gasUrl}?action=getAllEquipments`;
        
        const gasRes = await fetch(pullUrl);
        if (gasRes.ok) {
          const gasData = await gasRes.json();
          if (gasData.success && Array.isArray(gasData.data) && gasData.data.length > 0) {
            const nowStr = new Date().toISOString();
            localStorage.setItem(CLOUD_LAST_SYNC_KEY, nowStr);

            // Also seed the server cloud DB with this data for other devices
            this.pushToCloud(gasData.data, [], { role: 'admin', displayName: 'Google Sheets Import' } as any);

            updateState({
              status: 'synced',
              lastSyncedAt: nowStr,
              cloudCount: gasData.data.length,
              lastModified: nowStr,
              updatedBy: 'Google Sheets'
            });

            return {
              success: true,
              equipments: gasData.data,
              trash: [],
              gasUrl,
              message: `Đã tải về ${gasData.data.length} thiết bị từ Google Sheets.`,
              source: 'gas'
            };
          }
        }
      }

      // Neither server nor GAS had pre-existing data
      updateState({ status: 'synced', errorMessage: null });
      return {
        success: false,
        message: 'Chưa có cơ sở dữ liệu trên Cloud.',
        source: 'none'
      };

    } catch (err: any) {
      console.error('Failed to pull from Cloud:', err);
      updateState({ 
        status: 'error', 
        errorMessage: err.message || 'Lỗi kết nối máy chủ Cloud' 
      });
      return {
        success: false,
        message: `Lỗi tải dữ liệu Cloud: ${err.message || 'Không thể kết nối'}`,
        source: 'none'
      };
    }
  },

  /**
   * Pushes latest equipments list to Cloud (Server DB + Google Sheets)
   */
  async pushToCloud(
    equipments: EquipmentData[], 
    trashList?: TrashEquipmentItem[], 
    user?: AppUser,
    immediate = false
  ): Promise<{ success: boolean; message: string }> {
    if (!Array.isArray(equipments) || equipments.length === 0) {
      return { success: false, message: 'Dữ liệu thiết bị trống' };
    }

    const doPush = async () => {
      updateState({ status: 'syncing' });
      try {
        const gasUrl = typeof window !== 'undefined' ? localStorage.getItem(GAS_URL_STORAGE_KEY) || '' : '';
        const payload = {
          equipments,
          trash: trashList || storageService.loadTrash(),
          gasUrl,
          updatedBy: user?.displayName || 'Quản trị viên',
          clientTimestamp: new Date().toISOString()
        };

        const res = await fetch('/api/cloud-sync/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const nowStr = new Date().toISOString();
        localStorage.setItem(CLOUD_LAST_SYNC_KEY, nowStr);

        updateState({
          status: 'synced',
          lastSyncedAt: nowStr,
          cloudCount: equipments.length,
          lastModified: data.lastModified || nowStr,
          updatedBy: user?.displayName || 'Quản trị viên'
        });

        return {
          success: true,
          message: `Đã đồng bộ ${equipments.length} thiết bị lên Cloud.`
        };
      } catch (err: any) {
        console.error('Failed to push to Cloud:', err);
        updateState({
          status: 'error',
          errorMessage: err.message || 'Lỗi đồng bộ lên Cloud'
        });
        return {
          success: false,
          message: `Lỗi đồng bộ lên Cloud: ${err.message || 'Không thể kết nối'}`
        };
      }
    };

    if (immediate) {
      return doPush();
    }

    // Debounce rapid push calls
    if (pushDebounceTimer) {
      clearTimeout(pushDebounceTimer);
    }

    return new Promise((resolve) => {
      pushDebounceTimer = setTimeout(async () => {
        const res = await doPush();
        resolve(res);
      }, 500);
    });
  },

  /**
   * Initializes background cross-device auto-sync polling
   * When tab gains focus or user returns to phone, checks for cloud updates
   */
  startCrossDeviceSync(
    onNewDataReceived: (equipments: EquipmentData[], trash: TrashEquipmentItem[], message: string) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    let isChecking = false;

    const performCheck = async () => {
      if (isChecking) return;
      if (!cloudSyncService.getCrossDeviceAutoSync()) return;

      isChecking = true;
      try {
        const status = await cloudSyncService.checkCloudStatus();
        if (status.hasNewData) {
          // Newer data detected on cloud from another device!
          const result = await cloudSyncService.pullFromCloud({ reason: 'auto_poll' });
          if (result.success && result.equipments && result.equipments.length > 0) {
            onNewDataReceived(
              result.equipments, 
              result.trash || [], 
              `✓ Đã tự động cập nhật ${result.equipments.length} thiết bị mới nhất từ thiết bị khác trên Cloud!`
            );
          }
        }
      } catch (err) {
        console.warn('Cross device poll check error:', err);
      } finally {
        isChecking = false;
      }
    };

    // 1. Check when window gains focus / user tabs back into the app
    const onFocus = () => {
      performCheck();
    };

    // 2. Check when device comes back online
    const onOnline = () => {
      performCheck();
    };

    // 3. Periodic timer (every 40 seconds)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        performCheck();
      }
    }, 40000);

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }
};
