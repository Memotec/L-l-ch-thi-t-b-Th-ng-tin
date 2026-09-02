import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { sampleEquipments } from './sampleData';
import { EquipmentData, AppUser } from './types';
import { authService } from './utils/authService';
import { googleDriveDocsService } from './utils/googleDriveDocsService';
import { storageService } from './utils/storageService';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardTab } from './components/DashboardTab';
import { GeneralTab } from './components/GeneralTab';
import { SpecTab } from './components/SpecTab';
import { ComponentsTab } from './components/ComponentsTab';
import { DocsTab } from './components/DocsTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { RepairTab } from './components/RepairTab';
import { SectionNavRibbon } from './components/SectionNavRibbon';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';

// Lazy load heavy components and modals on demand
const PrintPreviewTab = lazy(() => import('./components/PrintPreviewTab').then(m => ({ default: m.PrintPreviewTab })));
const QrCodeManagerTab = lazy(() => import('./components/QrCodeManagerTab').then(m => ({ default: m.QrCodeManagerTab })));
const GoogleWorkspaceTab = lazy(() => import('./components/GoogleWorkspaceTab').then(m => ({ default: m.GoogleWorkspaceTab })));
const SettingsTab = lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));
const NewEquipmentModal = lazy(() => import('./components/NewEquipmentModal').then(m => ({ default: m.NewEquipmentModal })));
const PdfViewerModal = lazy(() => import('./components/PdfViewerModal').then(m => ({ default: m.PdfViewerModal })));
const FullScreenPdfViewer = lazy(() => import('./components/FullScreenPdfViewer').then(m => ({ default: m.FullScreenPdfViewer })));
const LoginModal = lazy(() => import('./components/LoginModal').then(m => ({ default: m.LoginModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser>(() => authService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const isReadOnly = useMemo(() => authService.isReadOnly(currentUser), [currentUser]);

  const [equipments, setEquipments] = useState<EquipmentData[]>(() => storageService.loadEquipments());

  const [currentId, setCurrentId] = useState<string>(() => {
    return equipments[0]?.id || 'eq-vhf-01';
  });

  // Memoized current active equipment
  const currentEquipment = useMemo(() => {
    return equipments.find(e => e.id === currentId) || equipments[0] || sampleEquipments[0];
  }, [equipments, currentId]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<string>('Vừa lưu trữ tự động');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [pdfModalEquipment, setPdfModalEquipment] = useState<EquipmentData | null>(null);
  
  // Dedicated Full-Screen PDF Mode for QR Scans and Direct Inspection
  const [isPdfFullscreen, setIsPdfFullscreen] = useState<boolean>(false);
  const [pdfFullscreenEquipment, setPdfFullscreenEquipment] = useState<EquipmentData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleLoginSuccess = useCallback((user: AppUser, message: string) => {
    setCurrentUser(user);
    showToast(`✓ ${message}`);
  }, [showToast]);

  // Handler to enter Full-Screen PDF Viewer for any equipment
  const handleOpenPdfFullScreen = useCallback((eq?: EquipmentData) => {
    const target = eq || currentEquipment;
    setPdfFullscreenEquipment(target);
    setIsPdfFullscreen(true);
    window.location.hash = `#eq=${encodeURIComponent(target.id)}&view=pdf`;
  }, [currentEquipment]);

  // Deep Link Listener for QR Codes (#eq=eq-xxx&view=pdf, ?eq=xxx&view=pdf)
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      
      let targetId: string | null = null;
      let isPdfView = false;
      let isDocView = false;

      // 1. Check Search Query params (?eq=xxx&view=pdf)
      if (search) {
        const params = new URLSearchParams(search);
        if (params.has('eq') || params.has('id')) {
          targetId = params.get('eq') || params.get('id');
        }
        if (params.get('view') === 'pdf' || params.get('mode') === 'pdf') {
          isPdfView = true;
        }
        if (params.get('view') === 'doc') {
          isDocView = true;
        }
      }

      // 2. Check Hash fragment (#eq=xxx&view=pdf or #view=pdf&eq=xxx)
      if (hash) {
        const cleanHash = hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(cleanHash.includes('=') ? cleanHash : `eq=${cleanHash}`);
        
        if (hashParams.has('eq') || hashParams.has('id')) {
          targetId = hashParams.get('eq') || hashParams.get('id');
        } else if (cleanHash.startsWith('eq-') || cleanHash.startsWith('cns-')) {
          targetId = cleanHash.split('&')[0];
        }

        if (hashParams.get('view') === 'pdf' || hashParams.get('mode') === 'pdf' || cleanHash.includes('view=pdf')) {
          isPdfView = true;
        }
        if (hashParams.get('view') === 'doc' || cleanHash.includes('view=doc')) {
          isDocView = true;
        }
      }

      if (targetId) {
        const decoded = decodeURIComponent(targetId).trim();
        const found = equipments.find(e => 
          e.id.toLowerCase() === decoded.toLowerCase() || 
          (e.general.serial && e.general.serial.toLowerCase() === decoded.toLowerCase()) || 
          (e.general.assetNo && e.general.assetNo.toLowerCase() === decoded.toLowerCase()) ||
          e.general.name.toLowerCase() === decoded.toLowerCase()
        );

        if (found) {
          setCurrentId(found.id);
          if (isPdfView) {
            setPdfFullscreenEquipment(found);
            setIsPdfFullscreen(true);
            showToast(`✓ Quét mã QR thành công: Đang hiển thị toàn màn hình PDF Sổ lý lịch ${found.general.name}`);
          } else if (isDocView) {
            setActiveTab('printPreview');
            setIsPdfFullscreen(false);
            showToast(`✓ Đã quét mã QR: Mở tài liệu Sổ lý lịch ${found.general.name}`);
          } else {
            setActiveTab('general');
            setIsPdfFullscreen(false);
            showToast(`✓ Đã quét mã QR: Mở hồ sơ ${found.general.name}`);
          }
        }
      } else if (isPdfView) {
        const target = equipments.find(e => e.id === currentId) || equipments[0];
        if (target) {
          setPdfFullscreenEquipment(target);
          setIsPdfFullscreen(true);
        }
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [equipments, currentId, showToast]);

  // Global Keyboard Shortcut Listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update current equipment with debounced saving for smooth typing
  const handleUpdateCurrent = useCallback((updated: EquipmentData) => {
    setEquipments(prev => {
      const updatedList = prev.map(e => e.id === updated.id ? updated : e);
      storageService.saveDebounced(updatedList, 300, (timeStr) => {
        setLastSaved(`Đã lưu lúc ${timeStr}`);
      });
      return updatedList;
    });
  }, []);

  // Sync down from Google Apps Script / Google Sheets
  const handleSyncFromGas = useCallback((gasEquipments: EquipmentData[]) => {
    if (!Array.isArray(gasEquipments) || gasEquipments.length === 0) return;
    setEquipments(gasEquipments);
    if (!gasEquipments.some(e => e.id === currentId)) {
      setCurrentId(gasEquipments[0].id);
    }
    storageService.saveImmediate(gasEquipments);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(`Đã lưu lúc ${timeStr}`);
  }, [currentId]);

  // Manual save trigger
  const handleManualSave = useCallback(async () => {
    storageService.saveImmediate(equipments);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSaved(`Đã lưu lúc ${timeStr}`);
    showToast('✓ Đã lưu toàn bộ cơ sở dữ liệu thành công!');

    // Check if auto-sync to Google Docs on change is enabled
    const autoSync = localStorage.getItem('cns_auto_sync_gdoc_on_change_v1') === 'true';
    if (autoSync && googleDriveDocsService.isAuthorized()) {
      try {
        const result = await googleDriveDocsService.syncEquipmentToGoogleDoc(currentEquipment);
        handleUpdateCurrent({
          ...currentEquipment,
          googleDocUrl: result.docUrl,
          googleDocPdfUrl: result.pdfDownloadUrl,
          updatedAt: new Date().toISOString()
        });
        showToast(`✓ Đã tự động chép đè & đồng bộ Google Doc: ${currentEquipment.general.name}`);
      } catch (err: any) {
        console.warn('Auto sync Google Doc error:', err);
      }
    }
  }, [equipments, currentEquipment, handleUpdateCurrent, showToast]);

  // Create new equipment
  const handleCreateNew = useCallback((newEq: EquipmentData) => {
    setEquipments(prev => {
      const updatedList = [...prev, newEq];
      storageService.saveImmediate(updatedList);
      return updatedList;
    });
    setCurrentId(newEq.id);
    setActiveTab('general');
    showToast(`✓ Đã tạo hồ sơ cho thiết bị: ${newEq.general.name}`);
  }, [showToast]);

  // Clone equipment
  const handleCloneCurrent = useCallback(() => {
    if (!currentUser.permissions.canClone) {
      setIsLoginModalOpen(true);
      showToast('Cần quyền Quản trị viên (Admin) để nhân bản thiết bị.');
      return;
    }
    const cloned: EquipmentData = {
      ...JSON.parse(JSON.stringify(currentEquipment)),
      id: `eq-${Date.now()}`,
      general: {
        ...currentEquipment.general,
        name: `${currentEquipment.general.name} (Bản sao)`,
        serial: `${currentEquipment.general.serial}-COPY`,
        assetNo: `${currentEquipment.general.assetNo}-COPY`,
        status: 'Dự phòng sẵn sàng'
      }
    };
    setEquipments(prev => {
      const updatedList = [...prev, cloned];
      storageService.saveImmediate(updatedList);
      return updatedList;
    });
    setCurrentId(cloned.id);
    showToast(`✓ Đã sao chép hồ sơ mới thành công!`);
  }, [currentUser, currentEquipment, showToast]);

  // Delete equipment
  const handleDeleteCurrent = useCallback(() => {
    if (!currentUser.permissions.canDelete) {
      setIsLoginModalOpen(true);
      showToast('Cần quyền Quản trị viên (Admin) để xóa hồ sơ thiết bị.');
      return;
    }
    if (equipments.length <= 1) {
      alert('Không thể xóa thiết bị duy nhất trong hệ thống.');
      return;
    }
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ thiết bị: "${currentEquipment.general.name}"?`);
    if (!confirmDelete) return;

    const remaining = equipments.filter(e => e.id !== currentEquipment.id);
    setEquipments(remaining);
    setCurrentId(remaining[0].id);
    storageService.saveImmediate(remaining);
    showToast(`✓ Đã xóa hồ sơ thiết bị.`);
  }, [currentUser, equipments, currentEquipment, showToast]);

  // Export current equipment JSON
  const handleExportCurrent = useCallback(() => {
    const jsonStr = JSON.stringify(currentEquipment, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_${(currentEquipment.general.serial || currentEquipment.id).replace(/\W/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file JSON hồ sơ thiết bị!');
  }, [currentEquipment, showToast]);

  // Export all equipments JSON
  const handleExportAll = useCallback(() => {
    const jsonStr = JSON.stringify(equipments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNS_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất toàn bộ cơ sở dữ liệu CNS!');
  }, [equipments, showToast]);

  // Import JSON file
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser.permissions.canImportData) {
      setIsLoginModalOpen(true);
      showToast('Cần quyền Quản trị viên (Admin) để nhập dữ liệu sao lưu.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].general) {
          setEquipments(parsed);
          setCurrentId(parsed[0].id);
          storageService.saveImmediate(parsed);
          showToast(`✓ Đã nhập thành công ${parsed.length} thiết bị từ file backup!`);
        } else if (parsed && parsed.general && parsed.org) {
          setEquipments(prev => {
            const existingIdx = prev.findIndex(eq => eq.id === parsed.id);
            let updatedList: EquipmentData[];
            if (existingIdx >= 0) {
              updatedList = prev.map(eq => eq.id === parsed.id ? parsed : eq);
            } else {
              updatedList = [...prev, parsed];
            }
            storageService.saveImmediate(updatedList);
            return updatedList;
          });
          setCurrentId(parsed.id);
          showToast(`✓ Đã nhập hồ sơ thiết bị: ${parsed.general.name}`);
        } else {
          alert('Định dạng file JSON không hợp lệ với cấu trúc Sổ Lý Lịch CNS.');
        }
      } catch (err) {
        console.error('Import parse error:', err);
        alert('Lỗi đọc file JSON. Vui lòng kiểm tra lại định dạng file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [currentUser, showToast]);

  // Reset to default sample
  const handleResetDefaults = useCallback(() => {
    if (!currentUser.permissions.canResetDatabase) {
      setIsLoginModalOpen(true);
      showToast('Cần quyền Quản trị viên (Admin) để khôi phục dữ liệu mẫu ban đầu.');
      return;
    }
    const confirmReset = window.confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu? Các thay đổi chưa lưu có thể bị ghi đè.');
    if (!confirmReset) return;
    setEquipments(sampleEquipments);
    setCurrentId(sampleEquipments[0].id);
    storageService.saveImmediate(sampleEquipments);
    showToast('✓ Đã khôi phục dữ liệu mẫu ban đầu!');
  }, [currentUser, showToast]);

  // Handle direct print
  const handlePrintDirect = useCallback(() => {
    setActiveTab('printPreview');
    setTimeout(() => {
      window.print();
    }, 400);
  }, []);

  // If Full-Screen PDF Mode is active (e.g. from scanning QR Code or direct link)
  if (isPdfFullscreen && (pdfFullscreenEquipment || currentEquipment)) {
    const targetEquipment = pdfFullscreenEquipment || currentEquipment;
    return (
      <Suspense fallback={<LoadingFallback message="Đang tải tệp PDF Sổ lý lịch toàn màn hình..." />}>
        <FullScreenPdfViewer
          equipment={targetEquipment}
          allEquipments={equipments}
          onSelectEquipment={(id) => {
            const found = equipments.find(e => e.id === id);
            if (found) {
              setPdfFullscreenEquipment(found);
              setCurrentId(id);
              window.location.hash = `#eq=${encodeURIComponent(id)}&view=pdf`;
            }
          }}
          onExitToAdmin={() => {
            setIsPdfFullscreen(false);
            window.location.hash = `#eq=${encodeURIComponent(targetEquipment.id)}`;
            showToast(`✓ Đã vào Hệ thống Quản trị: ${targetEquipment.general.name}`);
          }}
          onShowToast={showToast}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-[#152238] text-slate-100 antialiased overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5F6471] text-white px-4 py-3 rounded-xl shadow-2xl border border-sky-400/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar (Sticky Navigation & Multi-equipment selector) */}
      <Sidebar
        equipments={equipments}
        currentEquipmentId={currentId}
        activeTab={activeTab}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onSelectEquipment={(id) => setCurrentId(id)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onNewEquipment={() => setIsNewModalOpen(true)}
        onCloneEquipment={handleCloneCurrent}
        onDeleteEquipment={handleDeleteCurrent}
        onExportCurrent={handleExportCurrent}
        onExportAll={handleExportAll}
        onImportFile={handleImportFile}
        onSaveData={handleManualSave}
        onResetDefaults={handleResetDefaults}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        lastSaved={lastSaved}
      />

      {/* Main App Canvas with Deep Sky Blue + Gray Slate Background */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-gradient-to-b from-[#16273f] via-[#1c304d] to-[#253549]">
        {/* Topbar Action Header */}
        <Topbar
          currentEquipment={currentEquipment}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onSaveData={handleManualSave}
          onShowPrint={() => setActiveTab('printPreview')}
          onPrintDirect={handlePrintDirect}
          onOpenQr={() => setActiveTab('qrCode')}
          onOpenGas={() => setActiveTab('settings')}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenPdfModal={() => handleOpenPdfFullScreen(currentEquipment)}
          onResetDefaults={handleResetDefaults}
          searchTerm={searchTerm}
          onSearchChange={(term) => setSearchTerm(term)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />

        {/* Tab Body Viewports with ErrorBoundary and Suspense */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Quick Horizontal Section Switcher */}
          <SectionNavRibbon
            activeTab={activeTab}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />

          <ErrorBoundary fallbackTitle="Không thể tải nội dung phần này">
            {activeTab === 'dashboard' && (
              <DashboardTab
                data={currentEquipment}
                allEquipments={equipments}
                onChange={handleUpdateCurrent}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSelectEquipment={(id) => setCurrentId(id)}
                onNewEquipment={() => setIsNewModalOpen(true)}
                onOpenPdfModal={(eq) => handleOpenPdfFullScreen(eq)}
              />
            )}

            {activeTab === 'general' && (
              <GeneralTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'spec' && (
              <SpecTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'components' && (
              <ComponentsTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'docs' && (
              <DocsTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            {activeTab === 'repair' && (
              <RepairTab
                data={currentEquipment}
                onChange={handleUpdateCurrent}
                isReadOnly={isReadOnly}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
              />
            )}

            <Suspense fallback={<LoadingFallback message="Đang tải cấu hình..." />}>
              {activeTab === 'qrCode' && (
                <QrCodeManagerTab
                  currentEquipment={currentEquipment}
                  allEquipments={equipments}
                  onSelectEquipment={(id) => setCurrentId(id)}
                  onShowToast={showToast}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenPdfViewer={(eq) => handleOpenPdfFullScreen(eq)}
                  onUpdateEquipment={handleUpdateCurrent}
                  isReadOnly={isReadOnly}
                  onOpenLoginModal={() => setIsLoginModalOpen(true)}
                />
              )}

              {activeTab === 'googleWorkspace' && (
                <GoogleWorkspaceTab
                  currentEquipment={currentEquipment}
                  allEquipments={equipments}
                  onSyncFromGas={handleSyncFromGas}
                  onUpdateCurrentEquipment={handleUpdateCurrent}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  currentEquipment={currentEquipment}
                  allEquipments={equipments}
                  currentUser={currentUser}
                  lastSaved={lastSaved}
                  onOpenLoginModal={() => setIsLoginModalOpen(true)}
                  onSaveData={handleManualSave}
                  onCloneEquipment={handleCloneCurrent}
                  onDeleteEquipment={handleDeleteCurrent}
                  onExportCurrent={handleExportCurrent}
                  onExportAll={handleExportAll}
                  onImportFile={handleImportFile}
                  onResetDefaults={handleResetDefaults}
                  onUpdateEquipment={handleUpdateCurrent}
                  onSyncFromGas={handleSyncFromGas}
                  onShowToast={showToast}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'printPreview' && (
                <PrintPreviewTab
                  data={currentEquipment}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Lazy Modals loaded with Suspense */}
      <Suspense fallback={null}>
        {/* New Equipment Modal Dialog */}
        {isNewModalOpen && (
          <NewEquipmentModal
            isOpen={isNewModalOpen}
            onClose={() => setIsNewModalOpen(false)}
            onCreate={handleCreateNew}
          />
        )}

        {/* Full-Screen Aviation PDF Viewer Modal */}
        {pdfModalEquipment && (
          <PdfViewerModal
            isOpen={!!pdfModalEquipment}
            onClose={() => setPdfModalEquipment(null)}
            equipment={pdfModalEquipment}
            onShowToast={showToast}
          />
        )}

        {/* Authentication & Role Modal */}
        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* Comprehensive Full-System Search & Lookup Window */}
        {isSearchModalOpen && (
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            equipments={equipments}
            initialQuery={searchTerm}
            onSelectResult={(equipmentId, targetTab) => {
              setCurrentId(equipmentId);
              setActiveTab(targetTab);
              showToast(`✓ Đã chuyển đến hồ sơ: ${equipments.find(e => e.id === equipmentId)?.general.name || equipmentId}`);
            }}
            onOpenPdfModal={(eq) => handleOpenPdfFullScreen(eq)}
          />
        )}
      </Suspense>
    </div>
  );
}

