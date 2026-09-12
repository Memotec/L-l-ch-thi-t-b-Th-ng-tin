export interface TrashEquipmentItem {
  equipment: EquipmentData;
  deletedAt: string;
  deletedBy?: string;
}

export type EquipmentCategory = 
  | 'Thiết bị Nhóm 1'
  | 'Thiết bị Nhóm 2'
  | 'Thiết bị Nhóm 3'
  | 'VHF/ HF'
  | 'VHF/UHF'
  | 'VIBA/VSAT/Cáp Quang'
  | 'VIBA'
  | 'VSAT'
  | 'Ghép Kênh'
  | 'VOICE' 
  | 'VCCS' 
  | 'POWER'
  | 'Thiết bị đo'
  | 'IT'  
  | 'RADAR_ADS'
  | 'NAV'
  | 'OTHER'
  | 'Thiết Bị Khác';

export type EquipmentGroupType = 'Thiết bị Nhóm 1' | 'Thiết bị Nhóm 2' | 'Thiết bị Nhóm 3';

export interface EquipmentGroupMeta {
  id: EquipmentGroupType;
  name: string;
  code: string;
  shortLabel: string;
  description: string;
  subCategories: string[];
  badgeColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

export const EQUIPMENT_GROUPS: EquipmentGroupMeta[] = [
  {
    id: 'Thiết bị Nhóm 1',
    name: 'Thiết bị Nhóm 1',
    code: 'GROUP_1',
    shortLabel: 'Nhóm 1 (Thông tin & Giám sát)',
    description: 'Hệ thống thông tin liên lạc, chuyển mạch thoại, dẫn đường & giám sát không lưu (VHF/HF, VCCS, Ra-đa, ADS-B, NAV...)',
    subCategories: ['VHF/ HF', 'VHF/UHF', 'VOICE', 'VCCS', 'RADAR_ADS', 'NAV'],
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'Thiết bị Nhóm 2',
    name: 'Thiết bị Nhóm 2',
    code: 'GROUP_2',
    shortLabel: 'Nhóm 2 (Truyền dẫn, Nguồn & Đo)',
    description: 'Hệ thống truyền dẫn viba, cáp quang, ghép kênh, nguồn điện UPS & thiết bị đo kiểm chuẩn (VIBA, VSAT, Cáp quang, Router, POWER, Đo lường...)',
    subCategories: ['VIBA/VSAT/Cáp Quang', 'VIBA', 'VSAT', 'Ghép Kênh', 'POWER', 'Thiết bị đo'],
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'Thiết bị Nhóm 3',
    name: 'Thiết bị Nhóm 3',
    code: 'GROUP_3',
    shortLabel: 'Nhóm 3 (Mạng IT & Phụ trợ)',
    description: 'Hệ thống mạng CNTT, máy chủ Server CNS, phần mềm, thiết bị phụ trợ & chuyên ngành khác (IT, Server, Thiết Bị Khác...)',
    subCategories: ['IT', 'OTHER', 'Thiết Bị Khác'],
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    dotColor: 'bg-rose-500'
  }
];

export function getEquipmentGroupStyle(category?: string) {
  const grp = normalizeEquipmentGroup(category);
  switch (grp) {
    case 'Thiết bị Nhóm 1':
      return {
        group: grp,
        label: 'Nhóm 1',
        fullLabel: 'Thiết bị Nhóm 1',
        lightBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        darkBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        dot: 'bg-blue-500',
        text: 'text-blue-600',
        darkText: 'text-blue-400',
        colorName: 'Xanh'
      };
    case 'Thiết bị Nhóm 2':
      return {
        group: grp,
        label: 'Nhóm 2',
        fullLabel: 'Thiết bị Nhóm 2',
        lightBadge: 'bg-amber-50 text-amber-800 border-amber-200',
        darkBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-500',
        text: 'text-amber-600',
        darkText: 'text-amber-400',
        colorName: 'Vàng'
      };
    case 'Thiết bị Nhóm 3':
      return {
        group: grp,
        label: 'Nhóm 3',
        fullLabel: 'Thiết bị Nhóm 3',
        lightBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        darkBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        dot: 'bg-rose-500',
        text: 'text-rose-600',
        darkText: 'text-rose-400',
        colorName: 'Đỏ'
      };
  }
}

export function normalizeEquipmentGroup(category?: string): EquipmentGroupType {
  if (!category) return 'Thiết bị Nhóm 1';
  const c = category.trim();
  if (c === 'Thiết bị Nhóm 1' || c === 'Nhóm 1' || c === 'Thiết Bị Nhóm 1') return 'Thiết bị Nhóm 1';
  if (c === 'Thiết bị Nhóm 2' || c === 'Nhóm 2' || c === 'Thiết Bị Nhóm 2') return 'Thiết bị Nhóm 2';
  if (c === 'Thiết bị Nhóm 3' || c === 'Nhóm 3' || c === 'Thiết Bị Nhóm 3') return 'Thiết bị Nhóm 3';

  // Legacy mappings
  if (['VHF/ HF', 'VHF/UHF', 'VOICE', 'VCCS', 'RADAR_ADS', 'NAV'].includes(c)) {
    return 'Thiết bị Nhóm 1';
  }
  if (['VIBA/VSAT/Cáp Quang', 'VIBA', 'VSAT', 'Ghép Kênh', 'POWER', 'Thiết bị đo'].includes(c)) {
    return 'Thiết bị Nhóm 2';
  }
  if (['IT', 'OTHER', 'Thiết Bị Khác'].includes(c)) {
    return 'Thiết bị Nhóm 3';
  }

  return 'Thiết bị Nhóm 1';
}

export type EquipmentStatus = 
  | 'Đang khai thác' 
  | 'Dự phòng sẵn sàng' 
  | 'Đang bảo dưỡng/sửa chữa' 
  | 'Tạm ngừng khai thác' 
  | 'Đã thanh lý';

export type EquipmentPriority = 
  | 'Hệ thống chính (Level 1)' 
  | 'Hệ thống dự phòng nóng (Level 2)' 
  | 'Hệ thống phụ trợ (Level 3)';

export interface GeneralInfo {
  category: EquipmentCategory;
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
  assetNo: string;
  assetCode: string;
  yearMade: string;
  origin: string;
  commissioned: string;
  acceptanceDate: string;
  warrantyDate: string;
  nextCalDate: string;
  status: EquipmentStatus;
  priority: EquipmentPriority;
  estimatedLifespanYears: number | string;
  notes: string;
}

export const PERFORMER_OPTIONS = [
  'Kíp Tô Minh Tâm',
  'Kíp Nhâm Mạnh Đạt',
  'Kíp Nguyễn Tá Đại Phước',
  'Kíp Phan Trọng Nhân',
  'Kíp Đặng Chí Thanh',
  'Kíp Lê Công Quan Nhựt',
  'Hành Chính Đội TT'
] as const;

export interface OrgInfo {
  companyName?: string; // Default: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'
  unit: string;
  location: string;
  primaryEngineer: string;
  phoneContact: string;
  supervisor: string;
  coverNote?: string; // e.g. '120.9 TxM - B9 VHF'
}

export interface OrgTransferRow {
  id: string;
  date: string;
  unit: string;
  handoverDocNo?: string;
  status: string;
  note?: string;
}

export interface SimpleLicenseRow {
  id: string;
  no: string;
  expiryDate: string;
}

export interface LicenseRow {
  id: string;
  startNo: string;
  startDate?: string;
  content: string;
  endDate: string;
  active?: boolean;
}

export interface SpecInfo {
  text: string;
  power?: string;
  output?: string;
  range?: string;
  interface?: string;
  mgmtIp?: string;
  subnetMask?: string;
  gateway?: string;
  vlanId?: string;
  firmware?: string;
  snmpCommunity?: string;
  channelFreq?: string;
  tempLimit?: string;
  humidityLimit?: string;
}

export type ComponentHealth = 'Tốt' | 'Cần theo dõi' | 'Đã sửa chữa' | 'Hỏng';

export interface ComponentRow {
  id: string;
  no?: number | string;
  name: string;
  partNo?: string;
  serial?: string;
  unit: string;
  qty: number | string;
  healthStatus?: ComponentHealth;
  note?: string;
}

export interface DocRow {
  id: string;
  no?: number | string;
  name: string;
  qty: number | string;
  format?: 'Bản in giấy' | 'Bản điện tử (PDF/CAD)' | 'Cả hai' | string;
  lang?: string;
  location?: string;
  note?: string;
}

export type MaintenanceCycle = 'Hàng tuần' | 'Hàng tháng' | 'Hàng quý' | '6 tháng' | 'Hàng năm' | 'Đột xuất';
export type MaintenanceResult = 'Đạt yêu cầu kỹ thuật' | 'Cần hiệu chỉnh/theo dõi' | 'Không đạt';

export interface MaintenanceRow {
  id: string;
  date: string;
  cycle?: MaintenanceCycle | string;
  content: string;
  measuredParams?: string;
  result?: MaintenanceResult | string;
  person: string;
  supervisor?: string;
}

export type RepairType = 
  | 'Sửa chữa khắc phục sự cố' 
  | 'Thay thế linh kiện / bo mạch' 
  | 'Hiệu chỉnh căn chỉnh kỹ thuật' 
  | 'Nâng cấp cấu hình / Firmware' 
  | 'Bảo trì ngăn ngừa'
  | string;

export type RepairStatus = 'Đã xử lý dứt điểm' | 'Đang theo dõi' | 'Chờ vật tư';

export interface RepairRow {
  id: string;
  date: string;
  resolvedDate?: string;
  type?: RepairType;
  incidentDescription?: string;
  rootCause?: string;
  actionTaken?: string;
  replacedParts?: string;
  person: string;
  status?: RepairStatus;
}

export interface NoteRow {
  id: string;
  date: string;
  content: string;
  author: string;
  priority?: 'Thấp' | 'Trung bình' | 'Cao' | string;
  status?: 'Đang theo dõi' | 'Hoàn thành' | 'Khẩn cấp' | string;
}

export interface EquipmentData {
  id: string;
  createdAt: string;
  updatedAt: string;
  googleDocUrl?: string;
  googleDocPdfUrl?: string;
  general: GeneralInfo;
  org: OrgInfo;
  orgRows: OrgTransferRow[];
  licenses: LicenseRow[];
  freqLicenses?: SimpleLicenseRow[];
  exploitLicenses?: SimpleLicenseRow[];
  spec: SpecInfo;
  components: ComponentRow[];
  docs: DocRow[];
  maintenance: MaintenanceRow[];
  repair: RepairRow[];
  notesList?: NoteRow[];
}

export type UserRole = 'admin' | 'viewer' | 'default';

export interface UserPermissions {
  canView: boolean;
  canScanQr: boolean;
  canCreate: boolean;
  canCreateEquipment?: boolean;
  canEditDetails: boolean;
  canDelete: boolean;
  canClone: boolean;
  canImportData: boolean;
  canExportData: boolean;
  canResetDatabase: boolean;
  canSyncGas: boolean;
  canAccessCloudDrive?: boolean;
  canDownloadCloudDatabase?: boolean;
  canUploadCloudDatabase?: boolean;
}

export interface AppUser {
  username: string;
  displayName: string;
  role: UserRole;
  avatarColor?: string;
  permissions: UserPermissions;
}

export type NotificationType = 
  | 'create' 
  | 'delete' 
  | 'update' 
  | 'restore' 
  | 'sync' 
  | 'maintenance' 
  | 'repair' 
  | 'warning' 
  | 'info';

export type NotificationCategory = 'all' | 'unread' | 'ledger' | 'maintenance_repair' | 'sync';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  isRead: boolean;
  targetEquipmentId?: string;
  targetEquipmentName?: string;
  targetTab?: string;
  actor?: string;
}

export interface AutoBackupSnapshot {
  id: string;
  timestamp: string;
  equipmentCount: number;
  dataSizeFormatted: string;
  dataSizeBytes: number;
  triggerType: 'auto_24h' | 'manual' | 'cloud_sync';
  data: EquipmentData[];
}

export interface AutoBackupConfig {
  enabled: boolean;
  autoDownloadFile: boolean;
  intervalHours: number;
  lastBackupTimestamp: number | null;
  maxSnapshots: number;
}

