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
  FolderArchive,
  FolderCheck,
  KeyRound,
  FileCheck2,
  Lock,
  UserCheck,
  Eye,
  AlertTriangle,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { EquipmentData, AppUser } from '../types';
import { generateGasCode, generateGasHtml, generateAppsscriptJson } from '../utils/gasGenerator';
import { googleDriveDocsService, GoogleDocSyncResult } from '../utils/googleDriveDocsService';
import { cloudSyncService, DEFAULT_GAS_WEBAPP_URL, GAS_URL_STORAGE_KEY } from '../utils/cloudSyncService';

interface GoogleWorkspaceTabProps {
  currentEquipment: EquipmentData;
  allEquipments: EquipmentData[];
  onSyncFromGas: (equipments: EquipmentData[]) => void;
  onUpdateCurrentEquipment?: (eq: EquipmentData) => void;
  onShowToast: (msg: string) => void;
  currentUser?: AppUser;
  onOpenLoginModal?: () => void;
}

const AUTO_SYNC_STORAGE_KEY = 'cns_auto_sync_gdoc_on_change_v1';

export const GoogleWorkspaceTab: React.FC<GoogleWorkspaceTabProps> = ({
  currentEquipment,
  allEquipments,
  onSyncFromGas,
  onUpdateCurrentEquipment,
  onShowToast,
  currentUser,
  onOpenLoginModal
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canUploadCloudDatabase === true;
  const isViewer = !isAdmin;

  const [gasUrl, setGasUrl] = useState<string>(() => {
    return cloudSyncService.getGasUrl();
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
  const [copiedDocStandard, setCopiedDocStandard] = useState<boolean>(false);

  // Google OAuth Troubleshooter & Client ID configuration
  const [showOAuthTroubleshooter, setShowOAuthTroubleshooter] = useState<boolean>(false);
  const [clientIdInput, setClientIdInput] = useState<string>(() => googleDriveDocsService.getClientId());
  const [hasCustomClientId, setHasCustomClientId] = useState<boolean>(() => googleDriveDocsService.hasCustomClientId());
  const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);
  const [authErrorDetail, setAuthErrorDetail] = useState<string | null>(null);

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

  // Check direct Google Drive authorization and ensure GAS URL is synced
  useEffect(() => {
    googleDriveDocsService.loadScripts().then(() => {
      setIsDriveAuthorized(googleDriveDocsService.isAuthorized());
    }).catch((err) => {
      console.warn('Google scripts load warning:', err);
    });

    const activeUrl = cloudSyncService.getGasUrl();
    if (activeUrl && activeUrl !== gasUrl) {
      setGasUrl(activeUrl);
    }
  }, []);

  // Save GAS URL to local storage and sync to server cloud storage
  const handleSaveGasUrl = async (url: string) => {
    if (isViewer) {
      onShowToast('URL Web App Google Apps Script được cố định bởi Quản trị viên. Người xem không được thay đổi.');
      return;
    }
    setGasUrl(url);
    await cloudSyncService.saveGasUrl(url);
    onShowToast('✓ Đã tự động ghi nhớ URL Google Apps Script thành công!');
  };

  // Toggle auto-sync setting
  const handleToggleAutoSync = (val: boolean) => {
    if (isViewer && val) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Vui lòng đăng nhập Admin để bật tự động ghi đè lên Google Drive.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    setAutoSyncOnChange(val);
    localStorage.setItem(AUTO_SYNC_STORAGE_KEY, String(val));
    onShowToast(val 
      ? '✓ Đã kích hoạt: Tự động ghi đè & đồng bộ Google Doc khi có thay đổi' 
      : 'Đã tắt chế độ tự động đồng bộ Google Doc'
    );
  };

  // Connect / Authorize Direct Google Drive & Docs API (Both Viewer & Admin can view and download)
  const handleAuthorizeDrive = async () => {
    setIsAuthorizingDrive(true);
    setAuthErrorDetail(null);
    try {
      await googleDriveDocsService.requestAccessToken();
      setIsDriveAuthorized(true);
      setShowOAuthTroubleshooter(false);
      onShowToast('✓ Kết nối tài khoản Google Drive & Google Docs thành công!');
      setLastActionStatus('✓ Đã xác thực thành công Google Drive. Quyền lưu trữ thư mục tập trung đã sẵn sàng.');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const msg = err.message || '';
      const isBlocked = msg.includes('uỷ quyền') || msg.includes('ủy quyền') || msg.includes('chặn') || msg.includes('access_denied') || msg.includes('unauthorized') || msg.includes('redirect_uri_mismatch');
      if (isBlocked) {
        setShowOAuthTroubleshooter(true);
        setAuthErrorDetail(msg);
        onShowToast('⚠️ Đã chặn quyền truy cập (Lỗi uỷ quyền). Vui lòng xem hướng dẫn khắc phục bên dưới hoặc chuyển sang dùng Apps Script.');
      } else {
        onShowToast(`✗ Không thể kết nối Google: ${msg || 'Hủy bỏ'}`);
      }
      setLastActionStatus(`✗ Lỗi kết nối Google: ${msg}`);
    } finally {
      setIsAuthorizingDrive(false);
    }
  };

  // Save custom Google OAuth Client ID
  const handleSaveClientId = () => {
    if (isViewer) {
      onShowToast('Cần quyền Quản trị viên để thay đổi Client ID.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    const trimmed = clientIdInput.trim();
    if (!trimmed) {
      googleDriveDocsService.resetClientId();
      setClientIdInput(googleDriveDocsService.getClientId());
      setHasCustomClientId(false);
      onShowToast('Đã khôi phục Google Client ID mặc định.');
    } else {
      googleDriveDocsService.setClientId(trimmed);
      setHasCustomClientId(true);
      onShowToast('✓ Đã lưu Google OAuth Client ID mới thành công!');
    }
    setIsDriveAuthorized(false);
  };

  // Reset Client ID to default
  const handleResetClientId = () => {
    if (isViewer) {
      onShowToast('Cần quyền Quản trị viên để thay đổi Client ID.');
      return;
    }
    googleDriveDocsService.resetClientId();
    setClientIdInput(googleDriveDocsService.getClientId());
    setHasCustomClientId(false);
    setIsDriveAuthorized(false);
    onShowToast('Đã khôi phục Client ID mặc định.');
  };

  // Copy current window origin
  const handleCopyOrigin = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (origin) {
      navigator.clipboard.writeText(origin);
      setCopiedOrigin(true);
      onShowToast(`✓ Đã sao chép Nguồn gốc JavaScript: ${origin}`);
      setTimeout(() => setCopiedOrigin(false), 3000);
    }
  };

  // Direct Sync current equipment to Google Doc (Central Folder on Google Drive) - PROTECTED FOR ADMIN
  const handleDirectSyncDoc = async () => {
    if (isViewer) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Vui lòng đăng nhập Admin để ghi đè Google Doc.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

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

  // Download Standard Google Doc formatted HTML file (ALLOWED FOR VIEWER)
  const handleDownloadStandardDoc = () => {
    googleDriveDocsService.downloadStandardGoogleDocHtml(currentEquipment);
    onShowToast('✓ Đã tải xuống file HTML chuẩn Google Docs (8 trang chuẩn)!');
  };

  // Copy Standard HTML to clipboard for direct paste into Google Docs (ALLOWED FOR VIEWER)
  const handleCopyStandardDoc = async () => {
    const success = await googleDriveDocsService.copyStandardHtmlForGoogleDocs(currentEquipment);
    if (success) {
      setCopiedDocStandard(true);
      setTimeout(() => setCopiedDocStandard(false), 2500);
      onShowToast('✓ Đã sao chép nội dung chuẩn Google Docs! Nhấn Ctrl+V vào Google Docs để dán giữ nguyên định dạng.');
    } else {
      onShowToast('Không thể tự động ghi vào bộ nhớ tạm, vui lòng dùng nút Tải file HTML');
    }
  };

  // Direct Batch Sync all equipments to central Google Drive folder - PROTECTED FOR ADMIN
  const handleBatchSyncAllDocs = async () => {
    if (isViewer) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Chỉ Quản trị viên mới được phép đồng bộ & ghi đè hàng loạt lên Google Drive của chủ sở hữu.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

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

  // Upload (Push) all equipment data to Google Sheets via GAS - PROTECTED FOR ADMIN
  const handleSyncUpToSheets = async () => {
    if (isViewer) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Vui lòng đăng nhập Admin để đẩy/ghi đè lên Google Sheets của chủ sở hữu.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

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

  // Download (Pull) equipment data from Google Sheets via GAS - ALLOWED FOR VIEWER!
  const handleSyncDownFromSheets = async () => {
    if (!gasUrl.trim()) {
      onShowToast('Vui lòng nhập URL Google Apps Script Web App.');
      return;
    }

    setIsSyncingDown(true);
    setLastActionStatus('Đang tải dữ liệu thiết bị từ Google Sheets (Chế độ Chỉ đọc)...');

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

        onSyncFromGas(result.data);
        setLastActionStatus(`✓ Đã nạp thành công ${result.data.length} thiết bị từ Google Sheet!`);
        onShowToast(`✓ Đã tải về thành công ${result.data.length} thiết bị từ Google Sheet!`);
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

  // Generate Google Doc via GAS - PROTECTED FOR ADMIN
  const handleGenerateGoogleDocGas = async () => {
    if (isViewer) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Cần quyền Quản trị viên để xuất bản Google Doc lên Google Drive.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

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

  // Create Backup in Google Drive via GAS - PROTECTED FOR ADMIN
  const handleBackupToDrive = async () => {
    if (isViewer) {
      onShowToast('Tài khoản Người Xem có quyền Chỉ đọc tài nguyên Cloud. Cần quyền Quản trị viên để sao lưu cơ sở dữ liệu lên Google Drive của chủ sở hữu.');
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }

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
    onShowToast('✓ Đã sao chép toàn bộ mã nguồn Code.gs!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Copy Index.html
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(gasHtml);
    setCopiedHtml(true);
    onShowToast('✓ Đã sao chép toàn bộ mã nguồn Index.html!');
    setTimeout(() => setCopiedHtml(false), 3000);
  };

  // Copy Manifest
  const handleCopyJson = () => {
    navigator.clipboard.writeText(appsscriptJson);
    setCopiedJson(true);
    onShowToast('✓ Đã sao chép file appsscript.json!');
    setTimeout(() => setCopiedJson(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-400/30 shrink-0">
            <Cloud className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white">Lưu Trữ Tập Trung Google Drive & Google Docs Tự Động</h2>
              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-semibold border border-emerald-400/40">
                Tự Động Ghi Đè & Đồng Bộ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Các file <b>Google Doc</b> Sổ Lý Lịch được lưu trữ tập trung vào thư mục <code>CNS_SoLyLich_GoogleDocs</code> trong Google Drive cá nhân của bạn. Khi có bất kỳ thay đổi nào, dữ liệu sẽ <b>tự động chép đè</b> nội dung mới nhất.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          <button
            onClick={() => setActiveCodeTab('directDrive')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'directDrive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-300" />
            <span>Google Drive Trực Tiếp</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('gasSync')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCodeTab === 'gasSync'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Cloud className="w-4 h-4 text-slate-300" />
            <span>Apps Script & Sheets</span>
          </button>
        </div>
      </div>

      {/* Role & Access Permissions Callout Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs transition-colors ${
        isViewer 
          ? 'bg-blue-50/90 border-blue-200 text-blue-900' 
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${isViewer ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {isViewer ? <Eye className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                Tài khoản: {currentUser?.displayName || (isViewer ? 'Người Xem (Viewer - Mặc định)' : 'Quản Trị Viên (Admin)')}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isViewer 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {isViewer ? 'Chế Độ: Truy Cập, Tải Về & Chỉ Đọc CSDL Cloud' : 'Toàn Quyền Quản Trị & Ghi Đè Cloud'}
              </span>
            </div>
            <p className="text-[11px] mt-0.5 text-slate-600 leading-relaxed">
              {isViewer ? (
                <>
                  ✓ Được cấp quyền <b>truy cập</b>, <b>tải về (Pull)</b> cơ sở dữ liệu thiết bị từ Google Sheets/Google Drive và <b>tải tệp Doc/PDF</b> về máy. Thao tác ghi đè hoặc đẩy dữ liệu (Push) lên Cloud của chủ sở hữu được bảo vệ (yêu cầu Admin).
                </>
              ) : (
                <>
                  Bạn có toàn quyền ghi đè Google Doc, đồng bộ hàng loạt và đẩy cơ sở dữ liệu lên Google Sheets & Google Drive của chủ sở hữu.
                </>
              )}
            </p>
          </div>
        </div>

        {isViewer && onOpenLoginModal && (
          <button
            onClick={onOpenLoginModal}
            className="px-3.5 py-1.5 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Đăng nhập Admin</span>
          </button>
        )}
      </div>

      {/* Mode 1: DIRECT GOOGLE DRIVE & GOOGLE DOCS AUTO-OVERWRITE */}
      {activeCodeTab === 'directDrive' && (
        <div className="space-y-5">
          {/* Authorization Block Warning & Quick Fix Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg shrink-0 border border-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                  <span>Gặp lỗi &quot;Đã chặn quyền truy cập: Lỗi uỷ quyền&quot; từ Google?</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200/70 text-amber-900 font-semibold">Lỗi Google OAuth 403 / 400</span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Nguyên nhân do Google yêu cầu thêm domain vào <b>Nguồn gốc JavaScript</b> hoặc tài khoản chưa nằm trong danh sách <b>Người dùng thử nghiệm (Test users)</b>. 
                  Hãy dùng <b>Google Apps Script Web App</b> để đồng bộ tự động 100% không bao giờ bị chặn, hoặc bấm nút bên dưới để cấu hình Client ID.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto flex-wrap">
              <button
                onClick={() => setActiveCodeTab('gasSync')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Dùng Apps Script (Khuyên dùng)</span>
              </button>
              <button
                onClick={() => setShowOAuthTroubleshooter(prev => !prev)}
                className="px-3.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-amber-700" />
                <span>{showOAuthTroubleshooter ? 'Ẩn Trợ Giúp' : 'Khắc Phục Lỗi & Cấu Hình'}</span>
                {showOAuthTroubleshooter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Full OAuth Troubleshooter & Client ID Setup Panel */}
          {showOAuthTroubleshooter && (
            <div className="p-5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-4 text-xs text-slate-800 shadow-xs">
              <div className="flex items-start justify-between gap-2 border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Hướng Dẫn Khắc Phục Triệt Để: &quot;Đã chặn quyền truy cập: Lỗi uỷ quyền&quot;</span>
                </div>
                <button
                  onClick={() => setShowOAuthTroubleshooter(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer p-1 rounded hover:bg-amber-100 transition-colors"
                  title="Đóng bảng hướng dẫn"
                >
                  ✕ Đóng
                </button>
              </div>

              {authErrorDetail && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-mono break-all space-y-1">
                  <div className="font-bold text-rose-900">Chi tiết thông báo từ Google:</div>
                  <div>{authErrorDetail}</div>
                </div>
              )}

              <div className="space-y-2 text-[11.5px] leading-relaxed bg-white/70 p-3.5 rounded-lg border border-amber-200/80">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  Tại sao Google hiển thị thông báo &quot;Đã chặn quyền truy cập: Lỗi uỷ quyền&quot;?
                </div>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
                  <li>
                    <b>Lỗi nguồn gốc JavaScript (Origin Mismatch):</b> Tên miền của ứng dụng (<code>{typeof window !== 'undefined' ? window.location.origin : ''}</code>) chưa được thêm vào ô <b>&quot;Nguồn gốc JavaScript đã ủy quyền&quot; (Authorized JavaScript origins)</b> trong Google Cloud Console.
                  </li>
                  <li>
                    <b>Chưa thêm Người dùng thử nghiệm (Test users):</b> Màn hình đồng ý OAuth (OAuth consent screen) đang ở trạng thái <i>Thử nghiệm (Testing)</i> và tài khoản Google của bạn (ví dụ: <code>TAILIEUTBTT@gmail.com</code>) chưa được thêm vào danh sách <b>Test users</b>.
                  </li>
                </ul>
              </div>

              {/* Solution 1: Recommended Google Apps Script */}
              <div className="p-4 bg-white border border-emerald-300 rounded-lg space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>GIẢI PHÁP 1 (KHUYÊN DÙNG 100% - KHÔNG BAO GIỜ BỊ CHẶN): Dùng Google Apps Script Web App</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] border border-emerald-200">
                    Khuyến nghị số 1
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Google Apps Script Web App chạy với quyền hạn của chính tài khoản Google của bạn. Toàn bộ tính năng tự động tạo Google Doc 8 trang chuẩn, ghi đè khi thay đổi, xuất link PDF, lưu vào thư mục Drive và đồng bộ Google Sheets <b>hoàn toàn không cần Client ID</b> và không bao giờ bị Google chặn ủy quyền!
                </p>
                <button
                  onClick={() => setActiveCodeTab('gasSync')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Chuyển Sang Tab Apps Script & Sheets Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Solution 2: Custom Client ID */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>GIẢI PHÁP 2: Cấu hình Google OAuth Client ID của bạn</span>
                  </div>
                  {hasCustomClientId && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded text-[10px] border border-blue-200">
                      Đang dùng Client ID tùy chỉnh
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Nếu bạn muốn dùng popup kết nối trực tiếp của Google, bạn có thể tạo một OAuth Client ID miễn phí trong Google Cloud Console và dán vào đây:
                </p>

                {/* Step 1: Origin */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                    <span>1. Nguồn gốc JavaScript đã ủy quyền (Authorized JavaScript origins):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[11px] bg-slate-100 text-blue-900 px-3 py-1.5 rounded border border-slate-300 flex-1 truncate select-all">
                      {typeof window !== 'undefined' ? window.location.origin : ''}
                    </code>
                    <button
                      onClick={handleCopyOrigin}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOrigin ? 'Đã chép!' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Sao chép đường dẫn trên và dán vào ô <b>Authorized JavaScript origins</b> trong Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client IDs.
                  </p>
                </div>

                {/* Step 2: Input Client ID */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                    <span>2. Nhập Google OAuth Client ID của bạn:</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="ví dụ: 123456789-abcdef.apps.googleusercontent.com"
                      className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <button
                      onClick={handleSaveClientId}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs"
                    >
                      Lưu Client ID
                    </button>
                    {hasCustomClientId && (
                      <button
                        onClick={handleResetClientId}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer shrink-0 transition-colors"
                      >
                        Khôi phục mặc định
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Test Users */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">
                    3. Thêm tài khoản vào Người dùng thử nghiệm (Test users):
                  </div>
                  <div>
                    Trong Google Cloud Console &gt; <b>APIs &amp; Services</b> &gt; <b>OAuth consent screen</b> &gt; Mục <b>Test users</b>, nhấn <b>+ ADD USERS</b> và nhập email của bạn (ví dụ: <code>TAILIEUTBTT@gmail.com</code>).
                  </div>
                </div>
              </div>

              {/* Solution 3: Offline standard HTML */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-2 text-[11.5px] shadow-2xs">
                <span className="text-slate-700">
                  <b>GIẢI PHÁP 3:</b> Tải file HTML chuẩn hoặc sao chép để dán (Ctrl+V) vào Google Docs mà không cần cấu hình Google:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadStandardDoc}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải file Doc chuẩn 8 trang</span>
                  </button>
                  <button
                    onClick={handleCopyStandardDoc}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer text-slate-800 transition-colors flex items-center gap-1"
                  >
                    {copiedDocStandard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedDocStandard ? 'Đã sao chép!' : 'Sao chép Doc chuẩn'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Direct Authorization & Central Folder Status */}
          <div className="enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Google Drive Tập Trung</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {isDriveAuthorized ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Đã cấp quyền Drive
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Cần xác thực Google
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4 text-blue-600" />
                Thư mục lưu trữ tập trung:
              </div>
              <div className="font-mono text-[11px] text-slate-900 bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                <span>📁 CNS_SoLyLich_GoogleDocs</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Tự động tạo</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tất cả các tài liệu Google Doc của các thiết bị sẽ được xếp chung vào thư mục này trên Google Drive của bạn.
              </p>
            </div>

            {/* Auto Overwrite Toggle */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="auto-sync-toggle" className="text-xs font-semibold text-slate-900 cursor-pointer flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  Tự động ghi đè khi cập nhật
                </label>
                <input
                  id="auto-sync-toggle"
                  type="checkbox"
                  disabled={isViewer}
                  checked={autoSyncOnChange}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 ${isViewer ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isViewer ? (
                  <span className="text-amber-700 font-medium">
                    (Chế độ Người xem: Tự động ghi đè lên Google Drive bị tắt để đảm bảo chỉ đọc)
                  </span>
                ) : (
                  <>Khi lưu thông tin thiết bị, hệ thống sẽ tự động cập nhật và <b>chép đè</b> nội dung mới vào chính file Google Doc đã tạo trước đó.</>
                )}
              </p>
            </div>

            {!isDriveAuthorized ? (
              <div className="space-y-2">
                <button
                  onClick={handleAuthorizeDrive}
                  disabled={isAuthorizingDrive}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  <KeyRound className={`w-4 h-4 ${isAuthorizingDrive ? 'animate-spin' : ''}`} />
                  <span>{isAuthorizingDrive ? 'Đang kết nối Google...' : 'Kết Nối Google Drive / Docs'}</span>
                </button>
                <button
                  onClick={() => setShowOAuthTroubleshooter(prev => !prev)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{showOAuthTroubleshooter ? 'Ẩn trợ giúp lỗi ủy quyền' : 'Khắc phục lỗi: Đã chặn quyền truy cập'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã kết nối tài khoản Google</span>
                </div>
                <button
                  onClick={() => {
                    googleDriveDocsService.clearAuth();
                    setIsDriveAuthorized(false);
                    onShowToast('Đã ngắt kết nối Google Drive.');
                  }}
                  className="text-[10.5px] text-rose-600 hover:underline cursor-pointer font-medium"
                >
                  Đăng xuất
                </button>
              </div>
            )}

            {lastActionStatus && (
              <div className={`p-3 rounded-lg text-xs border ${
                lastActionStatus.startsWith('✓') 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : lastActionStatus.startsWith('✗')
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <div className="font-medium">{lastActionStatus}</div>
              </div>
            )}
          </div>

          {/* Right Column: Actions for Synchronizing / Overwriting Google Docs */}
          <div className="lg:col-span-2 enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Đồng Bộ & Ghi Đè Google Docs</h3>
                  <p className="text-[11px] text-slate-500">Tạo mới hoặc chép đè bản ghi mới nhất vào Google Drive</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Thiết bị: <b className="text-slate-900">{currentEquipment.general.name}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Sync Single Current Equipment */}
              <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>1. Đồng bộ / Ghi đè theo Chuẩn Form (8 trang)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tạo tài liệu Google Doc hoặc <b>chép đè toàn bộ</b> nội dung chuẩn 8 trang (Bìa, Mục lục & Cơ quan QL, Sơ lược thiết bị & Giấy phép, Đặc tính kỹ thuật, Thành phần thiết bị, Tài liệu kỹ thuật, Bảo dưỡng, Kiểm tra/sửa chữa) của <b>{currentEquipment.general.name}</b> vào Google Drive.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleDirectSyncDoc}
                    disabled={isSyncingDirectDoc}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                      isViewer
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white'
                    }`}
                    title={isViewer ? 'Chế độ Người xem (Chỉ đọc) - Cần quyền Admin để ghi đè lên Google Drive của chủ sở hữu' : 'Đồng bộ & ghi đè Google Doc'}
                  >
                    {isViewer ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ghi đè Google Doc (Chỉ Admin)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className={`w-3.5 h-3.5 ${isSyncingDirectDoc ? 'animate-spin' : ''}`} />
                        <span>{isSyncingDirectDoc ? 'Đang đồng bộ Drive...' : 'Đồng bộ / Ghi đè Google Doc này'}</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadStandardDoc}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                      title="Tải file HTML biểu mẫu chuẩn 8 trang để mở hoặc nhập trực tiếp vào Google Docs"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tải file Doc chuẩn</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyStandardDoc}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
                      title="Sao chép nội dung chuẩn để dán trực tiếp (Ctrl+V) vào tài liệu Google Docs mới"
                    >
                      {copiedDocStandard ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Sao chép Doc chuẩn</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Batch Sync All Equipments */}
              <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <div className="p-1.5 bg-emerald-100 rounded text-emerald-700">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span>2. Đồng bộ hàng loạt ({allEquipments.length} thiết bị)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tự động duyệt qua toàn bộ {allEquipments.length} hồ sơ thiết bị, tạo hoặc ghi đè từng file Google Doc vào thư mục tập trung.
                  </p>
                </div>
                <button
                  onClick={handleBatchSyncAllDocs}
                  disabled={isBatchSyncingDocs}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                    isViewer
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white'
                  }`}
                  title={isViewer ? 'Chế độ Người xem (Chỉ đọc) - Cần quyền Admin để ghi đè hàng loạt lên Google Drive của chủ sở hữu' : `Đồng bộ toàn bộ ${allEquipments.length} thiết bị`}
                >
                  {isViewer ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đồng bộ hàng loạt (Chỉ Admin)</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncingDocs ? 'animate-spin' : ''}`} />
                      <span>{isBatchSyncingDocs ? 'Đang đồng bộ hàng loạt...' : `Đồng bộ toàn bộ ${allEquipments.length} thiết bị`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Batch Progress Bar */}
            {batchProgress && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-800">Tiến trình đồng bộ Drive:</span>
                  <span className="font-bold text-slate-900">{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  Đang xử lý: <b className="text-slate-900">{batchProgress.name}</b>
                </div>
              </div>
            )}

            {/* Direct Doc Sync Result Alert */}
            {directDocResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>
                      {directDocResult.isOverwritten ? 'Đã Ghi Đè Cập Nhật Google Doc Thành Công:' : 'Đã Tạo Mới Google Doc Thành Công:'}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-800 font-mono font-medium truncate max-w-xs bg-white px-2 py-0.5 rounded border border-blue-200">
                    {directDocResult.docTitle}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  Tài liệu được lưu trữ tập trung tại thư mục <b>CNS_SoLyLich_GoogleDocs</b>. Mọi thay đổi tiếp theo sẽ tiếp tục được đồng bộ và ghi đè tự động.
                </p>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <a
                    href={directDocResult.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Google Doc chỉnh sửa</span>
                  </a>
                  {directDocResult.folderUrl && (
                    <a
                      href={directDocResult.folderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mở thư mục tập trung trên Drive</span>
                    </a>
                  )}
                  <a
                    href={directDocResult.pdfDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Tải PDF từ Drive</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Mode 2: GOOGLE APPS SCRIPT & SHEETS EXTENSION */}
      {activeCodeTab === 'gasSync' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Col: Web App URL Configuration */}
          <div className="enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Kết Nối Web App Script</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {connectionStatus === 'connected' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Đã kết nối
                  </span>
                ) : connectionStatus === 'testing' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Đang thử
                  </span>
                ) : connectionStatus === 'error' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertCircle className="w-3 h-3" />
                    Lỗi kết nối
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Chưa kết nối
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Google Apps Script Web App URL:
                </label>
                {isViewer && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                    Chỉ đọc (Cố định bởi Admin)
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={gasUrl}
                  readOnly={isViewer}
                  onChange={(e) => handleSaveGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`form-input-standard font-mono ${isViewer ? 'bg-slate-50 cursor-not-allowed text-slate-600' : ''}`}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {isViewer
                  ? 'Đường dẫn Web App được cấu hình kết nối tới kho dữ liệu Google Drive của chủ sở hữu.'
                  : 'Nhận URL này sau khi bấm Deploy > New deployment > Web app (Anyone) trên Google Apps Script.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestConnection}
                disabled={isConnecting || !gasUrl.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
              </button>
            </div>

            {connectionInfo && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Google Sheet ID đã liên kết:
                </div>
                <div className="font-mono text-[10px] text-emerald-900 break-all bg-white p-1.5 rounded border border-emerald-200">
                  {connectionInfo.spreadsheetId || 'Active Spreadsheet'}
                </div>
                {connectionInfo.spreadsheetName && (
                  <div className="text-[11px] text-emerald-800">
                    Tên file: <b>{connectionInfo.spreadsheetName}</b>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Cloud Operations */}
          <div className="lg:col-span-2 enterprise-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tác Vụ Tự Động Hóa Google Workspace</h3>
                  <p className="text-[11px] text-slate-500">Đồng bộ dữ liệu và xuất bản tài liệu thời gian thực</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Đang chọn: <b className="text-slate-900">{currentEquipment.general.name}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: Push to Google Sheets - Protected for Admin */}
              <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs">
                    <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span>1. Đồng bộ lên Google Sheets</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Ghi toàn bộ {allEquipments.length} thiết bị vào các bảng <i>ThongTinChung, ThanhPhan, BaoDuong, SuaChua</i>.
                  </p>
                </div>
                <button
                  onClick={handleSyncUpToSheets}
                  disabled={isSyncingUp || !gasUrl.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                    isViewer
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white'
                  }`}
                  title={isViewer ? 'Chế độ Người xem (Chỉ đọc) - Cần quyền Admin để ghi đè lên Google Sheets của chủ sở hữu' : 'Lưu lên Google Sheets'}
                >
                  {isViewer ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Lưu lên Sheets (Chỉ Admin)</span>
                    </>
                  ) : (
                    <>
                      <Send className={`w-3.5 h-3.5 ${isSyncingUp ? 'animate-spin' : ''}`} />
                      <span>{isSyncingUp ? 'Đang gửi dữ liệu...' : 'Lưu lên Google Sheets'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: Pull from Google Sheets - ALLOWED FOR VIEWER */}
              <div className="p-4 rounded-lg border-2 border-emerald-200 hover:border-emerald-300 transition-all bg-emerald-50/40 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <div className="p-1.5 bg-emerald-100 rounded text-emerald-700">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <span>2. Tải cơ sở dữ liệu từ Google Sheets</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      Cho phép Người xem
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Đọc và tải toàn bộ dữ liệu thiết bị mới nhất từ Google Sheets về ứng dụng cục bộ để tra cứu và làm việc.
                  </p>
                </div>
                <button
                  onClick={handleSyncDownFromSheets}
                  disabled={isSyncingDown || !gasUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Tải cơ sở dữ liệu thiết bị từ Google Sheets về máy (Hỗ trợ người xem & quản trị viên)"
                >
                  <Download className={`w-3.5 h-3.5 ${isSyncingDown ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDown ? 'Đang đọc Sheets...' : 'Tải về từ Google Sheets (Chỉ đọc)'}</span>
                </button>
              </div>

              {/* Card 3: Generate Google Doc - Protected for Admin */}
              <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 text-blue-700 font-bold text-xs">
                    <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>3. Tạo / Ghi đè Google Doc Sổ Lý Lịch</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Sinh file Google Doc đầy đủ 6 mục văn bản chuẩn A4 cho thiết bị đang chọn.
                  </p>
                </div>
                <button
                  onClick={handleGenerateGoogleDocGas}
                  disabled={isGeneratingDoc || !gasUrl.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                    isViewer
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 text-white'
                  }`}
                  title={isViewer ? 'Chế độ Người xem (Chỉ đọc) - Cần quyền Admin để ghi đè Google Doc lên Drive' : 'Xuất Google Doc thiết bị này'}
                >
                  {isViewer ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Xuất Doc lên Drive (Chỉ Admin)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingDoc ? 'Đang xuất Doc...' : 'Xuất Google Doc thiết bị này'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 4: Backup JSON to Drive - Protected for Admin */}
              <div className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-slate-50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 text-amber-700 font-bold text-xs">
                    <div className="p-1.5 bg-amber-100 rounded text-amber-700">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <span>4. Sao lưu file JSON vào Google Drive</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Lưu trữ định kỳ một bản sao JSON của toàn bộ {allEquipments.length} thiết bị vào Google Drive của chủ sở hữu.
                  </p>
                </div>
                <button
                  onClick={handleBackupToDrive}
                  disabled={isBackingUpDrive || !gasUrl.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                    isViewer
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-500 text-white'
                  }`}
                  title={isViewer ? 'Chế độ Người xem (Chỉ đọc) - Cần quyền Admin để sao lưu lên Drive của chủ sở hữu' : 'Sao lưu JSON lên Google Drive'}
                >
                  {isViewer ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sao lưu Drive (Chỉ Admin)</span>
                    </>
                  ) : (
                    <>
                      <Cloud className={`w-3.5 h-3.5 ${isBackingUpDrive ? 'animate-spin' : ''}`} />
                      <span>{isBackingUpDrive ? 'Đang sao lưu...' : 'Sao lưu JSON lên Google Drive'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
