import React from 'react';
import { 
  FileText, 
  Award, 
  Calendar, 
  Globe2, 
  Plus, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { EquipmentData, LicenseRow, AppUser } from '../types';

interface GeneralTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
  onDeleteEquipment?: () => void;
  currentUser?: AppUser;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal,
  onDeleteEquipment,
  currentUser
}) => {
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

  const addLicense = () => {
    if (isReadOnly) return;
    const newLicense: LicenseRow = {
      id: `lic-${Date.now()}`,
      startNo: '',
      startDate: new Date().toISOString().split('T')[0],
      content: '',
      endDate: '',
      active: true
    };
    onChange({
      ...data,
      licenses: [...data.licenses, newLicense]
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

  // Check calibration expiry status
  const nextCalDate = data.general.nextCalDate ? new Date(data.general.nextCalDate) : null;
  const today = new Date();
  const daysUntilCal = nextCalDate ? Math.ceil((nextCalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Viewer */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem và tra cứu. Để chỉnh sửa dữ liệu, vui lòng đăng nhập tài khoản Quản trị viên (Admin).</span>
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

      {/* Expiry / Calibration Notice Banner if upcoming */}
      {daysUntilCal !== null && daysUntilCal <= 60 && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
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
                title="Xóa vĩnh viễn sổ lý lịch thiết bị này (Admin)"
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
            <label className="text-xs font-medium text-slate-700">Tên thiết bị</label>
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
            <label className="text-xs font-medium text-slate-700">Kiểu loại (Model)</label>
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
            <label className="text-xs font-medium text-slate-700">Số Serial / Part No</label>
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
