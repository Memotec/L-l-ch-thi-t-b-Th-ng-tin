import React from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle
} from 'lucide-react';
import { EquipmentData, RepairRow, RepairType, RepairStatus } from '../types';

interface RepairTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const RepairTab: React.FC<RepairTabProps> = ({ data, onChange }) => {
  const addRepair = (presetType: RepairType = 'Sửa chữa khắc phục sự cố') => {
    const newRow: RepairRow = {
      id: `rp-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      resolvedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: presetType,
      incidentDescription: '',
      rootCause: '',
      actionTaken: '',
      replacedParts: '',
      person: data.org.primaryEngineer || '',
      status: 'Đã xử lý dứt điểm'
    };
    onChange({
      ...data,
      repair: [newRow, ...data.repair]
    });
  };

  const updateRepair = (index: number, field: keyof RepairRow, value: any) => {
    const newRepairs = [...data.repair];
    newRepairs[index] = { ...newRepairs[index], [field]: value };
    onChange({ ...data, repair: newRepairs });
  };

  const removeRepair = (index: number) => {
    const newRepairs = data.repair.filter((_, i) => i !== index);
    onChange({ ...data, repair: newRepairs });
  };

  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case 'Đã xử lý dứt điểm':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Đang theo dõi':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Chờ vật tư':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      default:
        return 'bg-[#091533] text-slate-300 border-[#1e3c7a]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#182d5a] pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              6. Nhật ký Kiểm tra - Sửa chữa - Thay thế linh kiện - Biến động kỹ thuật
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">
              Ghi nhận tất cả các sự cố phát sinh, nguyên nhân, biện pháp khắc phục và linh kiện thay thế
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => addRepair('Sửa chữa khắc phục sự cố')}
              className="px-2.5 py-1.5 bg-[#2a0e1c] hover:bg-[#3d152a] text-rose-300 rounded-lg text-xs font-semibold border border-rose-800/60 transition-colors cursor-pointer"
            >
              + Khắc phục sự cố
            </button>
            <button
              onClick={() => addRepair('Thay thế linh kiện / bo mạch')}
              className="px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            >
              + Thay thế linh kiện
            </button>
            <button
              onClick={() => addRepair('Nâng cấp cấu hình / Firmware')}
              className="px-2.5 py-1.5 bg-[#12224d] hover:bg-[#1b3475] text-indigo-200 rounded-lg text-xs font-semibold border border-[#2b448a] transition-colors cursor-pointer"
            >
              + Nâng cấp Firmware
            </button>
            <button
              onClick={() => addRepair()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bản ghi sửa chữa</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {data.repair.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#1e3c7a] rounded-xl bg-[#060e24] text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-90" />
              <p className="font-semibold text-white text-sm">Chưa có bản ghi sự cố hoặc sửa chữa nào</p>
              <p className="text-xs mt-1 text-sky-200/60">Hệ thống đang vận hành trơn tru và ổn định.</p>
            </div>
          ) : (
            data.repair.map((rp, idx) => (
              <div 
                key={rp.id || idx}
                className="p-4 rounded-xl border border-[#182d5a] bg-[#060e24] hover:border-sky-500/50 transition-all space-y-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182d5a] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-sky-400">#{idx + 1}</span>
                    <select
                      value={rp.type}
                      onChange={(e) => updateRepair(idx, 'type', e.target.value as RepairType)}
                      className="text-xs font-bold bg-[#091533] border border-[#1e3c7a] rounded-md px-2 py-1 text-sky-200 focus:outline-none"
                    >
                      <option value="Sửa chữa khắc phục sự cố" className="bg-[#091533] text-white">Sửa chữa khắc phục sự cố</option>
                      <option value="Thay thế linh kiện / bo mạch" className="bg-[#091533] text-white">Thay thế linh kiện / bo mạch</option>
                      <option value="Hiệu chỉnh căn chỉnh kỹ thuật" className="bg-[#091533] text-white">Hiệu chỉnh căn chỉnh kỹ thuật</option>
                      <option value="Nâng cấp cấu hình / Firmware" className="bg-[#091533] text-white">Nâng cấp cấu hình / Firmware</option>
                      <option value="Bảo trì ngăn ngừa" className="bg-[#091533] text-white">Bảo trì ngăn ngừa</option>
                    </select>
                    <select
                      value={rp.status}
                      onChange={(e) => updateRepair(idx, 'status', e.target.value as RepairStatus)}
                      className={`text-xs font-semibold border rounded-md px-2 py-1 focus:outline-none ${getStatusBadge(rp.status)}`}
                    >
                      <option value="Đã xử lý dứt điểm" className="bg-[#091533] text-white">Đã xử lý dứt điểm</option>
                      <option value="Đang theo dõi" className="bg-[#091533] text-white">Đang theo dõi</option>
                      <option value="Chờ vật tư" className="bg-[#091533] text-white">Chờ vật tư</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeRepair(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Xóa bản ghi sự cố này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Thời điểm phát sinh sự cố</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:mm"
                      value={rp.date}
                      onChange={(e) => updateRepair(idx, 'date', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-sky-300 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Thời điểm hoàn thành / Khôi phục</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:mm"
                      value={rp.resolvedDate || ''}
                      onChange={(e) => updateRepair(idx, 'resolvedDate', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-sky-300 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Mô tả hiện tượng sự cố & triệu chứng *</label>
                    <textarea
                      rows={2}
                      placeholder="Hiện tượng cảnh báo Alarm, mất tín hiệu, suy hao..."
                      value={rp.incidentDescription}
                      onChange={(e) => updateRepair(idx, 'incidentDescription', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Nguyên nhân cốt lõi (Root cause)</label>
                    <textarea
                      rows={2}
                      placeholder="Do ẩm đầu cáp cao tần, linh kiện lão hóa, sét lan truyền..."
                      value={rp.rootCause || ''}
                      onChange={(e) => updateRepair(idx, 'rootCause', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-sky-200">Biện pháp xử lý chi tiết & Kết quả đo kiểm sau can thiệp *</label>
                  <textarea
                    rows={2}
                    placeholder="Chuyển kênh dự phòng, thay thế module, vệ sinh điểm tiếp xúc, đo lại công suất và SWR..."
                    value={rp.actionTaken}
                    onChange={(e) => updateRepair(idx, 'actionTaken', e.target.value)}
                    className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Linh kiện / Vật tư đã thay thế</label>
                    <input
                      type="text"
                      placeholder="VD: Bo mạch nguồn PSU mã 65-3000-02 (SN: 9901)..."
                      value={rp.replacedParts || ''}
                      onChange={(e) => updateRepair(idx, 'replacedParts', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-sky-200">Nhân Kỹ thuật & Đơn vị phối hợp thực hiện</label>
                    <input
                      type="text"
                      placeholder="VD: KS. Nguyễn Chí Thanh, Nhân Viên Kỹ Thuật..."
                      value={rp.person}
                      onChange={(e) => updateRepair(idx, 'person', e.target.value)}
                      className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
