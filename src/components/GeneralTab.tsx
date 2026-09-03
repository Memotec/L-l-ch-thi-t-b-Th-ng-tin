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
  Check
} from 'lucide-react';
import { EquipmentData, LicenseRow, AppUser } from '../types';

interface GeneralTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  currentUser?: AppUser;
  onOpenLoginModal?: () => void;
  onDeleteEquipment?: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  currentUser,
  onOpenLoginModal,
  onDeleteEquipment
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateGeneral = (field: string, value: string) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      general: {
        ...data.general,
        [field]: value
      }
    });
  };

  const updateOrg = (field: string, value: string) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      org: {
        ...data.org,
        [field]: value
      }
    });
  };

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
      licenses: [...data.licenses, newLic]
    });
  };

  const updateLicense = (index: number, field: keyof LicenseRow, value: any) => {
    if (isReadOnly) return;
    const newLicenses = [...data.licenses];
    newLicenses[index] = { ...newLicenses[index], [field]: value };
    onChange({ ...data, licenses: newLicenses });
  };

  const removeLicense = (index: number) => {
    if (isReadOnly) return;
    const newLicenses = data.licenses.filter((_, i) => i !== index);
    onChange({ ...data, licenses: newLicenses });
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Check calibration countdown
  const getCalibrationCountdown = () => {
    if (!data.general.nextCalDate) return null;
    const target = new Date(data.general.nextCalDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilCal = getCalibrationCountdown();

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Viewer */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem thông tin chung. Để sửa các trường dữ liệu pháp lý & tổ chức, vui lòng đăng nhập Quản trị viên.</span>
          </div>
          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
            >
              Đăng nhập Admin
            </button>
          )}
        </div>
      )}

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

      {/* 1. Technical Origin & Timelines */}
      <div className="enterprise-card p-6">
        <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              1. Chi tiết Sơ lược Thiết bị & Các mốc thời gian pháp lý
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Thông tin xuất xứ, năm sản xuất và các mốc thời gian nghiệm thu đưa vào khai thác</p>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteEquipment && (
              <button
                onClick={onDeleteEquipment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-all cursor-pointer shadow-xs"
                title="Xóa sổ lý lịch thiết bị này"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa Sổ Lý Lịch</span>
              </button>
            )}
            {isReadOnly && (
              <span className="text-xs font-medium text-slate-500 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                Khóa chỉnh sửa
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Tên thiết bị</label>
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
              className="form-input-standard font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Hãng sản xuất</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.general.manufacturer}
              onChange={(e) => updateGeneral('manufacturer', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Kiểu loại (Model)</label>
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
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Năm sản xuất</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: 2020"
              value={data.general.yearMade || ''}
              onChange={(e) => updateGeneral('yearMade', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Số Serial / Part No</label>
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
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              Xuất xứ (Country of Origin)
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="UK / France / USA / Japan / Italy / Israel..."
              value={data.general.origin || ''}
              onChange={(e) => updateGeneral('origin', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
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
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
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
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
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

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Kỳ hạn kiểm định / Hiệu chuẩn tiếp theo
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={data.general.nextCalDate || ''}
              onChange={(e) => updateGeneral('nextCalDate', e.target.value)}
              className="form-input-standard font-semibold text-amber-700 md:w-1/3"
            />
          </div>
        </div>
      </div>

      {/* Organizational Ownership & Management Units */}
      <div className="enterprise-card p-6">
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Cơ quan Quản lý, Vị trí lắp đặt & Nhân sự chịu trách nhiệm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Phân cấp quản lý tài sản theo hệ thống Tổng công ty Quản lý bay Việt Nam</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Đơn vị quản lý cấp trên (Công ty / Trung tâm)</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.org.companyName || ''}
              onChange={(e) => updateOrg('companyName', e.target.value)}
              className="form-input-standard font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Bộ phận / Đội / Đài kỹ thuật trực tiếp</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={data.org.unit || ''}
              onChange={(e) => updateOrg('unit', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Vị trí lắp đặt / Trạm / Phòng máy</label>
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
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Số điện thoại liên hệ / Trực ban kỹ thuật</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: 028.38485383 - Ext 123"
              value={data.org.phoneContact || ''}
              onChange={(e) => updateOrg('phoneContact', e.target.value)}
              className="form-input-standard font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Kỹ sư chính phụ trách trang thiết bị</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: Kỹ sư Nguyễn Văn A"
              value={data.org.primaryEngineer || ''}
              onChange={(e) => updateOrg('primaryEngineer', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Cán bộ phụ trách / Đội trưởng</label>
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="VD: Trưởng đài / Đội trưởng"
              value={data.org.supervisor || ''}
              onChange={(e) => updateOrg('supervisor', e.target.value)}
              className="form-input-standard"
            />
          </div>
        </div>
      </div>

      {/* 2. Specialized Licenses and Certificates */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Giấy phép / Chứng nhận chuyên ngành liên quan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Giấy phép sử dụng tần số vô tuyến điện, Giấy chứng nhận đủ điều kiện bảo đảm hoạt động bay</p>
          </div>
          {!isReadOnly && (
            <button
              onClick={addLicense}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Thêm giấy phép</span>
            </button>
          )}
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
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
              {data.licenses.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="p-4 text-center text-slate-500 italic bg-white">
                    Chưa có dữ liệu giấy phép chuyên ngành.
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
                          onClick={() => removeLicense(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
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
    </div>
  );
};
