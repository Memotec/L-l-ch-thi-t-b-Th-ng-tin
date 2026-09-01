import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Radio, 
  Activity, 
  PhoneCall, 
  Zap, 
  Server, 
  HardDrive,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { EquipmentCategory, EquipmentData } from '../types';

interface NewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newEq: EquipmentData) => void;
}

export const NewEquipmentModal: React.FC<NewEquipmentModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [category, setCategory] = useState<EquipmentCategory>('VHF/UHF');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [serial, setSerial] = useState('');
  const [assetNo, setAssetNo] = useState('');
  const [unit, setUnit] = useState('Đài Kiểm soát Không lưu & Trạm Radar');
  const [location, setLocation] = useState('Phòng Thiết bị Kỹ thuật CNS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên thiết bị.');
      return;
    }

    const id = `eq-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newEquipment: EquipmentData = {
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      org: {
        unit,
        location,
        phoneContact: '024-3872xxxx',
        primaryEngineer: 'Nhân Viên Trực Kỹ thuật',
        supervisor: 'Đội trưởng Đội Thông Tin'
      },
      orgRows: [
        {
          id: `or-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          unit,
          handoverDocNo: 'BB-NTBG/CNS',
          status: 'Tiếp nhận mới 100%',
          note: 'Bàn giao đưa vào khai thác'
        }
      ],
      general: {
        name,
        category,
        model,
        manufacturer,
        serial: serial || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
        assetNo: assetNo || `TS-CNS-${Math.floor(1000 + Math.random() * 9000)}`,
        assetCode: `EQ-${Date.now().toString().slice(-4)}`,
        yearMade: new Date().getFullYear().toString(),
        origin: 'Quốc tế',
        commissioned: new Date().toISOString().split('T')[0],
        acceptanceDate: new Date().toISOString().split('T')[0],
        warrantyDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nextCalDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Đang khai thác',
        priority: 'Hệ thống chính (Level 1)',
        estimatedLifespanYears: 10,
        notes: 'Thiết bị mới đưa vào khai thác.'
      },
      spec: {
        text: `Hệ thống ${name} phục vụ đảm bảo hoạt động bay và viễn thông hàng không chuyên ngành.`,
        power: '220VAC ± 10% / -48VDC',
        output: 'Chuẩn định mức',
        range: 'Băng thông tiêu chuẩn',
        interface: 'VoIP ED-137 / IP / RS232',
        mgmtIp: '192.168.1.50',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
        vlanId: 'VLAN 100',
        firmware: 'v1.0.0',
        channelFreq: 'Kênh khai thác chính',
        snmpCommunity: 'public'
      },
      licenses: [
        {
          id: `lic-${Date.now()}`,
          startNo: 'GP-TS-CNS/2025',
          startDate: new Date().toISOString().split('T')[0],
          content: 'Giấy phép sử dụng tần số và cấp phép khai thác bảo đảm bay',
          endDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          active: true
        }
      ],
      components: [
        {
          id: `cp-1`,
          no: 1,
          name: 'Khối xử lý trung tâm (Main Controller)',
          partNo: 'MCU-01',
          serial: `SN-MCU-${Math.floor(1000 + Math.random() * 9000)}`,
          unit: 'Bo mạch',
          qty: 1,
          healthStatus: 'Tốt',
          note: 'Slot 1'
        },
        {
          id: `cp-2`,
          no: 2,
          name: 'Khối nguồn cung cấp (PSU Module)',
          partNo: 'PSU-220/48',
          serial: `SN-PSU-${Math.floor(1000 + Math.random() * 9000)}`,
          unit: 'Bộ',
          qty: 1,
          healthStatus: 'Tốt',
          note: 'Khe cắm nguồn'
        }
      ],
      docs: [
        {
          id: `doc-1`,
          no: 1,
          name: 'User Operation Manual (Hướng dẫn vận hành thiết bị)',
          qty: 1,
          format: 'Bản in giấy',
          lang: 'English / Tiếng Việt',
          location: 'Tủ tài liệu trạm',
          note: 'Kèm đĩa phần mềm'
        }
      ],
      maintenance: [
        {
          id: `mt-1`,
          date: new Date().toISOString().split('T')[0],
          cycle: 'Hàng quý',
          content: 'Kiểm tra hoạt động toàn diện, đo thông số nguồn điện và vệ sinh thiết bị ban đầu.',
          measuredParams: 'Thông số kỹ thuật chuẩn đạt 100%',
          result: 'Đạt yêu cầu kỹ thuật',
          person: 'Kỹ sư Trực Kỹ thuật',
          supervisor: 'Trưởng Đài CNS'
        }
      ],
      repair: []
    };

    onCreate(newEquipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#091533] rounded-2xl border border-[#182d5a] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-[#040a1c] text-white flex items-center justify-between border-b border-[#182d5a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500 rounded-lg text-white">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Thêm Hồ Sơ Lý Lịch Thiết Bị Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="font-bold text-sky-200 block">Chủng loại thiết bị CNS *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'VHF/UHF', label: 'VHF / UHF Radio', icon: Radio },
                { id: 'VIBA', label: 'Viba / Microwave', icon: Activity },
                { id: 'VOICE', label: 'VCS / Thoại', icon: PhoneCall },
                { id: 'POWER', label: 'UPS / Nguồn Điện', icon: Zap },
                { id: 'IT', label: 'NMS / Mạng IT', icon: Server },
                { id: 'OTHER', label: 'Khác (Radar/DVOR)', icon: HardDrive }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as EquipmentCategory)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      category === item.id
                        ? 'bg-sky-600 border-sky-400 text-white font-bold'
                        : 'bg-[#060e24] border-[#1e3c7a] hover:bg-[#12224d] text-sky-200/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-sky-200 block">Tên thiết bị *</label>
            <input
              type="text"
              required
              placeholder="VD: Máy phát VHF T/R Kênh Chính 125.6 MHz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2.5 font-semibold text-white placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Kiểu loại (Model)</label>
              <input
                type="text"
                placeholder="VD: PAE T6TR / Garex 220"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white font-mono placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Hãng sản xuất</label>
              <input
                type="text"
                placeholder="VD: Park Air Systems / Rohde & Schwarz"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Số Serial</label>
              <input
                type="text"
                placeholder="VD: SN-2024-8899"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white font-mono placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Mã Tài Sản Quản Lý</label>
              <input
                type="text"
                placeholder="VD: TS-VHF-009"
                value={assetNo}
                onChange={(e) => setAssetNo(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white font-mono placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Đơn vị quản lý</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sky-200 block">Vị trí lắp đặt</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#060e24] border border-[#1e3c7a] rounded-lg p-2 text-white placeholder:text-slate-500 focus:bg-[#0a183d] focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#182d5a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Sổ Lý Lịch Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
