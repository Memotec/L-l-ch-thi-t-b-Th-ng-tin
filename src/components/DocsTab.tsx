import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2
} from 'lucide-react';
import { EquipmentData, DocRow } from '../types';

interface DocsTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const DocsTab: React.FC<DocsTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const addDoc = (presetName?: string, presetLang?: string) => {
    if (isReadOnly) return;
    const newDoc: DocRow = {
      id: `doc-${Date.now()}`,
      no: data.docs.length + 1,
      name: presetName || '',
      qty: 1,
      format: 'Bản in giấy',
      lang: presetLang || '',
      location: '',
      note: ''
    };
    onChange({
      ...data,
      docs: [...data.docs, newDoc]
    });
  };

  const updateDoc = (index: number, field: keyof DocRow, value: any) => {
    if (isReadOnly) return;
    const newDocs = [...data.docs];
    newDocs[index] = { ...newDocs[index], [field]: value };
    onChange({ ...data, docs: newDocs });
  };

  const removeDoc = (index: number) => {
    if (isReadOnly) return;
    const newDocs = data.docs.filter((_, i) => i !== index).map((d, idx) => ({
      ...d,
      no: idx + 1
    }));
    onChange({ ...data, docs: newDocs });
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
            <span>Bạn đang ở chế độ xem danh mục tài liệu. Để thêm hoặc sửa tài liệu lưu trữ, vui lòng đăng nhập Quản trị viên.</span>
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
              <BookOpen className="w-5 h-5 text-blue-600" />
              4. Danh mục Tài liệu kỹ thuật kèm theo thiết bị
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ tài liệu hướng dẫn khai thác, bảo dưỡng, sơ đồ mạch nguyên lý và biên bản bàn giao
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => addDoc()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tài liệu</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick add templates */}
        {!isReadOnly && (
          <div className="mb-4 flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Mẫu tài liệu phổ biến:</span>
            <button
              onClick={() => addDoc('User Operation Manual (Hướng dẫn vận hành)', 'English / Tiếng Việt')}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              + Hướng dẫn vận hành
            </button>
            <button
              onClick={() => addDoc('Technical Maintenance Manual (Sổ tay bảo dưỡng kỹ thuật)', 'English')}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              + Sổ tay bảo dưỡng
            </button>
            <button
              onClick={() => addDoc('Schematic Diagram & Rack Wiring (Sơ đồ nguyên lý & Đấu nối)', 'Bản vẽ CAD/PDF')}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              + Sơ đồ đấu nối Rack
            </button>
            <button
              onClick={() => addDoc('Factory Acceptance Test (FAT Report) & CO/CQ', 'English')}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-[11px] transition-colors cursor-pointer"
            >
              + Biên bản FAT & CO/CQ
            </button>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-2.5 w-12 text-center">TT</th>
                <th className="p-2.5">Tên tài liệu kỹ thuật (Manual, Scheme, Sơ đồ... ) *</th>
                <th className="p-2.5 w-20 text-center">Số bản</th>
                <th className="p-2.5 w-40">Định dạng</th>
                <th className="p-2.5 w-36">Ngôn ngữ / Ver</th>
                <th className="p-2.5">Vị trí lưu trữ tại trạm</th>
                <th className="p-2.5">Ghi chú</th>
                {!isReadOnly && <th className="p-2.5 w-12 text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.docs.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="p-6 text-center text-slate-500 italic bg-white">
                    Chưa có tài liệu nào được khai báo.
                  </td>
                </tr>
              ) : (
                data.docs.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-50 bg-white">
                    <td className="p-2 text-center font-bold text-slate-500">
                      {doc.no || idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Tên tài liệu..."
                        value={doc.name}
                        onChange={(e) => updateDoc(idx, 'name', e.target.value)}
                        className="form-input-standard font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        disabled={isReadOnly}
                        min="1"
                        value={doc.qty}
                        onChange={(e) => updateDoc(idx, 'qty', e.target.value)}
                        className="form-input-standard text-center font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        disabled={isReadOnly}
                        value={doc.format}
                        onChange={(e) => updateDoc(idx, 'format', e.target.value)}
                        className="form-input-standard"
                      >
                        <option value="Bản in giấy">Bản in giấy</option>
                        <option value="Bản điện tử (PDF/CAD)">Bản điện tử (PDF/CAD)</option>
                        <option value="Cả hai">Cả hai</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="English / v4.2"
                        value={doc.lang}
                        onChange={(e) => updateDoc(idx, 'lang', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Tủ hồ sơ 01 / Ổ cứng trạm..."
                        value={doc.location}
                        onChange={(e) => updateDoc(idx, 'location', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Ghi chú thêm..."
                        value={doc.note}
                        onChange={(e) => updateDoc(idx, 'note', e.target.value)}
                        className="form-input-standard"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeDoc(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa tài liệu này"
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
