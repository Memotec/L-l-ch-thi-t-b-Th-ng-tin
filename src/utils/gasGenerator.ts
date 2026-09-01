/**
 * Utility to generate Google Apps Script (Code.gs), Web App UI (Index.html) & Manifest (appsscript.json)
 */

export const generateGasCode = (): string => {
  return `/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ SỔ LÝ LỊCH & VÒNG ĐỜI THIẾT BỊ KỸ THUẬT CNS (HÀNG KHÔNG)
 * GOOGLE APPS SCRIPT BACKEND (SHEETS, DOCS & DRIVE INTEGRATION)
 * ==============================================================================
 * Phiên bản: 3.0 (Tương thích Web App CNS Multi-Equipment Manager & Google Sheets UI)
 * 
 * CÁC TÍNH NĂNG CHÍNH:
 * 1. Web App Server (doGet / doPost):
 *    - Trả về giao diện Web App đầy đủ từ file Index.html khi truy cập trên trình duyệt.
 *    - Hỗ trợ REST API (doGet / doPost) phục vụ đồng bộ dữ liệu thời gian thực.
 * 2. Tương thích hai chiều google.script.run:
 *    - Cho phép giao diện Web App gọi trực tiếp các hàm xử lý dữ liệu máy chủ không cần cấu hình CORS.
 * 3. Quản lý cơ sở dữ liệu Google Sheets chuyên nghiệp:
 *    - Tự động tạo và cập nhật các Sheet: Thông tin chung, Thành phần linh kiện, Bảo dưỡng, Sửa chữa sự cố.
 *    - Lưu trữ bản sao dữ liệu toàn vẹn JSON trong Sheet ẩn.
 * 4. Tự động sinh Google Docs & PDF Sổ Lý Lịch:
 *    - Soạn thảo tài liệu kỹ thuật chuẩn Quốc hiệu, Tiêu ngữ, Bảng đặc tính, Linh kiện và Khối 3 chữ ký.
 * 5. Sao lưu tự động lên Google Drive:
 *    - Tự động tạo thư mục và xuất file backup JSON theo dấu thời gian.
 * 6. Tích hợp Menu điều khiển trực tiếp trên Google Sheets (onOpen).
 */

// Tên các Sheet dữ liệu
const SHEET_NAMES = {
  MASTER: '1_ThongTinChung',
  TRANSFERS: '2_DieuChuyen',
  LICENSES: '3_GiayPhep',
  SPECS: '4_DacTinhKyThuat',
  COMPONENTS: '5_ThanhPhanLinhKien',
  DOCS: '6_TaiLieuKyThuat',
  MAINTENANCE: '7_LichSuBaoDuong',
  REPAIRS: '8_SuaChuaBienDong',
  JSON_STORE: '_RAW_JSON_STORE_'
};

const DRIVE_FOLDER_BACKUP = 'CNS_LyLichThietBi_Backups';
const DRIVE_FOLDER_DOCS = 'CNS_SoLyLich_GoogleDocs';

/**
 * Tự động tạo Menu trên thanh công cụ Google Sheets khi mở file
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ Quản Lý Thiết Bị CNS')
    .addItem('🖥️ Mở Giao Diện Web App (Cửa sổ lớn)', 'showWebAppDialog')
    .addItem('📋 Mở Bảng Điều Khiển (Sidebar)', 'showWebAppSidebar')
    .addSeparator()
    .addItem('🔄 Tự động tạo các bảng dữ liệu chuẩn', 'setupAllSheets')
    .addItem('📄 Xuất Google Docs Sổ Lý Lịch cho thiết bị dòng đang chọn', 'exportSelectedRowToDoc')
    .addItem('💾 Sao lưu toàn bộ dữ liệu vào Google Drive', 'backupToDriveFromMenu')
    .addSeparator()
    .addItem('ℹ️ Giới thiệu & Hướng dẫn sử dụng', 'showHelpDialog')
    .addToUi();
}

/**
 * Mở Web App trong hộp thoại Modal trên Google Sheets
 */
function showWebAppDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('Hệ Thống Quản Lý Sổ Lý Lịch Thiết Bị CNS');
  SpreadsheetApp.getUi().showModalDialog(html, 'Sổ Lý Lịch & Vòng Đời Thiết Bị CNS');
}

/**
 * Mở Web App ở thanh Sidebar bên phải Google Sheets
 */
function showWebAppSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Quản Lý Sổ Lý Lịch CNS');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Hộp thoại hướng dẫn
 */
function showHelpDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Hệ Thống Quản Lý Sổ Lý Lịch Thiết Bị Kỹ Thuật CNS',
    'Phiên bản 3.0\\n\\n' +
    '1. Nhấn "Triển khai" > "Tùy chọn triển khai mới" > "Ứng dụng web" để nhận link chạy độc lập.\\n' +
    '2. Dữ liệu được lưu trữ tự động trên Google Sheets và Google Drive.\\n' +
    '3. Hỗ trợ đầy đủ chức năng quản lý linh kiện, lịch sử bảo dưỡng và xuất file Google Docs / PDF chuẩn mẫu.',
    ui.ButtonSet.OK
  );
}

/**
 * Xử lý yêu cầu GET từ Web App hoặc Trình duyệt
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : '';
    
    // Nếu có action API (Ping, Lấy danh sách thiết bị)
    if (action === 'ping') {
      return jsonResponse({
        success: true,
        status: 'online',
        message: 'Google Apps Script CNS Backend is active and connected!',
        spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'getAllEquipments' || action === 'getAll') {
      const data = getAllEquipmentsFromSheet();
      return jsonResponse({
        success: true,
        action: 'getAllEquipments',
        count: data.length,
        data: data
      });
    }
    
    if (action === 'getOneEquipment') {
      const id = e.parameter.id;
      const data = getOneEquipmentFromSheet(id);
      return jsonResponse({
        success: !!data,
        action: 'getOneEquipment',
        data: data
      });
    }
    
    // Mặc định: Phục vụ giao diện Web App HTML (Index.html)
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Hệ Thống Quản Lý Sổ Lý Lịch Thiết Bị CNS')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
      
  } catch (error) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family: sans-serif; padding: 24px; color: #b91c1c;">' +
      '<h2>Đã xảy ra lỗi khởi chạy Web App</h2>' +
      '<p>' + error.toString() + '</p>' +
      '<p>Vui lòng đảm bảo bạn đã tạo file <b>Index.html</b> trong trình biên tập Apps Script.</p>' +
      '</div>'
    );
  }
}

/**
 * Xử lý yêu cầu POST từ Web App (Lưu dữ liệu, Tạo Doc, Sao lưu Drive)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = {};
      }
    }
    
    const action = payload.action || (e && e.parameter && e.parameter.action) || 'saveAll';
    
    if (action === 'saveAllEquipments' || action === 'saveAll') {
      const equipments = payload.equipments || payload.data || [];
      const result = saveAllEquipmentsToSheet(equipments);
      return jsonResponse({
        success: true,
        action: 'saveAllEquipments',
        savedCount: equipments.length,
        details: result,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'createGoogleDoc' || action === 'exportToGoogleDoc') {
      const equipmentData = payload.equipment || payload.data;
      if (!equipmentData) {
        throw new Error('Thiếu dữ liệu thiết bị để tạo Google Doc.');
      }
      const docResult = generateGoogleDocForEquipment(equipmentData);
      return jsonResponse({
        success: true,
        action: 'createGoogleDoc',
        docId: docResult.docId,
        docUrl: docResult.docUrl,
        pdfDownloadUrl: docResult.pdfDownloadUrl,
        docName: docResult.docName,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'backupToDrive') {
      const equipments = payload.equipments || payload.data || getAllEquipmentsFromSheet();
      const backupResult = backupJsonToDrive(equipments);
      return jsonResponse({
        success: true,
        action: 'backupToDrive',
        fileId: backupResult.fileId,
        fileUrl: backupResult.fileUrl,
        folderUrl: backupResult.folderUrl,
        fileName: backupResult.fileName,
        timestamp: new Date().toISOString()
      });
    }
    
    return jsonResponse({
      success: false,
      message: 'Hành động không xác định: ' + action
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Trả về JSON Response có hỗ trợ CORS
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// CÁC HÀM XỬ LÝ DỮ LIỆU DÀNH CHO GOOGLE.SCRIPT.RUN (CLIENT GỌI TRỰC TIẾP)
// ==============================================================================

function apiGetEquipments() {
  return getAllEquipmentsFromSheet();
}

function apiSaveEquipments(equipments) {
  return saveAllEquipmentsToSheet(equipments);
}

function apiCreateGoogleDoc(equipment) {
  return generateGoogleDocForEquipment(equipment);
}

function apiBackupToDrive(equipments) {
  return backupJsonToDrive(equipments || getAllEquipmentsFromSheet());
}

function apiGetSpreadsheetInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    id: ss.getId(),
    name: ss.getName(),
    url: ss.getUrl()
  };
}

// ==============================================================================
// CƠ SỞ DỮ LIỆU VÀ ĐỒNG BỘ GOOGLE SHEETS
// ==============================================================================

/**
 * Lấy tất cả danh sách thiết bị từ Google Sheet
 */
function getAllEquipmentsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let jsonSheet = ss.getSheetByName(SHEET_NAMES.JSON_STORE);
  
  if (jsonSheet) {
    const rawVal = jsonSheet.getRange('A1').getValue();
    if (rawVal && typeof rawVal === 'string' && rawVal.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(rawVal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        Logger.log('Lỗi khi đọc JSON Store: ' + err);
      }
    }
  }
  
  // Fallback: Đọc từ Master Sheet
  const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER);
  if (!masterSheet) return getSampleInitialData();
  
  const rows = masterSheet.getDataRange().getValues();
  if (rows.length <= 1) return getSampleInitialData();
  
  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      createdAt: r[1] ? String(r[1]) : new Date().toISOString(),
      updatedAt: r[2] ? String(r[2]) : new Date().toISOString(),
      general: {
        category: r[3] || 'VHF/UHF',
        name: r[4] || '',
        model: r[5] || '',
        manufacturer: r[6] || '',
        serial: r[7] || '',
        assetNo: r[8] || '',
        assetCode: r[9] || '',
        yearMade: r[10] || '',
        origin: r[11] || '',
        commissioned: r[12] || '',
        acceptanceDate: r[13] || '',
        warrantyDate: r[14] || '',
        nextCalDate: r[15] || '',
        status: r[16] || 'Đang khai thác',
        priority: r[17] || 'Hệ thống chính (Level 1)',
        estimatedLifespanYears: Number(r[18]) || 15,
        notes: r[19] || ''
      },
      org: {
        companyName: r[20] || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
        unit: r[21] || '',
        location: r[22] || '',
        primaryEngineer: r[23] || '',
        phoneContact: r[24] || '',
        supervisor: r[25] || '',
        coverNote: r[26] || ''
      },
      orgRows: [],
      licenses: [],
      freqLicenses: [],
      exploitLicenses: [],
      spec: { text: '' },
      components: [],
      docs: [],
      maintenance: [],
      repair: []
    });
  }
  return list;
}

/**
 * Lấy 1 thiết bị theo ID
 */
function getOneEquipmentFromSheet(id) {
  const all = getAllEquipmentsFromSheet();
  return all.find(function(eq) { return eq.id === id; }) || null;
}

/**
 * Lưu danh sách tất cả thiết bị vào Google Sheet (ghi cả bảng hiển thị và JSON Store)
 */
function saveAllEquipmentsToSheet(equipments) {
  if (!Array.isArray(equipments) || equipments.length === 0) {
    return { success: false, message: 'Danh sách thiết bị trống' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Lưu RAW JSON vào JSON_STORE để đảm bảo toàn vẹn 100% dữ liệu
  let jsonSheet = ss.getSheetByName(SHEET_NAMES.JSON_STORE);
  if (!jsonSheet) {
    jsonSheet = ss.insertSheet(SHEET_NAMES.JSON_STORE);
    jsonSheet.hideSheet();
  }
  jsonSheet.getRange('A1').setValue(JSON.stringify(equipments));
  
  // 2. Ghi vào Master Sheet (Thông tin chung)
  let masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(SHEET_NAMES.MASTER);
  }
  masterSheet.clear();
  
  const masterHeaders = [
    'Mã Hệ Thống (ID)', 'Ngày Tạo', 'Ngày Cập Nhật',
    'Phân Loại Chủng Loại', 'Tên Thiết Bị', 'Model / Ký hiệu', 'Hãng Sản Xuất',
    'Số Serial', 'Mã Thẻ Tài Sản', 'Mã Kế Toán', 'Năm Sản Xuất', 'Nước Sản Xuất',
    'Ngày Đưa Vào SD', 'Ngày Nghiệm Thu', 'Hạn Bảo Hành', 'Hạn Kiểm Chuẩn',
    'Trạng Thái Vận Hành', 'Mức Độ Ưu Tiên', 'Niên Hạn Thiết Kế (Năm)', 'Ghi Chú Chung',
    'Đơn Vị Quản Lý Cấp Trên', 'Đài / Trạm Trực Thuộc', 'Vị Trí Lắp Đặt',
    'Kỹ Sư Phụ Trách Chính', 'Số Điện Thoại', 'Lãnh Đạo Trực Tiếp', 'Ghi Chú Bìa'
  ];
  
  const masterRows = [masterHeaders];
  equipments.forEach(function(eq) {
    const g = eq.general || {};
    const o = eq.org || {};
    masterRows.push([
      eq.id, eq.createdAt || '', eq.updatedAt || '',
      g.category || '', g.name || '', g.model || '', g.manufacturer || '',
      g.serial || '', g.assetNo || '', g.assetCode || '', g.yearMade || '', g.origin || '',
      g.commissioned || '', g.acceptanceDate || '', g.warrantyDate || '', g.nextCalDate || '',
      g.status || '', g.priority || '', g.estimatedLifespanYears || '', g.notes || '',
      o.companyName || '', o.unit || '', o.location || '',
      o.primaryEngineer || '', o.phoneContact || '', o.supervisor || '', o.coverNote || ''
    ]);
  });
  masterSheet.getRange(1, 1, masterRows.length, masterRows[0].length).setValues(masterRows);
  formatHeaderRow(masterSheet, '#0284c7');
  
  // 3. Ghi Sheet Thành phần & Linh kiện
  let compSheet = ss.getSheetByName(SHEET_NAMES.COMPONENTS);
  if (!compSheet) compSheet = ss.insertSheet(SHEET_NAMES.COMPONENTS);
  compSheet.clear();
  const compHeaders = ['Mã Thiết Bị (ID)', 'Tên Thiết Bị', 'STT', 'Tên Khối / Bo Mạch / Module', 'Mã Part No.', 'Số Serial', 'Đơn Vị Tính', 'Số Lượng', 'Tình Trạng Kỹ Thuật', 'Ghi Chú'];
  const compRows = [compHeaders];
  equipments.forEach(function(eq) {
    (eq.components || []).forEach(function(c, idx) {
      compRows.push([
        eq.id, eq.general ? eq.general.name : '', c.no || (idx + 1),
        c.name || '', c.partNo || '', c.serial || '', c.unit || 'Bộ',
        c.qty || 1, c.healthStatus || 'Tốt', c.note || ''
      ]);
    });
  });
  if (compRows.length > 1) {
    compSheet.getRange(1, 1, compRows.length, compRows[0].length).setValues(compRows);
    formatHeaderRow(compSheet, '#0369a1');
  }
  
  // 4. Ghi Sheet Lịch sử bảo dưỡng
  let maintSheet = ss.getSheetByName(SHEET_NAMES.MAINTENANCE);
  if (!maintSheet) maintSheet = ss.insertSheet(SHEET_NAMES.MAINTENANCE);
  maintSheet.clear();
  const maintHeaders = ['Mã Thiết Bị (ID)', 'Tên Thiết Bị', 'Ngày Thực Hiện', 'Chu Kỳ Bảo Dưỡng', 'Nội Dung Công Việc Đã Làm', 'Thông Số Đo Đạc Thực Tế', 'Kết Luận / Đánh Giá', 'Người Thực Hiện', 'Cán Bộ Kiểm Tra / Giám Sát'];
  const maintRows = [maintHeaders];
  equipments.forEach(function(eq) {
    (eq.maintenance || []).forEach(function(m) {
      maintRows.push([
        eq.id, eq.general ? eq.general.name : '', m.date || '',
        m.cycle || '', m.content || '', m.measuredParams || '',
        m.result || '', m.person || '', m.supervisor || ''
      ]);
    });
  });
  if (maintRows.length > 1) {
    maintSheet.getRange(1, 1, maintRows.length, maintRows[0].length).setValues(maintRows);
    formatHeaderRow(maintSheet, '#0d9488');
  }
  
  // 5. Ghi Sheet Sửa chữa & Biến động
  let repairSheet = ss.getSheetByName(SHEET_NAMES.REPAIRS);
  if (!repairSheet) repairSheet = ss.insertSheet(SHEET_NAMES.REPAIRS);
  repairSheet.clear();
  const repHeaders = ['Mã Thiết Bị (ID)', 'Tên Thiết Bị', 'Ngày Phát Sinh', 'Ngày Hoàn Thành', 'Phân Loại Biến Động', 'Hiện Tượng / Sự Cố', 'Nguyên Nhân', 'Biện Pháp Xử Lý / Khắc Phục', 'Vật Tư / Bo Mạch Đã Thay', 'Người Thực Hiện', 'Tình Trạng'];
  const repRows = [repHeaders];
  equipments.forEach(function(eq) {
    (eq.repair || []).forEach(function(r) {
      repRows.push([
        eq.id, eq.general ? eq.general.name : '', r.date || '',
        r.resolvedDate || '', r.type || '', r.incidentDescription || '',
        r.rootCause || '', r.actionTaken || '', r.replacedParts || '',
        r.person || '', r.status || ''
      ]);
    });
  });
  if (repRows.length > 1) {
    repairSheet.getRange(1, 1, repRows.length, repRows[0].length).setValues(repRows);
    formatHeaderRow(repairSheet, '#e11d48');
  }
  
  return { 
    success: true, 
    count: equipments.length,
    updatedSheets: [SHEET_NAMES.MASTER, SHEET_NAMES.COMPONENTS, SHEET_NAMES.MAINTENANCE, SHEET_NAMES.REPAIRS] 
  };
}

/**
 * Khởi tạo đầy đủ cấu trúc các sheet chuẩn
 */
function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sample = getAllEquipmentsFromSheet();
  saveAllEquipmentsToSheet(sample);
  SpreadsheetApp.getUi().alert('Thành công', 'Đã khởi tạo đầy đủ cấu trúc các bảng tính cơ sở dữ liệu CNS!', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Xuất Google Docs từ dòng được chọn trên Sheet
 */
function exportSelectedRowToDoc() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Vui lòng chọn một dòng chứa thông tin thiết bị (từ dòng 2 trở đi).');
    return;
  }
  
  const eqId = sheet.getRange(row, 1).getValue();
  if (!eqId) {
    SpreadsheetApp.getUi().alert('Không tìm thấy Mã thiết bị (ID) ở cột đầu tiên của dòng này.');
    return;
  }
  
  const eq = getOneEquipmentFromSheet(String(eqId));
  if (!eq) {
    SpreadsheetApp.getUi().alert('Không tìm thấy dữ liệu chi tiết cho thiết bị mã: ' + eqId);
    return;
  }
  
  const result = generateGoogleDocForEquipment(eq);
  SpreadsheetApp.getUi().alert(
    'Tạo Sổ Lý Lịch Thành Công',
    'Đã tạo Google Doc: ' + result.docName + '\\n\\nĐường dẫn: ' + result.docUrl,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Sao lưu từ menu Sheet
 */
function backupToDriveFromMenu() {
  const sample = getAllEquipmentsFromSheet();
  const res = backupJsonToDrive(sample);
  SpreadsheetApp.getUi().alert(
    'Sao Lưu Google Drive Thành Công',
    'Tên file: ' + res.fileName + '\\nThư mục: CNS_LyLichThietBi_Backups\\n\\nLink: ' + res.fileUrl,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Định dạng dòng tiêu đề bảng tính Google Sheet
 */
function formatHeaderRow(sheet, bgColor) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground(bgColor || '#0284c7');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, Math.min(lastCol, 20));
}

/**
 * Tạo Google Document định dạng chuẩn văn bản kỹ thuật "SỔ LÝ LỊCH THIẾT BỊ" trên Google Drive
 * - Tự động tìm kiếm file Sổ lý lịch đã có trong thư mục CNS_SoLyLich_GoogleDocs
 * - Nếu đã tồn tại: Tự động CHÉP ĐÈ (Overwrite) toàn bộ nội dung mới nhất
 * - Nếu chưa có: Tạo mới tài liệu Google Doc trong thư mục tập trung
 */
function generateGoogleDocForEquipment(eq) {
  const g = eq.general || {};
  const o = eq.org || {};
  const cleanName = (g.name ? g.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'ThietBi');
  const docName = 'So_Ly_Lich_' + cleanName + '_' + (g.serial || eq.id || 'NoSerial');
  
  // Tìm hoặc tạo thư mục lưu trữ tập trung trên Drive
  const folder = getOrCreateFolder(DRIVE_FOLDER_DOCS);
  
  // Kiểm tra xem đã có file Doc cùng tên trong thư mục tập trung hay chưa
  let doc;
  let isOverwritten = false;
  const existingFiles = folder.getFilesByName(docName);
  
  if (existingFiles.hasNext()) {
    const existingFile = existingFiles.next();
    doc = DocumentApp.openById(existingFile.getId());
    isOverwritten = true;
  } else {
    // Tạo tài liệu Google Docs mới
    doc = DocumentApp.create(docName);
    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);
    isOverwritten = false;
  }
  
  const body = doc.getBody();
  // Xóa sạch nội dung cũ nếu là file ghi đè
  body.clear();
  
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(45);
  body.setMarginRight(36);
  
  // --- HEADER QUỐC GIA & CƠ QUAN ---
  const headerTable = body.appendTable([
    [
      (o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM') + '\n' + (o.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT') + '\n------------------',
      'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n-------------------------'
    ]
  ]);
  headerTable.setBorderWidth(0);
  const cell0 = headerTable.getCell(0, 0);
  cell0.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  cell0.getChild(0).asParagraph().setBold(true).setFontSize(10);
  
  const cell1 = headerTable.getCell(0, 1);
  cell1.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  cell1.getChild(0).asParagraph().setBold(true).setFontSize(10);
  
  body.appendParagraph('');
  
  // --- TIÊU ĐỀ CHÍNH ---
  const titleP = body.appendParagraph('SỔ LÝ LỊCH THIẾT BỊ KỸ THUẬT');
  titleP.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  titleP.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titleP.setFontSize(18);
  titleP.setBold(true);
  titleP.setForegroundColor('#0369a1');
  
  const subTitleP = body.appendParagraph('CHỦNG LOẠI: ' + (g.category || 'VHF/UHF') + ' - TÊN THIẾT BỊ: ' + (g.name || '').toUpperCase());
  subTitleP.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  subTitleP.setFontSize(12);
  subTitleP.setBold(true);
  
  const updateP = body.appendParagraph('Đồng bộ tự động & Ghi đè mới nhất: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'));
  updateP.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  updateP.setFontSize(9);
  updateP.setItalic(true);
  updateP.setForegroundColor('#64748b');
  
  body.appendParagraph('');
  
  // --- PHẦN I: THÔNG TIN CHUNG ---
  addSectionHeader(body, 'I. THÔNG TIN CHUNG & QUẢN LÝ TÀI SẢN');
  const genTableData = [
    ['Tên thiết bị:', g.name || '', 'Chủng loại:', g.category || ''],
    ['Ký hiệu / Model:', g.model || '', 'Số Serial:', g.serial || ''],
    ['Hãng sản xuất:', g.manufacturer || '', 'Nước sản xuất:', g.origin || ''],
    ['Năm sản xuất:', String(g.yearMade || ''), 'Mã thẻ tài sản:', g.assetNo || ''],
    ['Ngày đưa vào sử dụng:', g.commissioned || '', 'Hạn bảo hành:', g.warrantyDate || ''],
    ['Trạng thái vận hành:', g.status || '', 'Mức độ ưu tiên:', g.priority || ''],
    ['Đài / Trạm quản lý:', o.unit || '', 'Vị trí lắp đặt:', o.location || ''],
    ['Kỹ sư phụ trách:', o.primaryEngineer || '', 'Số điện thoại liên hệ:', o.phoneContact || '']
  ];
  createFormattedTable(body, genTableData, true);
  
  body.appendParagraph('');
  
  // --- PHẦN II: THÔNG SỐ ĐẶC TÍNH KỸ THUẬT ---
  addSectionHeader(body, 'II. ĐẶC TÍNH KỸ THUẬT & CẤU HÌNH HỆ THỐNG');
  const s = eq.spec || {};
  const specData = [
    ['Công suất phát (Tx Power):', s.power || '---', 'Mức ngõ ra / Độ nhạy:', s.output || '---'],
    ['Dải tần số / Kênh công tác:', s.channelFreq || s.range || '---', 'Giao diện kết nối (Interface):', s.interface || '---'],
    ['Địa chỉ Quản trị IP:', s.mgmtIp || '---', 'Subnet Mask / Gateway:', (s.subnetMask || '') + ' / ' + (s.gateway || '')],
    ['VLAN ID / SNMP Community:', (s.vlanId || '---') + ' / ' + (s.snmpCommunity || '---'), 'Phiên bản Firmware:', s.firmware || '---']
  ];
  createFormattedTable(body, specData, true);
  
  if (s.text) {
    body.appendParagraph('Mô tả cấu hình chi tiết:').setBold(true).setFontSize(10);
    body.appendParagraph(s.text).setFontSize(10).setItalic(true);
  }
  
  body.appendParagraph('');
  
  // --- PHẦN III: DANH MỤC KHỐI & LINH KIỆN ---
  addSectionHeader(body, 'III. DANH MỤC CÁC KHỐI, BO MẠCH VÀ LINH KIỆN THAY THẾ');
  const compHeader = ['STT', 'Tên Khối / Bo Mạch / Module', 'Mã Part No.', 'Số Serial', 'ĐVT', 'SL', 'Tình Trạng'];
  const compRows = [compHeader];
  (eq.components || []).forEach(function(c, i) {
    compRows.push([
      String(c.no || (i + 1)),
      c.name || '',
      c.partNo || '',
      c.serial || '',
      c.unit || 'Bộ',
      String(c.qty || 1),
      c.healthStatus || 'Tốt'
    ]);
  });
  if (compRows.length === 1) {
    compRows.push(['1', 'Khối máy chính đồng bộ theo thiết bị', '---', g.serial || '---', 'Bộ', '1', 'Tốt']);
  }
  createFormattedTable(body, compRows, false, '#0284c7');
  
  body.appendParagraph('');
  
  // --- PHẦN IV: NHẬT KÝ BẢO DƯỠNG ĐỊNH KỲ ---
  addSectionHeader(body, 'IV. NHẬT KÝ BẢO DƯỠNG KỸ THUẬT ĐỊNH KỲ');
  const maintHeader = ['Ngày TH', 'Chu Kỳ', 'Nội Dung Bảo Dưỡng / Đo Đạc', 'Kết Quả Kỹ Thuật', 'Người TH', 'KTV Giám Sát'];
  const maintRows = [maintHeader];
  (eq.maintenance || []).forEach(function(m) {
    maintRows.push([
      m.date || '',
      m.cycle || '',
      (m.content || '') + (m.measuredParams ? '\\n[Thông số: ' + m.measuredParams + ']' : ''),
      m.result || '',
      m.person || '',
      m.supervisor || ''
    ]);
  });
  if (maintRows.length === 1) {
    maintRows.push(['Chưa có nhật ký', '---', '---', '---', '---', '---']);
  }
  createFormattedTable(body, maintRows, false, '#0d9488');
  
  body.appendParagraph('');
  
  // --- PHẦN V: BIẾN ĐỘNG & SỬA CHỮA SỰ CỐ ---
  addSectionHeader(body, 'V. THEO DÕI SỬA CHỮA, KHẮC PHỤC SỰ CỐ & BIẾN ĐỘNG');
  const repHeader = ['Ngày', 'Phân Loại', 'Hiện Tượng / Nguyên Nhân', 'Biện Pháp Xử Lý & Vật Tư Thay', 'Người TH', 'Tình Trạng'];
  const repRows = [repHeader];
  (eq.repair || []).forEach(function(r) {
    repRows.push([
      r.date || '',
      r.type || '',
      (r.incidentDescription || '') + (r.rootCause ? '\\n[Nguyên nhân: ' + r.rootCause + ']' : ''),
      (r.actionTaken || '') + (r.replacedParts ? '\\n[Thay thế: ' + r.replacedParts + ']' : ''),
      r.person || '',
      r.status || ''
    ]);
  });
  if (repRows.length === 1) {
    repRows.push(['Chưa có biến động', '---', '---', '---', '---', '---']);
  }
  createFormattedTable(body, repRows, false, '#e11d48');
  
  body.appendParagraph('');
  
  // --- KHỐI CHỮ KÝ PHÊ DUYỆT ---
  const signTable = body.appendTable([
    [
      'NGƯỜI LẬP SỔ\\n(Ký và ghi rõ họ tên)\\n\\n\\n\\n\\n' + (o.primaryEngineer || 'Kỹ sư phụ trách'),
      'CÁN BỘ QUẢN LÝ ĐÀI/TRẠM\\n(Ký và ghi rõ họ tên)\\n\\n\\n\\n\\n' + (o.supervisor || 'Trưởng đài/trạm'),
      'LÃNH ĐẠO ĐƠN VỊ DUYỆT\\n(Ký tên và đóng dấu)\\n\\n\\n\\n\\nTrưởng phòng / Giám đốc'
    ]
  ]);
  signTable.setBorderWidth(0);
  for (let c = 0; c < 3; c++) {
    const cell = signTable.getCell(0, c);
    cell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER).setBold(true).setFontSize(10);
  }
  
  doc.saveAndClose();
  
  const docId = doc.getId();
  return {
    docId: docId,
    docUrl: 'https://docs.google.com/document/d/' + docId + '/edit',
    pdfDownloadUrl: 'https://docs.google.com/document/d/' + docId + '/export?format=pdf',
    docName: docName
  };
}

/**
 * Tiện ích: Thêm tiêu đề mục trong Doc
 */
function addSectionHeader(body, text) {
  const p = body.appendParagraph(text);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  p.setFontSize(12);
  p.setBold(true);
  p.setForegroundColor('#0f172a');
  p.setSpacingBefore(10);
  p.setSpacingAfter(4);
}

/**
 * Tiện ích: Tạo bảng định dạng đẹp trong Google Docs
 */
function createFormattedTable(body, data, isGrid, headerBgColor) {
  if (!data || data.length === 0) return;
  const table = body.appendTable(data);
  table.setBorderColor('#cbd5e1');
  table.setBorderWidth(1);
  
  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.setPaddingTop(4);
      cell.setPaddingBottom(4);
      cell.setPaddingLeft(6);
      cell.setPaddingRight(6);
      
      const p = cell.getChild(0).asParagraph();
      p.setFontSize(9);
      
      if (!isGrid && r === 0) {
        // Dòng header của bảng danh sách
        cell.setBackgroundColor(headerBgColor || '#0284c7');
        p.setBold(true).setForegroundColor('#ffffff').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      } else if (isGrid && (c === 0 || c === 2)) {
        // Cột nhãn trong bảng Grid 4 cột
        cell.setBackgroundColor('#f1f5f9');
        p.setBold(true).setForegroundColor('#334155');
      }
    }
  }
}

/**
 * Sao lưu toàn bộ JSON dữ liệu vào thư mục Google Drive
 */
function backupJsonToDrive(equipments) {
  const folder = getOrCreateFolder(DRIVE_FOLDER_BACKUP);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  const fileName = 'CNS_Equipment_DB_Backup_' + dateStr + '.json';
  
  const jsonContent = JSON.stringify(equipments, null, 2);
  const file = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
  
  return {
    fileId: file.getId(),
    fileName: fileName,
    fileUrl: file.getUrl(),
    folderUrl: folder.getUrl()
  };
}

/**
 * Tiện ích: Tìm hoặc tạo thư mục Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Dữ liệu mẫu ban đầu khi khởi tạo mới
 */
function getSampleInitialData() {
  return [
    {
      id: 'EQ-CNS-2024-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      general: {
        category: 'VHF/UHF',
        name: 'Máy phát VHF Không Địa Chính (Main Tx)',
        model: 'R&S Series 4200 (XU4200)',
        manufacturer: 'Rohde & Schwarz',
        serial: 'RS-4200-VN-8849',
        assetNo: 'TSCD-VHF-001',
        assetCode: 'VHF-T1-TSN',
        yearMade: '2020',
        origin: 'CHLB Đức (Germany)',
        commissioned: '2020-06-15',
        acceptanceDate: '2020-06-10',
        warrantyDate: '2022-06-15',
        nextCalDate: '2025-06-15',
        status: 'Đang khai thác',
        priority: 'Hệ thống chính (Level 1)',
        estimatedLifespanYears: 15,
        notes: 'Thiết bị phát VHF chính đài kiểm soát không lưu Tân Sơn Nhất.'
      },
      org: {
        companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
        unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
        location: 'Đài KSKL Tân Sơn Nhất - Tầng 4 Phòng Thiết Bị',
        primaryEngineer: 'KS. Nguyễn Văn An',
        phoneContact: '0903.123.456',
        supervisor: 'KS. Trần Minh Trí',
        coverNote: 'Lưu hành nội bộ - Đơn vị CNS'
      },
      orgRows: [
        {
          id: 'org-1',
          date: '2020-06-15',
          fromUnit: 'Ban QLDA Chuyên Ngành Quản Lý Bay',
          toUnit: 'Trung Tâm Bảo Đảm Kỹ Thuật',
          reason: 'Bàn giao đưa vào khai thác chính thức sau nghiệm thu',
          decisionNo: 'QĐ-88/QLB-KT',
          signer: 'Tổng Giám Đốc'
        }
      ],
      licenses: [],
      freqLicenses: [
        {
          id: 'freq-1',
          licenseNo: 'GP-TS-118.1-2024',
          frequency: '118.100 MHz (TWR Main)',
          issuedDate: '2024-01-01',
          expiryDate: '2028-12-31',
          issuer: 'Cục Tần số Vô tuyến điện',
          status: 'Hiệu lực'
        }
      ],
      exploitLicenses: [
        {
          id: 'exp-1',
          licenseNo: 'GP-KT-VHF-2023',
          type: 'Giấy phép khai thác thiết bị CNS Hàng không',
          issuedDate: '2023-05-10',
          expiryDate: '2027-05-10',
          issuer: 'Cục Hàng không Việt Nam (CAAV)',
          status: 'Hiệu lực'
        }
      ],
      spec: {
        power: '50 W Carrier (200 W PEP)',
        frequency: '118.000 - 136.975 MHz',
        range: '118.000 - 136.975 MHz (Kênh 8.33 / 25 kHz)',
        channelFreq: '118.100 MHz (TWR Main)',
        sensitivity: '-107 dBm (cho bộ thu)',
        output: '50 Ohm unbalanced, N-female',
        interface: 'VoIP ED-137B/C, E&M 4-wire, RS-232, LAN 10/100',
        mgmtIp: '192.168.10.25',
        subnetMask: '255.255.255.0',
        gateway: '192.168.10.1',
        vlanId: '100',
        snmpCommunity: 'cns_private_read',
        firmware: 'v4.12.08',
        text: 'Thiết bị phát VHF tiêu chuẩn ICAO Annex 10. Hoạt động song công hoặc đơn công qua bộ lọc khoang cộng hưởng (Cavity Filter).'
      },
      components: [
        {
          id: 'comp-1',
          no: 1,
          name: 'Khối khuếch đại công suất cao tần (PA Module 50W)',
          partNo: 'PA-4200-50W',
          serial: 'SN-PA-99124',
          unit: 'Khối',
          qty: 1,
          healthStatus: 'Tốt',
          note: 'Nguyên bản theo máy'
        },
        {
          id: 'comp-2',
          no: 2,
          name: 'Bo mạch xử lý trung tâm & tổng hợp tần số (Synthesizer/CPU)',
          partNo: 'CPU-SYN-4200',
          serial: 'SN-CPU-88712',
          unit: 'Bo mạch',
          qty: 1,
          healthStatus: 'Tốt',
          note: 'Chạy firmware ED-137C'
        },
        {
          id: 'comp-3',
          no: 3,
          name: 'Bộ nguồn xung cấp điện chính (Power Supply AC/DC 28V)',
          partNo: 'PSU-4200-AC',
          serial: 'SN-PSU-44109',
          unit: 'Khối',
          qty: 1,
          healthStatus: 'Tốt',
          note: 'Đầu vào 220VAC / 24VDC dự phòng'
        }
      ],
      docs: [
        {
          id: 'doc-1',
          name: 'Tài liệu hướng dẫn vận hành & bảo dưỡng (Maintenance Manual)',
          code: 'OM-RS4200-EN-Rev3',
          unit: 'Rohde & Schwarz',
          releaseDate: '2020-01-10',
          type: 'Bản in + File PDF',
          location: 'Tủ hồ sơ kỹ thuật số 01',
          status: 'Đầy đủ'
        }
      ],
      maintenance: [
        {
          id: 'maint-1',
          date: '2024-06-15',
          cycle: 'Bảo dưỡng định kỳ 06 tháng',
          content: 'Vệ sinh lưới lọc bụi, quạt làm mát, đo kiểm công suất phát, độ sâu điều chế AM (85%), kiểm tra tỷ số sóng đứng VSWR.',
          measuredParams: 'Tx Pwr: 50.2W; VSWR: 1.12; AM Mod: 86.5%; Freq Dev: +12 Hz',
          result: 'Đạt yêu cầu tiêu chuẩn kỹ thuật loại 1',
          person: 'KS. Nguyễn Văn An',
          supervisor: 'KS. Trần Minh Trí'
        }
      ],
      repair: [
        {
          id: 'rep-1',
          date: '2023-11-20',
          resolvedDate: '2023-11-20',
          type: 'Cảnh báo nhiệt độ khối khuếch đại (High Temp)',
          incidentDescription: 'Hệ thống SNMP gửi cảnh báo nhiệt độ khối PA tăng cao trên 65°C trong ca trực.',
          rootCause: 'Bụi bẩn bám dày trên cánh tản nhiệt và quạt làm mát số 2 chạy yếu.',
          actionTaken: 'Bảo trì khẩn cấp: Tháo vệ sinh kỹ khe tản nhiệt, thay thế cụm quạt DC làm mát dự phòng.',
          replacedParts: '01 Quạt làm mát 24VDC SanAce (Part: FAN-4200-24V)',
          person: 'KS. Lê Hoàng Long',
          status: 'Đã hoàn thành, nhiệt độ duy trì ổn định 42°C'
        }
      ]
    }
  ];
}
`;
};

/**
 * Generates the full standalone Web App HTML (Index.html) for Google Apps Script HtmlService
 */
export const generateGasHtml = (): string => {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sổ Lý Lịch Thiết Bị Kỹ Thuật CNS - Google Apps Script Web App</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    code, pre {
      font-family: 'JetBrains Mono', monospace;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #printArea, #printArea * {
        visibility: visible;
      }
      #printArea {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen flex flex-col">

  <!-- TOPBAR -->
  <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 no-print shadow-md">
    <div class="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-sky-600 rounded-xl text-white shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span>QUẢN LÝ SỔ LÝ LỊCH THIẾT BỊ CNS</span>
            <span class="text-[10px] bg-sky-500/30 text-sky-300 border border-sky-400/40 px-1.5 py-0.5 rounded font-mono">GAS v3.0</span>
          </h1>
          <p class="text-[11px] text-slate-400">Google Workspace • Sheets • Docs • Drive Integration</p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Equipment Selector -->
        <select id="eqSelect" onchange="handleSelectEquipment(this.value)" class="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none max-w-xs">
          <!-- Populated by JS -->
        </select>

        <button onclick="openNewEquipmentModal()" class="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1">
          <span>+ Thêm mới</span>
        </button>

        <button onclick="saveAllDataToSheets()" id="btnSave" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          <span>Lưu vào Sheets</span>
        </button>

        <button onclick="exportCurrentToDoc()" id="btnDoc" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>Tạo Google Doc</span>
        </button>

        <button onclick="window.print()" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>In A4</span>
        </button>
      </div>
    </div>
  </header>

  <!-- NOTIFICATION TOAST -->
  <div id="toast" class="fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2">
    <span id="toastMsg">Thông báo</span>
  </div>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">

    <!-- NAVIGATION TABS -->
    <div class="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto no-print text-xs font-semibold">
      <button onclick="setTab('dashboard')" id="tab-dashboard" class="tab-btn px-3 py-2 rounded-lg bg-sky-600 text-white shadow-xs">📊 Tổng quan</button>
      <button onclick="setTab('general')" id="tab-general" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">📋 1. Thông tin chung</button>
      <button onclick="setTab('specs')" id="tab-specs" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">⚙️ 2. Đặc tính kỹ thuật</button>
      <button onclick="setTab('components')" id="tab-components" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">🧩 3. Linh kiện & Bo mạch</button>
      <button onclick="setTab('maintenance')" id="tab-maintenance" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">🔧 4. Bảo dưỡng định kỳ</button>
      <button onclick="setTab('repair')" id="tab-repair" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">⚠️ 5. Sự cố & Sửa chữa</button>
      <button onclick="setTab('printPreview')" id="tab-printPreview" class="tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">🖨️ Xem & In Sổ Lý Lịch</button>
    </div>

    <!-- TAB 1: DASHBOARD -->
    <section id="view-dashboard" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-500 uppercase">Tổng số thiết bị</div>
          <div id="statTotal" class="text-2xl font-bold text-slate-900 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div class="text-[11px] font-semibold text-emerald-600 uppercase">Đang khai thác</div>
          <div id="statActive" class="text-2xl font-bold text-emerald-700 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div class="text-[11px] font-semibold text-amber-600 uppercase">Bảo dưỡng / Kiểm chuẩn</div>
          <div id="statMaint" class="text-2xl font-bold text-amber-700 mt-1">0</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div class="text-[11px] font-semibold text-rose-600 uppercase">Sự cố / Thay thế</div>
          <div id="statIncident" class="text-2xl font-bold text-rose-700 mt-1">0</div>
        </div>
      </div>

      <!-- Current Selected Equipment Info Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <span id="cardCategory" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">VHF/UHF</span>
            <h2 id="cardName" class="text-lg font-bold text-slate-900 mt-1">Tên thiết bị</h2>
          </div>
          <div class="flex items-center gap-2">
            <span id="cardStatus" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">Đang khai thác</span>
            <span id="cardPriority" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800">Cấp 1</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span class="text-slate-500">Model / Ký hiệu:</span>
            <div id="cardModel" class="font-semibold text-slate-800 mt-0.5">---</div>
          </div>
          <div>
            <span class="text-slate-500">Số Serial:</span>
            <div id="cardSerial" class="font-mono font-semibold text-slate-800 mt-0.5">---</div>
          </div>
          <div>
            <span class="text-slate-500">Hãng sản xuất:</span>
            <div id="cardMaker" class="font-semibold text-slate-800 mt-0.5">---</div>
          </div>
          <div>
            <span class="text-slate-500">Vị trí lắp đặt:</span>
            <div id="cardLocation" class="font-semibold text-slate-800 mt-0.5">---</div>
          </div>
          <div>
            <span class="text-slate-500">Kỹ sư phụ trách:</span>
            <div id="cardEngineer" class="font-semibold text-slate-800 mt-0.5">---</div>
          </div>
          <div>
            <span class="text-slate-500">Đài / Trạm:</span>
            <div id="cardUnit" class="font-semibold text-slate-800 mt-0.5">---</div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 2: GENERAL INFO FORM -->
    <section id="view-general" class="hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">I. THÔNG TIN CHUNG & QUẢN LÝ TÀI SẢN</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label class="font-semibold text-slate-700">Tên thiết bị:</label>
          <input type="text" id="inpName" onchange="updateCurrent('general', 'name', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Chủng loại:</label>
          <select id="inpCategory" onchange="updateCurrent('general', 'category', this.value)" class="w-full p-2 mt-1 border rounded-lg">
            <option value="VHF/UHF">VHF/UHF</option>
            <option value="VOR/DME">VOR/DME</option>
            <option value="ILS">ILS</option>
            <option value="Radar (PSR/SSR)">Radar (PSR/SSR)</option>
            <option value="ADS-B">ADS-B</option>
            <option value="Voice Recorder">Voice Recorder</option>
            <option value="Nguồn / UPS / Máy phát">Nguồn / UPS / Máy phát</option>
          </select>
        </div>
        <div>
          <label class="font-semibold text-slate-700">Model / Ký hiệu:</label>
          <input type="text" id="inpModel" onchange="updateCurrent('general', 'model', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Hãng sản xuất:</label>
          <input type="text" id="inpManufacturer" onchange="updateCurrent('general', 'manufacturer', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Số Serial:</label>
          <input type="text" id="inpSerial" onchange="updateCurrent('general', 'serial', this.value)" class="w-full p-2 mt-1 border rounded-lg font-mono">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Nước sản xuất:</label>
          <input type="text" id="inpOrigin" onchange="updateCurrent('general', 'origin', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Năm sản xuất:</label>
          <input type="text" id="inpYearMade" onchange="updateCurrent('general', 'yearMade', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Mã thẻ tài sản:</label>
          <input type="text" id="inpAssetNo" onchange="updateCurrent('general', 'assetNo', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Ngày đưa vào sử dụng:</label>
          <input type="date" id="inpCommissioned" onchange="updateCurrent('general', 'commissioned', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Trạng thái vận hành:</label>
          <select id="inpStatus" onchange="updateCurrent('general', 'status', this.value)" class="w-full p-2 mt-1 border rounded-lg">
            <option value="Đang khai thác">Đang khai thác</option>
            <option value="Dự phòng nóng">Dự phòng nóng</option>
            <option value="Đang bảo dưỡng">Đang bảo dưỡng</option>
            <option value="Chờ sửa chữa">Chờ sửa chữa</option>
            <option value="Ngừng khai thác">Ngừng khai thác</option>
          </select>
        </div>
        <div>
          <label class="font-semibold text-slate-700">Vị trí lắp đặt:</label>
          <input type="text" id="inpLocation" onchange="updateCurrent('org', 'location', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Kỹ sư phụ trách:</label>
          <input type="text" id="inpEngineer" onchange="updateCurrent('org', 'primaryEngineer', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
      </div>
    </section>

    <!-- TAB 3: SPECIFICATIONS -->
    <section id="view-specs" class="hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">II. ĐẶC TÍNH KỸ THUẬT & CẤU HÌNH HỆ THỐNG</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label class="font-semibold text-slate-700">Công suất phát (Tx Power):</label>
          <input type="text" id="inpPower" onchange="updateCurrent('spec', 'power', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Dải tần / Kênh công tác:</label>
          <input type="text" id="inpFrequency" onchange="updateCurrent('spec', 'channelFreq', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Địa chỉ Quản trị IP:</label>
          <input type="text" id="inpMgmtIp" onchange="updateCurrent('spec', 'mgmtIp', this.value)" class="w-full p-2 mt-1 border rounded-lg font-mono">
        </div>
        <div>
          <label class="font-semibold text-slate-700">Giao diện kết nối (Interface):</label>
          <input type="text" id="inpInterface" onchange="updateCurrent('spec', 'interface', this.value)" class="w-full p-2 mt-1 border rounded-lg">
        </div>
        <div class="md:col-span-2">
          <label class="font-semibold text-slate-700">Mô tả cấu hình chi tiết:</label>
          <textarea id="inpSpecText" onchange="updateCurrent('spec', 'text', this.value)" rows="4" class="w-full p-2 mt-1 border rounded-lg"></textarea>
        </div>
      </div>
    </section>

    <!-- TAB 4: COMPONENTS -->
    <section id="view-components" class="hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-sm font-bold text-slate-900">III. DANH MỤC KHỐI & LINH KIỆN THAY THẾ</h3>
        <button onclick="addComponentRow()" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold">+ Thêm linh kiện</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b">
              <th class="p-2">STT</th>
              <th class="p-2">Tên khối / Bo mạch</th>
              <th class="p-2">Mã Part No.</th>
              <th class="p-2">Số Serial</th>
              <th class="p-2">SL</th>
              <th class="p-2">Tình trạng</th>
              <th class="p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody id="componentsTableBody">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 5: MAINTENANCE -->
    <section id="view-maintenance" class="hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-sm font-bold text-slate-900">IV. NHẬT KÝ BẢO DƯỠNG KỸ THUẬT ĐỊNH KỲ</h3>
        <button onclick="addMaintRow()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold">+ Thêm nhật ký</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b">
              <th class="p-2">Ngày TH</th>
              <th class="p-2">Chu kỳ</th>
              <th class="p-2">Nội dung công việc</th>
              <th class="p-2">Thông số đo đạc</th>
              <th class="p-2">Kết luận</th>
              <th class="p-2">Người TH</th>
              <th class="p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody id="maintTableBody">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 6: REPAIR -->
    <section id="view-repair" class="hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-sm font-bold text-slate-900">V. THEO DÕI SỬA CHỮA, KHẮC PHỤC SỰ CỐ & BIẾN ĐỘNG</h3>
        <button onclick="addRepairRow()" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold">+ Thêm sự cố</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-semibold border-b">
              <th class="p-2">Ngày</th>
              <th class="p-2">Hiện tượng / Sự cố</th>
              <th class="p-2">Nguyên nhân</th>
              <th class="p-2">Biện pháp & Vật tư</th>
              <th class="p-2">Người TH</th>
              <th class="p-2">Trạng thái</th>
              <th class="p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody id="repairTableBody">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 7: PRINT PREVIEW (A4) -->
    <section id="view-printPreview" class="hidden space-y-4">
      <div class="flex items-center justify-between no-print">
        <span class="text-xs text-slate-500">Mẫu sổ lý lịch chuẩn khổ giấy A4 theo quy định</span>
        <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs">
          🖨️ In hoặc Xuất PDF
        </button>
      </div>

      <div id="printArea" class="bg-white p-10 max-w-4xl mx-auto rounded-xl border border-slate-300 shadow-lg text-slate-900 space-y-6">
        <!-- National Header -->
        <div class="grid grid-cols-2 text-center text-xs">
          <div>
            <div id="prCompany" class="font-bold uppercase">CÔNG TY QUẢN LÝ BAY MIỀN NAM</div>
            <div id="prUnit" class="font-semibold uppercase text-[11px]">TRUNG TÂM BẢO ĐẢM KỸ THUẬT</div>
            <div class="text-[10px]">***</div>
          </div>
          <div>
            <div class="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="font-semibold text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
            <div class="text-[10px]">---------------</div>
          </div>
        </div>

        <!-- Title -->
        <div class="text-center space-y-1">
          <h1 class="text-xl font-bold text-sky-900 uppercase">SỔ LÝ LỊCH THIẾT BỊ KỸ THUẬT</h1>
          <div id="prSubTitle" class="text-xs font-semibold text-slate-700">CHỦNG LOẠI: VHF/UHF - TÊN THIẾT BỊ: MÁY PHÁT VHF</div>
        </div>

        <!-- Section 1: General Info -->
        <div class="space-y-2">
          <div class="font-bold text-xs uppercase bg-slate-100 p-1.5 rounded">I. THÔNG TIN CHUNG & QUẢN LÝ TÀI SẢN</div>
          <table class="w-full text-xs border border-slate-300 border-collapse">
            <tbody id="prGeneralTbody"></tbody>
          </table>
        </div>

        <!-- Section 2: Components -->
        <div class="space-y-2">
          <div class="font-bold text-xs uppercase bg-slate-100 p-1.5 rounded">II. DANH MỤC KHỐI & LINH KIỆN ĐỒNG BỘ</div>
          <table class="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b">
                <th class="border p-1.5 text-center">STT</th>
                <th class="border p-1.5">Tên Khối / Bo Mạch</th>
                <th class="border p-1.5">Mã Part No.</th>
                <th class="border p-1.5">Số Serial</th>
                <th class="border p-1.5 text-center">SL</th>
                <th class="border p-1.5 text-center">Tình Trạng</th>
              </tr>
            </thead>
            <tbody id="prComponentsTbody"></tbody>
          </table>
        </div>

        <!-- Section 3: Signatures -->
        <div class="grid grid-cols-3 text-center text-xs pt-8">
          <div>
            <div class="font-bold">NGƯỜI LẬP SỔ</div>
            <div class="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div id="prSignEngineer" class="font-semibold mt-16">KS. Kỹ sư phụ trách</div>
          </div>
          <div>
            <div class="font-bold">CÁN BỘ QUẢN LÝ ĐÀI/TRẠM</div>
            <div class="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
            <div id="prSignSupervisor" class="font-semibold mt-16">Trưởng đài / Trưởng trạm</div>
          </div>
          <div>
            <div class="font-bold">LÃNH ĐẠO ĐƠN VỊ DUYỆT</div>
            <div class="text-[11px] text-slate-500 italic mt-0.5">(Ký tên và đóng dấu)</div>
            <div class="font-semibold mt-16">Trưởng phòng / Giám đốc</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    // State management
    var equipments = [];
    var currentId = '';

    // Initialize data from Google Apps Script Backend (if running inside GAS) or LocalStorage
    window.onload = function() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            if (Array.isArray(data) && data.length > 0) {
              equipments = data;
              currentId = equipments[0].id;
              renderUI();
              showToast('✓ Đã tải dữ liệu từ Google Sheets!');
            }
          })
          .withFailureHandler(function(err) {
            console.error(err);
            loadFromLocalStorage();
          })
          .apiGetEquipments();
      } else {
        loadFromLocalStorage();
      }
    };

    function loadFromLocalStorage() {
      var local = localStorage.getItem('cns_equipments_data_v1');
      if (local) {
        try {
          equipments = JSON.parse(local);
        } catch(e) {}
      }
      if (!equipments || equipments.length === 0) {
        equipments = [
          {
            id: 'EQ-001',
            general: {
              name: 'Máy phát VHF Không Địa Chính (Main Tx)',
              category: 'VHF/UHF',
              model: 'R&S Series 4200 (XU4200)',
              manufacturer: 'Rohde & Schwarz',
              serial: 'RS-4200-VN-8849',
              assetNo: 'TSCD-VHF-001',
              yearMade: '2020',
              origin: 'CHLB Đức (Germany)',
              commissioned: '2020-06-15',
              status: 'Đang khai thác',
              priority: 'Hệ thống chính (Level 1)'
            },
            org: {
              companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
              unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
              location: 'Đài KSKL Tân Sơn Nhất',
              primaryEngineer: 'KS. Nguyễn Văn An',
              supervisor: 'KS. Trần Minh Trí'
            },
            spec: {
              power: '50W',
              channelFreq: '118.100 MHz',
              mgmtIp: '192.168.10.25',
              interface: 'VoIP ED-137C, E&M, LAN',
              text: 'Máy phát chính duy trì liên lạc không địa kiểm soát tại sân.'
            },
            components: [
              { id: 'c1', no: 1, name: 'Khối khuếch đại công suất PA 50W', partNo: 'PA-4200', serial: 'SN-PA-991', qty: 1, healthStatus: 'Tốt' },
              { id: 'c2', no: 2, name: 'Bo xử lý trung tâm Synthesizer/CPU', partNo: 'CPU-SYN', serial: 'SN-CPU-887', qty: 1, healthStatus: 'Tốt' }
            ],
            maintenance: [
              { id: 'm1', date: '2024-06-15', cycle: '6 tháng', content: 'Vệ sinh quạt, đo công suất phát', measuredParams: 'Tx: 50.2W; VSWR: 1.12', result: 'Đạt yêu cầu', person: 'KS. Nguyễn Văn An' }
            ],
            repair: []
          }
        ];
      }
      currentId = equipments[0].id;
      renderUI();
    }

    function getCurrentEquipment() {
      return equipments.find(function(e) { return e.id === currentId; }) || equipments[0];
    }

    function renderUI() {
      var current = getCurrentEquipment();
      if (!current) return;

      // Render Dropdown
      var select = document.getElementById('eqSelect');
      select.innerHTML = '';
      equipments.forEach(function(eq) {
        var opt = document.createElement('option');
        opt.value = eq.id;
        opt.textContent = (eq.general.name || 'Thiết bị') + ' (' + (eq.general.serial || eq.id) + ')';
        if (eq.id === currentId) opt.selected = true;
        select.appendChild(opt);
      });

      // Stats
      document.getElementById('statTotal').textContent = equipments.length;
      document.getElementById('statActive').textContent = equipments.filter(function(e) { return e.general.status === 'Đang khai thác'; }).length;
      document.getElementById('statMaint').textContent = equipments.filter(function(e) { return e.general.status === 'Đang bảo dưỡng'; }).length;
      document.getElementById('statIncident').textContent = equipments.filter(function(e) { return e.general.status === 'Chờ sửa chữa'; }).length;

      // Dashboard Card
      document.getElementById('cardCategory').textContent = current.general.category || 'VHF/UHF';
      document.getElementById('cardName').textContent = current.general.name || '';
      document.getElementById('cardStatus').textContent = current.general.status || 'Đang khai thác';
      document.getElementById('cardPriority').textContent = current.general.priority || 'Level 1';
      document.getElementById('cardModel').textContent = current.general.model || '---';
      document.getElementById('cardSerial').textContent = current.general.serial || '---';
      document.getElementById('cardMaker').textContent = current.general.manufacturer || '---';
      document.getElementById('cardLocation').textContent = current.org.location || '---';
      document.getElementById('cardEngineer').textContent = current.org.primaryEngineer || '---';
      document.getElementById('cardUnit').textContent = current.org.unit || '---';

      // General Form
      document.getElementById('inpName').value = current.general.name || '';
      document.getElementById('inpCategory').value = current.general.category || 'VHF/UHF';
      document.getElementById('inpModel').value = current.general.model || '';
      document.getElementById('inpManufacturer').value = current.general.manufacturer || '';
      document.getElementById('inpSerial').value = current.general.serial || '';
      document.getElementById('inpOrigin').value = current.general.origin || '';
      document.getElementById('inpYearMade').value = current.general.yearMade || '';
      document.getElementById('inpAssetNo').value = current.general.assetNo || '';
      document.getElementById('inpCommissioned').value = current.general.commissioned || '';
      document.getElementById('inpStatus').value = current.general.status || 'Đang khai thác';
      document.getElementById('inpLocation').value = current.org.location || '';
      document.getElementById('inpEngineer').value = current.org.primaryEngineer || '';

      // Specs
      var s = current.spec || {};
      document.getElementById('inpPower').value = s.power || '';
      document.getElementById('inpFrequency').value = s.channelFreq || s.frequency || '';
      document.getElementById('inpMgmtIp').value = s.mgmtIp || '';
      document.getElementById('inpInterface').value = s.interface || '';
      document.getElementById('inpSpecText').value = s.text || '';

      // Components Table
      var compTbody = document.getElementById('componentsTableBody');
      compTbody.innerHTML = '';
      (current.components || []).forEach(function(c, idx) {
        var tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-slate-50';
        tr.innerHTML = 
          '<td class="p-2 font-mono">' + (c.no || idx + 1) + '</td>' +
          '<td class="p-2 font-semibold">' + (c.name || '') + '</td>' +
          '<td class="p-2 font-mono text-slate-600">' + (c.partNo || '---') + '</td>' +
          '<td class="p-2 font-mono">' + (c.serial || '---') + '</td>' +
          '<td class="p-2">' + (c.qty || 1) + '</td>' +
          '<td class="p-2"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">' + (c.healthStatus || 'Tốt') + '</span></td>' +
          '<td class="p-2"><button onclick="deleteComponent(' + idx + ')" class="text-rose-600 hover:underline">Xóa</button></td>';
        compTbody.appendChild(tr);
      });

      // Maintenance Table
      var maintTbody = document.getElementById('maintTableBody');
      maintTbody.innerHTML = '';
      (current.maintenance || []).forEach(function(m, idx) {
        var tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-slate-50';
        tr.innerHTML = 
          '<td class="p-2 font-mono">' + (m.date || '') + '</td>' +
          '<td class="p-2 font-semibold">' + (m.cycle || '') + '</td>' +
          '<td class="p-2">' + (m.content || '') + '</td>' +
          '<td class="p-2 font-mono text-slate-600">' + (m.measuredParams || '---') + '</td>' +
          '<td class="p-2 text-emerald-700 font-medium">' + (m.result || '') + '</td>' +
          '<td class="p-2">' + (m.person || '') + '</td>' +
          '<td class="p-2"><button onclick="deleteMaint(' + idx + ')" class="text-rose-600 hover:underline">Xóa</button></td>';
        maintTbody.appendChild(tr);
      });

      // Repair Table
      var repairTbody = document.getElementById('repairTableBody');
      repairTbody.innerHTML = '';
      (current.repair || []).forEach(function(r, idx) {
        var tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-slate-50';
        tr.innerHTML = 
          '<td class="p-2 font-mono">' + (r.date || '') + '</td>' +
          '<td class="p-2 font-semibold text-rose-700">' + (r.incidentDescription || '') + '</td>' +
          '<td class="p-2">' + (r.rootCause || '---') + '</td>' +
          '<td class="p-2">' + (r.actionTaken || '') + '</td>' +
          '<td class="p-2">' + (r.person || '') + '</td>' +
          '<td class="p-2 text-emerald-600 font-semibold">' + (r.status || 'Đã xử lý') + '</td>' +
          '<td class="p-2"><button onclick="deleteRepair(' + idx + ')" class="text-rose-600 hover:underline">Xóa</button></td>';
        repairTbody.appendChild(tr);
      });

      // Print Preview Sync
      renderPrintPreview(current);
    }

    function renderPrintPreview(current) {
      document.getElementById('prCompany').textContent = current.org.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM';
      document.getElementById('prUnit').textContent = current.org.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT';
      document.getElementById('prSubTitle').textContent = 'CHỦNG LOẠI: ' + (current.general.category || 'VHF/UHF') + ' - TÊN THIẾT BỊ: ' + (current.general.name || '').toUpperCase();
      document.getElementById('prSignEngineer').textContent = current.org.primaryEngineer || 'Kỹ sư phụ trách';
      document.getElementById('prSignSupervisor').textContent = current.org.supervisor || 'Trưởng đài/trạm';

      var genTbody = document.getElementById('prGeneralTbody');
      genTbody.innerHTML = 
        '<tr class="border-b"><td class="p-2 bg-slate-50 font-bold w-1/4 border-r">Tên thiết bị:</td><td class="p-2 border-r">' + (current.general.name || '') + '</td><td class="p-2 bg-slate-50 font-bold w-1/4 border-r">Chủng loại:</td><td class="p-2">' + (current.general.category || '') + '</td></tr>' +
        '<tr class="border-b"><td class="p-2 bg-slate-50 font-bold border-r">Ký hiệu / Model:</td><td class="p-2 border-r">' + (current.general.model || '') + '</td><td class="p-2 bg-slate-50 font-bold border-r">Số Serial:</td><td class="p-2 font-mono">' + (current.general.serial || '') + '</td></tr>' +
        '<tr class="border-b"><td class="p-2 bg-slate-50 font-bold border-r">Hãng sản xuất:</td><td class="p-2 border-r">' + (current.general.manufacturer || '') + '</td><td class="p-2 bg-slate-50 font-bold border-r">Nước sản xuất:</td><td class="p-2">' + (current.general.origin || '') + '</td></tr>' +
        '<tr class="border-b"><td class="p-2 bg-slate-50 font-bold border-r">Vị trí lắp đặt:</td><td class="p-2 border-r">' + (current.org.location || '') + '</td><td class="p-2 bg-slate-50 font-bold border-r">Kỹ sư phụ trách:</td><td class="p-2">' + (current.org.primaryEngineer || '') + '</td></tr>';

      var compTbody = document.getElementById('prComponentsTbody');
      compTbody.innerHTML = '';
      (current.components || []).forEach(function(c, i) {
        var tr = document.createElement('tr');
        tr.className = 'border-b';
        tr.innerHTML = 
          '<td class="border p-1.5 text-center">' + (c.no || i + 1) + '</td>' +
          '<td class="border p-1.5 font-semibold">' + (c.name || '') + '</td>' +
          '<td class="border p-1.5 font-mono">' + (c.partNo || '---') + '</td>' +
          '<td class="border p-1.5 font-mono">' + (c.serial || '---') + '</td>' +
          '<td class="border p-1.5 text-center">' + (c.qty || 1) + '</td>' +
          '<td class="border p-1.5 text-center">' + (c.healthStatus || 'Tốt') + '</td>';
        compTbody.appendChild(tr);
      });
    }

    function setTab(tabId) {
      document.querySelectorAll('section[id^="view-"]').forEach(function(el) { el.classList.add('hidden'); });
      document.querySelectorAll('.tab-btn').forEach(function(btn) { 
        btn.className = 'tab-btn px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100'; 
      });

      var target = document.getElementById('view-' + tabId);
      if (target) target.classList.remove('hidden');

      var targetBtn = document.getElementById('tab-' + tabId);
      if (targetBtn) targetBtn.className = 'tab-btn px-3 py-2 rounded-lg bg-sky-600 text-white shadow-xs';
    }

    function handleSelectEquipment(id) {
      currentId = id;
      renderUI();
    }

    function updateCurrent(section, field, value) {
      var current = getCurrentEquipment();
      if (!current[section]) current[section] = {};
      current[section][field] = value;
      current.updatedAt = new Date().toISOString();
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
    }

    function addComponentRow() {
      var name = prompt('Nhập tên khối / bo mạch linh kiện:');
      if (!name) return;
      var part = prompt('Nhập mã Part No. (hoặc bỏ trống):') || '---';
      var sn = prompt('Nhập số Serial linh kiện:') || '---';
      var current = getCurrentEquipment();
      if (!current.components) current.components = [];
      current.components.push({
        id: 'comp-' + Date.now(),
        no: current.components.length + 1,
        name: name,
        partNo: part,
        serial: sn,
        qty: 1,
        healthStatus: 'Tốt'
      });
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
      showToast('✓ Đã thêm linh kiện mới');
    }

    function deleteComponent(index) {
      if (!confirm('Bạn có chắc muốn xóa linh kiện này?')) return;
      var current = getCurrentEquipment();
      current.components.splice(index, 1);
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
      showToast('✓ Đã xóa linh kiện');
    }

    function addMaintRow() {
      var content = prompt('Nhập nội dung bảo dưỡng:');
      if (!content) return;
      var params = prompt('Nhập thông số đo đạc:') || '';
      var current = getCurrentEquipment();
      if (!current.maintenance) current.maintenance = [];
      current.maintenance.push({
        id: 'maint-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        cycle: 'Định kỳ',
        content: content,
        measuredParams: params,
        result: 'Đạt yêu cầu',
        person: current.org.primaryEngineer || 'Kỹ sư trực'
      });
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
      showToast('✓ Đã thêm nhật ký bảo dưỡng');
    }

    function deleteMaint(index) {
      if (!confirm('Xóa nhật ký bảo dưỡng này?')) return;
      var current = getCurrentEquipment();
      current.maintenance.splice(index, 1);
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
    }

    function addRepairRow() {
      var incident = prompt('Mô tả hiện tượng sự cố:');
      if (!incident) return;
      var action = prompt('Biện pháp khắc phục đã thực hiện:') || '';
      var current = getCurrentEquipment();
      if (!current.repair) current.repair = [];
      current.repair.push({
        id: 'rep-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        incidentDescription: incident,
        rootCause: '',
        actionTaken: action,
        person: current.org.primaryEngineer || 'Kỹ sư trực',
        status: 'Đã hoàn thành'
      });
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
      showToast('✓ Đã thêm ghi nhận sửa chữa sự cố');
    }

    function deleteRepair(index) {
      if (!confirm('Xóa ghi nhận này?')) return;
      var current = getCurrentEquipment();
      current.repair.splice(index, 1);
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
    }

    function openNewEquipmentModal() {
      var name = prompt('Nhập tên thiết bị mới (VD: Máy phát VHF Không Địa TWR):');
      if (!name) return;
      var model = prompt('Nhập Model / Ký hiệu:') || '';
      var serial = prompt('Nhập số Serial:') || '';
      var newEq = {
        id: 'EQ-CNS-' + Date.now().toString().slice(-4),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        general: {
          name: name,
          category: 'VHF/UHF',
          model: model,
          serial: serial,
          status: 'Đang khai thác',
          priority: 'Hệ thống chính (Level 1)'
        },
        org: {
          companyName: 'CÔNG TY QUẢN LÝ BAY MIỀN NAM',
          unit: 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT',
          location: 'Đài KSKL',
          primaryEngineer: 'Kỹ sư phụ trách'
        },
        spec: {},
        components: [],
        maintenance: [],
        repair: []
      };
      equipments.push(newEq);
      currentId = newEq.id;
      localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
      renderUI();
      showToast('✓ Đã thêm thiết bị mới!');
    }

    // Google Apps Script Server Calls
    function saveAllDataToSheets() {
      var btn = document.getElementById('btnSave');
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.textContent = 'Lưu vào Sheets';
            showToast('✓ Đã lưu thành công vào Google Sheets!');
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.textContent = 'Lưu vào Sheets';
            alert('Lỗi khi lưu vào Google Sheets: ' + err);
          })
          .apiSaveEquipments(equipments);
      } else {
        localStorage.setItem('cns_equipments_data_v1', JSON.stringify(equipments));
        btn.disabled = false;
        btn.textContent = 'Lưu vào Sheets';
        showToast('✓ Đã lưu vào bộ nhớ cục bộ (chưa kết nối Apps Script)');
      }
    }

    function exportCurrentToDoc() {
      var current = getCurrentEquipment();
      var btn = document.getElementById('btnDoc');
      btn.disabled = true;
      btn.textContent = 'Đang tạo Doc...';

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.textContent = 'Tạo Google Doc';
            if (res && res.docUrl) {
              if (confirm('Tạo Google Doc thành công!\\nBạn có muốn mở tài liệu ngay?')) {
                window.open(res.docUrl, '_blank');
              }
            }
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.textContent = 'Tạo Google Doc';
            alert('Lỗi tạo Google Doc: ' + err);
          })
          .apiCreateGoogleDoc(current);
      } else {
        btn.disabled = false;
        btn.textContent = 'Tạo Google Doc';
        alert('Chức năng tạo Google Doc yêu cầu triển khai bên trong Google Apps Script.');
      }
    }

    function showToast(msg) {
      var toast = document.getElementById('toast');
      document.getElementById('toastMsg').textContent = msg;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(function() {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3500);
    }
  </script>
</body>
</html>
`;
};

export const generateAppsscriptJson = (): string => {
  return JSON.stringify({
    "timeZone": "Asia/Ho_Chi_Minh",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "webapp": {
      "executeAs": "USER_DEPLOYING",
      "access": "ANYONE_ANONYMOUS"
    },
    "oauthScopes": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/script.external_request"
    ]
  }, null, 2);
};
