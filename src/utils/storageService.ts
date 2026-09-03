import { EquipmentData, TrashEquipmentItem } from '../types';
import { createEmptyEquipment } from '../sampleData';

const STORAGE_KEY = 'cns_multi_equipment_data_v2';
const TRASH_STORAGE_KEY = 'cns_trash_equipment_data_v1';
const TRASH_RETENTION_DAYS = 30;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const storageService = {
  /**
   * Loads equipment data safely from localStorage with fallback to clean empty equipment
   */
  loadEquipments(): EquipmentData[] {
    try {
      if (typeof window === 'undefined') return [createEmptyEquipment()];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.general) {
          // If all equipments in storage are the old default sample equipments and user never edited, we can check or return
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load equipments from localStorage:', err);
    }
    return [createEmptyEquipment()];
  },

  /**
   * Saves equipment list immediately to localStorage
   */
  saveImmediate(data: EquipmentData[]): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Failed to save equipments immediately to localStorage:', err);
      return false;
    }
  },

  /**
   * Loads trash equipment items, auto-purging items deleted more than 30 days ago
   */
  loadTrash(): TrashEquipmentItem[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem(TRASH_STORAGE_KEY);
      if (!raw) return [];

      const parsed: TrashEquipmentItem[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const now = Date.now();
      const maxAgeMs = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      // Filter out items older than 30 days
      const validItems = parsed.filter(item => {
        if (!item || !item.deletedAt || !item.equipment) return false;
        const deletedTime = new Date(item.deletedAt).getTime();
        return (now - deletedTime) <= maxAgeMs;
      });

      // If any items were purged, update localStorage
      if (validItems.length !== parsed.length) {
        this.saveTrash(validItems);
      }

      return validItems;
    } catch (err) {
      console.error('Failed to load trash from localStorage:', err);
      return [];
    }
  },

  /**
   * Saves trash list to localStorage
   */
  saveTrash(trashList: TrashEquipmentItem[]): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashList));
      return true;
    } catch (err) {
      console.error('Failed to save trash to localStorage:', err);
      return false;
    }
  },

  /**
   * Debounced save to prevent excessive JSON serialization on rapid user keystrokes
   */
  saveDebounced(data: EquipmentData[], delayMs: number = 300, onComplete?: (timeStr: string) => void): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const success = this.saveImmediate(data);
      if (success && onComplete) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        onComplete(timeStr);
      }
    }, delayMs);
  },

  /**
   * Cleans debounce timer
   */
  cancelPendingSave(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }
};
