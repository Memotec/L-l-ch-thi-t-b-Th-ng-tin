import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Radio, 
  Network, 
  Sparkles, 
  Terminal, 
  Wifi, 
  Layers, 
  Check, 
  Copy,
  Loader2
} from 'lucide-react';
import { EquipmentData } from '../types';

interface SpecTabProps {
  data: EquipmentData;
  onChange: (updated: EquipmentData) => void;
}

export const SpecTab: React.FC<SpecTabProps> = ({ data, onChange }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const updateSpec = (field: string, value: string) => {
    onChange({
      ...data,
      spec: {
        ...data.spec,
        [field]: value
      }
    });
  };

  const handleFetchAiSpecs = async () => {
    setLoadingAi(true);
    setAiSuggestion(null);
    try {
      const response = await fetch('/api/ai/suggest-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: data.general.category,
          model: data.general.model,
          manufacturer: data.general.manufacturer
        })
      });
      const result = await response.json();
      if (result.suggestion) {
        setAiSuggestion(result.suggestion);
      }
    } catch (err) {
      console.error('Error getting AI specs:', err);
      setAiSuggestion('Không thể kết nối tới máy chủ phân tích AI. Vui lòng kiểm tra lại cấu hình.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. System Architecture & Core Specs */}
      <div className="bg-[#091533] rounded-xl border border-[#182d5a] shadow-md p-6">
        <div className="flex items-center justify-between border-b border-[#182d5a] pb-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              2. Đặc tính kỹ thuật & Cấu hình chuyên sâu
            </h2>
            <p className="text-xs text-sky-200/70 mt-0.5">Kiến trúc hệ thống, thông số nguồn điện, RF, mạng và giao thức điều khiển</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-sky-200">
              Mô tả chung về kiến trúc hệ thống / thông số cấu hình cốt lõi
            </label>
            <textarea
              rows={3}
              placeholder="Nhập kiến trúc hệ thống, nguyên lý hoạt động, chế độ dự phòng 1+1, công nghệ xử lý DSP..."
              value={data.spec.text}
              onChange={(e) => updateSpec('text', e.target.value)}
              className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Điện áp nguồn cung cấp
              </label>
              <input
                type="text"
                placeholder="VD: 220VAC ± 10% / -48VDC"
                value={data.spec.power}
                onChange={(e) => updateSpec('power', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Công suất tiêu thụ / phát (RF/Power)
              </label>
              <input
                type="text"
                placeholder="VD: RF 50W AM / Tiêu thụ 180VA"
                value={data.spec.output}
                onChange={(e) => updateSpec('output', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Dải tần số / Băng thông / Thông lượng
              </label>
              <input
                type="text"
                placeholder="VD: 118.000 - 136.975 MHz / 350 Mbps"
                value={data.spec.range}
                onChange={(e) => updateSpec('range', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Tần số làm việc / Kênh khai thác
              </label>
              <input
                type="text"
                placeholder="VD: 125.600 MHz / Kênh 7.150 GHz"
                value={data.spec.channelFreq || ''}
                onChange={(e) => updateSpec('channelFreq', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono font-bold text-sky-300 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Network and Remote Management Configuration */}
        <div className="mt-6 pt-5 border-t border-[#182d5a]">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
            <Network className="w-4 h-4 text-sky-400" />
            Cấu hình Mạng, Địa chỉ IP & Giao thức Giám sát (NMS)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-sky-200">Chuẩn giao tiếp / Giao thức kết nối</label>
              <input
                type="text"
                placeholder="VD: VoIP ED-137B/C, E1 G.703, RS232, Audio 600 Ohm Balanced, E&M"
                value={data.spec.interface}
                onChange={(e) => updateSpec('interface', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Địa chỉ IP Quản lý (Management IP)</label>
              <input
                type="text"
                placeholder="VD: 192.168.10.15"
                value={data.spec.mgmtIp}
                onChange={(e) => updateSpec('mgmtIp', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono font-bold text-sky-300 focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">VLAN ID / Phân đoạn mạng</label>
              <input
                type="text"
                placeholder="VD: VLAN 200 (VHF-DATA)"
                value={data.spec.vlanId || ''}
                onChange={(e) => updateSpec('vlanId', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Subnet Mask</label>
              <input
                type="text"
                placeholder="VD: 255.255.255.0"
                value={data.spec.subnetMask || ''}
                onChange={(e) => updateSpec('subnetMask', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Default Gateway</label>
              <input
                type="text"
                placeholder="VD: 192.168.10.1"
                value={data.spec.gateway || ''}
                onChange={(e) => updateSpec('gateway', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">Phiên bản Firmware / DSP</label>
              <input
                type="text"
                placeholder="VD: v4.32.08-DSP2.1"
                value={data.spec.firmware}
                onChange={(e) => updateSpec('firmware', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sky-200">SNMP Community / Port</label>
              <input
                type="text"
                placeholder="VD: cns_snmp_v2 / Port 161"
                value={data.spec.snmpCommunity || ''}
                onChange={(e) => updateSpec('snmpCommunity', e.target.value)}
                className="w-full text-xs bg-[#050c1e] border border-[#1e3c7a] rounded-lg p-2.5 font-mono text-white focus:bg-[#0c1a3b] focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
