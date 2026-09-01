import React from 'react';
import { 
  FileText, 
  Award, 
  Calendar, 
  Globe2, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { EquipmentData, LicenseRow } from '../types';

interface GeneralTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ data, onChange }) => {
  const updateGeneral = (field: string, value: any) => {
    onChange({
      ...data,
      general: {
        ...data.general,
        [field]: value
      }
    });
  };

  const addLicense = () => {
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
    const newLicenses = [...data.licenses];
    newLicenses[index] = { ...newLicenses[index], [field]: value };
    onChange({ ...data, licenses: newLicenses });
  };

  const removeLicense = (index: number) => {
    const newLicenses = data.licenses.filter((_, i) => i !== index);
    onChange({ ...data, licenses: newLicenses });
  };

  // Check calibration expiry status
  const nextCalDate = data.general.nextCalDate ? new Date(data.general.nextCalDate) : null;
  const today = new Date();
  const daysUntilCal = nextCalDate ? Math.ceil((nextCalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-6">
      {/* Expiry / Calibration Notice Banner if upcoming */}
      {daysUntilCal !== null && daysUntilCal <= 60 && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          daysUntilCal < 0 
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <b>{daysUntilCal < 0 ? 'CẢNH BÁO QUÁ HẠN KIỂM ĐỊNH!' : 'LƯU Ý KỲ KIỂM ĐỊNH SẮP TỚI!'}</b> Thiết bị có hạn kiểm định / hiệu chuẩn tiếp theo vào ngày <b>{data.general.nextCalDate}</b> ({daysUntilCal < 0 ? `Đã quá hạn ${Math.abs(daysUntilCal)} ngày` : `Còn ${daysUntilCal} ngày`}). Cần liên hệ đơn vị đo lường lập kế hoạch kiểm định.
          </div>
        </div>
      )}

      {/* 1. Technical Origin & Timelines */}
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="border-b border-[#182d5a] pb-3 mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            1. Chi tiết Sơ lược Thiết bị & Các mốc thời gian pháp lý
          </h2>
          <p className="text-xs text-sky-200/70 mt-0.5">Thông tin xuất xứ, năm sản xuất và các mốc thời gian nghiệm thu đưa vào khai thác</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Tên thiết bị</label>
            <input
              type="text"
              value={data.general.name}
              onChange={(e) => updateGeneral('name', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-semibold text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Hãng sản xuất</label>
            <input
              type="text"
              value={data.general.manufacturer}
              onChange={(e) => updateGeneral('manufacturer', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Kiểu loại (Model)</label>
            <input
              type="text"
              value={data.general.model}
              onChange={(e) => updateGeneral('model', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Năm sản xuất</label>
            <input
              type="text"
              placeholder="VD: 2020"
              value={data.general.yearMade || ''}
              onChange={(e) => updateGeneral('yearMade', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Số Serial / Part No</label>
            <input
              type="text"
              value={data.general.serial}
              onChange={(e) => updateGeneral('serial', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-sky-300 font-bold focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              Xuất xứ (Country of Origin)
            </label>
            <input
              type="text"
              placeholder="UK / France / USA / Japan / Italy / Israel..."
              value={data.general.origin || ''}
              onChange={(e) => updateGeneral('origin', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Ngày đưa vào khai thác chính thức
            </label>
            <input
              type="date"
              value={data.general.commissioned || ''}
              onChange={(e) => updateGeneral('commissioned', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Ngày nghiệm thu bàn giao
            </label>
            <input
              type="date"
              value={data.general.acceptanceDate || ''}
              onChange={(e) => updateGeneral('acceptanceDate', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Thời hạn bảo hành của hãng đến
            </label>
            <input
              type="date"
              value={data.general.warrantyDate || ''}
              onChange={(e) => updateGeneral('warrantyDate', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Kỳ hạn kiểm định / Hiệu chuẩn tiếp theo
            </label>
            <input
              type="date"
              value={data.general.nextCalDate || ''}
              onChange={(e) => updateGeneral('nextCalDate', e.target.value)}
              className="w-full md:w-1/3 text-xs bg-[#0b1b40] border border-amber-500/50 rounded-lg p-2.5 font-semibold text-amber-200 focus:bg-[#0f2454] focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Specialized Licenses and Certificates */}
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex items-center justify-between border-b border-[#182d5a] pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-400" />
              Giấy phép / Chứng nhận chuyên ngành liên quan
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">Giấy phép sử dụng tần số vô tuyến điện, Giấy chứng nhận đủ điều kiện bảo đảm hoạt động bay</p>
          </div>
          <button
            onClick={addLicense}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 border border-[#1e3c7a] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Thêm giấy phép</span>
          </button>
        </div>

        <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
              <tr>
                <th className="p-2.5 w-44">Số Giấy phép / Chứng nhận</th>
                <th className="p-2.5 w-32">Ngày bắt đầu</th>
                <th className="p-2.5">Cơ quan cấp / Nội dung cấp phép</th>
                <th className="p-2.5 w-32">Ngày hết hạn</th>
                <th className="p-2.5 w-24 text-center">Hiệu lực</th>
                <th className="p-2.5 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182d5a]">
              {data.licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 italic bg-[#050c1e]">
                    Chưa có dữ liệu giấy phép chuyên ngành. Nhấn "Thêm giấy phép" để bổ sung.
                  </td>
                </tr>
              ) : (
                data.licenses.map((lic, idx) => (
                  <tr key={lic.id || idx} className="hover:bg-[#0c183a] bg-[#060e24]">
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Số GP-TS-..."
                        value={lic.startNo}
                        onChange={(e) => updateLicense(idx, 'startNo', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono font-medium text-sky-300"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={lic.startDate}
                        onChange={(e) => updateLicense(idx, 'startDate', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Cơ quan cấp (Cục Tần số, Cục HKVN...) và nội dung..."
                        value={lic.content}
                        onChange={(e) => updateLicense(idx, 'content', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={lic.endDate}
                        onChange={(e) => updateLicense(idx, 'endDate', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lic.active}
                          onChange={(e) => updateLicense(idx, 'active', e.target.checked)}
                          className="w-4 h-4 text-sky-500 rounded focus:ring-sky-400 bg-[#091533] border-[#1e3c7a]"
                        />
                      </label>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeLicense(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Xóa giấy phép này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
