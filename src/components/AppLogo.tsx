import React from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'light' | 'dark';
  className?: string;
  subTitle?: string;
  badge?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'light',
  className = '',
  subTitle = 'LÝ LỊCH THIẾT BỊ ĐIỆN TỬ',
  badge = 'CNS ATM'
}) => {
  const sizeMap = {
    xs: { img: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]', badge: 'text-[8px] px-1 py-0.2' },
    sm: { img: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { img: 'w-11 h-11', text: 'text-base', sub: 'text-[11px]', badge: 'text-[9px] px-1.5 py-0.5' },
    lg: { img: 'w-14 h-14', text: 'text-lg', sub: 'text-xs', badge: 'text-[10px] px-2 py-0.5' },
    xl: { img: 'w-20 h-20', text: 'text-xl', sub: 'text-sm', badge: 'text-xs px-2.5 py-1' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isLight = textColor === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem Logo Badge */}
      <div className="relative group shrink-0">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-amber-500 rounded-full blur-[2px] opacity-75 group-hover:opacity-100 transition duration-300"></div>
        <img
          src={doiThongTinLogoImg}
          alt="Logo Đội Thông Tin - TT BĐKT"
          referrerPolicy="no-referrer"
          className={`${currentSize.img} rounded-full object-cover relative bg-slate-900 border-2 border-white/80 shadow-md`}
        />
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-black tracking-tight leading-tight uppercase ${currentSize.text} ${isLight ? 'text-white' : 'text-slate-900'}`}>
              ĐỘI THÔNG TIN
            </span>
            {badge && (
              <span className={`font-bold rounded uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 ${currentSize.badge}`}>
                {badge}
              </span>
            )}
          </div>
          <div className={`font-semibold tracking-wide uppercase leading-tight ${currentSize.sub} ${isLight ? 'text-cyan-400' : 'text-blue-700'}`}>
            {subTitle}
          </div>
        </div>
      )}
    </div>
  );
};
