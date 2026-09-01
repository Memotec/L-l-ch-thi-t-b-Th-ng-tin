import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  XCircle,
  Tag
} from 'lucide-react';
import { EquipmentData, ComponentRow, ComponentHealth } from '../types';

interface ComponentsTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const ComponentsTab: React.FC<ComponentsTabProps> = ({ data, onChange }) => {
  const addComponent = () => {
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
    const newComps = [...data.components];
    newComps[index] = { ...newComps[index], [field]: value };
    onChange({ ...data, components: newComps });
  };

  const removeComponent = (index: number) => {
    const newComps = data.components.filter((_, i) => i !== index).map((c, idx) => ({
      ...c,
      no: idx + 1
    }));
    onChange({ ...data, components: newComps });
  };

  const getHealthBadge = (status: ComponentHealth) => {
    switch (status) {
      case 'Tốt':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Cần theo dõi':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Đã sửa chữa':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/40';
      case 'Hỏng':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      default:
        return 'bg-[#091533] text-slate-300 border-[#1e3c7a]';
    }
  };

  const goodCount = data.components.filter(c => c.healthStatus === 'Tốt').length;
  const watchCount = data.components.filter(c => c.healthStatus === 'Cần theo dõi').length;
  const badCount = data.components.filter(c => c.healthStatus === 'Hỏng').length;

  return (
    <div className="space-y-6">
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#182d5a] pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              3. Thành phần thiết bị, Khối chức năng & Linh kiện chính
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">
              Quản lý chi tiết các module tháo rời, bo mạch xử lý, khối nguồn và linh kiện dự phòng
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs bg-[#050c1e] border border-[#1e3c7a] px-3 py-1.5 rounded-lg text-slate-200">
              <span>Tổng: <b className="text-white">{data.components.length}</b></span>
              <span className="text-blue-500/50">•</span>
              <span className="text-emerald-400 font-semibold">Tốt: {goodCount}</span>
              {watchCount > 0 && <span className="text-amber-400 font-semibold">• Theo dõi: {watchCount}</span>}
              {badCount > 0 && <span className="text-rose-400 font-semibold">• Hỏng: {badCount}</span>}
            </div>

            <button
              onClick={addComponent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bộ phận / Linh kiện</span>
            </button>
          </div>
        </div>

        <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
              <tr>
                <th className="p-2.5 w-12 text-center">TT</th>
                <th className="p-2.5">Tên thiết bị / Bo mạch / Khối chức năng *</th>
                <th className="p-2.5 w-44">Mã Part No</th>
                <th className="p-2.5 w-40">Số Serial linh kiện</th>
                <th className="p-2.5 w-20">ĐVT</th>
                <th className="p-2.5 w-16">SL</th>
                <th className="p-2.5 w-36">Tình trạng</th>
                <th className="p-2.5">Ghi chú / Vị trí slot</th>
                <th className="p-2.5 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182d5a]">
              {data.components.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 italic bg-[#050c1e]">
                    Chưa có thành phần linh kiện nào được khai báo. Nhấn "Thêm bộ phận / Linh kiện" để bắt đầu.
                  </td>
                </tr>
              ) : (
                data.components.map((comp, idx) => (
                  <tr key={comp.id || idx} className="hover:bg-[#0c183a] bg-[#060e24]">
                    <td className="p-2 text-center font-bold text-sky-300">
                      {comp.no || idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="VD: Khối khuếch đại công suất PA Module..."
                        value={comp.name}
                        onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-semibold text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Mã Part No..."
                        value={comp.partNo}
                        onChange={(e) => updateComponent(idx, 'partNo', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono text-sky-300"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Serial SN..."
                        value={comp.serial}
                        onChange={(e) => updateComponent(idx, 'serial', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono text-sky-300"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Cái/Bộ"
                        value={comp.unit}
                        onChange={(e) => updateComponent(idx, 'unit', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={comp.qty}
                        onChange={(e) => updateComponent(idx, 'qty', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white text-center font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={comp.healthStatus}
                        onChange={(e) => updateComponent(idx, 'healthStatus', e.target.value as ComponentHealth)}
                        className={`w-full border rounded p-1.5 text-xs font-semibold focus:outline-none ${getHealthBadge(comp.healthStatus)}`}
                      >
                        <option value="Tốt" className="bg-[#091533] text-white">Tốt (Good)</option>
                        <option value="Cần theo dõi" className="bg-[#091533] text-white">Cần theo dõi (Watch)</option>
                        <option value="Đã sửa chữa" className="bg-[#091533] text-white">Đã sửa chữa (Repaired)</option>
                        <option value="Hỏng" className="bg-[#091533] text-white">Hỏng (Faulty)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Slot 01 / Nhiệt độ 40°C..."
                        value={comp.note}
                        onChange={(e) => updateComponent(idx, 'note', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeComponent(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Xóa linh kiện này"
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
