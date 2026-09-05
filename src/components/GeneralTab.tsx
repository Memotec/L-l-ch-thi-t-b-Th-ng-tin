import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Award, 
  Plus, 
  Trash2, 
  Globe2, 
  AlertTriangle,
  Building, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  Radio, 
  Activity, 
  Zap, 
  Server, 
  PhoneCall, 
  Layers, 
  HardDrive, 
  FileCheck, 
  Clock, 
  CheckCircle2,
  Lock,
  ChevronDown,
  ArrowRight,
  Printer
} from 'lucide-react';
import { 
  EquipmentData, 
  EquipmentCategory, 
  EquipmentStatus, 
  EquipmentPriority, 
  LicenseRow, 
  OrgTransferRow, 
  AppUser 
} from '../types';

interface GeneralTabProps {
  data: EquipmentData;
  allEquipments?: EquipmentData[];
  onSelectEquipment?: (id: string) => void;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  currentUser?: AppUser;
  onOpenLoginModal?: () => void;
  onDeleteEquipment?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenPdfModal?: (eq: EquipmentData) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ 
  data, 
  allEquipments,
  onSelectEquipment,
  onChange,
  isReadOnly = false,
  currentUser,
  onOpenLoginModal,
  onDeleteEquipment,
  onNavigateTab,
  onOpenPdfModal
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateGeneral = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      general: {
        ...data.general,
        [field]: value
      }
    });
  };

  const updateOrg = (field: string, value: any) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      org: {
        ...data.org,
        [field]: value
      }
    });
  };

  // Trang 2: Quá trình luân chuyển & bàn giao đơn vị quản lý qua các thời kỳ (orgRows)
  const addOrgRow = () => {
    if (isReadOnly) return;
    const newRow: OrgTransferRow = {
      id: `org-row-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      unit: '',
      handoverDocNo: '',
      status: 'Tốt, đủ điều kiện khai thác'
    };
    onChange({
      ...data,
      orgRows: [...(data.orgRows || []), newRow]
    });
  };

  const updateOrgRow = (index: number, field: keyof OrgTransferRow, value: string) => {
    if (isReadOnly) return;
    const updatedRows = [...(data.orgRows || [])];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    onChange({ ...data, orgRows: updatedRows });
  };

  const removeOrgRow = (index: number) => {
    if (isReadOnly) return;
    const updatedRows = (data.orgRows || []).filter((_, i) => i !== index);
    onChange({ ...data, orgRows: updatedRows });
  };

  // Trang 3: Giấy phép / chứng nhận chuyên ngành (licenses)
  const addLicense = () => {
    if (isReadOnly) return;
    const newLic: LicenseRow = {
      id: `lic-${Date.now()}`,
      startNo: '',
      startDate: new Date().toISOString().split('T')[0],
      content: '',
      endDate: '',
      active: true
    };
    onChange({
      ...data,
      licenses: [...(data.licenses || []), newLic]
    });
  };

  const updateLicense = (index: number, field: keyof LicenseRow, value: any) => {
    if (isReadOnly) return;
    const newLicenses = [...(data.licenses || [])];
    newLicenses[index] = { ...newLicenses[index], [field]: value };
    onChange({ ...data, licenses: newLicenses });
  };

  const removeLicense = (index: number) => {
    if (isReadOnly) return;
    const newLicenses = (data.licenses || []).filter((_, i) => i !== index);
    onChange({ ...data, licenses: newLicenses });
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Calibration alert computation
  const getCalibrationCountdown = () => {
    if (!data.general.nextCalDate) return null;
    const target = new Date(data.general.nextCalDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilCal = getCalibrationCountdown();

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/UHF': return <Radio className="w-4 h-4 text-blue-500" />;
      case 'Ghép Kênh': return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'VIBA': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'VSAT': return <Radio className="w-4 h-4 text-sky-500" />;
      case 'VCCS':
      case 'VOICE': return <PhoneCall className="w-4 h-4 text-amber-500" />;
      case 'POWER': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'IT': return <Server className="w-4 h-4 text-purple-500" />;
      default: return <HardDrive className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadgeColor = (status?: EquipmentStatus) => {
    switch (status) {
      case 'Đang khai thác': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Dự phòng sẵn sàng': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Đang bảo dưỡng/sửa chữa': return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Tạm ngừng khai thác': return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Đã thanh lý': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Equipment Banner & Admin Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Controls & Equipment Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Equipment Switcher */}
          {allEquipments && allEquipments.length > 1 && onSelectEquipment ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden md:inline">
                Sổ lý lịch:
              </span>
              <select
                value={data.id}
                onChange={(e) => onSelectEquipment(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl cursor-pointer transition-all shadow-2xs truncate"
                title="Chuyển sang sổ lý lịch thiết bị khác"
              >
                {allEquipments.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.general.name} ({eq.general.serial || eq.general.model || eq.general.category})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hồ sơ Sổ Lý Lịch CNS
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onOpenPdfModal && (
              <button
                type="button"
                onClick={() => onOpenPdfModal(data)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Xem & Tải tệp PDF Sổ Lý Lịch tiêu chuẩn A4"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Xem & Tải Sổ PDF</span>
              </button>
            )}

            {onDeleteEquipment && !isReadOnly && (
              <button
                type="button"
                onClick={onDeleteEquipment}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Chuyển sổ lý lịch này vào thùng rác"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa Sổ</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Equipment Title & Badges Header (Full Width) */}
        <div className="flex items-start gap-3.5 w-full">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl shrink-0 mt-0.5 shadow-2xs">
            {getCategoryIcon(data.general.category)}
          </div>

          <div className="w-full min-w-0 space-y-2">
            {/* Category & Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold whitespace-nowrap">
                {data.general.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadgeColor(data.general.status)}`}>
                {data.general.status || 'Đang khai thác'}
              </span>
              {data.general.priority && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                  {data.general.priority}
                </span>
              )}
            </div>

            {/* Equipment Name */}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {data.general.name}
            </h1>

            {/* Specs Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Model:</span>
                <span className="font-bold text-slate-800 truncate block">{data.general.model || '---'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Serial Number:</span>
                <span className="font-bold text-blue-700 truncate block">{data.general.serial || '---'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Mã Tài Sản:</span>
                <span className="font-semibold text-slate-800 truncate block">{data.general.assetNo || data.general.assetCode || '---'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Vị Trí / Đơn Vị:</span>
                <span className="font-semibold text-slate-800 truncate block">{data.org.location || data.org.unit || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Editing Permission Banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {!isReadOnly ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold">Quyền Quản Trị Viên (Admin):</span>
              <span>Đang mở Sổ lý lịch chi tiết. Bạn có thể sửa trực tiếp tất cả các trường thông tin bên dưới (hệ thống tự động lưu).</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Chế độ Người Xem (Viewer) - Các trường đang ở trạng thái chỉ đọc. Đăng nhập Admin để sửa.</span>
              </div>
              {onOpenLoginModal && (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                >
                  Đăng nhập Admin để sửa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Calibration Alert Ribbon if within 30 days or overdue */}
      {daysUntilCal !== null && daysUntilCal <= 30 && (
        <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
          daysUntilCal < 0 
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="text-xs">
            <b>{daysUntilCal < 0 ? 'CẢNH BÁO QUÁ HẠN KIỂM ĐỊNH!' : 'LƯU Ý KỲ KIỂM ĐỊNH SẮP TỚI!'}</b> Thiết bị có hạn kiểm định / hiệu chuẩn tiếp theo vào ngày <b>{data.general.nextCalDate}</b> ({daysUntilCal < 0 ? `Đã quá hạn ${Math.abs(daysUntilCal)} ngày` : `Còn ${daysUntilCal} ngày`}). Cần liên hệ đơn vị đo lường lập kế hoạch kiểm định.
          </div>
        </div>
      )}

      {/* SECTION 1: TRANG BÌA & ĐỊNH DANH THIẾT BỊ CNS */}
      <div className="enterprise-card p-6">
        <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              1. Thông Tin Định Danh & Phân Loại Chủng Loại Thiết Bị (Trang Bìa)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Xác lập chủng loại CNS, mã tài sản quản lý, model, số serial và mức độ ưu tiên vận hành</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Chủng loại thiết bị CNS *</label>
            <select
              disabled={isReadOnly}
              value={data.general.category}
              onChange={(e) => updateGeneral('category', e.target.value as EquipmentCategory)}
              className="form-input-standard font-semibold text-blue-900"
            >
              <option value="VHF/UHF">VHF/UHF Air-Ground Radio</option>
              <option value="Ghép Kênh">Ghép Kênh / Multiplexer</option>
              <option value="VIBA">Viba / Microwave Viễn thông</option>
              <option value="VSAT">VSAT Vệ tinh Hàng không</option>
              <option value="VCCS">VCCS / Chuyển mạch thoại</option>
              <option value="VOICE">VOICE / Ghi âm không lưu</option>
              <option value="POWER">Hệ thống Nguồn điện / UPS</option>
              <option value="IT">Mạng IT / Máy chủ CNS</option>
              <option value="Thiết Bị Khác">Thiết Bị Khác / Máy đo</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Tên thiết bị đầy đủ *</label>
              {data.general.name && (
                <button
                  type="button"
                  onClick={() => handleCopy(data.general.name, 'name')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'name' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'name' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.name}
              onChange={(e) => updateGeneral('name', e.target.value)}
              className="form-input-standard font-semibold text-slate-900"
              placeholder="VD: Máy thu phát VHF Air-Ground Park Air T6T Kênh Chính"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Trạng thái khai thác</label>
            <select
              disabled={isReadOnly}
              value={data.general.status || 'Đang khai thác'}
              onChange={(e) => updateGeneral('status', e.target.value as EquipmentStatus)}
              className="form-input-standard font-medium"
            >
              <option value="Đang khai thác">Đang khai thác</option>
              <option value="Dự phòng sẵn sàng">Dự phòng sẵn sàng</option>
              <option value="Đang bảo dưỡng/sửa chữa">Đang bảo dưỡng/sửa chữa</option>
              <option value="Tạm ngừng khai thác">Tạm ngừng khai thác</option>
              <option value="Đã thanh lý">Đã thanh lý</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Hãng sản xuất</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.manufacturer}
              onChange={(e) => updateGeneral('manufacturer', e.target.value)}
              className="form-input-standard"
              placeholder="VD: Park Air Systems / Jotron"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Kiểu loại (Model)</label>
              {data.general.model && (
                <button
                  type="button"
                  onClick={() => handleCopy(data.general.model, 'model')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'model' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'model' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.model}
              onChange={(e) => updateGeneral('model', e.target.value)}
              className="form-input-standard font-mono"
              placeholder="VD: T6T"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Số Serial / Part No</label>
              {data.general.serial && (
                <button
                  type="button"
                  onClick={() => handleCopy(data.general.serial, 'serial')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'serial' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'serial' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.serial}
              onChange={(e) => updateGeneral('serial', e.target.value)}
              className="form-input-standard font-mono font-semibold text-blue-600"
              placeholder="VD: PA-SN-998822"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              Xuất xứ (Nước SX)
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="Vương Quốc Anh / Pháp / Mỹ..."
              value={data.general.origin || ''}
              onChange={(e) => updateGeneral('origin', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Mã tài sản quản lý (Asset No)</label>
              {data.general.assetNo && (
                <button
                  type="button"
                  onClick={() => handleCopy(data.general.assetNo || '', 'assetNo')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'assetNo' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'assetNo' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.assetNo || ''}
              onChange={(e) => updateGeneral('assetNo', e.target.value)}
              className="form-input-standard font-mono"
              placeholder="VD: TS-VHF-2023-01"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Mã nội bộ trạm / Đài (Asset Code)</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.assetCode || ''}
              onChange={(e) => updateGeneral('assetCode', e.target.value)}
              className="form-input-standard font-mono"
              placeholder="VD: VHF-NB-01"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Phân nhóm thiết bị (Mức ưu tiên)</label>
            <select
              disabled={isReadOnly}
              value={data.general.priority || 'Hệ thống chính (Level 1)'}
              onChange={(e) => updateGeneral('priority', e.target.value as EquipmentPriority)}
              className="form-input-standard font-medium"
            >
              <option value="Hệ thống chính (Level 1)">Hệ thống chính (Level 1)</option>
              <option value="Hệ thống dự phòng nóng (Level 2)">Hệ thống dự phòng nóng (Level 2)</option>
              <option value="Hệ thống phụ trợ (Level 3)">Hệ thống phụ trợ (Level 3)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Năm sản xuất</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: 2021"
              value={data.general.yearMade || ''}
              onChange={(e) => updateGeneral('yearMade', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Tuổi thọ thiết kế ước tính (Năm)</label>
            <input
              type="number"
              min="1"
              max="50"
              disabled={isReadOnly}
              value={data.general.estimatedLifespanYears || 10}
              onChange={(e) => updateGeneral('estimatedLifespanYears', parseInt(e.target.value) || 10)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-bold text-slate-800">Ghi chú mục đích sử dụng / Đặc thù vận hành</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.notes || ''}
              onChange={(e) => updateGeneral('notes', e.target.value)}
              className="form-input-standard"
              placeholder="VD: Phục vụ điều hành bay tiếp cận ACC / Đài Kiểm soát không lưu"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: CƠ QUAN QUẢN LÝ, VỊ TRÍ & NHÂN SỰ */}
      <div className="enterprise-card p-6">
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            2. Cơ Quan Quản Lý, Vị Trí Lắp Đặt & Nhân Sự Chịu Trách Nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Phân cấp quản lý tài sản theo hệ thống Tổng công ty Quản lý bay Việt Nam</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Đơn vị quản lý cấp trên (Công ty / Trung tâm)</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.org.companyName || ''}
              onChange={(e) => updateOrg('companyName', e.target.value)}
              className="form-input-standard font-semibold"
              placeholder="VD: Tổng công ty Quản lý bay Việt Nam / Công ty QLB Miền Bắc"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Bộ phận / Đội / Đài kỹ thuật trực tiếp *</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.org.unit || ''}
              onChange={(e) => updateOrg('unit', e.target.value)}
              className="form-input-standard"
              placeholder="VD: Đài KSKL Nội Bài / Đội Kỹ thuật CNS"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Vị trí lắp đặt / Trạm / Phòng máy / Rack U *</label>
              {data.org.location && (
                <button
                  type="button"
                  onClick={() => handleCopy(data.org.location, 'location')}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'location' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'location' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.org.location || ''}
              onChange={(e) => updateOrg('location', e.target.value)}
              className="form-input-standard font-semibold text-slate-900"
              placeholder="VD: Phòng thiết bị Tầng 3 - Đài KSKL Nội Bài, Rack CNS-02, U12-U14"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Số điện thoại liên hệ / Trực ban kỹ thuật</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: 024.38865xxx - Ext 123"
              value={data.org.phoneContact || ''}
              onChange={(e) => updateOrg('phoneContact', e.target.value)}
              className="form-input-standard font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Kỹ sư chính phụ trách trang thiết bị</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: KS. Nguyễn Văn A (Chứng chỉ CNS-VHF)"
              value={data.org.primaryEngineer || ''}
              onChange={(e) => updateOrg('primaryEngineer', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-800">Cán bộ phụ trách / Đội trưởng</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: Trưởng đài KSKL / Đội trưởng Đội Thiết bị CNS"
              value={data.org.supervisor || ''}
              onChange={(e) => updateOrg('supervisor', e.target.value)}
              className="form-input-standard"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: TRANG 2 SỔ LÝ LỊCH - QUÁ TRÌNH LUÂN CHUYỂN & BÀN GIAO */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              3. Quá Trình Luân Chuyển & Bàn Giao Đơn Vị Quản Lý (Trang 2 Sổ Lý Lịch)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ghi nhận lịch sử điều chuyển, bàn giao giữa các đơn vị, trạm đài qua các thời kỳ</p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={addOrgRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Thêm dòng bàn giao</span>
            </button>
          )}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5 w-36">Ngày tháng</th>
                <th className="p-2.5 w-56">Đơn vị bàn giao / Tiếp nhận</th>
                <th className="p-2.5 w-52">Số biên bản / Quyết định</th>
                <th className="p-2.5">Tình trạng thiết bị khi bàn giao</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!data.orgRows || data.orgRows.length === 0) ? (
                <tr>
                  <td colSpan={!isReadOnly ? 5 : 4} className="p-5 text-center text-slate-500 italic bg-white">
                    Chưa có ghi nhận luân chuyển bàn giao nào. Bấm "Thêm dòng bàn giao" để bổ sung lịch sử Trang 2 của Sổ.
                  </td>
                </tr>
              ) : (
                data.orgRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50 bg-white">
                    <td className="p-2">
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={row.date}
                        onChange={(e) => updateOrgRow(idx, 'date', e.target.value)}
                        className="form-input-standard font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: Đội CNS bàn giao sang Đài KSKL..."
                        value={row.unit}
                        onChange={(e) => updateOrgRow(idx, 'unit', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: BB-BG/2023/CNS-01"
                        value={row.handoverDocNo}
                        onChange={(e) => updateOrgRow(idx, 'handoverDocNo', e.target.value)}
                        className="form-input-standard font-mono text-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: Tốt, hoạt động bình thường, kèm 02 khối nguồn"
                        value={row.status}
                        onChange={(e) => updateOrgRow(idx, 'status', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeOrgRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: MỐC THỜI GIAN PHÁP LÝ & KIỂM ĐỊNH */}
      <div className="enterprise-card p-6">
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            4. Các Mốc Thời Gian Pháp Lý, Bảo Hành & Kiểm Định Kỹ Thuật
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Thời hạn vận hành, ngày nghiệm thu bàn giao và chu kỳ kiểm định / hiệu chuẩn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Ngày đưa vào khai thác chính thức
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={data.general.commissioned || ''}
              onChange={(e) => updateGeneral('commissioned', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Ngày nghiệm thu bàn giao
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={data.general.acceptanceDate || ''}
              onChange={(e) => updateGeneral('acceptanceDate', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Thời hạn bảo hành của hãng đến
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={data.general.warrantyDate || ''}
              onChange={(e) => updateGeneral('warrantyDate', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Kỳ hạn kiểm định / Hiệu chuẩn tiếp theo
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={data.general.nextCalDate || ''}
              onChange={(e) => updateGeneral('nextCalDate', e.target.value)}
              className="form-input-standard font-semibold text-amber-700 border-amber-300 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: GIẤY PHÉP / CHỨNG NHẬN CHUYÊN NGÀNH (TRANG 3 SỔ LÝ LỊCH) */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              5. Giấy Phép & Chứng Nhận Chuyên Ngành Hàng Không (Trang 3 Sổ Lý Lịch)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Giấy phép sử dụng tần số vô tuyến điện, Giấy chứng nhận đủ điều kiện bảo đảm hoạt động bay</p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={addLicense}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Thêm giấy phép</span>
            </button>
          )}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5 w-44">Số Giấy phép / Chứng nhận</th>
                <th className="p-2.5 w-32">Ngày bắt đầu</th>
                <th className="p-2.5">Cơ quan cấp / Nội dung cấp phép</th>
                <th className="p-2.5 w-32">Ngày hết hạn</th>
                <th className="p-2.5 w-24 text-center">Hiệu lực</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!data.licenses || data.licenses.length === 0) ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="p-4 text-center text-slate-500 italic bg-white">
                    Chưa có dữ liệu giấy phép chuyên ngành. Bấm "Thêm giấy phép" để bổ sung.
                  </td>
                </tr>
              ) : (
                data.licenses.map((lic, idx) => (
                  <tr key={lic.id || idx} className="hover:bg-slate-50 bg-white">
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Số GP-TS-..."
                        value={lic.startNo}
                        onChange={(e) => updateLicense(idx, 'startNo', e.target.value)}
                        className="form-input-standard font-mono font-medium text-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={lic.startDate}
                        onChange={(e) => updateLicense(idx, 'startDate', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Cơ quan cấp và nội dung..."
                        value={lic.content}
                        onChange={(e) => updateLicense(idx, 'content', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={lic.endDate}
                        onChange={(e) => updateLicense(idx, 'endDate', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={lic.active}
                          onChange={(e) => updateLicense(idx, 'active', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                        />
                      </label>
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLicense(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa giấy phép này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK JUMP TO OTHER LOGBOOK SECTIONS */}
      {onNavigateTab && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Các phần nội dung khác của Sổ Lý Lịch ({data.general.name})
            </h3>
            <span className="text-xs text-slate-500">Chuyển trang nhanh</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: 'spec', label: '2. Đặc Tính Kỹ Thuật' },
              { id: 'components', label: '3. Khối & Linh Kiện' },
              { id: 'docs', label: '4. Tài Liệu Kỹ Thuật' },
              { id: 'maintenance', label: '5. Lịch Sử Bảo Dưỡng' },
              { id: 'repair', label: '6. Sửa Chữa & Sự Cố' },
              { id: 'notes', label: '7. Ghi Chú & Lưu Ý' }
            ].map(sec => (
              <button
                key={sec.id}
                type="button"
                onClick={() => onNavigateTab(sec.id)}
                className="px-3 py-2 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer text-center shadow-2xs"
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
