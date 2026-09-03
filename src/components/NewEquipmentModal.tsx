import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Radio, 
  Activity, 
  PhoneCall, 
  Zap, 
  Server, 
  HardDrive
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
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState('');

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
        unit: unit.trim(),
        location: location.trim(),
        phoneContact: '',
        primaryEngineer: '',
        supervisor: ''
      },
      orgRows: [],
      general: {
        name: name.trim(),
        category,
        model: model.trim(),
        manufacturer: manufacturer.trim(),
        serial: serial.trim(),
        assetNo: assetNo.trim(),
        assetCode: '',
        yearMade: '',
        origin: '',
        commissioned: '',
        acceptanceDate: '',
        warrantyDate: '',
        nextCalDate: '',
        status: 'Đang khai thác',
        priority: 'Hệ thống chính (Level 1)',
        estimatedLifespanYears: 10,
        notes: ''
      },
      spec: {
        text: '',
        power: '',
        output: '',
        range: '',
        interface: '',
        mgmtIp: '',
        subnetMask: '',
        gateway: '',
        vlanId: '',
        firmware: '',
        channelFreq: '',
        snmpCommunity: ''
      },
      licenses: [],
      components: [],
      docs: [],
      maintenance: [],
      repair: []
    };

    onCreate(newEquipment);
    onClose();
    // Reset fields
    setName('');
    setModel('');
    setManufacturer('');
    setSerial('');
    setAssetNo('');
    setUnit('');
    setLocation('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg text-white">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Thêm Hồ Sơ Lý Lịch Thiết Bị Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 block">Chủng loại thiết bị CNS *</label>
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
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      category === item.id
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 block">Tên thiết bị *</label>
            <input
              type="text"
              required
              placeholder="Nhập tên thiết bị"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input-standard font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Kiểu loại (Model)</label>
              <input
                type="text"
                placeholder="Nhập model thiết bị"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Hãng sản xuất</label>
              <input
                type="text"
                placeholder="Nhập hãng sản xuất"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="form-input-standard"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Số Serial</label>
              <input
                type="text"
                placeholder="Nhập số serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Mã Tài Sản Quản Lý</label>
              <input
                type="text"
                placeholder="Nhập mã tài sản"
                value={assetNo}
                onChange={(e) => setAssetNo(e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Đơn vị quản lý</label>
              <input
                type="text"
                placeholder="Nhập đơn vị quản lý"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Vị trí lắp đặt</label>
              <input
                type="text"
                placeholder="Nhập vị trí lắp đặt"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input-standard"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
