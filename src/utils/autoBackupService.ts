import { EquipmentData, AutoBackupSnapshot, AutoBackupConfig } from '../types';

const CONFIG_KEY = 'cns_auto_backup_config_v1';
const LAST_TIME_KEY = 'cns_auto_backup_last_time_v1';
const SNAPSHOTS_KEY = 'cns_auto_backup_snapshots_v1';

const DEFAULT_INTERVAL_HOURS = 24;
const DEFAULT_MAX_SNAPSHOTS = 7; // Keep up to 7 daily rolling snapshots in browser storage

export const autoBackupService = {
  /**
   * Retrieves current auto backup configuration
   */
  getConfig(): AutoBackupConfig {
    try {
      if (typeof window === 'undefined') {
        return {
          enabled: true,
          autoDownloadFile: true,
          intervalHours: DEFAULT_INTERVAL_HOURS,
          lastBackupTimestamp: null,
          maxSnapshots: DEFAULT_MAX_SNAPSHOTS
        };
      }

      const raw = localStorage.getItem(CONFIG_KEY);
      const lastTimeRaw = localStorage.getItem(LAST_TIME_KEY);
      const lastBackupTimestamp = lastTimeRaw ? parseInt(lastTimeRaw, 10) : null;

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: parsed.enabled ?? true,
          autoDownloadFile: parsed.autoDownloadFile ?? true,
          intervalHours: parsed.intervalHours ?? DEFAULT_INTERVAL_HOURS,
          lastBackupTimestamp: !isNaN(lastBackupTimestamp as number) ? lastBackupTimestamp : null,
          maxSnapshots: parsed.maxSnapshots ?? DEFAULT_MAX_SNAPSHOTS
        };
      }

      return {
        enabled: true,
        autoDownloadFile: true,
        intervalHours: DEFAULT_INTERVAL_HOURS,
        lastBackupTimestamp: !isNaN(lastBackupTimestamp as number) ? lastBackupTimestamp : null,
        maxSnapshots: DEFAULT_MAX_SNAPSHOTS
      };
    } catch (err) {
      console.error('Failed to get auto backup config:', err);
      return {
        enabled: true,
        autoDownloadFile: true,
        intervalHours: DEFAULT_INTERVAL_HOURS,
        lastBackupTimestamp: null,
        maxSnapshots: DEFAULT_MAX_SNAPSHOTS
      };
    }
  },

  /**
   * Updates configuration settings
   */
  updateConfig(partial: Partial<AutoBackupConfig>): AutoBackupConfig {
    try {
      const current = this.getConfig();
      const updated: AutoBackupConfig = {
        ...current,
        ...partial
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(CONFIG_KEY, JSON.stringify({
          enabled: updated.enabled,
          autoDownloadFile: updated.autoDownloadFile,
          intervalHours: updated.intervalHours,
          maxSnapshots: updated.maxSnapshots
        }));

        if (partial.lastBackupTimestamp !== undefined) {
          if (partial.lastBackupTimestamp === null) {
            localStorage.removeItem(LAST_TIME_KEY);
          } else {
            localStorage.setItem(LAST_TIME_KEY, partial.lastBackupTimestamp.toString());
          }
        }
      }

      return updated;
    } catch (err) {
      console.error('Failed to update auto backup config:', err);
      return this.getConfig();
    }
  },

  /**
   * Retrieves all saved safety snapshots from browser storage
   */
  getSnapshots(): AutoBackupSnapshot[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(SNAPSHOTS_KEY);
      if (!raw) return [];
      const parsed: AutoBackupSnapshot[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Sort newest first
      return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error('Failed to get backup snapshots:', err);
      return [];
    }
  },

  /**
   * Formats byte size to human readable string (KB, MB)
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Formats duration in milliseconds to human friendly text
   */
  formatDuration(ms: number): string {
    if (ms <= 0) return 'Sắp diễn ra';
    const totalMinutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  },

  /**
   * Downloads formatted JSON backup file to user's local downloads folder
   */
  downloadBackupFile(equipments: EquipmentData[], prefix: string = 'CNS_Database_Backup_24h'): void {
    try {
      if (typeof window === 'undefined' || !equipments || equipments.length === 0) return;

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `${prefix}_${dateStr}_${timeStr}.json`;

      const jsonStr = JSON.stringify({
        schemaVersion: '2.0',
        backupType: 'automatic_24h_safety_copy',
        exportedAt: now.toISOString(),
        totalEquipments: equipments.length,
        system: 'Hệ thống Quản lý Sổ Lý Lịch Thiết Bị CNS',
        equipments: equipments
      }, null, 2);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to trigger JSON file download:', err);
    }
  },

  /**
   * Saves a safety snapshot into browser storage (pruning oldest if exceeding limit)
   */
  saveSnapshot(
    equipments: EquipmentData[], 
    triggerType: 'auto_24h' | 'manual' | 'cloud_sync' = 'auto_24h'
  ): AutoBackupSnapshot | null {
    try {
      if (typeof window === 'undefined' || !equipments || equipments.length === 0) return null;

      const config = this.getConfig();
      const now = new Date();
      const jsonStr = JSON.stringify(equipments);
      const bytes = new Blob([jsonStr]).size;

      const newSnapshot: AutoBackupSnapshot = {
        id: `snap-${now.getTime()}`,
        timestamp: now.toISOString(),
        equipmentCount: equipments.length,
        dataSizeBytes: bytes,
        dataSizeFormatted: this.formatBytes(bytes),
        triggerType,
        data: equipments
      };

      const existing = this.getSnapshots();
      // Keep within max limit
      const updatedList = [newSnapshot, ...existing].slice(0, config.maxSnapshots || DEFAULT_MAX_SNAPSHOTS);

      try {
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updatedList));
      } catch (storageErr: any) {
        console.warn('LocalStorage full when saving full snapshots, saving lightened snapshot list', storageErr);
        // If quota exceeded, try keeping fewer snapshots (e.g. 2 snapshots)
        const lightList = [newSnapshot, ...existing].slice(0, 2);
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(lightList));
      }

      // Update last backup timestamp
      localStorage.setItem(LAST_TIME_KEY, now.getTime().toString());

      return newSnapshot;
    } catch (err) {
      console.error('Failed to save backup snapshot to browser storage:', err);
      return null;
    }
  },

  /**
   * Periodic check: Evaluates if 24 hours have elapsed since the last backup,
   * triggers snapshot saving and JSON file download if enabled.
   */
  checkAndRunAutoBackup(
    equipments: EquipmentData[], 
    onBackupComplete?: (snapshot: AutoBackupSnapshot, downloaded: boolean) => void
  ): { triggered: boolean; snapshot?: AutoBackupSnapshot; nextBackupInMs?: number } {
    try {
      if (!equipments || equipments.length === 0) {
        return { triggered: false };
      }

      const config = this.getConfig();
      if (!config.enabled) {
        return { triggered: false };
      }

      const now = Date.now();
      const intervalMs = (config.intervalHours || DEFAULT_INTERVAL_HOURS) * 60 * 60 * 1000;
      const lastTime = config.lastBackupTimestamp;

      // If never backed up, or elapsed time >= intervalMs
      const shouldBackup = !lastTime || (now - lastTime) >= intervalMs;

      if (shouldBackup) {
        const snapshot = this.saveSnapshot(equipments, 'auto_24h');
        let downloaded = false;

        if (config.autoDownloadFile) {
          this.downloadBackupFile(equipments, 'CNS_Auto_Backup_24h');
          downloaded = true;
        }

        if (snapshot && onBackupComplete) {
          onBackupComplete(snapshot, downloaded);
        }

        return {
          triggered: true,
          snapshot: snapshot || undefined,
          nextBackupInMs: intervalMs
        };
      }

      const timeRemaining = Math.max(0, (lastTime + intervalMs) - now);
      return {
        triggered: false,
        nextBackupInMs: timeRemaining
      };
    } catch (err) {
      console.error('Error during checkAndRunAutoBackup:', err);
      return { triggered: false };
    }
  },

  /**
   * Manually forces an instant backup snapshot and file download
   */
  forceRunBackupNow(equipments: EquipmentData[]): { snapshot: AutoBackupSnapshot | null; downloaded: boolean } {
    try {
      if (!equipments || equipments.length === 0) {
        return { snapshot: null, downloaded: false };
      }

      const snapshot = this.saveSnapshot(equipments, 'manual');
      this.downloadBackupFile(equipments, 'CNS_Manual_Backup');
      
      return {
        snapshot,
        downloaded: true
      };
    } catch (err) {
      console.error('Failed to force run backup:', err);
      return { snapshot: null, downloaded: false };
    }
  },

  /**
   * Restores equipment dataset from a selected snapshot
   */
  restoreSnapshot(snapshotId: string): EquipmentData[] | null {
    try {
      const snapshots = this.getSnapshots();
      const target = snapshots.find(s => s.id === snapshotId);
      if (target && Array.isArray(target.data) && target.data.length > 0) {
        return target.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
      return null;
    }
  },

  /**
   * Deletes a specific snapshot by ID
   */
  deleteSnapshot(snapshotId: string): boolean {
    try {
      const snapshots = this.getSnapshots();
      const filtered = snapshots.filter(s => s.id !== snapshotId);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Failed to delete snapshot:', err);
      return false;
    }
  },

  /**
   * Clears all stored safety snapshots
   */
  clearAllSnapshots(): boolean {
    try {
      localStorage.removeItem(SNAPSHOTS_KEY);
      return true;
    } catch (err) {
      console.error('Failed to clear snapshots:', err);
      return false;
    }
  }
};
