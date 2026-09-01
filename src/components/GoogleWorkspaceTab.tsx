import React, { useState, useEffect } from 'react';
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
  FolderCheck,
  Share2,
  KeyRound,
  FileCheck2
} from 'lucide-react';
import { EquipmentData } from '../types';
import { generateGasCode, generateGasHtml, generateAppsscriptJson } from '../utils/gasGenerator';
import { googleDriveDocsService, GoogleDocSyncResult } from '../utils/googleDriveDocsService';

interface GoogleWorkspaceTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  onSyncFromGas: (equipments: EquipmentData[]) => void;
  onUpdateCurrentEquipment?: (eq: EquipmentData) => void;
  onShowToast: (msg: string) => void;
}

const GAS_URL_STORAGE_KEY = 'cns_gas_webapp_url_v1';
const AUTO_SYNC_STORAGE_KEY = 'cns_auto_sync_gdoc_on_change_v1';

export const GoogleWorkspaceTab: React.FC<GoogleWorkspaceTabProps> = ({
  currentEquipment,
  allEquipments,
  onSyncFromGas,
  onUpdateCurrentEquipment,
  onShowToast
}) => {
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(GAS_URL_STORAGE_KEY) || '';
  });

  const [autoSyncOnChange, setAutoSyncOnChange] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_SYNC_STORAGE_KEY) === 'true';
  });

  // Direct Google Drive / Docs State
  const [isDriveAuthorized, setIsDriveAuthorized] = useState<boolean>(false);
  const [isAuthorizingDrive, setIsAuthorizingDrive] = useState<boolean>(false);
  const [isSyncingDirectDoc, setIsSyncingDirectDoc] = useState<boolean>(false);
  const [isBatchSyncingDocs, setIsBatchSyncingDocs] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [directDocResult, setDirectDocResult] = useState<GoogleDocSyncResult | null>(null);

  // Google Apps Script Web App State
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
  const [activeCodeTab, setActiveCodeTab] = useState<'directDrive' | 'gasSync' | 'guide' | 'codegs' | 'indexhtml' | 'manifest'>('directDrive');
  const [generatedDocResult, setGeneratedDocResult] = useState<{ docUrl: string; pdfDownloadUrl: string; docName: string; isOverwritten?: boolean } | null>(null);
  const [driveBackupResult, setDriveBackupResult] = useState<{ fileUrl: string; folderUrl: string; fileName: string } | null>(null);

  const gasCode = generateGasCode();
  const gasHtml = generateGasHtml();
  const appsscriptJson = generateAppsscriptJson();

  // Check direct Google Drive authorization
  useEffect(() => {
    googleDriveDocsService.loadScripts().then(() => {
      setIsDriveAuthorized(googleDriveDocsService.isAuthorized());
    }).catch((err) => {
      console.warn('Google scripts load warning:', err);
    });
  }, []);

  // Save GAS URL to local storage
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
  };

  // Toggle auto-sync setting
  const handleToggleAutoSync = (val: boolean) => {
    setAutoSyncOnChange(val);
    localStorage.setItem(AUTO_SYNC_STORAGE_KEY, String(val));
    onShowToast(val 
      ? '✓ Đã kích hoạt: Tự động ghi đè & đồng bộ Google Doc khi có thay đổi' 
      : 'Đã tắt chế độ tự động đồng bộ Google Doc'
    );
  };

  // Connect / Authorize Direct Google Drive & Docs API
  const handleAuthorizeDrive = async () => {
    setIsAuthorizingDrive(true);
    try {
      await googleDriveDocsService.requestAccessToken();
      setIsDriveAuthorized(true);
      onShowToast('✓ Kết nối tài khoản Google Drive & Google Docs thành công!');
      setLastActionStatus('✓ Đã xác thực thành công Google Drive. Quyền lưu trữ thư mục tập trung đã sẵn sàng.');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      onShowToast(`✗ Không thể kết nối Google: ${err.message || 'Hủy bỏ'}`);
    } finally {
      setIsAuthorizingDrive(false);
    }
  };

  // Direct Sync current equipment to Google Doc (Central Folder on Google Drive)
  const handleDirectSyncDoc = async () => {
    setIsSyncingDirectDoc(true);
    setLastActionStatus(`Đang tạo/đồng bộ Google Doc tập trung cho "${currentEquipment.general.name}"...`);
    try {
      const result = await googleDriveDocsService.syncEquipmentToGoogleDoc(currentEquipment);
      setDirectDocResult(result);
      setIsDriveAuthorized(true);

      // Update equipment record with doc URLs if needed
      if (onUpdateCurrentEquipment) {
        onUpdateCurrentEquipment({
          ...currentEquipment,
          googleDocUrl: result.docUrl,
          googleDocPdfUrl: result.pdfDownloadUrl,
          updatedAt: new Date().toISOString()
        });
      }

      const msg = result.isOverwritten
        ? `✓ Đã tự động ghi đè & cập nhật Google Doc: "${result.docTitle}"`
        : `✓ Đã tạo Google Doc mới trong thư mục tập trung Google Drive!`;
      setLastActionStatus(msg);
      onShowToast(msg);
    } catch (err: any) {
      console.error('Direct Doc Sync Error:', err);
      setLastActionStatus(`✗ Lỗi đồng bộ Google Docs: ${err.message}`);
      onShowToast(`✗ Lỗi đồng bộ: ${err.message}`);
    } finally {
      setIsSyncingDirectDoc(false);
    }
  };

  // Direct Batch Sync all equipments to central Google Drive folder
  const handleBatchSyncAllDocs = async () => {
    const confirmBatch = window.confirm(
      `Bạn có muốn đồng bộ/ghi đè toàn bộ ${allEquipments.length} thiết bị vào thư mục tập trung "CNS_SoLyLich_GoogleDocs" trên Google Drive?`
    );
    if (!confirmBatch) return;

    setIsBatchSyncingDocs(true);
    setBatchProgress({ current: 0, total: allEquipments.length, name: 'Bắt đầu...' });
    setLastActionStatus('Đang tiến hành đồng bộ toàn bộ hồ sơ thiết bị vào Google Drive...');

    try {
      const results = await googleDriveDocsService.syncAllEquipmentsToDocs(
        allEquipments,
        (current, total, name) => {
          setBatchProgress({ current, total, name });
          setLastActionStatus(`[${current}/${total}] Đang cập nhật Google Doc: ${name}...`);
        }
      );

      setIsDriveAuthorized(true);
      setLastActionStatus(`✓ Hoàn thành! Đã đồng bộ tập trung ${results.length}/${allEquipments.length} Google Docs vào Google Drive.`);
      onShowToast(`✓ Đã đồng bộ thành công ${results.length} Google Docs lên Google Drive!`);
    } catch (err: any) {
      console.error('Batch sync error:', err);
      setLastActionStatus(`✗ Lỗi đồng bộ hàng loạt: ${err.message}`);
      onShowToast('✗ Có lỗi xảy ra trong quá trình đồng bộ hàng loạt');
    } finally {
      setIsBatchSyncingDocs(false);
      setBatchProgress(null);
    }
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
          'Content-Type': 'text/plain;charset=utf-8'
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

  // Generate Google Doc via GAS (with automatic overwrite in central folder)
  const handleGenerateGoogleDocGas = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng kết nối Google Apps Script Web App để tạo Google Doc.');
      return;
    }

    setIsGeneratingDoc(true);
    setGeneratedDocResult(null);
    setLastActionStatus(`Đang tạo/ghi đè Google Doc cho "${currentEquipment.general.name}"...`);

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
          docName: result.docName,
          isOverwritten: result.isOverwritten
        });

        if (onUpdateCurrentEquipment) {
          onUpdateCurrentEquipment({
            ...currentEquipment,
            googleDocUrl: result.docUrl,
            googleDocPdfUrl: result.pdfDownloadUrl
          });
        }

        setLastActionStatus(`✓ Đã cập nhật Google Doc trong thư mục Google Drive: "${result.docName}"`);
        onShowToast('✓ Đã đồng bộ & ghi đè Google Doc trong Google Drive thành công!');
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#040a1c] via-[#091533] to-[#0c183a] text-white p-6 rounded-2xl shadow-md border border-[#182d5a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-500/20 rounded-xl text-sky-400 border border-sky-400/30 shrink-0 shadow-inner">
            <Cloud className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Lưu Trữ Tập Trung Google Drive & Google Docs Tự Động</h2>
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-semibold border border-emerald-400/40">
                Tự Động Ghi Đè & Đồng Bộ
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
              Các file <b>Google Doc</b> Sổ Lý Lịch được lưu trữ tập trung vào thư mục <code>CNS_SoLyLich_GoogleDocs</code> trong Google Drive cá nhân của bạn. Khi có bất kỳ thay đổi nào, dữ liệu sẽ <b>tự động chép đè</b> nội dung mới nhất mà không tạo rác file trùng lặp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          <button
            onClick={() => setActiveCodeTab('directDrive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'directDrive'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white ring-2 ring-sky-300/40'
                : 'bg-[#0a1638] hover:bg-[#122457] text-sky-200 border border-[#1e3c7a]'
            }`}
          >
            <HardDrive className="w-4 h-4 text-sky-300" />
            <span>Google Drive Trực Tiếp</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('gasSync')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'gasSync'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white ring-2 ring-indigo-300/40'
                : 'bg-[#0a1638] hover:bg-[#122457] text-sky-200 border border-[#1e3c7a]'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-300" />
            <span>Apps Script & Sheets</span>
          </button>
        </div>
      </div>

      {/* Mode 1: DIRECT GOOGLE DRIVE & GOOGLE DOCS AUTO-OVERWRITE */}
      {activeCodeTab === 'directDrive' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Direct Authorization & Central Folder Status */}
          <div className="bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#182d5a] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-950 rounded-lg text-sky-400 border border-sky-800">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Google Drive Tập Trung</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {isDriveAuthorized ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Đã cấp quyền Drive
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/40">
                    Cần xác thực Google
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-[#060e24] border border-sky-500/30 rounded-xl text-xs space-y-2">
              <div className="font-semibold text-sky-300 flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4 text-sky-400" />
                Thư mục lưu trữ tập trung:
              </div>
              <div className="font-mono text-[11px] text-white bg-[#03091b] p-2 rounded border border-[#1a3568] flex items-center justify-between">
                <span>📁 CNS_SoLyLich_GoogleDocs</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded">Tự động tạo</span>
              </div>
              <p className="text-[11px] text-sky-200/70 leading-relaxed">
                Tất cả các tài liệu Google Doc của các thiết bị sẽ được xếp chung vào thư mục này trên Google Drive của bạn.
              </p>
            </div>

            {/* Auto Overwrite Toggle */}
            <div className="p-3.5 bg-[#060e24] border border-[#1e3c7a] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="auto-sync-toggle" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  Tự động ghi đè khi cập nhật
                </label>
                <input
                  id="auto-sync-toggle"
                  type="checkbox"
                  checked={autoSyncOnChange}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-[#050c1e] border-[#1e3c7a] cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Khi lưu thông tin thiết bị, hệ thống sẽ tự động cập nhật và <b>chép đè</b> nội dung mới vào chính file Google Doc đã tạo trước đó.
              </p>
            </div>

            {!isDriveAuthorized ? (
              <button
                onClick={handleAuthorizeDrive}
                disabled={isAuthorizingDrive}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <KeyRound className={`w-4 h-4 ${isAuthorizingDrive ? 'animate-spin' : ''}`} />
                <span>{isAuthorizingDrive ? 'Đang kết nối Google...' : 'Kết Nối Google Drive / Docs'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã kết nối tài khoản Google</span>
                </div>
                <button
                  onClick={() => {
                    googleDriveDocsService.clearAuth();
                    setIsDriveAuthorized(false);
                    onShowToast('Đã ngắt kết nối Google Drive.');
                  }}
                  className="text-[10.5px] text-rose-300 hover:underline cursor-pointer"
                >
                  Đăng xuất
                </button>
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

          {/* Right Column: Actions for Synchronizing / Overwriting Google Docs */}
          <div className="lg:col-span-2 bg-[#091533] p-5 rounded-2xl border border-[#182d5a] shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#182d5a] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-800">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Đồng Bộ & Ghi Đè Google Docs</h3>
                  <p className="text-[11px] text-sky-200/70">Tạo mới hoặc chép đè bản ghi mới nhất vào Google Drive</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-sky-200 bg-[#060e24] px-2.5 py-1 rounded-lg border border-[#1e3c7a]">
                Thiết bị: <b className="text-white">{currentEquipment.general.name}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Sync Single Current Equipment */}
              <div className="p-4 rounded-xl border border-[#182d5a] hover:border-sky-400/50 transition-all bg-[#060e24] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <div className="p-1.5 bg-sky-950 rounded-md text-sky-300 border border-sky-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>1. Đồng bộ / Ghi đè thiết bị hiện tại</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tạo tài liệu Google Doc hoặc <b>chép đè toàn bộ</b> nội dung (Mục I-VI, linh kiện, bảo dưỡng, sửa chữa) của <b>{currentEquipment.general.name}</b> vào Google Drive.
                  </p>
                </div>
                <button
                  onClick={handleDirectSyncDoc}
                  disabled={isSyncingDirectDoc}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSyncingDirectDoc ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDirectDoc ? 'Đang đồng bộ Drive...' : 'Đồng bộ / Ghi đè Google Doc này'}</span>
                </button>
              </div>

              {/* Card 2: Batch Sync All Equipments */}
              <div className="p-4 rounded-xl border border-[#182d5a] hover:border-emerald-400/50 transition-all bg-[#060e24] space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <div className="p-1.5 bg-emerald-950 rounded-md text-emerald-300 border border-emerald-800">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span>2. Đồng bộ hàng loạt ({allEquipments.length} thiết bị)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tự động duyệt qua toàn bộ {allEquipments.length} hồ sơ thiết bị, tạo hoặc ghi đè từng file Google Doc vào thư mục tập trung.
                  </p>
                </div>
                <button
                  onClick={handleBatchSyncAllDocs}
                  disabled={isBatchSyncingDocs}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncingDocs ? 'animate-spin' : ''}`} />
                  <span>{isBatchSyncingDocs ? 'Đang đồng bộ hàng loạt...' : `Đồng bộ toàn bộ ${allEquipments.length} thiết bị`}</span>
                </button>
              </div>
            </div>

            {/* Batch Progress Bar */}
            {batchProgress && (
              <div className="p-4 bg-[#060e24] border border-emerald-600/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300">Tiến trình đồng bộ Drive:</span>
                  <span className="font-bold text-white">{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <div className="w-full bg-[#0a1638] h-2 rounded-full overflow-hidden border border-[#182d5a]">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Đang xử lý: <b className="text-white">{batchProgress.name}</b>
                </div>
              </div>
            )}

            {/* Direct Doc Sync Result Alert */}
            {directDocResult && (
              <div className="p-4 bg-gradient-to-r from-indigo-950/80 to-[#0c1a40] border border-indigo-500/50 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>
                      {directDocResult.isOverwritten ? 'Đã Ghi Đè Cập Nhật Google Doc Thành Công:' : 'Đã Tạo Mới Google Doc Thành Công:'}
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-300 font-mono font-medium truncate max-w-xs bg-[#050c1e] px-2 py-0.5 rounded border border-indigo-800">
                    {directDocResult.docTitle}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300">
                  Tài liệu được lưu trữ tập trung tại thư mục <b>CNS_SoLyLich_GoogleDocs</b>. Mọi thay đổi tiếp theo sẽ tiếp tục được đồng bộ và ghi đè tự động.
                </p>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <a
                    href={directDocResult.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Google Doc chỉnh sửa</span>
                  </a>
                  {directDocResult.folderUrl && (
                    <a
                      href={directDocResult.folderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060e24] hover:bg-[#0c183a] text-indigo-200 border border-indigo-500/50 text-xs font-semibold rounded-lg shadow-md transition-colors"
                    >
                      <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Mở thư mục tập trung trên Drive</span>
                    </a>
                  )}
                  <a
                    href={directDocResult.pdfDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060e24] hover:bg-[#0c183a] text-sky-200 border border-sky-500/50 text-xs font-semibold rounded-lg shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Tải PDF từ Drive</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: GOOGLE APPS SCRIPT & SHEETS EXTENSION */}
      {activeCodeTab === 'gasSync' && (
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
                  <span>3. Tạo / Ghi đè Google Doc Sổ Lý Lịch</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Tự động tạo hoặc chép đè Google Docs trong thư mục <code>CNS_SoLyLich_GoogleDocs</code> trên Google Drive.
                </p>
                <button
                  onClick={handleGenerateGoogleDocGas}
                  disabled={isGeneratingDoc || !gasUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0c183a] disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingDoc ? 'Đang xử lý...' : 'Tạo / Ghi đè Doc trên Drive'}</span>
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
                    <span>{generatedDocResult.isOverwritten ? 'Đã Ghi Đè Google Doc:' : 'Google Doc Đã Được Tạo Thành Công:'}</span>
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
          </div>
        </div>
      )}

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
              <span>1. Hướng Dẫn Cài Đặt Apps Script</span>
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
