export interface TrashEquipmentItem {
  equipment: EquipmentData;
  deletedAt: string;
  deletedBy?: string;
}

export type EquipmentCategory = 
  | 'VHF/ HF'
  | 'VHF/UHF'
  | 'VIBA/VSAT/Cáp Quang'
  | 'VIBA' 
  | 'VSAT' 
  | 'Thiết bị đo'
  | 'Ghép Kênh'
  | 'VCCS' 
  | 'VOICE' 
  | 'POWER' 
  | 'IT'  
  | 'OTHER'
  | 'Thiết Bị Khác'
  | 'RADAR_ADS'
  | 'NAV';

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

