import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2,
  Search,
  X,
  Copy,
  Check,
  Filter,
  SlidersHorizontal
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
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [isCompact, setIsCompact] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

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

  const updateComponent = (originalIndex: number, field: keyof ComponentRow, value: any) => {
    if (isReadOnly) return;
    const newComps = [...data.components];
    newComps[originalIndex] = { ...newComps[originalIndex], [field]: value };
    onChange({ ...data, components: newComps });
  };

  const removeComponent = (originalIndex: number) => {
    if (isReadOnly) return;
    const newComps = data.components.filter((_, i) => i !== originalIndex).map((c, idx) => ({
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

  // Filter components by search and health
  const filteredComponents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.components.map((comp, originalIndex) => ({ comp, originalIndex })).filter(({ comp }) => {
      const matchSearch = !q || 
        (comp.name && comp.name.toLowerCase().includes(q)) ||
        (comp.partNo && comp.partNo.toLowerCase().includes(q)) ||
        (comp.serial && comp.serial.toLowerCase().includes(q)) ||
        (comp.note && comp.note.toLowerCase().includes(q));

      const matchHealth = healthFilter === 'ALL' || comp.healthStatus === healthFilter;
      return matchSearch && matchHealth;
    });
  }, [data.components, searchTerm, healthFilter]);

  // Copy components table to clipboard (Excel TSV format)
  const handleCopyTable = () => {
    if (data.components.length === 0) return;
    const headers = ['TT', 'Tên thiết bị/Linh kiện', 'Part No', 'Số Serial', 'ĐVT', 'SL', 'Tình trạng', 'Ghi chú'];
    const rows = data.components.map((c, i) => [
      i + 1,
      c.name || '',
      c.partNo || '',
      c.serial || '',
      c.unit || 'Bộ',
      c.qty || 1,
      c.healthStatus || 'Tốt',
      c.note || ''
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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

            <button
              onClick={handleCopyTable}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                copiedAll ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Sao chép bảng sang định dạng Excel / Báo cáo"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAll ? 'Đã sao chép!' : 'Xuất Excel / Copy'}</span>
            </button>

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

        {/* Quick Filter & Search Bar for Components */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Lọc linh kiện (Tên, Part No, Serial, Ghi chú)..."
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
            <span className="text-slate-500 text-[11px] font-medium mr-1">Tình trạng:</span>
            {['ALL', 'Tốt', 'Cần theo dõi', 'Đã sửa chữa', 'Hỏng'].map((st) => (
              <button
                key={st}
                onClick={() => setHealthFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  healthFilter === st
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

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className={`w-full text-left border-collapse min-w-[850px] ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
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
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 8 : 9} className="p-6 text-center text-slate-500 italic bg-white">
                    {data.components.length === 0 
                      ? 'Chưa có thành phần linh kiện nào được khai báo.'
                      : `Không tìm thấy linh kiện nào khớp với bộ lọc "${searchTerm || healthFilter}".`}
                  </td>
                </tr>
              ) : (
                filteredComponents.map(({ comp, originalIndex }, displayIdx) => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors bg-white">
                    <td className="p-2 text-center font-mono font-medium text-slate-500">
                      {comp.no || displayIdx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: Khối kích phát RF Power Module"
                        value={comp.name}
                        onChange={(e) => updateComponent(originalIndex, 'name', e.target.value)}
                        className={`w-full font-medium text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: PA-500W-01"
                        value={comp.partNo}
                        onChange={(e) => updateComponent(originalIndex, 'partNo', e.target.value)}
                        className={`w-full font-mono text-slate-800 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: SN-883921"
                        value={comp.serial}
                        onChange={(e) => updateComponent(originalIndex, 'serial', e.target.value)}
                        className={`w-full font-mono font-semibold text-slate-900 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={comp.unit}
                        onChange={(e) => updateComponent(originalIndex, 'unit', e.target.value)}
                        className={`w-16 text-center border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={1}
                        disabled={isReadOnly}
                        value={comp.qty}
                        onChange={(e) => updateComponent(originalIndex, 'qty', parseInt(e.target.value) || 1)}
                        className={`w-12 text-center font-semibold border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-1 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        disabled={isReadOnly}
                        value={comp.healthStatus}
                        onChange={(e) => updateComponent(originalIndex, 'healthStatus', e.target.value as ComponentHealth)}
                        className={`w-full rounded border px-2 font-medium cursor-pointer transition-colors ${getHealthBadge(comp.healthStatus)} ${isCompact ? 'py-0.5' : 'py-1'} disabled:opacity-90`}
                      >
                        <option value="Tốt">✓ Tốt</option>
                        <option value="Cần theo dõi">⚠ Cần theo dõi</option>
                        <option value="Đã sửa chữa">🛠 Đã sửa chữa</option>
                        <option value="Hỏng">✕ Hỏng</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="VD: Khe cắm Slot 2, Tủ Rack chính..."
                        value={comp.note}
                        onChange={(e) => updateComponent(originalIndex, 'note', e.target.value)}
                        className={`w-full text-slate-600 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 ${isCompact ? 'py-0.5' : 'py-1'} transition-colors disabled:bg-transparent disabled:border-transparent`}
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeComponent(originalIndex)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Xóa linh kiện này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredComponents.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <b>{filteredComponents.length}</b> / <b>{data.components.length}</b> thành phần linh kiện</span>
            <span className="italic text-[11px]">Gợi ý: Có thể tra cứu nhanh bất kỳ mã Serial hoặc Part No nào tại thanh tìm kiếm trên cùng</span>
          </div>
        )}
      </div>
    </div>
  );
};
