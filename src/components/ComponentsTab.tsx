import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2
} from 'lucide-react';
import { EquipmentData, ComponentRow, ComponentHealth } from '../types';

interface ComponentsTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const ComponentsTab: React.FC<ComponentsTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const addComponent = () => {
    if (isReadOnly) return;
    const newComp: ComponentRow = {
      id: `cp-${Date.now()}`,
      no: data.components.length + 1,
      name: '',
      partNo: '',
      serial: '',
      unit: 'Bộ',
      qty: 1,
      healthStatus: 'Tốt',
      note: ''
    };
    onChange({
      ...data,
      components: [...data.components, newComp]
    });
  };

  const updateComponent = (index: number, field: keyof ComponentRow, value: any) => {
    if (isReadOnly) return;
    const newComps = [...data.components];
    newComps[index] = { ...newComps[index], [field]: value };
    onChange({ ...data, components: newComps });
  };

  const removeComponent = (index: number) => {
    if (isReadOnly) return;
    const newComps = data.components.filter((_, i) => i !== index).map((c, idx) => ({
      ...c,
      no: idx + 1
    }));
    onChange({ ...data, components: newComps });
  };

  const getHealthBadge = (status: ComponentHealth) => {
    switch (status) {
      case 'Tốt':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cần theo dõi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Đã sửa chữa':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Hỏng':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const goodCount = data.components.filter(c => c.healthStatus === 'Tốt').length;
  const watchCount = data.components.filter(c => c.healthStatus === 'Cần theo dõi').length;
  const badCount = data.components.filter(c => c.healthStatus === 'Hỏng').length;

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Viewer */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem danh mục linh kiện. Để thêm/sửa/xóa module hoặc linh kiện, vui lòng đăng nhập Quản trị viên.</span>
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
              <Layers className="w-5 h-5 text-blue-600" />
              3. Thành phần thiết bị, Khối chức năng & Linh kiện chính
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý chi tiết các module tháo rời, bo mạch xử lý, khối nguồn và linh kiện dự phòng
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
              <span>Tổng: <b className="text-slate-900">{data.components.length}</b></span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold">Tốt: {goodCount}</span>
              {watchCount > 0 && <span className="text-amber-700 font-semibold">• Theo dõi: {watchCount}</span>}
              {badCount > 0 && <span className="text-rose-700 font-semibold">• Hỏng: {badCount}</span>}
            </div>

            {!isReadOnly && (
              <button
                onClick={addComponent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm bộ phận / Linh kiện</span>
              </button>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5 w-12 text-center">TT</th>
                <th className="p-2.5">Tên thiết bị / Bo mạch / Khối chức năng *</th>
                <th className="p-2.5 w-44">Mã Part No</th>
                <th className="p-2.5 w-40">Số Serial linh kiện</th>
                <th className="p-2.5 w-20 text-center">ĐVT</th>
                <th className="p-2.5 w-16 text-center">SL</th>
                <th className="p-2.5 w-36">Tình trạng</th>
                <th className="p-2.5">Ghi chú / Vị trí slot</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.components.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="p-6 text-center text-slate-500 italic bg-white">
                    Chưa có thành phần linh kiện nào được khai báo.
                  </td>
                </tr>
              ) : (
                data.components.map((comp, idx) => (
                  <tr key={comp.id || idx} className="hover:bg-slate-50 bg-white">
                    <td className="p-2 text-center font-bold text-slate-500">
                      {comp.no || idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: Khối khuếch đại công suất PA Module..."
                        value={comp.name}
                        onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                        className="form-input-standard font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Mã Part No..."
                        value={comp.partNo}
                        onChange={(e) => updateComponent(idx, 'partNo', e.target.value)}
                        className="form-input-standard font-mono text-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Serial SN..."
                        value={comp.serial}
                        onChange={(e) => updateComponent(idx, 'serial', e.target.value)}
                        className="form-input-standard font-mono text-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Cái/Bộ"
                        value={comp.unit}
                        onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                        className="form-input-standard text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        disabled={isReadOnly}
                        min="1"
                        value={comp.qty}
                        onChange={(e) => updateComponent(idx, 'qty', e.target.value)}
                        className="form-input-standard text-center font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        disabled={isReadOnly}
                        value={comp.healthStatus}
                        onChange={(e) => updateComponent(idx, 'healthStatus', e.target.value as ComponentHealth)}
                        className={`w-full border rounded p-1.5 text-xs font-semibold focus:outline-none ${getHealthBadge(comp.healthStatus)}`}
                      >
                        <option value="Tốt">Tốt (Good)</option>
                        <option value="Cần theo dõi">Cần theo dõi (Watch)</option>
                        <option value="Đã sửa chữa">Đã sửa chữa (Repaired)</option>
                        <option value="Hỏng">Hỏng (Faulty)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Slot 01 / Nhiệt độ 40°C..."
                        value={comp.note}
                        onChange={(e) => updateComponent(idx, 'note', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeComponent(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa linh kiện này"
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
