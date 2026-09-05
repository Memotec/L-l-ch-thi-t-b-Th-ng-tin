import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  QrCode, 
  ExternalLink, 
  FileText, 
  Cpu, 
  Layers, 
  BookOpen, 
  Wrench, 
  AlertTriangle, 
  Copy, 
  Check, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Radio, 
  Activity, 
  PhoneCall, 
  Zap, 
  Server, 
  HardDrive,
  Gauge,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { EquipmentData, EquipmentCategory, EquipmentStatus } from '../types';
import { NotesTab } from './NotesTab';

interface ViewerEquipmentDetailProps {
  equipment: EquipmentData;
  onBack: () => void;
  onOpenPdf: (equipment: EquipmentData) => void;
  onOpenQr: (equipment: EquipmentData) => void;
}

type DetailTab = 'general' | 'spec' | 'components' | 'docs' | 'maintenance' | 'repair' | 'notes';

export const ViewerEquipmentDetail: React.FC<ViewerEquipmentDetailProps> = ({
  equipment,
  onBack,
  onOpenPdf,
  onOpenQr
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCategoryIcon = (category: EquipmentCategory) => {
    switch (category) {
      case 'VHF/ HF':
      case 'VHF/UHF': return <Radio className="w-5 h-5 text-blue-500" />;
      case 'Ghép Kênh': return <Layers className="w-5 h-5 text-indigo-500" />;
      case 'VIBA/VSAT/Cáp Quang':
      case 'VIBA': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'Thiết bị đo': return <Gauge className="w-5 h-5 text-amber-500" />;
      case 'VOICE': return <PhoneCall className="w-5 h-5 text-amber-500" />;
      case 'POWER': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'IT': return <Server className="w-5 h-5 text-indigo-500" />;
      case 'RADAR_ADS': return <Activity className="w-5 h-5 text-cyan-500" />;
      case 'NAV': return <Radio className="w-5 h-5 text-purple-500" />;
      default: return <HardDrive className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'Đang khai thác':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Dự phòng sẵn sàng':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Đang bảo dưỡng/sửa chữa':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Tạm ngừng khai thác':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const s = equipment.spec || ({} as any);

  const tabs: { id: DetailTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'general', label: '1. Sơ Lược & Pháp Lý', icon: FileText, count: equipment.licenses?.length || 0 },
    { id: 'spec', label: '2. Đặc Tính & Cấu Hình', icon: Cpu },
    { id: 'components', label: '3. Khối & Linh Kiện', icon: Layers, count: equipment.components?.length || 0 },
    { id: 'docs', label: '4. Tài Liệu Kỹ Thuật', icon: BookOpen, count: equipment.docs?.length || 0 },
    { id: 'maintenance', label: '5. Lịch Sử Bảo Dưỡng', icon: Wrench, count: equipment.maintenance?.length || 0 },
    { id: 'repair', label: '6. Sửa Chữa & Sự Cố', icon: AlertTriangle, count: equipment.repair?.length || 0 },
    { id: 'notes', label: '7. Ghi Chú & Lưu Ý', icon: MessageSquare, count: equipment.notesList?.length || 0 }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenPdf(equipment)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xem PDF / In A4</span>
          </button>

          <button
            onClick={() => onOpenQr(equipment)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Mã QR Tem Nhãn</span>
          </button>

          {equipment.googleDocUrl && (
            <a
              href={equipment.googleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Google Docs</span>
            </a>
          )}
        </div>
      </div>

      {/* Equipment Header Passport Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-start gap-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl shrink-0 mt-1">
              {getCategoryIcon(g.category)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
                  {g.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadge(g.status)}`}>
                  {g.status}
                </span>
                {g.priority && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                    {g.priority}
                  </span>
                )}
              </div>

              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {g.name}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 mt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Hãng sản xuất:</span>
                  <span className="font-semibold text-slate-800">{g.manufacturer || '---'} ({g.origin || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Model:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {g.model || '---'}
                    {g.model && (
                      <button 
                        onClick={() => copyToClipboard(g.model, 'model')} 
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Sao chép Model"
                      >
                        {copiedField === 'model' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số Serial (SN):</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    {g.serial || '---'}
                    {g.serial && (
                      <button 
                        onClick={() => copyToClipboard(g.serial, 'serial')} 
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Sao chép Serial"
                      >
                        {copiedField === 'serial' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã Tài Sản:</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    {g.assetNo || '---'}
                    {g.assetNo && (
                      <button 
                        onClick={() => copyToClipboard(g.assetNo, 'assetNo')} 
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Sao chép Mã TS"
                      >
                        {copiedField === 'assetNo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Org & Engineer Info Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5 shrink-0 lg:w-72">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đơn Vị & Kỹ Sư Quản Lý</div>
            <div className="flex items-center gap-2 text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium truncate">{o.unit || 'Đội Thông Tin'} - {o.location || 'TT BĐKT'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium truncate">{o.primaryEngineer || 'Kỹ sư phụ trách'}</span>
            </div>
            {o.phoneContact && (
              <div className="flex items-center gap-2 text-slate-800">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-mono font-medium">{o.phoneContact}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display (Read-Only) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        {/* Section 1: General & Legal */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>I. Thông Tin Bàn Giao & Vận Hành</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Năm sản xuất:</span>
                  <span className="font-semibold text-slate-800">{g.yearMade || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày đưa vào khai thác:</span>
                  <span className="font-semibold text-slate-800">{g.commissioned || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày nghiệm thu:</span>
                  <span className="font-semibold text-slate-800">{g.acceptanceDate || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Thời hạn bảo hành:</span>
                  <span className="font-semibold text-slate-800">{g.warrantyDate || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kỳ hiệu chuẩn / kiểm định kế tiếp:</span>
                  <span className="font-semibold text-slate-800">{g.nextCalDate || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tuổi thọ ước tính:</span>
                  <span className="font-semibold text-slate-800">{g.estimatedLifespanYears ? `${g.estimatedLifespanYears} năm` : '---'}</span>
                </div>
              </div>
            </div>

            {/* Frequency & Operation Licenses */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Giấy Phép Tần Số & Giấy Phép Khai Thác ({equipment.licenses?.length || 0})</span>
              </h3>
              {equipment.licenses && equipment.licenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">Số Quyết Định / Giấy Phép</th>
                        <th className="p-3">Nội Dung Cấp Phép</th>
                        <th className="p-3">Ngày Cấp</th>
                        <th className="p-3">Ngày Hết Hạn</th>
                        <th className="p-3 rounded-r-lg">Hiệu Lực</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {equipment.licenses.map((lic, idx) => (
                        <tr key={lic.id || idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-blue-900">{lic.startNo}</td>
                          <td className="p-3 font-medium text-slate-800">{lic.content}</td>
                          <td className="p-3 text-slate-600">{lic.startDate || '---'}</td>
                          <td className="p-3 text-slate-600">{lic.endDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lic.active !== false 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {lic.active !== false ? 'Còn hiệu lực' : 'Hết hạn'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                  Chưa có thông tin giấy phép tần số/khai thác được cập nhật.
                </div>
              )}
            </div>

            {/* Transfer history */}
            {equipment.orgRows && equipment.orgRows.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Lịch Sử Bàn Giao & Quản Lý
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">Ngày chuyển giao</th>
                        <th className="p-3">Đơn vị tiếp nhận</th>
                        <th className="p-3">Số văn bản / Biên bản</th>
                        <th className="p-3">Tình trạng bàn giao</th>
                        <th className="p-3 rounded-r-lg">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {equipment.orgRows.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{row.date}</td>
                          <td className="p-3 text-slate-800">{row.unit}</td>
                          <td className="p-3 font-mono text-slate-600">{row.handoverDocNo || '---'}</td>
                          <td className="p-3 font-medium text-blue-900">{row.status}</td>
                          <td className="p-3 text-slate-600">{row.note || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Specifications */}
        {activeTab === 'spec' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>II. Đặc Tính Kỹ Thuật & Cấu Hình Hoạt Động</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">Thông Số Cơ Bản</div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dải tần hoạt động:</span>
                  <span className="font-bold text-slate-800 font-mono">{s.frequency || s.range || '118.000 - 136.975 MHz'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Công suất phát định mức:</span>
                  <span className="font-bold text-slate-800">{s.power || s.output || '50 W (Peak)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Độ nhạy thu:</span>
                  <span className="font-bold text-slate-800">{s.sensitivity || '-107 dBm'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nguồn điện cung cấp:</span>
                  <span className="font-bold text-slate-800">{s.powerSupply || '220VAC / 24VDC Backup'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-2">Cấu Hình Mạng & Địa Chỉ IP</div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Địa chỉ IP quản trị:</span>
                  <span className="font-mono font-bold text-blue-800">{s.ipAddress || '192.168.10.25'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Subnet Mask / Gateway:</span>
                  <span className="font-mono text-slate-700">{s.subnetGateway || '255.255.255.0 / 192.168.10.1'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Giao thức âm thanh / dữ liệu:</span>
                  <span className="font-semibold text-slate-800">{s.protocol || 'ED-137B / VoIP E&M'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Vị trí lắp đặt Rack:</span>
                  <span className="font-semibold text-slate-800">{s.rackLocation || 'Rack VHF-02, Slot U14-U18'}</span>
                </div>
              </div>
            </div>

            {s.text && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 text-xs">
                <div className="font-bold text-blue-900 mb-2">Thuyết Minh Đặc Tính Chi Tiết:</div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{s.text}</p>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Components */}
        {activeTab === 'components' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>III. Danh Mục Khối & Linh Kiện Kèm Theo ({equipment.components?.length || 0})</span>
            </h3>

            {equipment.components && equipment.components.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Tên Khối / Module</th>
                      <th className="p-3">Mã Hiệu (Part No)</th>
                      <th className="p-3">Số Serial</th>
                      <th className="p-3">Số Lượng</th>
                      <th className="p-3">Tình Trạng</th>
                      <th className="p-3 rounded-r-lg">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipment.components.map((comp, idx) => (
                      <tr key={comp.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{comp.name}</td>
                        <td className="p-3 font-mono text-slate-700">{comp.partNo || '---'}</td>
                        <td className="p-3 font-mono font-bold text-blue-900">{comp.serial || '---'}</td>
                        <td className="p-3 text-center">{comp.qty || 1}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {comp.healthStatus || 'Hoạt động tốt'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{comp.note || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-xl text-center">
                Chưa có danh mục linh kiện nào được ghi nhận.
              </div>
            )}
          </div>
        )}

        {/* Section 4: Technical Docs */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>IV. Tài Liệu Kỹ Thuật Kèm Theo ({equipment.docs?.length || 0})</span>
            </h3>

            {equipment.docs && equipment.docs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Tên Tài Liệu Kỹ Thuật</th>
                      <th className="p-3">Ký Hiệu / Mã Tài Liệu</th>
                      <th className="p-3">Số Lượng / Bản</th>
                      <th className="p-3">Nơi Lưu Trữ</th>
                      <th className="p-3 rounded-r-lg">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipment.docs.map((doc, idx) => (
                      <tr key={doc.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{doc.name}</td>
                        <td className="p-3 font-mono text-slate-700">{doc.no || '---'}</td>
                        <td className="p-3 text-center">{doc.qty || 1}</td>
                        <td className="p-3 text-slate-800">{doc.location || 'Tủ hồ sơ Đội TT'}</td>
                        <td className="p-3 text-slate-600">{doc.note || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-xl text-center">
                Chưa có danh mục tài liệu kỹ thuật nào.
              </div>
            )}
          </div>
        )}

        {/* Section 5: Maintenance Logs */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>V. Nhật Ký Lịch Sử Bảo Dưỡng Định Kỳ ({equipment.maintenance?.length || 0})</span>
            </h3>

            {equipment.maintenance && equipment.maintenance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Từ ngày, đến ngày</th>
                      <th className="p-3">Chu Kỳ</th>
                      <th className="p-3">Nội Dung Bảo Dưỡng</th>
                      <th className="p-3">Kết Quả Đánh Giá</th>
                      <th className="p-3">Người Thực Hiện</th>
                      <th className="p-3 rounded-r-lg">Người Kiểm Tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipment.maintenance.map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold text-slate-900">{m.date}</td>
                        <td className="p-3 font-medium text-blue-800">{m.cycle || 'Định kỳ'}</td>
                        <td className="p-3 text-slate-800">{m.content}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {m.result || 'Đạt tiêu chuẩn'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-800">{m.person}</td>
                        <td className="p-3 text-slate-600">{m.supervisor || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-xl text-center">
                Chưa có nhật ký bảo dưỡng nào được ghi nhận cho thiết bị này.
              </div>
            )}
          </div>
        )}

        {/* Section 6: Repairs & Incidents */}
        {activeTab === 'repair' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>VI. Lịch Sử Sửa Chữa, Sự Cố & Biến Động ({equipment.repair?.length || 0})</span>
            </h3>

            {equipment.repair && equipment.repair.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Ngày Phát Sinh</th>
                      <th className="p-3">Hiện Tượng & Nguyên Nhân</th>
                      <th className="p-3">Biện Pháp Khắc Phục</th>
                      <th className="p-3">Linh Kiện Thay Thế</th>
                      <th className="p-3">Người Sửa Chữa</th>
                      <th className="p-3 rounded-r-lg">Trạng Thái Sau SC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipment.repair.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold text-slate-900">{r.date}</td>
                        <td className="p-3 text-slate-900 font-medium">{r.incidentDescription || r.rootCause || '---'}</td>
                        <td className="p-3 text-slate-800">{r.actionTaken || '---'}</td>
                        <td className="p-3 font-mono text-slate-700">{r.replacedParts || 'Không có'}</td>
                        <td className="p-3 text-slate-800">{r.person}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {r.status || 'Hoạt động bình thường'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-xl text-center">
                Thiết bị hoạt động ổn định, chưa phát sinh sự cố sửa chữa nào.
              </div>
            )}
          </div>
        )}

        {/* Section 7: Notes */}
        {activeTab === 'notes' && (
          <NotesTab
            data={equipment}
            onChange={() => {}} // Read-only view
            isReadOnly={true}
          />
        )}
      </div>
    </div>
  );
};
