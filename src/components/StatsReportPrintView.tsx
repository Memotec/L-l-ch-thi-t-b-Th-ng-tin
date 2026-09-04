import React, { useMemo } from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';
import { EquipmentData, EquipmentCategory, EquipmentStatus } from '../types';

interface StatsReportPrintViewProps {
  equipments: EquipmentData[];
  companyName?: string;
}

export const StatsReportPrintView: React.FC<StatsReportPrintViewProps> = ({
  equipments,
  companyName = 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'
}) => {
  const today = new Date();
  const dateFormatted = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  // 1. General counts
  const generalStats = useMemo(() => {
    const total = equipments.length;
    let active = 0;
    let standby = 0;
    let maintenance = 0;
    let temporaryOff = 0;

    equipments.forEach(eq => {
      const s = eq.general?.status;
      if (s === 'Đang khai thác') active++;
      else if (s === 'Dự phòng sẵn sàng') standby++;
      else if (s === 'Đang bảo dưỡng/sửa chữa') maintenance++;
      else if (s === 'Tạm ngừng khai thác') temporaryOff++;
    });

    const maintTotal = maintenance + temporaryOff;
    const uptimePercentage = total > 0 ? Math.round(((active + standby) / total) * 100) : 0;

    return { total, active, standby, maintTotal, maintenance, temporaryOff, uptimePercentage };
  }, [equipments]);

  // 2. Category Statistics (CNS Groups)
  const categoryStats = useMemo(() => {
    const categories: Record<EquipmentCategory, { total: number; active: number; standby: number; maint: number }> = {
      'VHF/UHF': { total: 0, active: 0, standby: 0, maint: 0 },
      'VCCS': { total: 0, active: 0, standby: 0, maint: 0 },
      'VIBA': { total: 0, active: 0, standby: 0, maint: 0 },
      'POWER': { total: 0, active: 0, standby: 0, maint: 0 },
      'IT': { total: 0, active: 0, standby: 0, maint: 0 },
      'RADAR_ADS': { total: 0, active: 0, standby: 0, maint: 0 },
      'NAV': { total: 0, active: 0, standby: 0, maint: 0 },
      'Ghép Kênh': { total: 0, active: 0, standby: 0, maint: 0 },
      'VSAT': { total: 0, active: 0, standby: 0, maint: 0 },
      'VOICE': { total: 0, active: 0, standby: 0, maint: 0 },
      'Thiết Bị Khác': { total: 0, active: 0, standby: 0, maint: 0 }
    };

    equipments.forEach(eq => {
      const cat = eq.general?.category;
      const status = eq.general?.status;
      if (cat && categories[cat]) {
        categories[cat].total++;
        if (status === 'Đang khai thác') categories[cat].active++;
        else if (status === 'Dự phòng sẵn sàng') categories[cat].standby++;
        else categories[cat].maint++;
      }
    });

    return Object.entries(categories).map(([name, stats]) => ({
      name,
      ...stats,
      percentage: generalStats.total > 0 ? Math.round((stats.total / generalStats.total) * 100) : 0
    }));
  }, [equipments, generalStats.total]);

  // 3. Priority Level statistics
  const priorityStats = useMemo(() => {
    let level1 = 0;
    let level2 = 0;
    let level3 = 0;

    equipments.forEach(eq => {
      const p = eq.general?.priority;
      if (p === 'Hệ thống chính (Level 1)') level1++;
      else if (p === 'Hệ thống dự phòng nóng (Level 2)') level2++;
      else if (p === 'Hệ thống phụ trợ (Level 3)') level3++;
    });

    const sum = level1 + level2 + level3;

    return {
      level1,
      level2,
      level3,
      level1Pct: sum > 0 ? Math.round((level1 / sum) * 100) : 0,
      level2Pct: sum > 0 ? Math.round((level2 / sum) * 100) : 0,
      level3Pct: sum > 0 ? Math.round((level3 / sum) * 100) : 0,
    };
  }, [equipments]);

  // 4. Equipment Age breakdown
  const ageStats = useMemo(() => {
    let under5 = 0;    // 2021+
    let between5to10 = 0; // 2016-2020
    let between10to15 = 0; // 2011-2015
    let over15 = 0;    // <2011
    let unknown = 0;

    const currentYear = 2026;

    equipments.forEach(eq => {
      const yearStr = eq.general?.commissioned || eq.general?.yearMade;
      if (!yearStr) {
        unknown++;
        return;
      }
      const year = parseInt(yearStr);
      if (isNaN(year)) {
        unknown++;
        return;
      }

      const age = currentYear - year;
      if (age < 5) under5++;
      else if (age >= 5 && age < 10) between5to10++;
      else if (age >= 10 && age < 15) between10to15++;
      else over15++;
    });

    const totalCalculated = under5 + between5to10 + between10to15 + over15;

    return {
      under5,
      between5to10,
      between10to15,
      over15,
      unknown,
      under5Pct: totalCalculated > 0 ? Math.round((under5 / totalCalculated) * 100) : 0,
      between5to10Pct: totalCalculated > 0 ? Math.round((between5to10 / totalCalculated) * 100) : 0,
      between10to15Pct: totalCalculated > 0 ? Math.round((between10to15 / totalCalculated) * 100) : 0,
      over15Pct: totalCalculated > 0 ? Math.round((over15 / totalCalculated) * 100) : 0,
    };
  }, [equipments]);

  // 5. Technical log statistics (maintenance count this month/year)
  const maintenanceCount = useMemo(() => {
    let totalLogs = 0;
    let standardCount = 0;
    let troubleCount = 0;

    equipments.forEach(eq => {
      const logs = eq.maintenance || [];
      totalLogs += logs.length;
      logs.forEach(l => {
        if (l.cycle?.toLowerCase().includes('sự cố') || l.content?.toLowerCase().includes('hỏng') || l.content?.toLowerCase().includes('sự cố')) {
          troubleCount++;
        } else {
          standardCount++;
        }
      });
    });

    return { totalLogs, standardCount, troubleCount };
  }, [equipments]);

  return (
    <div className="text-black page-sheet bg-white mx-auto shadow-md border border-slate-300 relative flex flex-col justify-between"
         style={{
           width: '210mm',
           minHeight: '297mm',
           padding: '12mm 15mm 10mm 18mm',
           boxSizing: 'border-box'
         }}>
      <div>
        {/* OFFICIAL LETTERHEAD */}
        <table className="w-full mb-6" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '45%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img 
                    src={doiThongTinLogoImg} 
                    alt="Logo Đội Thông Tin" 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-black shadow-2xs"
                  />
                  <div className="text-center">
                    <div className="font-bold uppercase text-[9.5pt] tracking-tight leading-tight text-black">
                      {companyName}
                    </div>
                    <div className="font-bold uppercase text-[8.5pt] tracking-tight text-black mt-0.5">
                      TRUNG TÂM BẢO ĐẢM KỸ THUẬT
                    </div>
                  </div>
                </div>
                <div className="font-semibold text-[9pt] text-slate-800">
                  ĐỘI THIẾT BỊ THÔNG TIN (CNS)
                </div>
                <div className="w-24 mx-auto border-b border-black mt-1"></div>
              </td>
              <td style={{ width: '55%', verticalAlign: 'top', textAlign: 'center', padding: 0 }}>
                <div className="font-bold uppercase text-[10pt] tracking-tight leading-tight text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="font-bold text-[9.5pt] text-black mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="w-28 mx-auto border-b border-black mt-1.5 mb-1"></div>
                <div className="text-[9pt] italic text-slate-700">
                  TP. Hồ Chí Minh, {dateFormatted}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TITLE */}
        <div className="text-center my-4">
          <h1 className="font-bold uppercase tracking-wider text-black text-[13.5pt]">
            BÁO CÁO THỐNG KÊ SỐ LÝ LỊCH THIẾT BỊ CNS
          </h1>
          <div className="text-[9.5pt] italic text-slate-700 mt-0.5">
            (Số liệu tổng hợp tổng đài, hiện trạng trang thiết bị kỹ thuật, vòng đời sử dụng và nhật ký bảo dưỡng)
          </div>
        </div>

        {/* SECTION 1: GENERAL OVERVIEW */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[11pt] font-bold uppercase text-slate-900 border-b border-black pb-0.5 mb-2 flex items-center gap-1.5">
              <span>I. CHỈ TIÊU TRẠNG THÁI HOẠT ĐỘNG CHUNG</span>
            </h2>
            <p className="text-[10pt] text-justify leading-relaxed mb-3">
              Tính đến thời điểm hiện tại, Đội Thiết bị Thông tin đang quản lý tổng cộng <strong className="font-bold">{generalStats.total} bộ hồ sơ lý lịch điện tử</strong> của các hệ thống thiết bị thông tin, dẫn đường và giám sát (CNS) đang lắp đặt khai thác tại đơn vị. Cơ cấu phân bổ trạng thái vận hành như sau:
            </p>

            <table className="pdf-table w-full border-collapse border border-black text-black text-[9.5pt] text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th style={{ width: '35%', border: '1px solid #000', padding: '5px' }}>Trạng thái kỹ thuật</th>
                  <th style={{ width: '25%', border: '1px solid #000', padding: '5px' }}>Số lượng (Bộ/Hệ thống)</th>
                  <th style={{ width: '20%', border: '1px solid #000', padding: '5px' }}>Tỷ lệ phần trăm</th>
                  <th style={{ width: '20%', border: '1px solid #000', padding: '5px' }}>Ghi chú chuyên ngành</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold' }} className="text-emerald-700">✓ Đang khai thác trực tuyến</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{generalStats.active}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>{generalStats.total > 0 ? Math.round((generalStats.active / generalStats.total) * 100) : 0}%</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontSize: '8.5pt' }}>Đảm bảo liên tục 24/7</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold' }} className="text-blue-700">⚡ Dự phòng sẵn sàng (Standby)</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{generalStats.standby}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>{generalStats.total > 0 ? Math.round((generalStats.standby / generalStats.total) * 100) : 0}%</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontSize: '8.5pt' }}>Sẵn sàng thay thế nóng</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', fontWeight: 'bold' }} className="text-amber-700">🔧 Đang sửa chữa / Tạm ngưng</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{generalStats.maintTotal}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>{generalStats.total > 0 ? Math.round((generalStats.maintTotal / generalStats.total) * 100) : 0}%</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontSize: '8.5pt' }}>Đang bảo dưỡng, kiểm chuẩn</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>TỔNG CỘNG HỒ SƠ</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>{generalStats.total}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>100%</td>
                  <td style={{ border: '1px solid #000', padding: '5px', fontSize: '8.5pt' }}>Uptime: {generalStats.uptimePercentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 2: CATEGORY DETAILED BREAKDOWN */}
          <div>
            <h2 className="text-[11pt] font-bold uppercase text-slate-900 border-b border-black pb-0.5 mb-2 flex items-center gap-1.5">
              <span>II. CƠ CẤU THIẾT BỊ CNS THEO CHUYÊN NGÀNH KỸ THUẬT</span>
            </h2>
            <table className="pdf-table w-full border-collapse border border-black text-black text-[9pt] text-center">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th style={{ width: '25%', border: '1px solid #000', padding: '4px' }}>Chủng loại thiết bị</th>
                  <th style={{ width: '15%', border: '1px solid #000', padding: '4px' }}>Mã viết tắt</th>
                  <th style={{ width: '15%', border: '1px solid #000', padding: '4px' }}>Tổng số</th>
                  <th style={{ width: '15%', border: '1px solid #000', padding: '4px' }}>Đang khai thác</th>
                  <th style={{ width: '15%', border: '1px solid #000', padding: '4px' }}>Dự phòng</th>
                  <th style={{ width: '15%', border: '1px solid #000', padding: '4px' }}>Tỷ lệ gộp</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((item) => (
                  <tr key={item.name}>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', fontWeight: 'semibold' }}>
                      {item.name === 'VHF/UHF' && 'Bộ đàm VHF/UHF Không-Địa'}
                      {item.name === 'VCCS' && 'Chuyển mạch thoại VCCS'}
                      {item.name === 'VIBA' && 'Truyền dẫn Viba số'}
                      {item.name === 'POWER' && 'Nguồn AC/DC & UPS'}
                      {item.name === 'IT' && 'Mạng máy tính & Server'}
                      {item.name === 'RADAR_ADS' && 'Radar & Giám sát ADS-B'}
                      {item.name === 'NAV' && 'Đài dẫn đường DVOR/DME'}
                      {!['VHF/UHF', 'VCCS', 'VIBA', 'POWER', 'IT', 'RADAR_ADS', 'NAV'].includes(item.name) && item.name}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'semibold' }}>{item.total}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textDecorationColor: 'emerald' }}>{item.active}</td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item.standby}</td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 3: OTHER ANALYTICS GRID */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Col: Priority & Importance */}
            <div className="border border-black p-2.5 rounded">
              <h3 className="text-[9.5pt] font-bold text-slate-900 border-b border-black/40 pb-1 mb-2">
                CƠ CẤU MỨC ĐỘ QUAN TRỌNG (PRIORITY)
              </h3>
              <ul className="space-y-1.5 text-[8.5pt]">
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-rose-800">● Hệ thống Level 1 (Cốt lõi):</span>
                  <span><strong>{priorityStats.level1}</strong> máy ({priorityStats.level1Pct}%)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">● Hệ thống Level 2 (Dự phòng nóng):</span>
                  <span><strong>{priorityStats.level2}</strong> máy ({priorityStats.level2Pct}%)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">● Hệ thống Level 3 (Phụ trợ):</span>
                  <span><strong>{priorityStats.level3}</strong> máy ({priorityStats.level3Pct}%)</span>
                </li>
              </ul>
            </div>

            {/* Right Col: Equipment Age */}
            <div className="border border-black p-2.5 rounded">
              <h3 className="text-[9.5pt] font-bold text-slate-900 border-b border-black/40 pb-1 mb-2">
                THỐNG KÊ TUỔI THỌ SỬ DỤNG THIẾT BỊ (CNS AGE)
              </h3>
              <ul className="space-y-1 text-[8.5pt]">
                <li className="flex justify-between items-center">
                  <span>● Dưới 5 năm sử dụng (Mới):</span>
                  <span><strong>{ageStats.under5}</strong> máy ({ageStats.under5Pct}%)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>● Từ 5 đến 10 năm sử dụng:</span>
                  <span><strong>{ageStats.between5to10}</strong> máy ({ageStats.between5to10Pct}%)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>● Từ 10 đến 15 năm sử dụng:</span>
                  <span><strong>{ageStats.between10to15}</strong> máy ({ageStats.between10to15Pct}%)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold text-amber-900">● Trên 15 năm sử dụng (Cần tái đầu tư):</span>
                  <span><strong>{ageStats.over15}</strong> máy ({ageStats.over15Pct}%)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* SECTION 4: TECHNICAL LOGSUMMARY */}
          <div className="border border-black p-2.5 rounded">
            <h3 className="text-[9.5pt] font-bold text-slate-900 border-b border-black pb-1 mb-1.5 uppercase">
              III. Tổng hợp Nhật ký vận hành & bảo dưỡng định kỳ
            </h3>
            <p className="text-[9pt] leading-relaxed text-justify">
              Hệ thống ghi chép điện tử ghi nhận tổng cộng <strong className="font-bold">{maintenanceCount.totalLogs} lượt lưu nhật ký, cập nhật thông số và bảo dưỡng</strong>. Trong đó bao gồm <strong className="font-bold text-emerald-800">{maintenanceCount.standardCount} lượt bảo dưỡng định kỳ</strong> (tuần, tháng, quý, năm) đáp ứng tiêu chuẩn kỹ thuật hàng không và <strong className="font-bold text-rose-800">{maintenanceCount.troubleCount} lượt rà soát, xử lý sự cố</strong> phát sinh hoặc đo thông số đột xuất. Toàn bộ thông tin cập nhật đều được ký xác nhận bởi kỹ thuật viên phụ trách hệ thống và kiểm duyệt viên ca trực tương ứng.
            </p>
          </div>
        </div>
      </div>

      {/* SIGN-OFF BLOCK */}
      <div className="mt-4 pt-2 text-black text-[9.5pt]" style={{ pageBreakInside: 'avoid' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                <div className="font-bold uppercase text-[9.5pt]">
                  KỸ SƯ THỐNG KÊ
                </div>
                <div className="text-[8pt] italic text-slate-700">
                  (Ký và ghi rõ họ tên)
                </div>
                <div className="h-14"></div>
                <div className="border-t border-dotted border-black/60 w-32 mx-auto pt-1 font-semibold text-[9pt]">
                  ....................................
                </div>
              </td>
              <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                <div className="font-bold uppercase text-[9.5pt]">
                  ĐỘI TRƯỞNG THIẾT BỊ CNS
                </div>
                <div className="text-[8pt] italic text-slate-700">
                  (Ký và ghi rõ họ tên)
                </div>
                <div className="h-14"></div>
                <div className="border-t border-dotted border-black/60 w-32 mx-auto pt-1 font-semibold text-[9pt]">
                  ....................................
                </div>
              </td>
              <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: 0 }}>
                <div className="font-bold uppercase text-[9.5pt]">
                  TRƯỞNG ĐÀI / GIÁM ĐỐC TRUNG TÂM
                </div>
                <div className="text-[8pt] italic text-slate-700">
                  (Ký tên và đóng dấu)
                </div>
                <div className="h-14"></div>
                <div className="border-t border-dotted border-black/60 w-32 mx-auto pt-1 font-semibold text-[9pt]">
                  ....................................
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
