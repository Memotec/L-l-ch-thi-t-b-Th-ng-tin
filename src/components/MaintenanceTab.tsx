import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Search, 
  Filter
} from 'lucide-react';
import { EquipmentData, MaintenanceRow, MaintenanceCycle, MaintenanceResult } from '../types';

interface MaintenanceTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const [filterCycle, setFilterCycle] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const addMaintenance = (presetCycle: MaintenanceCycle = 'Hàng quý') => {
    if (isReadOnly) return;
    const newRow: MaintenanceRow = {
      id: `mt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cycle: presetCycle,
      content: '',
      measuredParams: '',
      result: 'Đạt yêu cầu kỹ thuật',
      person: data.org.primaryEngineer || '',
      supervisor: data.org.supervisor || ''
    };
    onChange({
      ...data,
      maintenance: [newRow, ...data.maintenance]
    });
  };

  const updateMaintenance = (index: number, field: keyof MaintenanceRow, value: any) => {
    if (isReadOnly) return;
    const newMaintenance = [...data.maintenance];
    newMaintenance[index] = { ...newMaintenance[index], [field]: value };
    onChange({ ...data, maintenance: newMaintenance });
  };

  const removeMaintenance = (index: number) => {
    if (isReadOnly) return;
    const newMaintenance = data.maintenance.filter((_, i) => i !== index);
    onChange({ ...data, maintenance: newMaintenance });
  };

  const getResultBadge = (result?: MaintenanceResult | string) => {
    switch (result) {
      case 'Đạt yêu cầu kỹ thuật':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cần hiệu chỉnh/theo dõi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Không đạt':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredMaintenance = data.maintenance.filter(item => {
    const matchesCycle = filterCycle === 'ALL' || item.cycle === filterCycle;
    const matchesSearch = searchTerm === '' || 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.measuredParams.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);
    return matchesCycle && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Viewer */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem lịch sử bảo dưỡng. Để ghi nhật ký bảo dưỡng mới, vui lòng đăng nhập Quản trị viên.</span>
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
              <Wrench className="w-5 h-5 text-blue-600" />
              5. Lịch sử Bảo dưỡng định kỳ (Tuần / Tháng / Quý / 6 Tháng / Năm)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận toàn bộ quá trình bảo dưỡng kỹ thuật, đo kiểm chỉ tiêu theo quy trình tiêu chuẩn
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => addMaintenance('Hàng tháng')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                + Bảo dưỡng Tháng
              </button>
              <button
                onClick={() => addMaintenance('Hàng quý')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                + Bảo dưỡng Quý
              </button>
              <button
                onClick={() => addMaintenance('Hàng năm')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                + Bảo dưỡng Năm
              </button>
              <button
                onClick={() => addMaintenance('Đột xuất')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm kỳ bảo dưỡng</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-700 font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc chu kỳ:
            </span>
            {['ALL', 'Hàng tuần', 'Hàng tháng', 'Hàng quý', '6 tháng', 'Hàng năm', 'Đột xuất'].map(cyc => (
              <button
                key={cyc}
                onClick={() => setFilterCycle(cyc)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterCycle === cyc
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cyc === 'ALL' ? 'Tất cả' : cyc}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung, người thực hiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5 w-32">Thời gian thực hiện *</th>
                <th className="p-2.5 w-32">Cấp bảo dưỡng</th>
                <th className="p-2.5">Nội dung công việc bảo dưỡng chi tiết *</th>
                <th className="p-2.5">Thông số kỹ thuật đo kiểm thực tế</th>
                <th className="p-2.5 w-44">Kết luận / Đánh giá</th>
                <th className="p-2.5 w-36">Người thực hiện</th>
                <th className="p-2.5 w-32">Người kiểm tra</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="p-6 text-center text-slate-500 italic bg-white">
                    Chưa có nhật ký bảo dưỡng định kỳ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((mt) => {
                  const actualIdx = data.maintenance.findIndex(item => item.id === mt.id);
                  return (
                    <tr key={mt.id || actualIdx} className="hover:bg-slate-50 bg-white">
                      <td className="p-2">
                        <input
                          type="date"
                          disabled={isReadOnly}
                          value={mt.date}
                          onChange={(e) => updateMaintenance(actualIdx, 'date', e.target.value)}
                          className="form-input-standard"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          disabled={isReadOnly}
                          value={mt.cycle}
                          onChange={(e) => updateMaintenance(actualIdx, 'cycle', e.target.value as MaintenanceCycle)}
                          className="form-input-standard font-semibold"
                        >
                          <option value="Hàng tuần">Hàng tuần</option>
                          <option value="Hàng tháng">Hàng tháng</option>
                          <option value="Hàng quý">Hàng quý</option>
                          <option value="6 tháng">6 tháng</option>
                          <option value="Hàng năm">Hàng năm</option>
                          <option value="Đột xuất">Đột xuất</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          disabled={isReadOnly}
                          placeholder="Chi tiết công việc..."
                          value={mt.content}
                          onChange={(e) => updateMaintenance(actualIdx, 'content', e.target.value)}
                          className="form-input-standard font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          disabled={isReadOnly}
                          placeholder="Thông số đo đạc RF/nguồn..."
                          value={mt.measuredParams}
                          onChange={(e) => updateMaintenance(actualIdx, 'measuredParams', e.target.value)}
                          className="form-input-standard font-mono text-blue-600"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          disabled={isReadOnly}
                          value={mt.result}
                          onChange={(e) => updateMaintenance(actualIdx, 'result', e.target.value as MaintenanceResult)}
                          className={`w-full border rounded p-1.5 text-xs font-semibold focus:outline-none ${getResultBadge(mt.result)}`}
                        >
                          <option value="Đạt yêu cầu kỹ thuật">Đạt yêu cầu kỹ thuật</option>
                          <option value="Cần hiệu chỉnh/theo dõi">Cần hiệu chỉnh / theo dõi</option>
                          <option value="Không đạt">Không đạt</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="KTV thực hiện..."
                          value={mt.person}
                          onChange={(e) => updateMaintenance(actualIdx, 'person', e.target.value)}
                          className="form-input-standard"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="Người giám sát..."
                          value={mt.supervisor || ''}
                          onChange={(e) => updateMaintenance(actualIdx, 'supervisor', e.target.value)}
                          className="form-input-standard"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeMaintenance(actualIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Xóa kỳ bảo dưỡng này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
