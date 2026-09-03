import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Search,
  X,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import { EquipmentData, RepairRow, RepairType, RepairStatus } from '../types';
import { PerformerSelect } from './PerformerSelect';
import { notificationService } from '../utils/notificationService';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

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

    notificationService.notify({
      title: 'Ghi nhận sự cố & sửa chữa',
      message: `Đã thêm một sự vụ kỹ thuật (${presetType}) cho thiết bị "${data.general.name}".`,
      type: 'repair',
      targetEquipmentId: data.id,
      targetEquipmentName: data.general.name,
      targetTab: 'repair',
      actor: 'Cán bộ kỹ thuật'
    });
  };

  const updateRepair = (originalIndex: number, field: keyof RepairRow, value: any) => {
    if (isReadOnly) return;
    const newRepairs = [...data.repair];
    newRepairs[originalIndex] = { ...newRepairs[originalIndex], [field]: value };
    onChange({ ...data, repair: newRepairs });
  };

  const removeRepair = (originalIndex: number) => {
    if (isReadOnly) return;
    const newRepairs = data.repair.filter((_, i) => i !== originalIndex);
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

  const filteredRepairs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.repair.map((rp, originalIndex) => ({ rp, originalIndex })).filter(({ rp }) => {
      const matchStatus = statusFilter === 'ALL' || rp.status === statusFilter;
      const matchType = typeFilter === 'ALL' || rp.type === typeFilter;
      const matchSearch = !q ||
        (rp.incidentDescription && rp.incidentDescription.toLowerCase().includes(q)) ||
        (rp.rootCause && rp.rootCause.toLowerCase().includes(q)) ||
        (rp.actionTaken && rp.actionTaken.toLowerCase().includes(q)) ||
        (rp.replacedParts && rp.replacedParts.toLowerCase().includes(q)) ||
        (rp.person && rp.person.toLowerCase().includes(q)) ||
        (rp.date && rp.date.includes(q));
      return matchStatus && matchType && matchSearch;
    });
  }, [data.repair, statusFilter, typeFilter, searchTerm]);

  // Copy table to clipboard
  const handleCopyTable = () => {
    if (data.repair.length === 0) return;
    const headers = ['Thời gian phát sinh', 'Thời gian hoàn thành', 'Phân loại', 'Mô tả hiện tượng', 'Nguyên nhân', 'Biện pháp xử lý & Vật tư', 'Người thực hiện', 'Trạng thái'];
    const rows = data.repair.map(r => [
      r.date || '',
      r.resolvedDate || '',
      r.type || '',
      r.incidentDescription || '',
      r.rootCause || '',
      `${r.actionTaken || ''} | Linh kiện: ${r.replacedParts || ''}`,
      r.person || '',
      r.status || 'Đã xử lý dứt điểm'
    ]);
    const tsv = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
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
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              6. Nhật ký Sửa chữa, Khắc phục sự cố & Biến động kỹ thuật
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận chi tiết hiện tượng bất thường, nguyên nhân, biện pháp khắc phục và thay thế vật tư
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTable}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                copiedAll ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Sao chép nhật ký sự cố sang Excel"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAll ? 'Đã sao chép!' : 'Xuất Excel / Copy'}</span>
            </button>

            {!isReadOnly && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => addRepair('Sửa chữa khắc phục sự cố')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Ghi nhận sự cố</span>
                </button>
                <button
                  onClick={() => addRepair('Thay thế linh kiện')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>Thay linh kiện</span>
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
                placeholder="Lọc sự cố (Hiện tượng, Nguyên nhân, Xử lý, Vật tư, KTV)..."
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
            <span className="text-slate-500 text-[11px] font-medium mr-1">Trạng thái:</span>
            {['ALL', 'Đã xử lý dứt điểm', 'Đang theo dõi', 'Chờ vật tư'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Tất cả' : st}
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
          <table className={`w-full text-left border-collapse min-w-[1200px] ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            <thead className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-2.5 w-36 whitespace-nowrap">Thời gian phát sinh</th>
                <th className="p-2.5 w-36 whitespace-nowrap">Thời gian hoàn thành</th>
                <th className="p-2.5 w-40 whitespace-nowrap">Phân loại</th>
                <th className="p-2.5 min-w-[240px]">Mô tả hiện tượng & Nguyên nhân</th>
                <th className="p-2.5 min-w-[240px]">Biện pháp xử lý & Vật tư thay thế</th>
                <th className="p-2.5 min-w-[200px]">Người thực hiện</th>
                <th className="p-2.5 w-40 whitespace-nowrap">Trạng thái</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center whitespace-nowrap">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="p-6 text-center text-slate-500 italic bg-white">
                    {data.repair.length === 0
                      ? 'Thiết bị hoạt động ổn định, chưa có ghi nhận sự cố hay hỏng hóc kỹ thuật nào.'
                      : `Không tìm thấy sự cố nào khớp với bộ lọc "${searchTerm || statusFilter}".`}
                  </td>
                </tr>
              ) : (
                filteredRepairs.map(({ rp, originalIndex }) => (
                  <tr key={`repair-${rp.id || originalIndex}-${originalIndex}`} className="hover:bg-blue-50/30 bg-white transition-colors">
                    <td className="p-2 align-top">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="YYYY-MM-DD HH:mm"
                        value={rp.date}
                        onChange={(e) => updateRepair(originalIndex, 'date', e.target.value)}
                        className={`form-input-standard font-mono ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="YYYY-MM-DD HH:mm"
                        value={rp.resolvedDate || ''}
                        onChange={(e) => updateRepair(originalIndex, 'resolvedDate', e.target.value)}
                        className={`form-input-standard font-mono ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <select
                        disabled={isReadOnly}
                        value={rp.type}
                        onChange={(e) => updateRepair(originalIndex, 'type', e.target.value as RepairType)}
                        className={`form-input-standard font-medium bg-white ${isCompact ? 'py-0.5' : 'py-1'}`}
                      >
                        <option value="Sửa chữa khắc phục sự cố">Sửa chữa sự cố</option>
                        <option value="Sửa chữa đột xuất">Sửa chữa đột xuất</option>
                        <option value="Thay thế linh kiện">Thay thế linh kiện</option>
                        <option value="Nâng cấp phần mềm/firmware">Nâng cấp Firmware</option>
                        <option value="Hiệu chuẩn lại tham số">Hiệu chuẩn tham số</option>
                      </select>
                    </td>
                    <td className="p-2 align-top space-y-1">
                      <textarea
                        rows={isCompact ? 1 : 2}
                        disabled={isReadOnly}
                        placeholder="Hiện tượng bất thường / cảnh báo..."
                        value={rp.incidentDescription}
                        onChange={(e) => updateRepair(originalIndex, 'incidentDescription', e.target.value)}
                        className={`form-input-standard font-medium text-slate-900 resize-y ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Nguyên nhân xác định..."
                        value={rp.rootCause}
                        onChange={(e) => updateRepair(originalIndex, 'rootCause', e.target.value)}
                        className={`form-input-standard text-rose-600 font-mono text-[11px] ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top space-y-1">
                      <textarea
                        rows={isCompact ? 1 : 2}
                        disabled={isReadOnly}
                        placeholder="Nội dung thao tác khắc phục..."
                        value={rp.actionTaken}
                        onChange={(e) => updateRepair(originalIndex, 'actionTaken', e.target.value)}
                        className={`form-input-standard text-slate-800 resize-y ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Linh kiện/vật tư thay thế (nếu có)..."
                        value={rp.replacedParts}
                        onChange={(e) => updateRepair(originalIndex, 'replacedParts', e.target.value)}
                        className={`form-input-standard text-blue-600 font-mono text-[11px] ${isCompact ? 'py-0.5' : 'py-1'}`}
                      />
                    </td>
                    <td className="p-2 align-top">
                      <PerformerSelect
                        value={rp.person}
                        onChange={(val) => updateRepair(originalIndex, 'person', val)}
                        disabled={isReadOnly}
                        placeholder="KTV xử lý..."
                      />
                    </td>
                    <td className="p-2 align-top">
                      <select
                        disabled={isReadOnly}
                        value={rp.status}
                        onChange={(e) => updateRepair(originalIndex, 'status', e.target.value as RepairStatus)}
                        className={`w-full border rounded-md p-1.5 font-semibold focus:outline-none ${getStatusBadge(rp.status)} ${isCompact ? 'py-0.5' : 'py-1'}`}
                      >
                        <option value="Đã xử lý dứt điểm">✓ Đã xử lý xong</option>
                        <option value="Đang theo dõi">⚠ Đang theo dõi</option>
                        <option value="Chờ vật tư">✕ Chờ vật tư</option>
                      </select>
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 align-top text-center">
                        <button
                          onClick={() => removeRepair(originalIndex)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Xóa sự vụ này"
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

        {filteredRepairs.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <b>{filteredRepairs.length}</b> / <b>{data.repair.length}</b> vụ việc kỹ thuật</span>
            <span className="italic text-[11px]">Hồ sơ biến động được lưu trữ đối soát đầy đủ</span>
          </div>
        )}
      </div>
    </div>
  );
};
