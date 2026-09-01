import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter,
  Check
} from 'lucide-react';
import { EquipmentData, MaintenanceRow, MaintenanceCycle, MaintenanceResult } from '../types';

interface MaintenanceTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ data, onChange }) => {
  const [filterCycle, setFilterCycle] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const addMaintenance = (presetCycle: MaintenanceCycle = 'Hàng quý') => {
    let defaultContent = 'Kiểm tra hoạt động toàn diện, đo thông số nguồn điện, kiểm tra các kết nối cáp tín hiệu và vệ sinh bảo dưỡng định kỳ.';
    let defaultParams = 'Các chỉ tiêu kỹ thuật đo được nằm trong giới hạn dung sai cho phép.';

    if (data.general.category === 'VHF/UHF') {
      defaultContent = 'Đo công suất phát RF, độ sâu điều chế AM, đo tỷ số sóng đứng SWR anten, đo độ nhạy máy thu và sao lưu cấu hình.';
      defaultParams = 'RF Power: 50W; SWR: 1.15; Mod Depth: 85%; Nguồn DC: 28V';
    } else if (data.general.category === 'POWER') {
      defaultContent = 'Đo điện áp và nội trở từng bình acquy, kiểm tra tiếp xúc đầu cực, đo điện áp/dòng sạc và thử nghiệm chuyển mạch nguồn lưới.';
      defaultParams = 'Điện áp DC Bus: 540V; Nhiệt độ phòng acquy: 22°C; Điện áp ra 3 pha: 230V cân bằng';
    }

    const newRow: MaintenanceRow = {
      id: `mt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cycle: presetCycle,
      content: defaultContent,
      measuredParams: defaultParams,
      result: 'Đạt yêu cầu kỹ thuật',
      person: data.org.primaryEngineer || 'Kỹ thuật viên trạm',
      supervisor: data.org.supervisor || 'Trưởng trạm'
    };
    onChange({
      ...data,
      maintenance: [newRow, ...data.maintenance]
    });
  };

  const updateMaintenance = (index: number, field: keyof MaintenanceRow, value: any) => {
    const newMaintenance = [...data.maintenance];
    newMaintenance[index] = { ...newMaintenance[index], [field]: value };
    onChange({ ...data, maintenance: newMaintenance });
  };

  const removeMaintenance = (index: number) => {
    const newMaintenance = data.maintenance.filter((_, i) => i !== index);
    onChange({ ...data, maintenance: newMaintenance });
  };

  const getResultBadge = (result: MaintenanceResult) => {
    switch (result) {
      case 'Đạt yêu cầu kỹ thuật':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Cần hiệu chỉnh/theo dõi':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Không đạt':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      default:
        return 'bg-[#091533] text-slate-300 border-[#1e3c7a]';
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
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#182d5a] pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sky-400" />
              5. Lịch sử Bảo dưỡng định kỳ (Tuần / Tháng / Quý / 6 Tháng / Năm)
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">
              Ghi nhận toàn bộ quá trình bảo dưỡng kỹ thuật, đo kiểm chỉ tiêu theo quy trình tiêu chuẩn
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => addMaintenance('Hàng tháng')}
              className="px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            >
              + Bảo dưỡng Tháng
            </button>
            <button
              onClick={() => addMaintenance('Hàng quý')}
              className="px-2.5 py-1.5 bg-[#0e1d44] hover:bg-[#162d66] text-sky-200 rounded-lg text-xs font-semibold border border-[#1e3c7a] transition-colors cursor-pointer"
            >
              + Bảo dưỡng Quý
            </button>
            <button
              onClick={() => addMaintenance('Hàng năm')}
              className="px-2.5 py-1.5 bg-[#12224d] hover:bg-[#1b3475] text-indigo-200 rounded-lg text-xs font-semibold border border-[#2b448a] transition-colors cursor-pointer"
            >
              + Bảo dưỡng Năm
            </button>
            <button
              onClick={() => addMaintenance('Đột xuất')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm kỳ bảo dưỡng</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-sky-300 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc chu kỳ:
            </span>
            {['ALL', 'Hàng tuần', 'Hàng tháng', 'Hàng quý', '6 tháng', 'Hàng năm', 'Đột xuất'].map(cyc => (
              <button
                key={cyc}
                onClick={() => setFilterCycle(cyc)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterCycle === cyc
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'bg-[#050c1e] text-slate-300 hover:bg-[#0c183a] border border-[#182d5a]'
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
              className="pl-8 pr-3 py-1 text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg w-full sm:w-60 text-white placeholder-slate-400 focus:bg-[#0c1a3b] focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>

        <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
              <tr>
                <th className="p-2.5 w-32">Thời gian thực hiện *</th>
                <th className="p-2.5 w-32">Cấp bảo dưỡng</th>
                <th className="p-2.5">Nội dung công việc bảo dưỡng chi tiết *</th>
                <th className="p-2.5">Thông số kỹ thuật đo kiểm thực tế</th>
                <th className="p-2.5 w-44">Kết luận / Đánh giá</th>
                <th className="p-2.5 w-36">Người thực hiện</th>
                <th className="p-2.5 w-32">Người kiểm tra</th>
                <th className="p-2.5 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182d5a]">
              {filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic bg-[#050c1e]">
                    Chưa có nhật ký bảo dưỡng định kỳ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((mt) => {
                  const actualIdx = data.maintenance.findIndex(item => item.id === mt.id);
                  return (
                    <tr key={mt.id || actualIdx} className="hover:bg-[#0c183a] bg-[#060e24]">
                      <td className="p-2">
                        <input
                          type="date"
                          value={mt.date}
                          onChange={(e) => updateMaintenance(actualIdx, 'date', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={mt.cycle}
                          onChange={(e) => updateMaintenance(actualIdx, 'cycle', e.target.value as MaintenanceCycle)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-semibold text-white"
                        >
                          <option value="Hàng tuần" className="bg-[#091533] text-white">Hàng tuần</option>
                          <option value="Hàng tháng" className="bg-[#091533] text-white">Hàng tháng</option>
                          <option value="Hàng quý" className="bg-[#091533] text-white">Hàng quý</option>
                          <option value="6 tháng" className="bg-[#091533] text-white">6 tháng</option>
                          <option value="Hàng năm" className="bg-[#091533] text-white">Hàng năm</option>
                          <option value="Đột xuất" className="bg-[#091533] text-white">Đột xuất</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          placeholder="Chi tiết công việc..."
                          value={mt.content}
                          onChange={(e) => updateMaintenance(actualIdx, 'content', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          placeholder="Thông số đo đạc RF/nguồn..."
                          value={mt.measuredParams}
                          onChange={(e) => updateMaintenance(actualIdx, 'measuredParams', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-mono text-sky-300"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={mt.result}
                          onChange={(e) => updateMaintenance(actualIdx, 'result', e.target.value as MaintenanceResult)}
                          className={`w-full border rounded p-1.5 text-xs font-semibold focus:outline-none ${getResultBadge(mt.result)}`}
                        >
                          <option value="Đạt yêu cầu kỹ thuật" className="bg-[#091533] text-white">Đạt yêu cầu kỹ thuật</option>
                          <option value="Cần hiệu chỉnh/theo dõi" className="bg-[#091533] text-white">Cần hiệu chỉnh / theo dõi</option>
                          <option value="Không đạt" className="bg-[#091533] text-white">Không đạt</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="KTV thực hiện..."
                          value={mt.person}
                          onChange={(e) => updateMaintenance(actualIdx, 'person', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Người giám sát..."
                          value={mt.supervisor || ''}
                          onChange={(e) => updateMaintenance(actualIdx, 'supervisor', e.target.value)}
                          className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeMaintenance(actualIdx)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Xóa kỳ bảo dưỡng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
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
