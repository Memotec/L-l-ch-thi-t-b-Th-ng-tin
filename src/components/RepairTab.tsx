import React from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';
import { EquipmentData, RepairRow, RepairType, RepairStatus } from '../types';
import { PerformerSelect } from './PerformerSelect';

interface RepairTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const RepairTab: React.FC<RepairTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const addRepair = (presetType: RepairType = 'Sửa chữa khắc phục sự cố') => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    const newRepairs = [...data.repair];
    newRepairs[index] = { ...newRepairs[index], [field]: value };
    onChange({ ...data, repair: newRepairs });
  };

  const removeRepair = (index: number) => {
    if (isReadOnly) return;
    const newRepairs = data.repair.filter((_, i) => i !== index);
    onChange({ ...data, repair: newRepairs });
  };

  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case 'Đã xử lý dứt điểm':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Đang theo dõi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Chờ vật tư':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Viewer */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem nhật ký sửa chữa. Để ghi nhận sự cố mới hoặc cập nhật biện pháp xử lý, vui lòng đăng nhập Quản trị viên.</span>
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

      <div className="enterprise-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              6. Nhật ký Kiểm tra - Sửa chữa - Thay thế linh kiện - Biến động kỹ thuật
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận tất cả các sự cố phát sinh, nguyên nhân, biện pháp khắc phục và linh kiện thay thế
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => addRepair('Sửa chữa khắc phục sự cố')}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium border border-rose-200 transition-colors cursor-pointer"
              >
                + Khắc phục sự cố
              </button>
              <button
                onClick={() => addRepair('Thay thế linh kiện / bo mạch')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                + Thay thế linh kiện
              </button>
              <button
                onClick={() => addRepair('Nâng cấp cấu hình / Firmware')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                + Nâng cấp Firmware
              </button>
              <button
                onClick={() => addRepair()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm bản ghi sửa chữa</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {data.repair.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
              <p className="font-semibold text-slate-900 text-sm">Chưa có bản ghi sự cố hoặc sửa chữa nào</p>
              <p className="text-xs mt-1 text-slate-500">Hệ thống đang vận hành trơn tru và ổn định.</p>
            </div>
          ) : (
            data.repair.map((rp, idx) => (
              <div 
                key={`repair-${rp.id || idx}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <select
                      disabled={isReadOnly}
                      value={rp.type}
                      onChange={(e) => updateRepair(idx, 'type', e.target.value as RepairType)}
                      className="form-input-standard py-1 text-xs font-bold"
                    >
                      <option value="Sửa chữa khắc phục sự cố">Sửa chữa khắc phục sự cố</option>
                      <option value="Thay thế linh kiện / bo mạch">Thay thế linh kiện / bo mạch</option>
                      <option value="Hiệu chỉnh căn chỉnh kỹ thuật">Hiệu chỉnh căn chỉnh kỹ thuật</option>
                      <option value="Nâng cấp cấu hình / Firmware">Nâng cấp cấu hình / Firmware</option>
                      <option value="Bảo trì ngăn ngừa">Bảo trì ngăn ngừa</option>
                    </select>
                    <select
                      disabled={isReadOnly}
                      value={rp.status}
                      onChange={(e) => updateRepair(idx, 'status', e.target.value as RepairStatus)}
                      className={`text-xs font-semibold border rounded-md px-2 py-1 focus:outline-none ${getStatusBadge(rp.status)}`}
                    >
                      <option value="Đã xử lý dứt điểm">Đã xử lý dứt điểm</option>
                      <option value="Đang theo dõi">Đang theo dõi</option>
                      <option value="Chờ vật tư">Chờ vật tư</option>
                    </select>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeRepair(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Xóa bản ghi sự cố này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Thời điểm phát sinh sự cố</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="YYYY-MM-DD HH:mm"
                      value={rp.date}
                      onChange={(e) => updateRepair(idx, 'date', e.target.value)}
                      className="form-input-standard font-mono text-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Thời điểm hoàn thành / Khôi phục</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="YYYY-MM-DD HH:mm"
                      value={rp.resolvedDate || ''}
                      onChange={(e) => updateRepair(idx, 'resolvedDate', e.target.value)}
                      className="form-input-standard font-mono text-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Mô tả hiện tượng sự cố & triệu chứng *</label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      placeholder="Hiện tượng cảnh báo Alarm, mất tín hiệu, suy hao..."
                      value={rp.incidentDescription}
                      onChange={(e) => updateRepair(idx, 'incidentDescription', e.target.value)}
                      className="form-input-standard"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Nguyên nhân cốt lõi (Root cause)</label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      placeholder="Do ẩm đầu cáp cao tần, linh kiện lão hóa, sét lan truyền..."
                      value={rp.rootCause || ''}
                      onChange={(e) => updateRepair(idx, 'rootCause', e.target.value)}
                      className="form-input-standard"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">Biện pháp xử lý chi tiết & Kết quả đo kiểm sau can thiệp *</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    placeholder="Chuyển kênh dự phòng, thay thế module, vệ sinh điểm tiếp xúc, đo lại công suất và SWR..."
                    value={rp.actionTaken}
                    onChange={(e) => updateRepair(idx, 'actionTaken', e.target.value)}
                    className="form-input-standard"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Linh kiện / Vật tư đã thay thế</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="VD: Bo mạch nguồn PSU mã 65-3000-02 (SN: 9901)..."
                      value={rp.replacedParts || ''}
                      onChange={(e) => updateRepair(idx, 'replacedParts', e.target.value)}
                      className="form-input-standard"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">Kíp / Nhân Kỹ thuật thực hiện</label>
                    <PerformerSelect
                      value={rp.person}
                      onChange={(val) => updateRepair(idx, 'person', val)}
                      disabled={isReadOnly}
                      placeholder="Chọn Kíp hoặc tự nhập..."
                      showQuickPills={true}
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
