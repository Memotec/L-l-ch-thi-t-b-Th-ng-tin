import * as XLSX from 'xlsx';
import { EquipmentData, AppUser } from '../types';

export interface StatisticsExportSummary {
  totalEquipments: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  dueStatus: {
    overdue: number;
    dueSoon30Days: number;
    normal: number;
    notSet: number;
  };
  totalMaintenanceLogs: number;
  totalRepairLogs: number;
  totalComponents: number;
}

class StatisticsExportService {
  /**
   * Calculate summary statistics from equipment list
   */
  calculateStatistics(equipments: EquipmentData[]): StatisticsExportSummary {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const dueStatus = {
      overdue: 0,
      dueSoon30Days: 0,
      normal: 0,
      notSet: 0
    };
    let totalMaintenanceLogs = 0;
    let totalRepairLogs = 0;
    let totalComponents = 0;

    const now = new Date();

    equipments.forEach(eq => {
      // Category
      const cat = eq.general?.category || 'Chưa phân loại';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      // Status
      const stat = eq.general?.status || 'Chưa cập nhật';
      byStatus[stat] = (byStatus[stat] || 0) + 1;

      // Priority
      const prio = eq.general?.priority || 'Chưa phân cấp';
      byPriority[prio] = (byPriority[prio] || 0) + 1;

      // Calibration Dues
      const nextCal = eq.general?.nextCalDate;
      if (nextCal) {
        const calDate = new Date(nextCal);
        if (!isNaN(calDate.getTime())) {
          const diffDays = Math.ceil((calDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            dueStatus.overdue++;
          } else if (diffDays <= 30) {
            dueStatus.dueSoon30Days++;
          } else {
            dueStatus.normal++;
          }
        } else {
          dueStatus.notSet++;
        }
      } else {
        dueStatus.notSet++;
      }

      // Logs & Components
      totalMaintenanceLogs += (eq.maintenance || []).length;
      totalRepairLogs += (eq.repair || []).length;
      totalComponents += (eq.components || []).length;
    });

    return {
      totalEquipments: equipments.length,
      byCategory,
      byStatus,
      byPriority,
      dueStatus,
      totalMaintenanceLogs,
      totalRepairLogs,
      totalComponents
    };
  }

  /**
   * Export comprehensive multi-sheet Excel (.xlsx) file for administrators
   */
  exportToExcel(equipments: EquipmentData[], adminUser?: AppUser): void {
    const stats = this.calculateStatistics(equipments);
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const wb = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: TỔNG QUAN THỐNG KÊ (Executive Summary)
    // ==========================================
    const summaryData: any[][] = [
      ['CÔNG TY QUẢN LÝ BAY MIỀN NAM - TRUNG TÂM BẢO ĐẢM KỸ THUẬT'],
      ['ĐỘI THÔNG TIN - HỆ THỐNG QUẢN LÝ SỔ LÝ LỊCH THIẾT BỊ CNS'],
      [''],
      ['BÁO CÁO THỐNG KÊ TỔNG HỢP TOÀN BỘ SỔ LÝ LỊCH THIẾT BỊ HIỆN CÓ'],
      [`Ngày lập báo cáo: ${dateStr} ${timeStr}`],
      [`Người trích xuất: ${adminUser?.displayName || adminUser?.username || 'Quản trị viên'} (${adminUser?.role === 'admin' ? 'Quyền Quản Trị Hệ Thống' : 'Kỹ sư Đội TT'})`],
      [''],
      ['I. CHỈ SỐ TỔNG QUAN', 'SỐ LƯỢNG', 'GHI CHÚ'],
      ['Tổng số sổ lý lịch thiết bị đang quản lý', stats.totalEquipments, 'Hồ sơ kỹ thuật điện tử đang lưu trữ'],
      ['Tổng số lượt bảo dưỡng định kỳ ghi nhận', stats.totalMaintenanceLogs, 'Toàn bộ các chu kỳ Tuần/Tháng/Quý/Năm'],
      ['Tổng số lượt sửa chữa & khắc phục sự cố', stats.totalRepairLogs, 'Nhật ký khắc phục kỹ thuật'],
      ['Tổng số linh kiện & module quản lý', stats.totalComponents, 'Các khối chức năng chi tiết'],
      [''],
      ['II. PHÂN LOẠI THEO CHỦNG LOẠI THIẾT BỊ', 'SỐ LƯỢNG', 'TỶ LỆ (%)'],
      ...Object.entries(stats.byCategory).map(([cat, count]) => [
        cat,
        count,
        stats.totalEquipments > 0 ? `${((count / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ]),
      [''],
      ['III. PHÂN LOẠI THEO TRẠNG THÁI KHAI THÁC', 'SỐ LƯỢNG', 'TỶ LỆ (%)'],
      ...Object.entries(stats.byStatus).map(([status, count]) => [
        status,
        count,
        stats.totalEquipments > 0 ? `${((count / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ]),
      [''],
      ['IV. PHÂN CẤP ƯU TIÊN VẬN HÀNH', 'SỐ LƯỢNG', 'TỶ LỆ (%)'],
      ...Object.entries(stats.byPriority).map(([prio, count]) => [
        prio,
        count,
        stats.totalEquipments > 0 ? `${((count / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ]),
      [''],
      ['V. TÌNH TRẠNG HẠN KIỂM CHUẨN / HIỆU CHUẨN', 'SỐ LƯỢNG', 'TỶ LỆ (%)'],
      [
        'Quá hạn kiểm định / hiệu chuẩn (Cần xử lý gấp)',
        stats.dueStatus.overdue,
        stats.totalEquipments > 0 ? `${((stats.dueStatus.overdue / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ],
      [
        'Sắp đến hạn kiểm định trong 30 ngày tới',
        stats.dueStatus.dueSoon30Days,
        stats.totalEquipments > 0 ? `${((stats.dueStatus.dueSoon30Days / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ],
      [
        'Thời hạn kiểm định đảm bảo an toàn',
        stats.dueStatus.normal,
        stats.totalEquipments > 0 ? `${((stats.dueStatus.normal / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ],
      [
        'Chưa cập nhật thông tin kiểm chuẩn',
        stats.dueStatus.notSet,
        stats.totalEquipments > 0 ? `${((stats.dueStatus.notSet / stats.totalEquipments) * 100).toFixed(1)}%` : '0%'
      ]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan Thống Kê');

    // ==========================================
    // SHEET 2: DANH SÁCH TOÀN BỘ SỔ LÝ LỊCH (Inventory Master)
    // ==========================================
    const inventoryHeaders = [
      'STT',
      'Mã Hệ Thống',
      'Mã Tài Sản',
      'Tên Thiết Bị',
      'Chủng Loại',
      'Model',
      'Số Serial',
      'Hãng Sản Xuất',
      'Nước Sản Xuất',
      'Năm Sản Xuất',
      'Ngày Đưa Vào Khai Thác',
      'Vị Trí Lắp Đặt / Trạm',
      'Đơn Vị Quản Lý',
      'Kỹ Sư Phụ Trách',
      'Người Giám Sát',
      'Cấp Độ Ưu Tiên',
      'Trạng Thái Hoạt Động',
      'Hạn Bảo Hành',
      'Hạn Kiểm Chuẩn Kế Tiếp',
      'Tình Trạng Kiểm Chuẩn',
      'Lần BD Gần Nhất',
      'Kỳ BD Gần Nhất',
      'Người Thực Hiện Gần Nhất',
      'Tổng Lượt Bảo Dưỡng',
      'Tổng Lượt Sự Cố / Sửa Chữa',
      'Số Khối Linh Kiện',
      'Số Tài Liệu Kèm',
      'Ghi Chú Kỹ Thuật'
    ];

    const inventoryRows = equipments.map((eq, idx) => {
      const nowTime = now.getTime();
      let calStatus = 'Chưa thiết lập';
      if (eq.general?.nextCalDate) {
        const cal = new Date(eq.general.nextCalDate);
        if (!isNaN(cal.getTime())) {
          const diff = Math.ceil((cal.getTime() - nowTime) / (1000 * 60 * 60 * 24));
          if (diff < 0) calStatus = `Quá hạn ${Math.abs(diff)} ngày`;
          else if (diff <= 30) calStatus = `Còn ${diff} ngày (Sắp đến hạn)`;
          else calStatus = `Đảm bảo (Còn ${diff} ngày)`;
        }
      }

      const maintLogs = eq.maintenance || [];
      const lastMaint = maintLogs[0];

      return [
        idx + 1,
        eq.general?.assetCode || eq.id,
        eq.general?.assetNo || '',
        eq.general?.name || 'Chưa đặt tên',
        eq.general?.category || '',
        eq.general?.model || '',
        eq.general?.serial || '',
        eq.general?.manufacturer || '',
        eq.general?.origin || '',
        eq.general?.yearMade || '',
        eq.general?.commissioned || '',
        eq.org?.location || '',
        eq.org?.unit || '',
        eq.org?.primaryEngineer || '',
        eq.org?.supervisor || '',
        eq.general?.priority || '',
        eq.general?.status || '',
        eq.general?.warrantyDate || '',
        eq.general?.nextCalDate || '',
        calStatus,
        lastMaint?.date || 'Chưa có',
        lastMaint?.cycle || '',
        lastMaint?.person || '',
        maintLogs.length,
        (eq.repair || []).length,
        (eq.components || []).length,
        (eq.docs || []).length,
        eq.general?.notes || ''
      ];
    });

    const wsInventory = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryRows]);
    wsInventory['!cols'] = [
      { wch: 6 },  // STT
      { wch: 15 }, // Mã Hệ Thống
      { wch: 16 }, // Mã Tài Sản
      { wch: 32 }, // Tên Thiết Bị
      { wch: 14 }, // Chủng Loại
      { wch: 18 }, // Model
      { wch: 18 }, // Serial
      { wch: 20 }, // Hãng
      { wch: 14 }, // Nước
      { wch: 12 }, // Năm SX
      { wch: 15 }, // Ngày KT
      { wch: 26 }, // Vị trí
      { wch: 26 }, // Đơn vị
      { wch: 20 }, // Kỹ sư
      { wch: 20 }, // Giám sát
      { wch: 22 }, // Ưu tiên
      { wch: 20 }, // Trạng thái
      { wch: 14 }, // Hạn BH
      { wch: 16 }, // Hạn Kiểm Chuẩn
      { wch: 22 }, // Tình Trạng
      { wch: 14 }, // Lần BD gần nhất
      { wch: 14 }, // Kỳ BD
      { wch: 22 }, // Người thực hiện
      { wch: 12 }, // Số lần BD
      { wch: 12 }, // Số lần SC
      { wch: 12 }, // Linh kiện
      { wch: 12 }, // Tài liệu
      { wch: 30 }  // Ghi chú
    ];
    XLSX.utils.book_append_sheet(wb, wsInventory, 'Danh Sách Sổ Lý Lịch');

    // ==========================================
    // SHEET 3: CẢNH BÁO HẠN BẢO TRÌ & KIỂM ĐỊNH (Warning List)
    // ==========================================
    const warningHeaders = [
      'STT',
      'Tên Thiết Bị',
      'Mã Thiết Bị',
      'Vị Trí',
      'Chủng Loại',
      'Loại Hạn',
      'Thời Hạn',
      'Số Ngày Còn / Quá',
      'Mức Độ Cảnh Báo',
      'Kỹ Sư Phụ Trách',
      'Gợi Ý Xử Lý'
    ];

    const warningRows: any[][] = [];
    let warnIdx = 1;

    equipments.forEach(eq => {
      // 1. Check calibration
      if (eq.general?.nextCalDate) {
        const cal = new Date(eq.general.nextCalDate);
        if (!isNaN(cal.getTime())) {
          const diff = Math.ceil((cal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) {
            warningRows.push([
              warnIdx++,
              eq.general?.name || eq.id,
              eq.general?.assetCode || eq.general?.assetNo || eq.id,
              eq.org?.location || '',
              eq.general?.category || '',
              'Kiểm Chuẩn / Đo Kiểm Định Kỳ',
              eq.general.nextCalDate,
              `Quá hạn ${Math.abs(diff)} ngày`,
              'NGUY CẤP',
              eq.org?.primaryEngineer || 'Đội TT',
              'Lập kế hoạch kiểm chuẩn hoặc liên hệ đơn vị đo lường ngay lập tức'
            ]);
          } else if (diff <= 30) {
            warningRows.push([
              warnIdx++,
              eq.general?.name || eq.id,
              eq.general?.assetCode || eq.general?.assetNo || eq.id,
              eq.org?.location || '',
              eq.general?.category || '',
              'Kiểm Chuẩn / Đo Kiểm Định Kỳ',
              eq.general.nextCalDate,
              `Còn ${diff} ngày`,
              'CẦN CHÚ Ý',
              eq.org?.primaryEngineer || 'Đội TT',
              'Chuẩn bị thiết bị dự phòng và bố trí lịch kiểm định'
            ]);
          }
        }
      }

      // 2. Check warranty
      if (eq.general?.warrantyDate) {
        const war = new Date(eq.general.warrantyDate);
        if (!isNaN(war.getTime())) {
          const diff = Math.ceil((war.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= 30) {
            warningRows.push([
              warnIdx++,
              eq.general?.name || eq.id,
              eq.general?.assetCode || eq.general?.assetNo || eq.id,
              eq.org?.location || '',
              eq.general?.category || '',
              'Hạn Bảo Hành Nhà Cung Cấp',
              eq.general.warrantyDate,
              `Còn ${diff} ngày`,
              'SẮP HẾT HẠN',
              eq.org?.primaryEngineer || 'Đội TT',
              'Kiểm tra rà soát toàn bộ các lỗi tiềm ẩn trước khi hết hạn bảo hành'
            ]);
          }
        }
      }
    });

    const wsWarning = XLSX.utils.aoa_to_sheet([warningHeaders, ...warningRows]);
    wsWarning['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 14 },
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsWarning, 'Cảnh Báo Hạn Kỹ Thuật');

    // ==========================================
    // SHEET 4: CHI TIẾT LINH KIỆN & VẬT TƯ (Components Detail)
    // ==========================================
    const componentHeaders = [
      'STT',
      'Tên Thiết Bị Gốc',
      'Mã Thiết Bị',
      'Tên Khối / Module',
      'Ký Hiệu / Part No',
      'Số Serial',
      'Đơn Vị Tính',
      'Số Lượng',
      'Tình Trạng Kỹ Thuật',
      'Ghi Chú'
    ];

    const componentRows: any[][] = [];
    let compIdx = 1;

    equipments.forEach(eq => {
      (eq.components || []).forEach(comp => {
        componentRows.push([
          compIdx++,
          eq.general?.name || eq.id,
          eq.general?.assetCode || eq.general?.assetNo || eq.id,
          comp.name || '',
          comp.partNo || '',
          comp.serial || '',
          comp.unit || 'Cái',
          comp.qty || 1,
          comp.healthStatus || 'Tốt',
          comp.note || ''
        ]);
      });
    });

    const wsComponents = XLSX.utils.aoa_to_sheet([componentHeaders, ...componentRows]);
    wsComponents['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsComponents, 'Chi Tiết Linh Kiện');

    // Generate filename with timestamp
    const dateFormatted = now.toISOString().split('T')[0];
    const filename = `Bao_Cao_Thong_Ke_So_Ly_Lich_CNS_${dateFormatted}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export quick CSV with UTF-8 BOM for immediate opening in Excel without encoding artifacts
   */
  exportToCsv(equipments: EquipmentData[]): void {
    const headers = [
      'STT',
      'Mã Thiết Bị',
      'Mã Tài Sản',
      'Tên Thiết Bị',
      'Chủng Loại',
      'Model',
      'Số Serial',
      'Hãng Sản Xuất',
      'Năm Sản Xuất',
      'Vị Trí Lắp Đặt',
      'Đơn Vị Quản Lý',
      'Kỹ Sư Phụ Trách',
      'Trạng Thái',
      'Cấp Ưu Tiên',
      'Hạn Kiểm Định',
      'Lần BD Gần Nhất'
    ];

    const rows = equipments.map((eq, i) => {
      const lastMaint = (eq.maintenance || [])[0];
      return [
        i + 1,
        `"${(eq.general?.assetCode || eq.id).replace(/"/g, '""')}"`,
        `"${(eq.general?.assetNo || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.name || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.category || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.model || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.serial || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.manufacturer || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.yearMade || '').replace(/"/g, '""')}"`,
        `"${(eq.org?.location || '').replace(/"/g, '""')}"`,
        `"${(eq.org?.unit || '').replace(/"/g, '""')}"`,
        `"${(eq.org?.primaryEngineer || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.status || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.priority || '').replace(/"/g, '""')}"`,
        `"${(eq.general?.nextCalDate || '').replace(/"/g, '""')}"`,
        `"${(lastMaint?.date || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    // UTF-8 BOM \uFEFF ensures Excel recognizes Vietnamese characters
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Thong_Ke_So_Ly_Lich_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const statisticsExportService = new StatisticsExportService();
