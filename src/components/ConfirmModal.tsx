import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, RotateCcw, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  equipmentDetails?: {
    name: string;
    model?: string;
    serial?: string;
    assetNo?: string;
    location?: string;
  };
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'trash' | 'warning' | 'refresh' | 'info';
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  equipmentDetails,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  iconType = 'trash',
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600 border border-rose-200',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500'
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 border border-amber-200',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500'
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 text-blue-600 border border-blue-200',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500'
        };
    }
  };

  const { iconBg, confirmBtn } = getVariantStyles();

  const renderIcon = () => {
    switch (iconType) {
      case 'trash':
        return <Trash2 className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'refresh':
        return <RotateCcw className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          {description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          )}

          {equipmentDetails && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-start justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Tên thiết bị:</span>
                <span className="font-bold text-slate-900 text-right max-w-[280px]">
                  {equipmentDetails.name}
                </span>
              </div>
              {equipmentDetails.model && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Model / Ký hiệu:</span>
                  <span className="font-semibold text-slate-800">{equipmentDetails.model}</span>
                </div>
              )}
              {equipmentDetails.serial && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Số Serial:</span>
                  <span className="font-mono font-medium text-slate-800">{equipmentDetails.serial}</span>
                </div>
              )}
              {equipmentDetails.assetNo && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Mã tài sản (Asset No):</span>
                  <span className="font-mono font-medium text-slate-800">{equipmentDetails.assetNo}</span>
                </div>
              )}
              {equipmentDetails.location && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Vị trí lắp đặt:</span>
                  <span className="text-slate-800">{equipmentDetails.location}</span>
                </div>
              )}
            </div>
          )}

          {children}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-1 ${confirmBtn}`}
          >
            {renderIcon()}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
