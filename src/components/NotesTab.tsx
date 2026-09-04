import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  MessageSquare, 
  Calendar, 
  User, 
  AlertCircle, 
  Check, 
  ArrowUpDown,
  Tag,
  Flag
} from 'lucide-react';
import { EquipmentData, NoteRow, PERFORMER_OPTIONS } from '../types';

interface NotesTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  data,
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // State for adding a new note
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState<string>(PERFORMER_OPTIONS[0]);
  const [newPriority, setNewPriority] = useState<'Thấp' | 'Trung bình' | 'Cao'>('Trung bình');
  const [newStatus, setNewStatus] = useState<'Đang theo dõi' | 'Hoàn thành' | 'Khẩn cấp'>('Đang theo dõi');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Search and filter memoized list
  const notes = useMemo(() => {
    return data.notesList || [];
  }, [data.notesList]);

  const filteredNotes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return notes.filter(note => {
      const matchSearch = !q || 
        (note.content && note.content.toLowerCase().includes(q)) ||
        (note.author && note.author.toLowerCase().includes(q));
      
      const matchPriority = priorityFilter === 'ALL' || note.priority === priorityFilter;
      const matchStatus = statusFilter === 'ALL' || note.status === statusFilter;
      
      return matchSearch && matchPriority && matchStatus;
    });
  }, [notes, searchTerm, priorityFilter, statusFilter]);

  // Actions
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newContent.trim()) return;

    const newNote: NoteRow = {
      id: `note-${Date.now()}`,
      date: newDate,
      content: newContent.trim(),
      author: newAuthor,
      priority: newPriority,
      status: newStatus
    };

    onChange({
      ...data,
      notesList: [newNote, ...notes] // Prepend new notes to the list
    });

    // Reset input fields
    setNewContent('');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  const handleUpdateNote = (id: string, field: keyof NoteRow, value: any) => {
    if (isReadOnly) return;
    const updatedNotes = notes.map(note => {
      if (note.id === id) {
        return { ...note, [field]: value };
      }
      return note;
    });
    onChange({
      ...data,
      notesList: updatedNotes
    });
  };

  const handleRemoveNote = (id: string) => {
    if (isReadOnly) return;
    const updatedNotes = notes.filter(note => note.id !== id);
    onChange({
      ...data,
      notesList: updatedNotes
    });
  };

  // Helper functions for badges
  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'Cao':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Trung bình':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Thấp':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadge = (s?: string) => {
    switch (s) {
      case 'Khẩn cấp':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'Đang theo dõi':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Hoàn thành':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHỈ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem. Để thêm hoặc sửa đổi danh sách ghi chú, vui lòng đăng nhập Quản trị viên.</span>
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

      {/* Main Grid: Create Note (Admin only) vs Note List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Create Form (Hidden if read-only for cleaner Viewer view) */}
        {!isReadOnly && (
          <div className="enterprise-card p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Thêm ghi chú / nhắc nhở mới
              </h3>
              <p className="text-[11px] text-slate-500">Ghi lại lưu ý kỹ thuật hoặc công việc cần theo dõi</p>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Nội dung ghi chú *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung cần ghi chú hoặc nhắc nhở..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Kíp trực / Người ghi nhận</label>
                <select
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="form-input-standard"
                >
                  {PERFORMER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-semibold">Độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="form-input-standard"
                  >
                    <option value="Thấp">Thấp</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Cao">Cao</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 font-semibold">Trạng thái</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="form-input-standard"
                  >
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold">Ngày ghi chép</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="form-input-standard"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm ghi chú vào danh sách</span>
              </button>
            </form>
          </div>
        )}

        {/* Right Side: List of notes (occupies more space) */}
        <div className={`enterprise-card p-5 space-y-4 ${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Danh mục ghi chú & theo dõi công việc ({filteredNotes.length})
              </h2>
              <p className="text-xs text-slate-500">Theo dõi, sắp xếp các lưu ý đặc biệt để tránh bị rối</p>
            </div>
          </div>

          {/* Quick Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm nội dung, kíp trực..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              >
                <option value="ALL">Độ ưu tiên: Tất cả</option>
                <option value="Cao">Độ ưu tiên: Cao</option>
                <option value="Trung bình">Độ ưu tiên: Trung bình</option>
                <option value="Thấp">Độ ưu tiên: Thấp</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white"
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="Đang theo dõi">Trạng thái: Đang theo dõi</option>
                <option value="Khẩn cấp">Trạng thái: Khẩn cấp</option>
                <option value="Hoàn thành">Trạng thái: Hoàn thành</option>
              </select>
            </div>
          </div>

          {/* Note List Render */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              Không tìm thấy ghi chú nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id} 
                  className={`p-4 rounded-xl border transition-all hover:shadow-xs bg-white ${
                    note.status === 'Khẩn cấp' 
                      ? 'border-rose-200 bg-rose-50/20' 
                      : note.status === 'Hoàn thành' 
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      {/* Note Metadata */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-medium text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {note.date}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          <User className="w-3 h-3 text-slate-400" />
                          {note.author}
                        </span>
                        
                        {/* Dynamic Selects or Badges */}
                        {!isReadOnly ? (
                          <>
                            <select
                              value={note.priority || 'Trung bình'}
                              onChange={(e) => handleUpdateNote(note.id, 'priority', e.target.value)}
                              className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border-0 text-[10px] font-bold focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Thấp">Thấp</option>
                              <option value="Trung bình">Trung bình</option>
                              <option value="Cao">Cao</option>
                            </select>

                            <select
                              value={note.status || 'Đang theo dõi'}
                              onChange={(e) => handleUpdateNote(note.id, 'status', e.target.value)}
                              className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded border-0 text-[10px] font-bold focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Đang theo dõi">Đang theo dõi</option>
                              <option value="Hoàn thành">Hoàn thành</option>
                              <option value="Khẩn cấp">Khẩn cấp</option>
                            </select>
                          </>
                        ) : (
                          <>
                            <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${getPriorityBadge(note.priority)}`}>
                              {note.priority || 'Trung bình'}
                            </span>
                            <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${getStatusBadge(note.status)}`}>
                              {note.status || 'Đang theo dõi'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Note Content (Editable text area for Admins, normal text for Viewers) */}
                      {!isReadOnly ? (
                        <textarea
                          rows={2}
                          value={note.content}
                          onChange={(e) => handleUpdateNote(note.id, 'content', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white rounded p-1 border-0 border-b border-transparent focus:border-slate-300 focus:ring-0 transition-colors placeholder:text-slate-400"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-line pl-1">
                          {note.content}
                        </p>
                      )}
                    </div>

                    {/* Delete button (Admin only) */}
                    {!isReadOnly && (
                      <button
                        onClick={() => handleRemoveNote(note.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        title="Xóa ghi chú này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
