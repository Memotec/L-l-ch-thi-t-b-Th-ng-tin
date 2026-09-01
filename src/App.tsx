import React, { useState, useEffect } from 'react';
import { sampleEquipments } from './sampleData';
import { EquipmentData } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardTab } from './components/DashboardTab';
import { GeneralTab } from './components/GeneralTab';
import { SpecTab } from './components/SpecTab';
import { ComponentsTab } from './components/ComponentsTab';
import { DocsTab } from './components/DocsTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { RepairTab } from './components/RepairTab';
import { PrintPreviewTab } from './components/PrintPreviewTab';
import { QrCodeManagerTab } from './components/QrCodeManagerTab';
import { GoogleWorkspaceTab } from './components/GoogleWorkspaceTab';
import { NewEquipmentModal } from './components/NewEquipmentModal';

const STORAGE_KEY = 'cns_multi_equipment_data_v2';

export default function App() {
  const [equipments, setEquipments] = useState<EquipmentData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved equipment data:', e);
    }
    return sampleEquipments;
  });

  const [currentId, setCurrentId] = useState<string>(() => {
    return equipments[0]?.id || 'eq-vhf-01';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<string>('Vừa lưu trữ tự động');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  const saveToStorage = (data: EquipmentData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(`Đã lưu lúc ${timeStr}`);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // QR Code Deep Link Listener (#eq=eq-xxx)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#eq=')) {
        const targetId = decodeURIComponent(hash.replace('#eq=', ''));
        const found = equipments.find(e => e.id === targetId || e.general.serial === targetId || e.general.assetNo === targetId);
        if (found) {
          setCurrentId(found.id);
          setActiveTab('general');
          showToast(`✓ Đã quét mã QR: Mở hồ sơ ${found.general.name}`);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [equipments]);

  // Get active equipment
  const currentEquipment = equipments.find(e => e.id === currentId) || equipments[0] || sampleEquipments[0];

  // Update current equipment
  const handleUpdateCurrent = (updated: EquipmentData) => {
    const updatedList = equipments.map(e => e.id === updated.id ? updated : e);
    setEquipments(updatedList);
    saveToStorage(updatedList);
  };

  // Sync down from Google Apps Script / Google Sheets
  const handleSyncFromGas = (gasEquipments: EquipmentData[]) => {
    if (!Array.isArray(gasEquipments) || gasEquipments.length === 0) return;
    setEquipments(gasEquipments);
    if (!gasEquipments.some(e => e.id === currentId)) {
      setCurrentId(gasEquipments[0].id);
    }
    saveToStorage(gasEquipments);
  };

  // Manual save trigger
  const handleManualSave = () => {
    saveToStorage(equipments);
    showToast('✓ Đã lưu toàn bộ cơ sở dữ liệu thành công!');
  };

  // Create new equipment
  const handleCreateNew = (newEq: EquipmentData) => {
    const updatedList = [...equipments, newEq];
    setEquipments(updatedList);
    setCurrentId(newEq.id);
    setActiveTab('general');
    saveToStorage(updatedList);
    showToast(`✓ Đã tạo hồ sơ cho thiết bị: ${newEq.general.name}`);
  };

  // Clone equipment
  const handleCloneCurrent = () => {
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
    const updatedList = [...equipments, cloned];
    setEquipments(updatedList);
    setCurrentId(cloned.id);
    saveToStorage(updatedList);
    showToast(`✓ Đã sao chép hồ sơ mới thành công!`);
  };

  // Delete equipment
  const handleDeleteCurrent = () => {
    if (equipments.length <= 1) {
      alert('Không thể xóa thiết bị duy nhất trong hệ thống.');
      return;
    }
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ thiết bị: "${currentEquipment.general.name}"?`);
    if (!confirmDelete) return;

    const remaining = equipments.filter(e => e.id !== currentEquipment.id);
    setEquipments(remaining);
    setCurrentId(remaining[0].id);
    saveToStorage(remaining);
    showToast(`✓ Đã xóa hồ sơ thiết bị.`);
  };

  // Export current equipment JSON
  const handleExportCurrent = () => {
    const jsonStr = JSON.stringify(currentEquipment, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_${(currentEquipment.general.serial || currentEquipment.id).replace(/\W/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất file JSON hồ sơ thiết bị!');
  };

  // Export all equipments JSON
  const handleExportAll = () => {
    const jsonStr = JSON.stringify(equipments, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNS_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Đã xuất toàn bộ cơ sở dữ liệu CNS!');
  };

  // Import JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].general) {
          // Imported full array
          setEquipments(parsed);
          setCurrentId(parsed[0].id);
          saveToStorage(parsed);
          showToast(`✓ Đã nhập thành công ${parsed.length} thiết bị từ file backup!`);
        } else if (parsed && parsed.general && parsed.org) {
          // Imported single equipment
          const existingIdx = equipments.findIndex(eq => eq.id === parsed.id);
          let updatedList: EquipmentData[];
          if (existingIdx >= 0) {
            updatedList = equipments.map(eq => eq.id === parsed.id ? parsed : eq);
          } else {
            updatedList = [...equipments, parsed];
          }
          setEquipments(updatedList);
          setCurrentId(parsed.id);
          saveToStorage(updatedList);
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
  };

  // Reset to default sample
  const handleResetDefaults = () => {
    const confirmReset = window.confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu? Các thay đổi chưa lưu có thể bị ghi đè.');
    if (!confirmReset) return;
    setEquipments(sampleEquipments);
    setCurrentId(sampleEquipments[0].id);
    saveToStorage(sampleEquipments);
    showToast('✓ Đã khôi phục dữ liệu mẫu ban đầu!');
  };

  // Handle direct print
  const handlePrintDirect = () => {
    setActiveTab('printPreview');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="flex h-screen bg-[#070d1e] text-slate-100 antialiased overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c1836] text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar (Sticky Navigation & Multi-equipment selector) */}
      <Sidebar
        equipments={equipments}
        currentEquipmentId={currentId}
        activeTab={activeTab}
        onSelectEquipment={(id) => setCurrentId(id)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onNewEquipment={() => setIsNewModalOpen(true)}
        onCloneEquipment={handleCloneCurrent}
        onDeleteEquipment={handleDeleteCurrent}
        onExportCurrent={handleExportCurrent}
        onExportAll={handleExportAll}
        onImportFile={handleImportFile}
        onSaveData={handleManualSave}
        lastSaved={lastSaved}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Topbar Action Header */}
        <Topbar
          currentEquipment={currentEquipment}
          onSaveData={handleManualSave}
          onShowPrint={() => setActiveTab('printPreview')}
          onPrintDirect={handlePrintDirect}
          onOpenQr={() => setActiveTab('qrCode')}
          onOpenGas={() => setActiveTab('googleWorkspace')}
          onResetDefaults={handleResetDefaults}
          searchTerm={searchTerm}
          onSearchChange={(term) => setSearchTerm(term)}
        />

        {/* Tab Body Viewports */}
        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              data={currentEquipment}
              allEquipments={equipments}
              onChange={handleUpdateCurrent}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectEquipment={(id) => setCurrentId(id)}
            />
          )}

          {activeTab === 'general' && (
            <GeneralTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'spec' && (
            <SpecTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'components' && (
            <ComponentsTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'docs' && (
            <DocsTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'repair' && (
            <RepairTab
              data={currentEquipment}
              onChange={handleUpdateCurrent}
            />
          )}

          {activeTab === 'qrCode' && (
            <QrCodeManagerTab
              currentEquipment={currentEquipment}
              allEquipments={equipments}
              onSelectEquipment={(id) => setCurrentId(id)}
              onShowToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'googleWorkspace' && (
            <GoogleWorkspaceTab
              currentEquipment={currentEquipment}
              allEquipments={equipments}
              onSyncFromGas={handleSyncFromGas}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'printPreview' && (
            <PrintPreviewTab
              data={currentEquipment}
            />
          )}
        </main>
      </div>

      {/* New Equipment Modal Dialog */}
      <NewEquipmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateNew}
      />
    </div>
  );
}
