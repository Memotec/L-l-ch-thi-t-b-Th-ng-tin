import React from 'react';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  FileBadge,
  Layers,
  Wrench,
  AlertOctagon,
  ArrowRightLeft,
  Cloud,
  FileSpreadsheet,
  FileText,
  QrCode
} from 'lucide-react';
import { EquipmentData, OrgTransferRow, EquipmentCategory, EquipmentStatus, EquipmentPriority } from '../types';

interface DashboardTabProps {
  data: EquipmentData;
  allEquipments?: EquipmentData[];
  onChange: (updated: EquipmentData) => void;
  onNavigateTab: (tab: string) => void;
  onSelectEquipment?: (id: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ data, allEquipments = [], onChange, onNavigateTab, onSelectEquipment }) => {
  const updateGeneral = (field: string, value: any) => {
    onChange({
      ...data,
      general: {
        ...data.general,
        [field]: value
      }
    });
  };

  const updateOrg = (field: string, value: any) => {
    onChange({
      ...data,
      org: {
        ...data.org,
        [field]: value
      }
    });
  };

  const addOrgRow = () => {
    const newRow: OrgTransferRow = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      unit: '',
      handoverDocNo: '',
      status: 'Bàn giao nguyên trạng hoạt động tốt',
      note: ''
    };
    onChange({
      ...data,
      orgRows: [...data.orgRows, newRow]
    });
  };

  const updateOrgRow = (index: number, field: keyof OrgTransferRow, value: string) => {
    const newRows = [...data.orgRows];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange({ ...data, orgRows: newRows });
  };

  const removeOrgRow = (index: number) => {
    const newRows = data.orgRows.filter((_, i) => i !== index);
    onChange({ ...data, orgRows: newRows });
  };

  // Calculate quick stats
  const commissionedYear = data.general.commissioned ? new Date(data.general.commissioned).getFullYear() : null;
  const currentYear = new Date().getFullYear();
  const serviceYears = commissionedYear ? Math.max(0, currentYear - commissionedYear) : 0;
  const totalComponents = data.components?.length || 0;
  const goodComponents = data.components?.filter(c => c.healthStatus === 'Tốt').length || 0;
  const totalMaintenance = data.maintenance?.length || 0;
  const totalRepairs = data.repair?.length || 0;

  return (
    <div className="space-y-6">
      {/* Cloud & Apps Script Quick Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-[#0a1b44] to-indigo-950 text-white p-4 rounded-xl shadow-lg border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 rounded-lg text-sky-300 border border-blue-400/30">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Đồng Bộ Google Apps Script (Google Sheets, Docs & Drive)</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-semibold border border-emerald-500/30">
                Sẵn sàng
              </span>
            </div>
            <p className="text-[11px] text-sky-200/80 mt-0.5">
              Hệ thống đã tích hợp trọn bộ Apps Script Backend (Code.gs) để tự động lưu bảng Google Sheet, xuất Google Doc và sao lưu Google Drive.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('qrCode')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-700 to-sky-700 hover:from-blue-600 hover:to-sky-600 text-white rounded-lg text-xs font-bold shadow-md transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border border-sky-400/40"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-200" />
            <span>Mã QR Lý Lịch</span>
          </button>
          <button
            onClick={() => onNavigateTab('googleWorkspace')}
            className="px-3.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border border-[#1e3c7a]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>Apps Script & Drive</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('general')}
          className="bg-[#091533] p-4 rounded-xl border border-[#182d5a] shadow-md hover:border-sky-400/60 hover:bg-[#0c1c45] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-sky-300/80 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Thời gian vận hành</span>
            <div className="p-2 bg-blue-900/40 text-sky-300 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-700/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {commissionedYear ? `${serviceYears} năm` : 'Chưa nhập'}
          </div>
          <p className="text-xs text-sky-300/70 mt-1">
            Đưa vào KT: <b className="text-sky-200 font-semibold">{data.general.commissioned || 'N/A'}</b>
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('components')}
          className="bg-[#091533] p-4 rounded-xl border border-[#182d5a] shadow-md hover:border-emerald-400/60 hover:bg-[#0c1c45] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-300/80 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Linh kiện & Bo mạch</span>
            <div className="p-2 bg-emerald-950/40 text-emerald-300 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-700/40">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {goodComponents}/{totalComponents}
          </div>
          <p className="text-xs text-sky-300/70 mt-1">
            {totalComponents > 0 ? `${Math.round((goodComponents / totalComponents) * 100)}% hoạt động tốt` : 'Chưa khai báo'}
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('maintenance')}
          className="bg-[#091533] p-4 rounded-xl border border-[#182d5a] shadow-md hover:border-amber-400/60 hover:bg-[#0c1c45] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-300/80 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bảo dưỡng định kỳ</span>
            <div className="p-2 bg-amber-950/40 text-amber-300 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors border border-amber-700/40">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalMaintenance} đợt
          </div>
          <p className="text-xs text-sky-300/70 mt-1">
            Lần gần nhất: <b className="text-sky-200 font-semibold">{data.maintenance?.[0]?.date || 'Chưa có'}</b>
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('repair')}
          className="bg-[#091533] p-4 rounded-xl border border-[#182d5a] shadow-md hover:border-rose-400/60 hover:bg-[#0c1c45] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-rose-300/80 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sự cố & Sửa chữa</span>
            <div className="p-2 bg-rose-950/40 text-rose-300 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-700/40">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalRepairs} lần
          </div>
          <p className="text-xs text-sky-300/70 mt-1">
            {totalRepairs === 0 ? 'Hoạt động ổn định' : 'Có ghi nhận nhật ký'}
          </p>
        </div>
      </div>

      {/* Identification & Categorization Section */}
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="border-b border-[#182d5a] pb-3 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-sky-400" />
              Thông tin định danh & Phân loại chủng loại thiết bị
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">Xác lập các thuộc tính cơ sở, mã định danh tài sản và mức độ ưu tiên khai thác</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Chủng loại thiết bị CNS *</label>
            <select
              id="cat-select"
              value={data.general.category}
              onChange={(e) => updateGeneral('category', e.target.value as EquipmentCategory)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-medium text-slate-100 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            >
              <option value="VHF/UHF" className="bg-[#091533]">VHF/UHF Air-Ground Radio (T6T, Jotron, Rohde&Schwarz)</option>
              <option value="VIBA" className="bg-[#091533]">Viba / Truyền dẫn số (Ceragon, Nokia, SIAE)</option>
              <option value="VOICE" className="bg-[#091533]">Hệ thống chuyển mạch thoại / Ghi âm (SITTI, Frequentis, Rohill)</option>
              <option value="POWER" className="bg-[#091533]">Hệ thống Nguồn điện (UPS, DC Rectifier, Máy nổ phát điện)</option>
              <option value="IT" className="bg-[#091533]">Thiết bị Mạng & Máy chủ (Switch, Router, Server CNS)</option>
              <option value="RADAR_ADS" className="bg-[#091533]">Ra-đa / Giám sát bay (MSSR, PSR, ADS-B, MLAT)</option>
              <option value="NAV" className="bg-[#091533]">Dẫn đường hàng không (ILS, DVOR, DME, NDB)</option>
              <option value="OTHER" className="bg-[#091533]">Chủng loại thiết bị kỹ thuật chuyên ngành khác</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-sky-200">Tên thiết bị đầy đủ *</label>
            <input
              type="text"
              placeholder="Ví dụ: Máy thu phát VHF Air-Ground Park Air T6T Kênh Chính"
              value={data.general.name}
              onChange={(e) => updateGeneral('name', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-semibold text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Trạng thái hiện tại *</label>
            <select
              value={data.general.status}
              onChange={(e) => updateGeneral('status', e.target.value as EquipmentStatus)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-semibold text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            >
              <option value="Đang khai thác" className="bg-[#091533]">Đang khai thác (Active)</option>
              <option value="Dự phòng sẵn sàng" className="bg-[#091533]">Dự phòng sẵn sàng (Standby)</option>
              <option value="Đang bảo dưỡng/sửa chữa" className="bg-[#091533]">Đang bảo dưỡng / sửa chữa (Maintenance)</option>
              <option value="Tạm ngừng khai thác" className="bg-[#091533]">Tạm ngừng khai thác (Suspended)</option>
              <option value="Đã thanh lý" className="bg-[#091533]">Đã thanh lý (Liquidated)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Hãng sản xuất</label>
            <input
              type="text"
              placeholder="Ví dụ: Park Air Systems / SITTI / Ceragon"
              value={data.general.manufacturer}
              onChange={(e) => updateGeneral('manufacturer', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Kiểu loại / Model</label>
            <input
              type="text"
              placeholder="Ví dụ: T6TRV 50W / M800IP"
              value={data.general.model}
              onChange={(e) => updateGeneral('model', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Số Serial / Part No</label>
            <input
              type="text"
              placeholder="Ví dụ: PA-T6T-2019-88341"
              value={data.general.serial}
              onChange={(e) => updateGeneral('serial', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-sky-300 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Mã tài sản quản lý (Asset No)</label>
            <input
              type="text"
              placeholder="Ví dụ: TS-CNS-VHF-001"
              value={data.general.assetNo}
              onChange={(e) => updateGeneral('assetNo', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-sky-300 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Mã nội bộ trạm / Đài</label>
            <input
              type="text"
              placeholder="Ví dụ: VHF-APP-125.6-M"
              value={data.general.assetCode}
              onChange={(e) => updateGeneral('assetCode', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Phân Nhóm Thiết Bị</label>
            <select
              value={data.general.priority}
              onChange={(e) => updateGeneral('priority', e.target.value as EquipmentPriority)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            >
              <option value="Hệ thống chính (Level 1)" className="bg-[#091533]">Thiết Bị Nhóm 1 (Level 1 - VHF, VCCS, ADS-B)</option>
              <option value="Hệ thống dự phòng nóng (Level 2)" className="bg-[#091533]">Hệ thiết Bị Nhóm 2 (Level 2 - VSAT, VIBA, Cáp Quang)</option>
              <option value="Hệ thống phụ trợ (Level 3)" className="bg-[#091533]">Thiết Bị Nhóm 3 (Level 3 - Hỗ trợ kỹ thuật)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Tuổi thọ thiết kế (Năm)</label>
            <input
              type="number"
              min="1"
              max="50"
              placeholder="15"
              value={data.general.estimatedLifespanYears || ''}
              onChange={(e) => updateGeneral('estimatedLifespanYears', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">Ghi chú mục đích sử dụng</label>
            <input
              type="text"
              placeholder="Đảm bảo điều hành bay ACC/APP..."
              value={data.general.notes || ''}
              onChange={(e) => updateGeneral('notes', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Organization & Location Section */}
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="border-b border-[#182d5a] pb-3 mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            Cơ cấu tổ chức quản lý & Vị trí lắp đặt chi tiết
          </h2>
          <p className="text-xs text-sky-200/70 mt-0.5">Xác định đơn vị chịu trách nhiệm kỹ thuật và địa điểm vật lý của thiết bị</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              Đơn vị quản lý trực tiếp *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đội Thông Tin - Dẫn Đường / Đài KLL Tân Sơn Nhất"
              value={data.org.unit}
              onChange={(e) => updateOrg('unit', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Vị trí lắp đặt / Trạm / Phòng máy / Rack U *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Trạm VHF Đồi C2 / Phòng máy Tầng 2 / Rack số 02 - U14-U16"
              value={data.org.location}
              onChange={(e) => updateOrg('location', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              Kỹ sư / Cán bộ kỹ thuật phụ trách chính
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Kỹ sư Nguyễn Văn Hùng"
              value={data.org.primaryEngineer || ''}
              onChange={(e) => updateOrg('primaryEngineer', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              Số điện thoại / Kênh liên lạc trực ban
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 0912.345.678 / Máy lẻ 104"
              value={data.org.phoneContact || ''}
              onChange={(e) => updateOrg('phoneContact', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Handover and Transfer Process Table */}
        <div className="mt-6 pt-5 border-t border-[#182d5a]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                Quá trình luân chuyển & Bàn giao đơn vị quản lý qua các thời kỳ
              </h3>
              <p className="text-xs text-sky-200/70">Ghi lại các mốc tiếp nhận, điều chuyển địa điểm hoặc bàn giao trạm</p>
            </div>
            <button
              onClick={addOrgRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 border border-[#1e3c7a] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Thêm dòng luân chuyển</span>
            </button>
          </div>

          <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
                <tr>
                  <th className="p-2.5 w-32">Ngày tháng</th>
                  <th className="p-2.5">Đơn vị bàn giao / Tiếp nhận</th>
                  <th className="p-2.5 w-44">Số biên bản / Quyết định</th>
                  <th className="p-2.5">Tình trạng thiết bị</th>
                  <th className="p-2.5 w-12 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182d5a]">
                {data.orgRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic bg-[#050c1e]">
                      Chưa có dữ liệu luân chuyển. Nhấn "Thêm dòng luân chuyển" để ghi nhận.
                    </td>
                  </tr>
                ) : (
                  data.orgRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-[#0c183a] bg-[#060e24]">
                      <td className="p-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateOrgRow(idx, 'date', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Đơn vị bàn giao / nhận..."
                          value={row.unit}
                          onChange={(e) => updateOrgRow(idx, 'unit', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="BB-NT-01/QĐ..."
                          value={row.handoverDocNo}
                          onChange={(e) => updateOrgRow(idx, 'handoverDocNo', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono text-sky-300"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Tình trạng kỹ thuật khi bàn giao..."
                          value={row.status}
                          onChange={(e) => updateOrgRow(idx, 'status', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeOrgRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          title="Xóa dòng này"
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
    </div>
  );
};
