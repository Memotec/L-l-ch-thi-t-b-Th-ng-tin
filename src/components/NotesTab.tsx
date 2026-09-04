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
  Tag, 
  Clock, 
  Sparkles, 
  Send,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { EquipmentData, NoteRow, PERFORMER_OPTIONS } from '../types';
import { PerformerSelect } from './PerformerSelect';

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
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState<string>(PERFORMER_OPTIONS[0]);
  const [newPriority, setNewPriority] = useState<'Thấp' | 'Trung bình' | 'Cao'>('Trung bình');
  const [newStatus, setNewStatus] = useState<'Đang theo dõi' | 'Hoàn thành' | 'Khẩn cấp'>('Đang theo dõi');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const notes = useMemo(() => data.notesList || [], [data.notesList]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = !searchTerm || 
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.author && n.author.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
      const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [notes, searchTerm, priorityFilter, statusFilter]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    if (!newContent.trim()) return;

    const newNote: NoteRow = {
      id: `note-${Date.now()}`,
      date: newDate,
      content: newContent.trim(),
      author: newAuthor,
      priority: newPriority,
      status: newStatus
    };

    const updatedNotes = [newNote, ...notes];
    onChange({
      ...data,
      notesList: updatedNotes
    });

    setNewContent('');
  };

  const handleUpdateNote = (id: string, field: keyof NoteRow, value: any) => {
    if (isReadOnly) {
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    const updatedNotes = notes.map(n => {
      if (n.id === id) {
        return { ...n, [field]: value };
      }
      return n;
    });

    onChange({
      ...data,
      notesList: updatedNotes
    });
  };

  const handleRemoveNote = (id: string) => {
    if (isReadOnly) {
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    const updatedNotes = notes.filter(n => n.id !== id);
    onChange({
      ...data,
      notesList: updatedNotes
    });
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
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
      {/* Read-Only Notice */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
              CHẾ ĐỘ XEM (VIEWER)
            </span>
            <span>Bạn đang ở chế độ xem. Để thêm hoặc sửa ghi chú, vui lòng đăng nhập Quản trị viên.</span>
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

      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-5 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Mục VII: Ghi Chú & Lưu Ý Kỹ Thuật
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Tab 7
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Theo dõi nhắc nhở kỹ thuật, lưu ý vận hành, vật tư thay thế và sự kiện đặc biệt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-semibold">
            Tổng cộng: {notes.length} ghi chú
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Add Note */}
        {!isReadOnly && (
          <div className="lg:col-span-5 enterprise-card p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Thêm Ghi Chú Mới</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Lưu ý kỹ thuật hoặc nhắc nhở công việc cần theo dõi
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3.5 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nội dung ghi chú *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập nội dung lưu ý kỹ thuật, thiết bị cần sửa, vật tư cần mua..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Độ ưu tiên</label>
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

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Trạng thái</label>
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

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Người ghi chú</label>
                  <select
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="form-input-standard"
                  >
                    {PERFORMER_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Ngày ghi chép</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="form-input-standard"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Ghi Chú Kỹ Thuật</span>
              </button>
            </form>
          </div>
        )}

        {/* Right List: Notes Feed */}
        <div className={`enterprise-card p-5 space-y-4 ${isReadOnly ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Danh Sách Ghi Chú & Lưu Ý
                <span className="ml-2 text-xs font-semibold text-slate-500">
                  ({filteredNotes.length} mục)
                </span>
              </h2>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Tìm ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-32 sm:w-40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="ALL">Ưu tiên: Tất cả</option>
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="ALL">Trạng thái: Tất cả</option>
                <option value="Đang theo dõi">Đang theo dõi</option>
                <option value="Khẩn cấp">Khẩn cấp</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">Chưa có ghi chú nào</div>
                <p className="text-[11px] text-slate-500">
                  {isReadOnly ? 'Hiện chưa có ghi chú nào được lưu cho thiết bị này.' : 'Hãy tạo ghi chú theo dõi kỹ thuật đầu tiên từ form bên trái.'}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className={`p-4 rounded-xl border transition-all bg-white hover:shadow-xs space-y-2.5 ${
                    note.status === 'Khẩn cấp' 
                      ? 'border-rose-200 bg-rose-50/10' 
                      : note.status === 'Hoàn thành' 
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-medium text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {note.date}
                        </span>

                        <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          <User className="w-3 h-3 text-slate-400" />
                          {note.author}
                        </span>

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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
