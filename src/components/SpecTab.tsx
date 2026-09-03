import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Radio, 
  Network,
  Copy,
  Check,
  Server,
  Shield,
  Layers
} from 'lucide-react';
import { EquipmentData } from '../types';

interface SpecTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
  isReadOnly?: boolean;
  onOpenLoginModal?: () => void;
}

export const SpecTab: React.FC<SpecTabProps> = ({ 
  data, 
  onChange,
  isReadOnly = false,
  onOpenLoginModal
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateSpec = (field: string, value: string) => {
    if (isReadOnly) return;
    onChange({
      ...data,
      spec: {
        ...data.spec,
        [field]: value
      }
    });
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
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
            <span>Bạn đang ở chế độ xem thông số kỹ thuật. Để chỉnh sửa tham số, vui lòng đăng nhập Quản trị viên.</span>
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

      {/* 2. System Architecture & Core Specs */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              2. Đặc tính kỹ thuật & Cấu hình chuyên sâu
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Kiến trúc hệ thống, thông số nguồn điện, RF, mạng và giao thức điều khiển</p>
          </div>
          {isReadOnly && (
            <span className="text-xs font-medium text-slate-500 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
              Khóa chỉnh sửa
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Mô tả chung về kiến trúc hệ thống / thông số cấu hình cốt lõi
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              placeholder="Nhập kiến trúc hệ thống, nguyên lý hoạt động, chế độ dự phòng 1+1, công nghệ xử lý DSP..."
              value={data.spec.text}
              onChange={(e) => updateSpec('text', e.target.value)}
              className="form-input-standard"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Điện áp nguồn cung cấp
                </label>
                {data.spec.power && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.power, 'power')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'power' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'power' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 220VAC ± 10% / -48VDC"
                value={data.spec.power}
                onChange={(e) => updateSpec('power', e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Công suất tiêu thụ / phát (RF/Power)
                </label>
                {data.spec.output && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.output, 'output')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'output' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'output' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: RF 50W AM / Tiêu thụ 180VA"
                value={data.spec.output}
                onChange={(e) => updateSpec('output', e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  Dải tần số / Băng thông / Thông lượng
                </label>
                {data.spec.range && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.range, 'range')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'range' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'range' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 118.000 - 136.975 MHz / 350 Mbps"
                value={data.spec.range}
                onChange={(e) => updateSpec('range', e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  Tần số làm việc / Kênh khai thác
                </label>
                {data.spec.channelFreq && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.channelFreq || '', 'channelFreq')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'channelFreq' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'channelFreq' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 125.600 MHz / Kênh 7.150 GHz"
                value={data.spec.channelFreq || ''}
                onChange={(e) => updateSpec('channelFreq', e.target.value)}
                className="form-input-standard font-mono font-semibold text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Network and Remote Management Configuration */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4">
            <Network className="w-4 h-4 text-blue-600" />
            Cấu hình Mạng, Địa chỉ IP & Giao thức Giám sát (NMS)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-700">Chuẩn giao tiếp / Giao thức kết nối</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: VoIP ED-137B/C, E1 G.703, RS232, Audio 600 Ohm Balanced, E&M"
                value={data.spec.interface}
                onChange={(e) => updateSpec('interface', e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Địa chỉ IP Quản lý (Management IP)</label>
                {data.spec.mgmtIp && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.mgmtIp, 'mgmtIp')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'mgmtIp' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'mgmtIp' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 192.168.10.15"
                value={data.spec.mgmtIp}
                onChange={(e) => updateSpec('mgmtIp', e.target.value)}
                className="form-input-standard font-mono font-semibold text-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">VLAN ID / Phân đoạn mạng</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: VLAN 200 (VHF-DATA)"
                value={data.spec.vlanId || ''}
                onChange={(e) => updateSpec('vlanId', e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Subnet Mask</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 255.255.255.0"
                value={data.spec.subnetMask || ''}
                onChange={(e) => updateSpec('subnetMask', e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Default Gateway</label>
                {data.spec.gateway && (
                  <button
                    type="button"
                    onClick={() => handleCopy(data.spec.gateway || '', 'gateway')}
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'gateway' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedKey === 'gateway' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 192.168.10.1"
                value={data.spec.gateway || ''}
                onChange={(e) => updateSpec('gateway', e.target.value)}
                className="form-input-standard font-mono"
              />
            </div>
          </div>
        </div>

        {/* Environmental & Operating Limits */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4">
            <Radio className="w-4 h-4 text-blue-600" />
            Điều kiện môi trường & Giới hạn khai thác
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Nhiệt độ môi trường làm việc</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: -10°C đến +55°C (Tiêu chuẩn phòng máy lạnh 22°C ± 2°C)"
                value={data.spec.tempLimit || ''}
                onChange={(e) => updateSpec('tempLimit', e.target.value)}
                className="form-input-standard"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Độ ẩm tương đối</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="VD: 10% - 90% không ngưng tụ"
                value={data.spec.humidityLimit || ''}
                onChange={(e) => updateSpec('humidityLimit', e.target.value)}
                className="form-input-standard"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
