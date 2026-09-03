import React, { useMemo } from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';
import { EquipmentData } from '../types';

interface TeamInventoryPrintViewProps {
  equipments: EquipmentData[];
  orientation?: 'landscape' | 'portrait';
  rowsPerPage?: number;
  showQr?: boolean;
  qrCodeMap?: Record<string, string>;
  companyName?: string;
  onSelectEquipment?: (id: string) => void;
}

export const TeamInventoryPrintView: React.FC<TeamInventoryPrintViewProps> = ({
  equipments,
  orientation = 'landscape',
  rowsPerPage = 7,
  showQr = true,
  qrCodeMap = {},
  companyName = 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
  onSelectEquipment
}) => {
  // Statistics for the inventory header
  const stats = useMemo(() => {
    const total = equipments.length;
    let active = 0;
    let standby = 0;
    let maintenance = 0;
    let other = 0;

    equipments.forEach(eq => {
      const s = eq.general?.status;
      if (s === 'Đang khai thác') active++;
      else if (s === 'Dự phòng sẵn sàng') standby++;
      else if (s === 'Đang bảo dưỡng/sửa chữa' || s === 'Tạm ngừng khai thác') maintenance++;
      else other++;
    });

    return { total, active, standby, maintenance, other };
  }, [equipments]);

  // Chunk equipments into printable pages
  const pages = useMemo(() => {
    const chunks: EquipmentData[][] = [];
    const size = Math.max(1, rowsPerPage);
    for (let i = 0; i < equipments.length; i += size) {
      chunks.push(equipments.slice(i, i + size));
    }
    if (chunks.length === 0) chunks.push([]);
    return chunks;
  }, [equipments, rowsPerPage]);

  const today = new Date();
  const dateFormatted = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const isLandscape = orientation === 'landscape';
  const sheetClass = isLandscape ? 'page-sheet-landscape' : 'page-sheet';

  return (
    <div className="space-y-8 print:space-y-0 text-black">
      {pages.map((pageItems, pIndex) => {
        const isFirstPage = pIndex === 0;
        const isLastPage = pIndex === pages.length - 1;
        const pageNum = pIndex + 1;
        const totalPages = pages.length;

        return (
          <div
            key={`team-inv-page-${pIndex}`}
            className={`${sheetClass} bg-white mx-auto shadow-md border border-slate-300 relative flex flex-col justify-between`}
            style={{
              width: isLandscape ? '297mm' : '210mm',
              minHeight: isLandscape ? '210mm' : '297mm',
              padding: isLandscape ? '8mm 12mm 8mm 12mm' : '12mm 14mm 10mm 16mm',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* PAGE 1: FULL OFFICIAL BANNER & TITLE */}
              {isFirstPage ? (
                <div className="mb-4">
                  <table className="w-full mb-3" style={{ borderCollapse: 'collapse', border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <img 
                              src={doiThongTinLogoImg} 
                              alt="Logo Đội Thông Tin - TT BĐKT" 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-black/80 shadow-2xs"
                            />
                            <div className="text-center">
                              <div className="font-bold uppercase text-[10.5pt] tracking-tight leading-tight text-black">
                                {companyName}
                              </div>
                              <div className="font-bold uppercase text-[9.5pt] tracking-tight text-black mt-0.5">
                                TRUNG TÂM BẢO ĐẢM KỸ THUẬT
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-[9.5pt] text-slate-800">
                            ĐỘI THIẾT BỊ THÔNG TIN (CNS)
                          </div>
                          <div className="w-24 mx-auto border-b border-black mt-1"></div>
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                          <div className="font-bold uppercase text-[11pt] tracking-tight leading-tight text-black">
                            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                          </div>
                          <div className="font-bold text-[10.5pt] text-black mt-0.5">
                            Độc lập - Tự do - Hạnh phúc
                          </div>
                          <div className="w-28 mx-auto border-b border-black mt-1.5 mb-1"></div>
                          <div className="text-[9.5pt] italic text-slate-700">
                            TP. Hồ Chí Minh, {dateFormatted}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Document Main Heading */}
                  <div className="text-center my-2">
                    <h1 
                      className="font-bold uppercase tracking-wider text-black"
                      style={{ fontSize: isLandscape ? '15pt' : '13.5pt', letterSpacing: '0.5px' }}
                    >
                      BẢNG TỔNG HỢP KIỂM KÊ THIẾT BỊ KỸ THUẬT CNS TOÀN ĐỘI
                    </h1>
                    <div className="text-[10pt] italic text-slate-700 mt-0.5">
                      (Hồ sơ theo dõi tài sản, tình trạng kỹ thuật và trực khai thác hệ thống thiết bị)
                    </div>
                  </div>

                  {/* Executive KPI Summary Bar */}
                  <div 
                    className="my-2.5 p-2 bg-slate-50 border border-black/80 rounded text-[9pt] leading-tight flex items-center justify-around flex-wrap gap-2 text-black"
                    style={{ fontSize: '9pt' }}
                  >
                    <div>
                      <span className="font-semibold text-slate-700">Tổng số thiết bị: </span>
                      <strong className="text-[10pt] text-black">{stats.total}</strong>
                    </div>
                    <div className="border-l border-slate-300 pl-3">
                      <span className="font-semibold text-slate-700">Đang khai thác: </span>
                      <strong className="text-[10pt] text-emerald-700">{stats.active}</strong>
                      <span className="text-[8pt] text-slate-500 ml-1">
                        ({stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="border-l border-slate-300 pl-3">
                      <span className="font-semibold text-slate-700">Dự phòng sẵn sàng: </span>
                      <strong className="text-[10pt] text-blue-700">{stats.standby}</strong>
                    </div>
                    <div className="border-l border-slate-300 pl-3">
                      <span className="font-semibold text-slate-700">Bảo dưỡng / Sửa chữa: </span>
                      <strong className="text-[10pt] text-amber-700">{stats.maintenance}</strong>
                    </div>
                    {stats.other > 0 && (
                      <div className="border-l border-slate-300 pl-3">
                        <span className="font-semibold text-slate-700">Trạng thái khác: </span>
                        <strong className="text-[10pt] text-slate-700">{stats.other}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SUBSEQUENT PAGES: COMPACT HEADER */
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-black text-[9.5pt]">
                  <div className="font-bold uppercase tracking-tight text-black">
                    {companyName} - BẢNG TỔNG HỢP KIỂM KÊ THIẾT BỊ CNS (Tiếp theo)
                  </div>
                  <div className="font-medium text-slate-600 text-[9pt]">
                    Trang {pageNum} / {totalPages}
                  </div>
                </div>
              )}

              {/* INVENTORY TABLE */}
              <table 
                className="pdf-table w-full border-collapse border border-black text-black"
                style={{ fontSize: isLandscape ? '9pt' : '8.5pt' }}
              >
                <thead>
                  <tr className="bg-slate-100 text-black font-bold">
                    <th style={{ width: '3%', border: '1px solid #000', padding: '4px 2px', textAlign: 'center' }}>
                      STT
                    </th>
                    <th style={{ width: isLandscape ? '16%' : '18%', border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>
                      TÊN THIẾT BỊ & MÃ
                    </th>
                    <th style={{ width: isLandscape ? '8%' : '9%', border: '1px solid #000', padding: '5px 3px', textAlign: 'center' }}>
                      CHỦNG LOẠI
                    </th>
                    <th style={{ width: isLandscape ? '12%' : '13%', border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>
                      HÃNG SX / MODEL
                    </th>
                    <th style={{ width: isLandscape ? '10%' : '11%', border: '1px solid #000', padding: '5px 3px', textAlign: 'center' }}>
                      SỐ SERIAL
                    </th>
                    <th style={{ width: isLandscape ? '9%' : '10%', border: '1px solid #000', padding: '5px 3px', textAlign: 'center' }}>
                      MÃ THẺ TS
                    </th>
                    <th style={{ width: isLandscape ? '13%' : '14%', border: '1px solid #000', padding: '5px 4px', textAlign: 'center' }}>
                      VỊ TRÍ LẮP ĐẶT
                    </th>
                    <th style={{ width: isLandscape ? '7%' : '7%', border: '1px solid #000', padding: '5px 2px', textAlign: 'center' }}>
                      NĂM SX/SD
                    </th>
                    <th style={{ width: isLandscape ? '9%' : '10%', border: '1px solid #000', padding: '5px 3px', textAlign: 'center' }}>
                      TÌNH TRẠNG
                    </th>
                    <th style={{ width: isLandscape ? '8%' : '8%', border: '1px solid #000', padding: '5px 3px', textAlign: 'center' }}>
                      KỸ SƯ P.TRÁCH
                    </th>
                    {showQr && (
                      <th style={{ width: '5%', border: '1px solid #000', padding: '4px 2px', textAlign: 'center' }}>
                        QR SỔ
                      </th>
                    )}
                    <th style={{ width: isLandscape ? '7%' : '7%', border: '1px solid #000', padding: '5px 2px', textAlign: 'center' }}>
                      KIỂM KÊ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((eq, rIndex) => {
                    const stt = pIndex * rowsPerPage + rIndex + 1;
                    const g = eq.general || ({} as any);
                    const org = eq.org || ({} as any);
                    const qrUrl = qrCodeMap[eq.id] || '';

                    const isOperating = g.status === 'Đang khai thác';
                    const isStandby = g.status === 'Dự phòng sẵn sàng';
                    const isMaint = g.status === 'Đang bảo dưỡng/sửa chữa' || g.status === 'Tạm ngừng khai thác';

                    return (
                      <tr 
                        key={eq.id || rIndex} 
                        style={{ height: isLandscape ? '46px' : '44px' }}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* 1. STT */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px' }}>
                          {stt}
                        </td>

                        {/* 2. Tên thiết bị & ID */}
                        <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
                          <div className="font-bold text-black leading-tight">
                            {onSelectEquipment ? (
                              <button
                                onClick={() => onSelectEquipment(eq.id)}
                                className="text-left font-bold hover:underline cursor-pointer focus:outline-none"
                                title="Bấm để xem sổ lý lịch cá nhân"
                              >
                                {g.name || eq.id}
                              </button>
                            ) : (
                              g.name || eq.id
                            )}
                          </div>
                          <div className="text-[7.5pt] font-mono text-slate-600 mt-0.5 flex items-center gap-1">
                            <span>ID: {eq.id}</span>
                            {g.priority && (
                              <span className="text-[7pt] text-slate-500">
                                • {g.priority.replace('Hệ thống ', '')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Chủng loại */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 3px', fontWeight: '500' }}>
                          {g.category || '---'}
                        </td>

                        {/* 4. Hãng SX / Model */}
                        <td style={{ border: '1px solid #000', padding: '4px 4px' }}>
                          <div className="font-bold leading-tight">{g.model || '---'}</div>
                          <div className="text-[7.5pt] text-slate-600 leading-tight">{g.manufacturer || ''}</div>
                        </td>

                        {/* 5. Số Serial */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 3px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {g.serial || '---'}
                        </td>

                        {/* 6. Mã thẻ tài sản */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 3px', fontFamily: 'monospace' }}>
                          {g.assetNo || g.assetCode || '---'}
                        </td>

                        {/* 7. Vị trí lắp đặt */}
                        <td style={{ border: '1px solid #000', padding: '4px 4px' }}>
                          <div className="leading-tight font-semibold text-slate-900">
                            {org.location || '---'}
                          </div>
                          {org.unit && org.unit !== org.location && (
                            <div className="text-[7.5pt] text-slate-600 leading-tight mt-0.5">
                              {org.unit}
                            </div>
                          )}
                        </td>

                        {/* 8. Năm SX / SD */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 2px', fontSize: '8pt' }}>
                          <div>{g.yearMade || '-'}</div>
                          <div className="text-slate-600 text-[7.5pt]">{g.commissioned || '-'}</div>
                        </td>

                        {/* 9. Tình trạng kỹ thuật */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 3px' }}>
                          <span 
                            className={`font-semibold text-[8pt] leading-tight block ${
                              isOperating 
                                ? 'text-emerald-800' 
                                : isStandby 
                                ? 'text-blue-800' 
                                : isMaint 
                                ? 'text-amber-800' 
                                : 'text-slate-700'
                            }`}
                          >
                            {g.status || '---'}
                          </span>
                        </td>

                        {/* 10. Kỹ sư phụ trách */}
                        <td style={{ border: '1px solid #000', textAlign: 'center', padding: '4px 3px' }}>
                          <div className="font-semibold text-[8pt] leading-tight">
                            {org.primaryEngineer || 'Tổ CNS'}
                          </div>
                          {org.phoneContact && (
                            <div className="text-[7pt] text-slate-600 font-mono">
                              {org.phoneContact}
                            </div>
                          )}
                        </td>

                        {/* 11. QR Code */}
                        {showQr && (
                          <td style={{ border: '1px solid #000', textAlign: 'center', padding: '2px', verticalAlign: 'middle' }}>
                            {qrUrl ? (
                              <img 
                                src={qrUrl} 
                                alt={`QR-${eq.id}`} 
                                className="w-9 h-9 mx-auto border border-black/40 p-0.5 object-contain"
                              />
                            ) : (
                              <span className="text-[7pt] text-slate-400 font-mono">QR</span>
                            )}
                          </td>
                        )}

                        {/* 12. Xác nhận kiểm kê thực địa */}
                        <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div className="h-6 flex items-center justify-center border-b border-dotted border-black/50 text-[7pt] text-slate-400">
                            [ &nbsp; &nbsp; &nbsp; ]
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* LAST PAGE: OFFICIAL SIGNATURE BLOCK */}
              {isLastPage && (
                <div className="mt-6 pt-4 text-black text-[10pt]" style={{ pageBreakInside: 'avoid' }}>
                  <table className="w-full" style={{ borderCollapse: 'collapse', border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div className="font-bold uppercase text-[10.5pt]">
                            ĐẠI DIỆN BAN KIỂM KÊ
                          </div>
                          <div className="text-[9pt] italic text-slate-700">
                            (Ký và ghi rõ họ tên)
                          </div>
                          <div className="h-16"></div>
                          <div className="border-t border-dotted border-black/60 w-36 mx-auto pt-1 font-semibold text-[9.5pt]">
                            ....................................
                          </div>
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div className="font-bold uppercase text-[10.5pt]">
                            TỔ TRƯỞNG / ĐỘI TRƯỞNG KỸ THUẬT
                          </div>
                          <div className="text-[9pt] italic text-slate-700">
                            (Ký và ghi rõ họ tên)
                          </div>
                          <div className="h-16"></div>
                          <div className="border-t border-dotted border-black/60 w-36 mx-auto pt-1 font-semibold text-[9.5pt]">
                            ....................................
                          </div>
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                          <div className="font-bold uppercase text-[10.5pt]">
                            LÃNH ĐẠO ĐƠN VỊ PHÊ DUYỆT
                          </div>
                          <div className="text-[9pt] italic text-slate-700">
                            (Ký tên và đóng dấu)
                          </div>
                          <div className="h-16"></div>
                          <div className="border-t border-dotted border-black/60 w-36 mx-auto pt-1 font-semibold text-[9.5pt]">
                            ....................................
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Centered Page Number Footer */}
            <div className="page-num text-center text-[9.5pt] font-semibold text-slate-700 pt-2 border-t border-slate-200 mt-2">
              Trang {pageNum} / {totalPages}
            </div>
          </div>
        );
      })}
    </div>
  );
};
