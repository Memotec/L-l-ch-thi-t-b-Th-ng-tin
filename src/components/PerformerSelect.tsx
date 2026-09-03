import React from 'react';
import { PERFORMER_OPTIONS } from '../types';

interface PerformerSelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showQuickPills?: boolean;
}

export const PerformerSelect: React.FC<PerformerSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn hoặc nhập...',
  className = '',
  showQuickPills = false
}) => {
  return (
    <div className="space-y-1 w-full">
      <div className="flex gap-1 items-center w-full">
        <select
          disabled={disabled}
          value={PERFORMER_OPTIONS.includes(value as any) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white hover:bg-slate-50 border border-slate-300 rounded-md px-2 py-1 font-medium text-slate-800 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shrink-0 max-w-[150px] truncate"
          title="Chọn Kíp trực"
        >
          <option value="" disabled>-- Kíp trực --</option>
          {PERFORMER_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          list="performer-datalist"
          className={`w-full bg-white border border-slate-300 rounded-md px-2 py-1 font-normal text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs ${className}`}
        />

        <datalist id="performer-datalist">
          {PERFORMER_OPTIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      {showQuickPills && !disabled && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {PERFORMER_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`px-2 py-0.5 rounded text-[10px] border transition-all cursor-pointer ${
                value === p 
                  ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-2xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
