import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Search, 
  X,
  Copy,
  Check,
  Filter,
  Calendar,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { EquipmentData, MaintenanceRow, MaintenanceCycle, MaintenanceResult } from '../types';
import { PerformerSelect } from './PerformerSelect';
import { notificationService } from '../utils/notificationService';

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
  const [filterResult, setFilterResult] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

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

    notificationService.notify({
      title: 'Đã thêm nhật ký bảo dưỡng',
      message: `Đã thêm một phiên bảo dưỡng (${presetCycle}) cho thiết bị "${data.general.name}".`,
      type: 'maintenance',
      targetEquipmentId: data.id,
      targetEquipmentName: data.general.name,
      targetTab: 'maintenance',
      actor: 'Cán bộ kỹ thuật'
    });
  };

  const updateMaintenance = (originalIndex: number, field: keyof MaintenanceRow, value: any) => {
    if (isReadOnly) return;
    const newMaintenance = [...data.maintenance];
    newMaintenance[originalIndex] = { ...newMaintenance[originalIndex], [field]: value };
    onChange({ ...data, maintenance: newMaintenance });
  };

  const removeMaintenance = (originalIndex: number) => {
    if (isReadOnly) return;
    const newMaintenance = data.maintenance.filter((_, i) => i !== originalIndex);
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

  const filteredMaintenance = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.maintenance.map((mt, originalIndex) => ({ mt, originalIndex })).filter(({ mt }) => {
      const matchesCycle = filterCycle === 'ALL' || mt.cycle === filterCycle;
      const matchesResult = filterResult === 'ALL' || mt.result === filterResult;
      const matchesSearch = !q || 
        (mt.content && mt.content.toLowerCase().includes(q)) ||
        (mt.person && mt.person.toLowerCase().includes(q)) ||
        (mt.supervisor && mt.supervisor.toLowerCase().includes(q)) ||
        (mt.measuredParams && mt.measuredParams.toLowerCase().includes(q)) ||
        (mt.date && mt.date.includes(q));
      return matchesCycle && matchesResult && matchesSearch;
    });
  }, [data.maintenance, filterCycle, filterResult, searchTerm]);

  // Copy table to clipboard
  const handleCopyTable = () => {
    if (data.maintenance.length === 0) return;
    const headers = ['Ngày TH', 'Chu kỳ', 'Nội dung bảo dưỡng', 'Thông số đo đạc', 'Kết luận', 'Người thực hiện', 'Người kiểm tra'];
    const rows = data.maintenance.map(m => [
      m.date || '',
      m.cycle || '',
      m.content || '',
      m.measuredParams || '',
      m.result || 'Đạt yêu cầu',
      m.person || '',
      m.supervisor || ''
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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
            <span>Bạn đang ở chế độ xem lịch sử bảo dưỡng. Để thêm phiên bảo dưỡng mới, vui lòng đăng nhập Quản trị viên.</span>
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
              5. Nhật ký Bảo dưỡng & Đo đạc thông số kỹ thuật định kỳ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi lịch bảo dưỡng tuần, tháng, quý, 6 tháng và hàng năm theo quy trình CNS
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTable}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                copiedAll ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Sao chép nhật ký bảo dưỡng sang Excel"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAll ? 'Đã sao chép!' : 'Xuất Excel / Copy'}</span>
            </button>

            {!isReadOnly && (
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => addMaintenance('Hàng quý')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm bảo dưỡng</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lọc bảo dưỡng (Nội dung, Thông số, Kỹ thuật viên)..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-500 text-[11px] font-medium mr-1">Chu kỳ:</span>
            {['ALL', 'Hàng tuần', 'Hàng tháng', 'Hàng quý', '6 tháng', 'Hàng năm', 'Đột xuất'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCycle(c)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterCycle === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {c === 'ALL' ? 'Tất cả' : c}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                isCompact ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Chuyển chế độ hiển thị thu gọn"
            >
              {isCompact ? 'Thu gọn' : 'Chuẩn'}
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-xs bg-white">
          <table className={`w-full text-left border-collapse min-w-[1100px] ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-2.5 w-36 whitespace-nowrap">Ngày TH</th>
                <th className="p-2.5 w-36 whitespace-nowrap">Chu kỳ</th>
                <th className="p-2.5 min-w-[220px]">Nội dung công việc bảo dưỡng</th>
                <th className="p-2.5 min-w-[200px]">Thông số kỹ thuật đo đạc</th>
                <th className="p-2.5 w-44 whitespace-nowrap">Kết luận</th>
                <th className="p-2.5 min-w-[200px]">Người thực hiện</th>
                <th className="p-2.5 w-36 whitespace-nowrap">Người kiểm tra</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center whitespace-nowrap">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="p-6 text-center text-slate-500 italic bg-white">
                    {data.maintenance.length === 0 
                      ? 'Chưa có nhật ký bảo dưỡng định kỳ nào được ghi nhận.'
                      : `Không tìm thấy nhật ký bảo dưỡng nào khớp với bộ lọc "${searchTerm || filterCycle}".`}
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map(({ mt, originalIndex }) => (
                  <tr key={`maint-${mt.id || originalIndex}-${originalIndex}`} className="hover:bg-blue-50/30 bg-white transition-colors">
                    <td className="p-2 align-top">
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={mt.date}
                        onChange={(e) => updateMaintenance(originalIndex, 'date', e.target.value)}
                        className={`form-input-standard font-mono ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <select
                        disabled={isReadOnly}
                        value={mt.cycle}
                        onChange={(e) => updateMaintenance(originalIndex, 'cycle', e.target.value as MaintenanceCycle)}
                        className={`form-input-standard font-medium bg-white ${isCompact ? 'py-0.5' : 'py-1'}`}
                      >
                        <option value="Hàng tuần">Hàng tuần</option>
                        <option value="Hàng tháng">Hàng tháng</option>
                        <option value="Hàng quý">Hàng quý</option>
                        <option value="6 tháng">6 tháng</option>
                        <option value="Hàng năm">Hàng năm</option>
                        <option value="Đột xuất">Đột xuất</option>
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        rows={isCompact ? 1 : 2}
                        disabled={isReadOnly}
                        placeholder="Chi tiết công việc..."
                        value={mt.content}
                        onChange={(e) => updateMaintenance(originalIndex, 'content', e.target.value)}
                        className={`form-input-standard font-medium resize-y ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea
                        rows={isCompact ? 1 : 2}
                        disabled={isReadOnly}
                        placeholder="Thông số đo đạc RF/nguồn..."
                        value={mt.measuredParams}
                        onChange={(e) => updateMaintenance(originalIndex, 'measuredParams', e.target.value)}
                        className={`form-input-standard font-mono text-blue-700 resize-y ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <select
                        disabled={isReadOnly}
                        value={mt.result}
                        onChange={(e) => updateMaintenance(originalIndex, 'result', e.target.value as MaintenanceResult)}
                        className={`w-full border rounded-md p-1.5 font-semibold focus:outline-none ${getResultBadge(mt.result)} ${isCompact ? 'py-0.5' : 'py-1'}`}
                      >
                        <option value="Đạt yêu cầu kỹ thuật">Đạt yêu cầu kỹ thuật</option>
                        <option value="Cần hiệu chỉnh/theo dõi">Cần hiệu chỉnh / theo dõi</option>
                        <option value="Không đạt">Không đạt</option>
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <PerformerSelect
                        value={mt.person}
                        onChange={(val) => updateMaintenance(originalIndex, 'person', val)}
                        disabled={isReadOnly}
                        placeholder="KTV thực hiện..."
                      />
                    </td>
                    <td className="p-2 align-top">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Người kiểm tra..."
                        value={mt.supervisor || ''}
                        onChange={(e) => updateMaintenance(originalIndex, 'supervisor', e.target.value)}
                        className={`form-input-standard ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 align-top text-center">
                        <button
                          onClick={() => removeMaintenance(originalIndex)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Xóa kỳ bảo dưỡng này"
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

        {filteredMaintenance.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <b>{filteredMaintenance.length}</b> / <b>{data.maintenance.length}</b> phiên bảo dưỡng</span>
            <span className="italic text-[11px]">Được đồng bộ và lưu trữ trên hệ thống điện tử CNS</span>
          </div>
        )}
      </div>
    </div>
  );
};
