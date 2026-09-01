import React, { useState } from 'react';
import { 
  Cloud, 
  FileSpreadsheet, 
  FileText, 
  HardDrive, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  FileCode,
  Globe,
  HelpCircle,
  FolderArchive,
  Code2,
  FileJson
} from 'lucide-react';
import { EquipmentData } from '../types';
import { generateGasCode, generateGasHtml, generateAppsscriptJson } from '../utils/gasGenerator';

interface GoogleWorkspaceTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  onSyncFromGas: (equipments: EquipmentData[]) => void;
  onShowToast: (msg: string) => void;
}

const GAS_URL_STORAGE_KEY = 'cns_gas_webapp_url_v1';

export const GoogleWorkspaceTab: React.FC<GoogleWorkspaceTabProps> = ({
  currentEquipment,
  allEquipments,
  onSyncFromGas,
  onShowToast
}) => {
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(GAS_URL_STORAGE_KEY) || '';
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'guide' | 'codegs' | 'indexhtml' | 'manifest'>('guide');
  const [generatedDocResult, setGeneratedDocResult] = useState<{ docUrl: string; pdfDownloadUrl: string; docName: string } | null>(null);
  const [driveBackupResult, setDriveBackupResult] = useState<{ fileUrl: string; folderUrl: string; fileName: string } | null>(null);

  const gasCode = generateGasCode();
  const gasHtml = generateGasHtml();
  const appsscriptJson = generateAppsscriptJson();

  // Save GAS URL to local storage
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
  };

  // Test GAS connection
  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng nhập đường dẫn Google Apps Script Web App URL');
      return;
    }

    setConnectionStatus('testing');
    setIsConnecting(true);
    setLastActionStatus('Đang kiểm tra kết nối tới Google Apps Script...');

    try {
      // Append ping action
      const pingUrl = gasUrl.includes('?') 
        ? `${gasUrl}&action=ping` 
        : `${gasUrl}?action=ping`;

      const response = await fetch(pingUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result && (result.status === 'online' || result.success)) {
        setConnectionStatus('connected');
        setConnectionInfo(result);
        setLastActionStatus('✓ Kết nối Google Apps Script & Google Sheet thành công!');
        onShowToast('✓ Đã kết nối thành công tới Google Apps Script!');
      } else {
        throw new Error(result.message || 'Phản hồi không hợp lệ từ script');
      }
    } catch (err: any) {
      console.error('GAS connection error:', err);
      setConnectionStatus('error');
      setLastActionStatus(`✗ Lỗi kết nối: ${err.message || 'Không thể kết nối. Hãy kiểm tra URL hoặc phân quyền Web App.'}`);
      onShowToast('✗ Không thể kết nối tới Google Apps Script.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Upload (Push) all equipment data to Google Sheets via GAS
  const handleSyncUpToSheets = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng nhập URL Google Apps Script Web App trước khi đồng bộ.');
      return;
    }

    setIsSyncingUp(true);
    setLastActionStatus('Đang đồng bộ cơ sở dữ liệu lên Google Sheets & Drive...');

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // GAS accepts text/plain to avoid CORS preflight issues
        },
        body: JSON.stringify({
          action: 'saveAllEquipments',
          equipments: allEquipments
        })
      });

      const result = await response.json();
      if (result && result.success) {
        setLastActionStatus(`✓ Đã lưu thành công ${allEquipments.length} hồ sơ thiết bị vào Google Sheet!`);
        onShowToast(`✓ Đã đồng bộ ${allEquipments.length} thiết bị lên Google Sheet!`);
      } else {
        throw new Error(result.message || 'Lỗi khi lưu dữ liệu lên Google Sheet');
      }
    } catch (err: any) {
      console.error('GAS push error:', err);
      setLastActionStatus(`✗ Lỗi đồng bộ lên Sheet: ${err.message}`);
      onShowToast('✗ Lỗi khi tải dữ liệu lên Google Sheets');
    } finally {
      setIsSyncingUp(false);
    }
  };

  // Download (Pull) equipment data from Google Sheets via GAS
  const handleSyncDownFromSheets = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng nhập URL Google Apps Script Web App.');
      return;
    }

    setIsSyncingDown(true);
    setLastActionStatus('Đang tải dữ liệu thiết bị từ Google Sheets...');

    try {
      const pullUrl = gasUrl.includes('?') 
        ? `${gasUrl}&action=getAllEquipments` 
        : `${gasUrl}?action=getAllEquipments`;

      const response = await fetch(pullUrl, {
        method: 'GET',
        mode: 'cors'
      });

      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        if (result.data.length === 0) {
          onShowToast('Google Sheet hiện chưa có dữ liệu nào.');
          setLastActionStatus('Google Sheet trống, chưa có dữ liệu thiết bị.');
          return;
        }

        const confirmUpdate = window.confirm(
          `Tìm thấy ${result.data.length} thiết bị từ Google Sheet. Bạn có muốn cập nhật vào ứng dụng?`
        );

        if (confirmUpdate) {
          onSyncFromGas(result.data);
          setLastActionStatus(`✓ Đã nạp thành công ${result.data.length} thiết bị từ Google Sheet!`);
          onShowToast(`✓ Đã cập nhật ${result.data.length} thiết bị từ Google Sheet!`);
        }
      } else {
        throw new Error(result.message || 'Dữ liệu không hợp lệ từ Google Sheet');
      }
    } catch (err: any) {
      console.error('GAS pull error:', err);
      setLastActionStatus(`✗ Lỗi tải dữ liệu: ${err.message}`);
      onShowToast('✗ Lỗi tải dữ liệu từ Google Sheets');
    } finally {
      setIsSyncingDown(false);
    }
  };

  // Generate Google Doc via GAS
  const handleGenerateGoogleDoc = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng kết nối Google Apps Script Web App để tạo Google Doc.');
      return;
    }

    setIsGeneratingDoc(true);
    setGeneratedDocResult(null);
    setLastActionStatus(`Đang tạo Google Doc cho thiết bị "${currentEquipment.general.name}"...`);

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'createGoogleDoc',
          equipment: currentEquipment
        })
      });

      const result = await response.json();
      if (result && result.success && result.docUrl) {
        setGeneratedDocResult({
          docUrl: result.docUrl,
          pdfDownloadUrl: result.pdfDownloadUrl,
          docName: result.docName
        });
        setLastActionStatus(`✓ Đã xuất bản Google Doc: "${result.docName}"`);
        onShowToast('✓ Đã tạo Google Doc trên Google Drive thành công!');
      } else {
        throw new Error(result.message || 'Không nhận được đường link Google Doc');
      }
    } catch (err: any) {
      console.error('GAS Doc error:', err);
      setLastActionStatus(`✗ Lỗi tạo Google Doc: ${err.message}`);
      onShowToast('✗ Lỗi khi tạo tài liệu Google Doc');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Create Backup in Google Drive via GAS
  const handleBackupToDrive = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng kết nối Google Apps Script Web App để sao lưu Drive.');
      return;
    }

    setIsBackingUpDrive(true);
    setDriveBackupResult(null);
    setLastActionStatus('Đang sao lưu JSON toàn bộ thiết bị vào Google Drive...');

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'backupToDrive',
          equipments: allEquipments
        })
      });

      const result = await response.json();
      if (result && result.success && result.fileUrl) {
        setDriveBackupResult({
          fileUrl: result.fileUrl,
          folderUrl: result.folderUrl,
          fileName: result.fileName
        });
        setLastActionStatus(`✓ Đã lưu file backup: "${result.fileName}" vào thư mục Drive`);
        onShowToast('✓ Đã sao lưu an toàn vào Google Drive!');
      } else {
        throw new Error(result.message || 'Lỗi tạo file sao lưu Drive');
      }
    } catch (err: any) {
      console.error('GAS Drive backup error:', err);
      setLastActionStatus(`✗ Lỗi sao lưu Drive: ${err.message}`);
      onShowToast('✗ Lỗi khi sao lưu Google Drive');
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  // Copy Code.gs
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasCode);
    setCopiedCode(true);
    onShowToast('✓ Đã sao chép toàn bộ mã nguồn Code.gs vào bộ nhớ đệm!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Copy Index.html
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(gasHtml);
    setCopiedHtml(true);
    onShowToast('✓ Đã sao chép toàn bộ mã nguồn Index.html vào bộ nhớ đệm!');
    setTimeout(() => setCopiedHtml(false), 3000);
  };

  // Copy Manifest
  const handleCopyJson = () => {
    navigator.clipboard.writeText(appsscriptJson);
    setCopiedJson(true);
    onShowToast('✓ Đã sao chép file appsscript.json!');
    setTimeout(() => setCopiedJson(false), 3000);
  };

  // Download Code.gs file
  const handleDownloadCode = () => {
    const blob = new Blob([gasCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('✓ Đã tải xuống file Code.gs');
  };

  // Download Index.html file
  const handleDownloadHtml = () => {
    const blob = new Blob([gasHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Index.html';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('✓ Đã tải xuống file Index.html');
  };

  // Download appsscript.json
  const handleDownloadManifest = () => {
    const blob = new Blob([appsscriptJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appsscript.json';
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('✓ Đã tải xuống file appsscript.json');
  };

  // Export current equipment CSV for Google Sheets
  const handleExportCsv = (type: 'master' | 'components' | 'maintenance' | 'repair') => {
    let csvContent = '';
    let filename = '';

    if (type === 'master') {
      filename = `CNS_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['ID', 'TenThietBi', 'Model', 'HangSanXuat', 'Serial', 'MaTaiSan', 'ChungLoai', 'TrangThai', 'ViTri', 'KySuPhuTrach'];
      const rows = allEquipments.map(e => [
        `"${e.id}"`,
        `"${e.general.name || ''}"`,
        `"${e.general.model || ''}"`,
        `"${e.general.manufacturer || ''}"`,
        `"${e.general.serial || ''}"`,
        `"${e.general.assetNo || ''}"`,
        `"${e.general.category || ''}"`,
        `"${e.general.status || ''}"`,
        `"${e.org.location || ''}"`,
        `"${e.org.primaryEngineer || ''}"`
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'components') {
      filename = `CNS_LinhKien_${currentEquipment.general.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const headers = ['STT', 'TenLinhKien', 'PartNo', 'Serial', 'DonViTinh', 'SoLuong', 'TinhTrang', 'GhiChu'];
      const rows = (currentEquipment.components || []).map((c, i) => [
        `"${c.no || i + 1}"`,
        `"${c.name || ''}"`,
        `"${c.partNo || ''}"`,
        `"${c.serial || ''}"`,
        `"${c.unit || 'Bộ'}"`,
        `"${c.qty || 1}"`,
        `"${c.healthStatus || 'Tốt'}"`,
        `"${c.note || ''}"`
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'maintenance') {
      filename = `CNS_BaoDuong_${currentEquipment.general.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const headers = ['Ngay', 'ChuKy', 'NoiDung', 'ThongSoDoDac', 'KetLuan', 'NguoiThucHien', 'GiamSat'];
      const rows = (currentEquipment.maintenance || []).map(m => [
        `"${m.date || ''}"`,
        `"${m.cycle || ''}"`,
        `"${m.content || ''}"`,
        `"${m.measuredParams || ''}"`,
        `"${m.result || ''}"`,
        `"${m.person || ''}"`,
        `"${m.supervisor || ''}"`
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else {
      filename = `CNS_SuaChua_${currentEquipment.general.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      const headers = ['NgayPhatSinh', 'NgayHoanThanh', 'PhanLoai', 'HienTuong', 'NguyenNhan', 'BienPhapXuLy', 'VatTuThayThe', 'NguoiThucHien', 'TrangThai'];
      const rows = (currentEquipment.repair || []).map(r => [
        `"${r.date || ''}"`,
        `"${r.resolvedDate || ''}"`,
        `"${r.type || ''}"`,
        `"${r.incidentDescription || ''}"`,
        `"${r.rootCause || ''}"`,
        `"${r.actionTaken || ''}"`,
        `"${r.replacedParts || ''}"`,
        `"${r.person || ''}"`,
        `"${r.status || ''}"`
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast(`✓ Đã xuất file CSV: ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#040a1c] via-[#091533] to-[#0c183a] text-white p-6 rounded-2xl shadow-md border border-[#182d5a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400 border border-sky-400/30 shrink-0">
            <Cloud className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Trung Tâm Google Apps Script & Google Workspace</h2>
              <span className="px-2 py-0.5 bg-sky-500/30 text-sky-300 rounded text-xs font-semibold border border-sky-400/40">
                Sheets • Docs • Drive • Code.gs & HTML
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
              Trọn bộ mã nguồn <b>Code.gs</b> (Backend) và <b>Index.html</b> (Frontend) để chạy ứng dụng quản lý Sổ Lý Lịch trực tiếp bên trong Google Sheets hoặc triển khai độc lập dưới dạng Google Apps Script Web App.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          <button
            onClick={() => setActiveCodeTab('codegs')}
            className="flex-1 md:flex-none px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span>Xem Code.gs</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('indexhtml')}
            className="flex-1 md:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>Xem Index.html</span>
          </button>
        </div>
      </div>

      {/* Connection & Live Sync Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Col: Web App URL Configuration */}
        <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#182d5a] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-950 rounded-lg text-sky-400 border border-sky-800">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Kết Nối Web App Script</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {connectionStatus === 'connected' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đã kết nối
                </span>
              ) : connectionStatus === 'testing' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/50">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Đang thử
                </span>
              ) : connectionStatus === 'error' ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-600/50">
                  <AlertCircle className="w-3 h-3" />
                  Lỗi kết nối
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-300 bg-[#060e24] px-2 py-0.5 rounded-full border border-[#1e3c7a]">
                  Chưa kết nối
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sky-200 block">
              Google Apps Script Web App URL:
            </label>
            <div className="relative">
              <input
                type="text"
                value={gasUrl}
                onChange={(e) => handleSaveGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full text-xs font-mono bg-[#050c1e] border border-[#1e3c7a] rounded-xl px-3 py-2.5 focus:bg-[#0c1a3b] focus:outline-none focus:ring-2 focus:ring-sky-400 text-white placeholder:text-slate-500"
              />
            </div>
            <p className="text-[11px] text-sky-200/60">
              Nhận URL này sau khi bấm <i>Deploy &gt; New deployment &gt; Web app (Anyone)</i> trên Google Apps Script.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={isConnecting || !gasUrl.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>
          </div>

          {connectionInfo && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Google Sheet ID đã liên kết:
              </div>
              <div className="font-mono text-[10px] text-emerald-200 break-all bg-[#040a1c] p-1.5 rounded border border-emerald-800">
                {connectionInfo.spreadsheetId || 'Active Spreadsheet'}
              </div>
              {connectionInfo.spreadsheetName && (
                <div className="text-[11px] text-emerald-300">
                  Tên file: <b>{connectionInfo.spreadsheetName}</b>
                </div>
              )}
            </div>
          )}

          {lastActionStatus && (
            <div className={`p-3 rounded-xl text-xs border ${
              lastActionStatus.startsWith('✓') 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' 
                : lastActionStatus.startsWith('✗')
                ? 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                : 'bg-[#060e24] text-slate-300 border-[#182d5a]'
            }`}>
              <div className="font-medium">{lastActionStatus}</div>
            </div>
          )}
        </div>

        {/* Right Col: Cloud Operations (Sync, Export Doc, Backup Drive) */}
        <div className="lg:col-span-2 bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#182d5a] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-800">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tác Vụ Tự Động Hóa Google Workspace</h3>
                <p className="text-[11px] text-sky-200/70">Đồng bộ dữ liệu và xuất bản tài liệu thời gian thực</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-200 bg-[#060e24] px-2.5 py-1 rounded-lg border border-[#1e3c7a]">
              Đang chọn: <b className="text-white">{currentEquipment.general.name}</b>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Push to Google Sheets */}
            <div className="p-4 rounded-xl border border-[#182d5a] hover:border-sky-400/50 transition-all bg-[#060e24] space-y-2">
              <div className="flex items-center gap-2.5 text-sky-400 font-bold text-xs">
                <div className="p-1.5 bg-sky-950 rounded-md text-sky-300 border border-sky-800">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span>1. Đồng bộ lên Google Sheets</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Ghi toàn bộ {allEquipments.length} thiết bị vào các bảng <i>ThongTinChung, ThanhPhan, BaoDuong, SuaChua</i>.
              </p>
              <button
                onClick={handleSyncUpToSheets}
                disabled={isSyncingUp || !gasUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${isSyncingUp ? 'animate-spin' : ''}`} />
                <span>{isSyncingUp ? 'Đang gửi dữ liệu...' : 'Lưu lên Google Sheets'}</span>
              </button>
            </div>

            {/* Card 2: Pull from Google Sheets */}
            <div className="p-4 rounded-xl border border-[#182d5a] hover:border-emerald-400/50 transition-all bg-[#060e24] space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs">
                <div className="p-1.5 bg-emerald-950 rounded-md text-emerald-300 border border-emerald-800">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span>2. Tải dữ liệu từ Google Sheets</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Đọc dữ liệu mới nhất từ Google Sheets và cập nhật vào ứng dụng làm việc cục bộ.
              </p>
              <button
                onClick={handleSyncDownFromSheets}
                disabled={isSyncingDown || !gasUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isSyncingDown ? 'animate-spin' : ''}`} />
                <span>{isSyncingDown ? 'Đang đọc Sheets...' : 'Tải về từ Google Sheets'}</span>
              </button>
            </div>

            {/* Card 3: Generate Google Doc */}
            <div className="p-4 rounded-xl border border-[#182d5a] hover:border-indigo-400/50 transition-all bg-[#060e24] space-y-2">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs">
                <div className="p-1.5 bg-indigo-950 rounded-md text-indigo-300 border border-indigo-800">
                  <FileText className="w-4 h-4" />
                </div>
                <span>3. Tạo Google Doc Sổ Lý Lịch</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tự động tạo file Google Docs với đầy đủ Quốc hiệu, Tiêu ngữ, Bảng đặc tính, Linh kiện và Khối chữ ký.
              </p>
              <button
                onClick={handleGenerateGoogleDoc}
                disabled={isGeneratingDoc || !gasUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                <span>{isGeneratingDoc ? 'Đang tạo Google Doc...' : 'Tạo Google Doc trên Drive'}</span>
              </button>
            </div>

            {/* Card 4: Backup JSON to Google Drive */}
            <div className="p-4 rounded-xl border border-[#182d5a] hover:border-amber-400/50 transition-all bg-[#060e24] space-y-2">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs">
                <div className="p-1.5 bg-amber-950 rounded-md text-amber-300 border border-amber-800">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span>4. Sao Lưu Bản Ghi vào Google Drive</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tạo bản sao lưu JSON timestamp trong thư mục <code>CNS_LyLichThietBi_Backups</code> trên Google Drive.
              </p>
              <button
                onClick={handleBackupToDrive}
                disabled={isBackingUpDrive || !gasUrl.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <FolderArchive className={`w-3.5 h-3.5 ${isBackingUpDrive ? 'animate-spin' : ''}`} />
                <span>{isBackingUpDrive ? 'Đang sao lưu...' : 'Sao lưu vào Drive'}</span>
              </button>
            </div>
          </div>

          {/* Result Alert: Generated Google Doc Links */}
          {generatedDocResult && (
            <div className="p-4 bg-indigo-950/70 border border-indigo-600/50 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Google Doc Đã Được Tạo Thành Công:</span>
                </div>
                <span className="text-[11px] text-indigo-300 font-mono font-medium truncate max-w-xs">
                  {generatedDocResult.docName}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={generatedDocResult.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Google Docs để chỉnh sửa</span>
                </a>
                <a
                  href={generatedDocResult.pdfDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060e24] hover:bg-[#0c183a] text-indigo-200 border border-indigo-500/50 text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tải trực tiếp file PDF từ Drive</span>
                </a>
              </div>
            </div>
          )}

          {/* Result Alert: Drive Backup Link */}
          {driveBackupResult && (
            <div className="p-4 bg-amber-950/70 border border-amber-600/50 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>File Sao Lưu Đã Được Lưu Trữ Trên Google Drive:</span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono font-medium truncate max-w-xs">
                  {driveBackupResult.fileName}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={driveBackupResult.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem file Backup trên Google Drive</span>
                </a>
                <a
                  href={driveBackupResult.folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060e24] hover:bg-[#0c183a] text-amber-200 border border-amber-500/50 text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mở thư mục sao lưu</span>
                </a>
              </div>
            </div>
          )}

          {/* Offline CSV Exporters */}
          <div className="pt-2 border-t border-[#182d5a] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-sky-200">Xuất file CSV cho Google Sheets:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleExportCsv('master')}
                className="px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 text-[11px] font-medium rounded border border-[#1e3c7a] transition-colors cursor-pointer"
                title="Xuất bảng thông tin tổng hợp tất cả thiết bị"
              >
                CSV Master
              </button>
              <button
                onClick={() => handleExportCsv('components')}
                className="px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 text-[11px] font-medium rounded border border-[#1e3c7a] transition-colors cursor-pointer"
                title="Xuất bảng thành phần & linh kiện thiết bị hiện tại"
              >
                CSV Linh kiện
              </button>
              <button
                onClick={() => handleExportCsv('maintenance')}
                className="px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 text-[11px] font-medium rounded border border-[#1e3c7a] transition-colors cursor-pointer"
                title="Xuất nhật ký bảo dưỡng định kỳ"
              >
                CSV Bảo dưỡng
              </button>
              <button
                onClick={() => handleExportCsv('repair')}
                className="px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 text-[11px] font-medium rounded border border-[#1e3c7a] transition-colors cursor-pointer"
                title="Xuất nhật ký sửa chữa & biến động"
              >
                CSV Sửa chữa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspector & Setup Guide Tabs */}
      <div className="bg-[#091533] rounded-2xl border border-[#182d5a] shadow-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#182d5a] bg-[#071128] px-5 py-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCodeTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCodeTab === 'guide'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#0e1d44]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>1. Hướng Dẫn Cài Đặt</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('codegs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCodeTab === 'codegs'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#0e1d44]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>2. Mã Nguồn Code.gs</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('indexhtml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCodeTab === 'indexhtml'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#0e1d44]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>3. Mã Giao Diện Index.html</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('manifest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCodeTab === 'manifest'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#0e1d44]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>4. appsscript.json</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeCodeTab === 'codegs' && (
              <>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép Code.gs'}</span>
                </button>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tải Code.gs</span>
                </button>
              </>
            )}

            {activeCodeTab === 'indexhtml' && (
              <>
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHtml ? 'Đã chép' : 'Sao chép Index.html'}</span>
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tải Index.html</span>
                </button>
              </>
            )}

            {activeCodeTab === 'manifest' && (
              <>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Đã chép' : 'Sao chép JSON'}</span>
                </button>
                <button
                  onClick={handleDownloadManifest}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#060e24] hover:bg-[#12224d] text-sky-200 rounded-md border border-[#1e3c7a] text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tải manifest</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Step-by-step Setup Guide */}
        {activeCodeTab === 'guide' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-[#060e24] border border-[#182d5a] relative flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-sm">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Mở Google Sheets & Apps Script</h4>
                  <p className="text-xs text-sky-200/70 leading-relaxed">
                    1. Mở trang tính <b>Google Sheets</b> trên Google Drive của bạn.<br />
                    2. Trên thanh menu chọn <b>Tiện ích mở rộng (Extensions)</b> &gt; <b>Apps Script</b>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-[#060e24] border border-[#182d5a] relative flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-sm">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Dán Mã Code.gs</h4>
                  <p className="text-xs text-sky-200/70 leading-relaxed">
                    1. Mở file <code>Code.gs</code> trong trình soạn thảo Apps Script.<br />
                    2. Bấm nút <b>"Sao chép Code.gs"</b> ở tab trên và Dán (Ctrl+V) vào.<br />
                    3. Bấm <b>Lưu (Ctrl+S)</b>.
                  </p>
                </div>
                <button
                  onClick={() => setActiveCodeTab('codegs')}
                  className="mt-3 text-[11px] font-semibold text-sky-400 hover:underline text-left cursor-pointer"
                >
                  → Xem mã Code.gs
                </button>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-[#060e24] border border-[#182d5a] relative flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-sm">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Tạo File Index.html</h4>
                  <p className="text-xs text-sky-200/70 leading-relaxed">
                    1. Trong Apps Script, bấm dấu <b>+ (Thêm tệp)</b> &gt; Chọn <b>HTML</b> &gt; Đặt tên là <code>Index</code>.<br />
                    2. Bấm nút <b>"Sao chép Index.html"</b> và Dán vào file.<br />
                    3. Bấm <b>Lưu (Ctrl+S)</b>.
                  </p>
                </div>
                <button
                  onClick={() => setActiveCodeTab('indexhtml')}
                  className="mt-3 text-[11px] font-semibold text-indigo-400 hover:underline text-left cursor-pointer"
                >
                  → Xem mã Index.html
                </button>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-[#060e24] border border-[#182d5a] relative flex flex-col justify-between">
                <div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3 shadow-sm">
                    4
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Triển Khai Web App</h4>
                  <p className="text-xs text-sky-200/70 leading-relaxed">
                    1. Bấm <b>Triển khai (Deploy)</b> &gt; <b>Tùy chọn triển khai mới (New deployment)</b>.<br />
                    2. Chọn loại <b>Ứng dụng web (Web app)</b>.<br />
                    3. Chọn quyền <b>Người có quyền truy cập (Who has access)</b>: <b>Bất kỳ ai (Anyone)</b>.<br />
                    4. Nhấn <b>Triển khai</b> và lấy link Web App.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#060e24] border border-sky-500/30 rounded-xl text-xs space-y-2 text-white">
              <div className="font-bold flex items-center gap-1.5 text-sky-300">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Bảo mật & Quyền riêng tư dữ liệu:</span>
              </div>
              <p className="leading-relaxed text-sky-200/75">
                Toàn bộ dữ liệu sổ lý lịch và tài liệu được lưu trực tiếp trên <b>Google Drive và Google Sheets thuộc tài khoản của bạn</b>. 
                Ứng dụng web không lưu trữ dữ liệu trung gian trên bất kỳ máy chủ bên thứ ba nào. Bạn có toàn quyền quản lý, phân quyền chia sẻ hoặc thu hồi quyền truy cập bất kỳ lúc nào trong Google Drive.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Code.gs Viewer */}
        {activeCodeTab === 'codegs' && (
          <div className="p-4 bg-[#040a1c] text-sky-100 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-[#182d5a]">
            <pre>{gasCode}</pre>
          </div>
        )}

        {/* Tab 3: Index.html Viewer */}
        {activeCodeTab === 'indexhtml' && (
          <div className="p-4 bg-[#040a1c] text-sky-100 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-[#182d5a]">
            <pre>{gasHtml}</pre>
          </div>
        )}

        {/* Tab 4: appsscript.json Viewer */}
        {activeCodeTab === 'manifest' && (
          <div className="p-4 bg-[#040a1c] text-sky-100 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-[#182d5a]">
            <pre>{appsscriptJson}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
