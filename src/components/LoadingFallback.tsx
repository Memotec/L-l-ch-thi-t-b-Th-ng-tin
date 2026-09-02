import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Đang tải dữ liệu hồ sơ...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-3 animate-in fade-in duration-200">
      <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-500/30 text-sky-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
      <div className="text-xs font-semibold text-sky-200 font-mono tracking-wide">{message}</div>
    </div>
  );
};
