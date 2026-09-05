import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  Building, 
  ShieldCheck, 
  Calendar, 
  Radio, 
  Activity, 
  Zap, 
  Server, 
  PhoneCall, 
  HardDrive,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  EquipmentData, 
  EquipmentCategory, 
  EquipmentStatus, 
  EquipmentPriority 
} from '../types';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentData | null;
  onSave: (updated: EquipmentData) => void;
  onShowToast?: (msg: string) => void;
}

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onSave,
  onShowToast
}) => {
  const [formData, setFormData] = useState<EquipmentData | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'org' | 'legal'>('general');

  useEffect(() => {
    if (equipment) {
      // Deep copy to prevent accidental mutation before save
      setFormData(JSON.parse(JSON.stringify(equipment)));
      setActiveSubTab('general');
    }
  }, [equipment, isOpen]);

  if (!isOpen || !formData) return null;

  const updateGeneral = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        general: {
          ...prev.general,
          [field]: value
        }
      };
    });
  };

  const updateOrg = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        org: {
          ...prev.org,
          [field]: value
        }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.general.name.trim()) {
      alert('Vui lòng nhập tên thiết bị.');
      return;
    }

    const updatedWithTimestamp: EquipmentData = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedWithTimestamp);
    if (onShowToast) {
      onShowToast(`✓ Đã lưu thành công các thông tin Sổ lý lịch: ${formData.general.name}`);
    }
    onClose();
  };

  const categories: { id: EquipmentCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'VHF/UHF', label: 'VHF/UHF Radio', icon: Radio },
    { id: 'Ghép Kênh', label: 'Ghép kênh / Router', icon: Layers },
    { id: 'VIBA', label: 'Viba / Microwave', icon: Activity },
    { id: 'VSAT', label: 'VSAT Vệ Tinh', icon: Radio },
    { id: 'VCCS', label: 'VCCS / Thoại Không Lưu', icon: PhoneCall },
    { id: 'VOICE', label: 'Hệ Thống Thoại / VCS', icon: PhoneCall },
    { id: 'POWER', label: 'Nguồn Điện / UPS', icon: Zap },
    { id: 'IT', label: 'Mạng IT / Server CNS', icon: Server },
    { id: 'Thiết Bị Khác', label: 'Thiết Bị Đo & Khác', icon: HardDrive }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Chỉnh Sửa Thông Tin Sổ Lý Lịch</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quyền Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {formData.general.name} ({formData.general.model || formData.general.serial || 'Hồ sơ kỹ thuật'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtab Navigator */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'general'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>1. Định danh & Chủng loại</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('org')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'org'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Cơ quan Quản lý & Vị trí</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('legal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'legal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. Thời gian & Kiểm định</span>
          </button>
        </div>

        {/* Modal Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL & CATEGORY */}
          {activeSubTab === 'general' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Chủng loại thiết bị CNS *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = formData.general.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => updateGeneral('category', cat.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tên thiết bị đầy đủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.general.name}
                    onChange={(e) => updateGeneral('name', e.target.value)}
                    className="form-input-standard font-semibold text-slate-900"
                    placeholder="VD: Máy thu phát VHF Air-Ground Park Air T6T Kênh Chính"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Trạng thái khai thác
                  </label>
                  <select
                    value={formData.general.status || 'Đang khai thác'}
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
                  <label className="text-xs font-bold text-slate-800 block">
                    Phân nhóm thiết bị (Mức ưu tiên)
                  </label>
                  <select
                    value={formData.general.priority || 'Hệ thống chính (Level 1)'}
                    onChange={(e) => updateGeneral('priority', e.target.value as EquipmentPriority)}
                    className="form-input-standard font-medium"
                  >
                    <option value="Hệ thống chính (Level 1)">Hệ thống chính (Level 1)</option>
                    <option value="Hệ thống dự phòng nóng (Level 2)">Hệ thống dự phòng nóng (Level 2)</option>
                    <option value="Hệ thống phụ trợ (Level 3)">Hệ thống phụ trợ (Level 3)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Kiểu loại (Model)
                  </label>
                  <input
                    type="text"
                    value={formData.general.model || ''}
                    onChange={(e) => updateGeneral('model', e.target.value)}
                    className="form-input-standard font-mono"
                    placeholder="VD: T6T / PA-5500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Hãng sản xuất
                  </label>
                  <input
                    type="text"
                    value={formData.general.manufacturer || ''}
                    onChange={(e) => updateGeneral('manufacturer', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: Park Air Systems / Jotron / Ceragon"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Số Serial / Part No
                  </label>
                  <input
                    type="text"
                    value={formData.general.serial || ''}
                    onChange={(e) => updateGeneral('serial', e.target.value)}
                    className="form-input-standard font-mono text-blue-600 font-semibold"
                    placeholder="VD: PA-SN-998822"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Nước sản xuất / Xuất xứ
                  </label>
                  <input
                    type="text"
                    value={formData.general.origin || ''}
                    onChange={(e) => updateGeneral('origin', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: Vương Quốc Anh (UK) / Pháp / Mỹ / Na Uy"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Mã tài sản quản lý (Asset No)
                  </label>
                  <input
                    type="text"
                    value={formData.general.assetNo || ''}
                    onChange={(e) => updateGeneral('assetNo', e.target.value)}
                    className="form-input-standard font-mono"
                    placeholder="VD: TS-VHF-2023-01"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Mã nội bộ trạm / Đài (Asset Code)
                  </label>
                  <input
                    type="text"
                    value={formData.general.assetCode || ''}
                    onChange={(e) => updateGeneral('assetCode', e.target.value)}
                    className="form-input-standard font-mono"
                    placeholder="VD: VHF-NB-01"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Năm sản xuất
                  </label>
                  <input
                    type="text"
                    value={formData.general.yearMade || ''}
                    onChange={(e) => updateGeneral('yearMade', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: 2021"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tuổi thọ thiết kế ước tính (Năm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.general.estimatedLifespanYears || 10}
                    onChange={(e) => updateGeneral('estimatedLifespanYears', parseInt(e.target.value) || 10)}
                    className="form-input-standard"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Ghi chú mục đích sử dụng / Đặc thù vận hành
                  </label>
                  <input
                    type="text"
                    value={formData.general.notes || ''}
                    onChange={(e) => updateGeneral('notes', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: Phục vụ điều hành bay tiếp cận ACC / Đài Kiểm soát không lưu"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION & LOCATION */}
          {activeSubTab === 'org' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                Thông tin cơ quan quản lý và phân cấp trách nhiệm khai thác theo quy chuẩn Sổ lý lịch Tổng công ty Quản lý bay Việt Nam.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Đơn vị quản lý cấp trên (Công ty / Trung tâm)
                  </label>
                  <input
                    type="text"
                    value={formData.org.companyName || ''}
                    onChange={(e) => updateOrg('companyName', e.target.value)}
                    className="form-input-standard font-semibold"
                    placeholder="VD: Tổng công ty Quản lý bay Việt Nam / Công ty QLB Miền Bắc"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Bộ phận / Đội / Đài kỹ thuật trực tiếp *
                  </label>
                  <input
                    type="text"
                    value={formData.org.unit || ''}
                    onChange={(e) => updateOrg('unit', e.target.value)}
                    className="form-input-standard font-semibold"
                    placeholder="VD: Đài KSKL Nội Bài / Đội Kỹ thuật CNS"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Vị trí lắp đặt / Trạm / Phòng máy / Rack U *
                  </label>
                  <input
                    type="text"
                    value={formData.org.location || ''}
                    onChange={(e) => updateOrg('location', e.target.value)}
                    className="form-input-standard font-semibold text-slate-900"
                    placeholder="VD: Phòng thiết bị Tầng 3 - Đài KSKL Nội Bài, Rack CNS-02, U12-U14"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Số điện thoại liên hệ / Trực ban kỹ thuật
                  </label>
                  <input
                    type="text"
                    value={formData.org.phoneContact || ''}
                    onChange={(e) => updateOrg('phoneContact', e.target.value)}
                    className="form-input-standard font-mono"
                    placeholder="VD: 024.38865xxx - Ext 123"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Kỹ sư chính phụ trách trang thiết bị
                  </label>
                  <input
                    type="text"
                    value={formData.org.primaryEngineer || ''}
                    onChange={(e) => updateOrg('primaryEngineer', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: KS. Nguyễn Văn A (Chứng chỉ CNS-VHF)"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Cán bộ phụ trách / Đội trưởng
                  </label>
                  <input
                    type="text"
                    value={formData.org.supervisor || ''}
                    onChange={(e) => updateOrg('supervisor', e.target.value)}
                    className="form-input-standard"
                    placeholder="VD: Trưởng đài KSKL / Đội trưởng Đội Thiết bị CNS"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINES & CALIBRATION */}
          {activeSubTab === 'legal' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Các mốc thời gian pháp lý, ngày đưa vào khai thác và chu kỳ kiểm định kỹ thuật định kỳ của thiết bị.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Ngày đưa vào khai thác chính thức
                  </label>
                  <input
                    type="date"
                    value={formData.general.commissioned || ''}
                    onChange={(e) => updateGeneral('commissioned', e.target.value)}
                    className="form-input-standard"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Ngày nghiệm thu bàn giao
                  </label>
                  <input
                    type="date"
                    value={formData.general.acceptanceDate || ''}
                    onChange={(e) => updateGeneral('acceptanceDate', e.target.value)}
                    className="form-input-standard"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Thời hạn bảo hành của hãng đến
                  </label>
                  <input
                    type="date"
                    value={formData.general.warrantyDate || ''}
                    onChange={(e) => updateGeneral('warrantyDate', e.target.value)}
                    className="form-input-standard"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block text-amber-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Kỳ hạn kiểm định / Hiệu chuẩn tiếp theo
                  </label>
                  <input
                    type="date"
                    value={formData.general.nextCalDate || ''}
                    onChange={(e) => updateGeneral('nextCalDate', e.target.value)}
                    className="form-input-standard font-semibold text-amber-800 border-amber-300 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Sổ Lý Lịch</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
