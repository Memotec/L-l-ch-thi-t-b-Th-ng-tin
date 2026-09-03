import { AppUser, UserPermissions } from '../types';

const AUTH_STORAGE_KEY = 'cns_equipment_auth_user_v1';

export const ADMIN_PERMISSIONS: UserPermissions = {
  canView: true,
  canScanQr: true,
  canCreate: true,
  canCreateEquipment: true,
  canEditDetails: true,
  canDelete: true,
  canClone: true,
  canImportData: true,
  canExportData: true,
  canResetDatabase: true,
  canSyncGas: true,
  canAccessCloudDrive: true,
  canDownloadCloudDatabase: true,
  canUploadCloudDatabase: true
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
  canView: true,
  canScanQr: true,
  canCreate: false,
  canCreateEquipment: false,
  canEditDetails: false,
  canDelete: false,
  canClone: false,
  canImportData: false,
  canExportData: true,
  canResetDatabase: false,
  canSyncGas: true,
  canAccessCloudDrive: true,
  canDownloadCloudDatabase: true,
  canUploadCloudDatabase: false
};

export const ADMIN_USER: AppUser = {
  username: 'admin',
  displayName: 'Quản Trị Viên (Admin)',
  role: 'admin',
  avatarColor: 'bg-rose-600',
  permissions: ADMIN_PERMISSIONS
};

export const DEFAULT_USER: AppUser = {
  username: 'viewer',
  displayName: 'Người Xem (Viewer - Mặc định)',
  role: 'default',
  avatarColor: 'bg-slate-600',
  permissions: DEFAULT_PERMISSIONS
};

export const authService = {
  getCurrentUser(): AppUser {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'admin') {
          return ADMIN_USER;
        }
      }
    } catch (e) {
      console.error('Error reading auth state from localStorage:', e);
    }
    return DEFAULT_USER;
  },

  login(username: string, password: string): { success: boolean; message: string; user?: AppUser } {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Check Admin account (admin / Aa123456)
    if (cleanUser === 'admin') {
      if (cleanPass === 'Aa123456') {
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(ADMIN_USER));
        } catch (e) {
          console.error('Failed to persist auth state:', e);
        }
        return {
          success: true,
          message: 'Đăng nhập Quản trị viên (Admin) thành công! Bạn có toàn quyền với hệ thống.',
          user: ADMIN_USER
        };
      } else {
        return {
          success: false,
          message: 'Mật khẩu tài khoản admin không chính xác. Mật khẩu mặc định: Aa123456'
        };
      }
    }

    // Default account quick login
    if (cleanUser === 'nhanvien' || cleanUser === 'default' || cleanUser === 'guest' || cleanUser === 'user') {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      } catch (e) {
        console.error('Failed to persist auth state:', e);
      }
      return {
        success: true,
        message: 'Đã chuyển sang Tài khoản Mặc Định (Quyền xem & thêm mới thiết bị).',
        user: DEFAULT_USER
      };
    }

    return {
      success: false,
      message: 'Tên tài khoản không tồn tại. Vui lòng sử dụng tài khoản "admin" (mật khẩu: Aa123456) hoặc tài khoản mặc định.'
    };
  },

  logout(): AppUser {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
    } catch (e) {
      console.error('Failed to clear auth state:', e);
    }
    return DEFAULT_USER;
  },

  switchToDefault(): AppUser {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
    } catch (e) {
      console.error('Failed to switch to default user:', e);
    }
    return DEFAULT_USER;
  },

  isAdmin(user: AppUser): boolean {
    return user.role === 'admin';
  },

  isReadOnly(user: AppUser): boolean {
    return user.role !== 'admin' || !user.permissions.canEditDetails;
  },

  canUploadCloud(user: AppUser): boolean {
    return user.role === 'admin' || user.permissions.canUploadCloudDatabase === true;
  },

  canDownloadCloud(user: AppUser): boolean {
    return user.permissions.canDownloadCloudDatabase !== false;
  }
};
