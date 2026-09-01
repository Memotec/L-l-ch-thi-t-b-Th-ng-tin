import React from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText, 
  HardDrive, 
  FolderArchive,
  Download
} from 'lucide-react';
import { EquipmentData, DocRow } from '../types';

interface DocsTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const DocsTab: React.FC<DocsTabProps> = ({ data, onChange }) => {
  const addDoc = (presetName?: string, presetLang?: string) => {
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
    const newDocs = [...data.docs];
    newDocs[index] = { ...newDocs[index], [field]: value };
    onChange({ ...data, docs: newDocs });
  };

  const removeDoc = (index: number) => {
    const newDocs = data.docs.filter((_, i) => i !== index).map((d, idx) => ({
      ...d,
      no: idx + 1
    }));
    onChange({ ...data, docs: newDocs });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#182d5a] pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              4. Danh mục Tài liệu kỹ thuật kèm theo thiết bị
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">
              Hồ sơ tài liệu hướng dẫn khai thác, bảo dưỡng, sơ đồ mạch nguyên lý và biên bản bàn giao
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => addDoc()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tài liệu</span>
            </button>
          </div>
        </div>

        {/* Quick add templates */}
        <div className="mb-4 flex items-center gap-2 flex-wrap text-xs bg-[#050c1e] p-2.5 rounded-lg border border-[#1e3c7a]">
          <span className="font-semibold text-sky-300">Mẫu tài liệu phổ biến:</span>
          <button
            onClick={() => addDoc('User Operation Manual (Hướng dẫn vận hành)', 'English / Tiếng Việt')}
            className="px-2 py-1 bg-[#091533] hover:bg-[#12234f] text-sky-200 hover:text-white rounded border border-[#1e3c7a] text-[11px] transition-colors cursor-pointer"
          >
            + Hướng dẫn vận hành
          </button>
          <button
            onClick={() => addDoc('Technical Maintenance Manual (Sổ tay bảo dưỡng kỹ thuật)', 'English')}
            className="px-2 py-1 bg-[#091533] hover:bg-[#12234f] text-sky-200 hover:text-white rounded border border-[#1e3c7a] text-[11px] transition-colors cursor-pointer"
          >
            + Sổ tay bảo dưỡng
          </button>
          <button
            onClick={() => addDoc('Schematic Diagram & Rack Wiring (Sơ đồ nguyên lý & Đấu nối)', 'Bản vẽ CAD/PDF')}
            className="px-2 py-1 bg-[#091533] hover:bg-[#12234f] text-sky-200 hover:text-white rounded border border-[#1e3c7a] text-[11px] transition-colors cursor-pointer"
          >
            + Sơ đồ đấu nối Rack
          </button>
          <button
            onClick={() => addDoc('Factory Acceptance Test (FAT Report) & CO/CQ', 'English')}
            className="px-2 py-1 bg-[#091533] hover:bg-[#12234f] text-sky-200 hover:text-white rounded border border-[#1e3c7a] text-[11px] transition-colors cursor-pointer"
          >
            + Biên bản FAT & CO/CQ
          </button>
        </div>

        <div className="border border-[#182d5a] rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[800px]">
            <thead className="bg-[#071128] text-sky-200 border-b border-[#182d5a] font-semibold">
              <tr>
                <th className="p-2.5 w-12 text-center">TT</th>
                <th className="p-2.5">Tên tài liệu kỹ thuật (Manual, Scheme, Sơ đồ... ) *</th>
                <th className="p-2.5 w-20 text-center">Số bản</th>
                <th className="p-2.5 w-40">Định dạng</th>
                <th className="p-2.5 w-36">Ngôn ngữ / Ver</th>
                <th className="p-2.5">Vị trí lưu trữ tại trạm</th>
                <th className="p-2.5">Ghi chú</th>
                <th className="p-2.5 w-12 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182d5a]">
              {data.docs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic bg-[#050c1e]">
                    Chưa có tài liệu nào được khai báo. Hãy chọn mẫu tài liệu ở trên hoặc nhấn "Thêm tài liệu".
                  </td>
                </tr>
              ) : (
                data.docs.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-[#0c183a] bg-[#060e24]">
                    <td className="p-2 text-center font-bold text-sky-300">
                      {doc.no || idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Tên tài liệu..."
                        value={doc.name}
                        onChange={(e) => updateDoc(idx, 'name', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs font-semibold text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={doc.qty}
                        onChange={(e) => updateDoc(idx, 'qty', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white text-center font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={doc.format}
                        onChange={(e) => updateDoc(idx, 'format', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      >
                        <option value="Bản in giấy" className="bg-[#091533] text-white">Bản in giấy</option>
                        <option value="Bản điện tử (PDF/CAD)" className="bg-[#091533] text-white">Bản điện tử (PDF/CAD)</option>
                        <option value="Cả hai" className="bg-[#091533] text-white">Cả hai</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="English / v4.2"
                        value={doc.lang}
                        onChange={(e) => updateDoc(idx, 'lang', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Tủ hồ sơ 01 / Ổ cứng trạm..."
                        value={doc.location}
                        onChange={(e) => updateDoc(idx, 'location', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Ghi chú thêm..."
                        value={doc.note}
                        onChange={(e) => updateDoc(idx, 'note', e.target.value)}
                        className="w-full bg-[#091533] border border-[#1e3c7a] rounded p-1.5 text-xs text-white"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => removeDoc(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Xóa tài liệu này"
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
