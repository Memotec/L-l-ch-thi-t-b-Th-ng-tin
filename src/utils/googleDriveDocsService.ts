import { EquipmentData } from '../types';

declare const google: any;

const DEFAULT_CLIENT_ID = '509124400040-o4n2t7b64qj7216l37861pkvlh3k46d3.apps.googleusercontent.com';
const CUSTOM_CLIENT_ID_KEY = 'cns_google_oauth_client_id_v1';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents';
const FOLDER_NAME = 'CNS_SoLyLich_GoogleDocs';

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface GoogleDocSyncResult {
  docId: string;
  docUrl: string;
  pdfDownloadUrl: string;
  docTitle: string;
  folderId?: string;
  folderUrl?: string;
  updatedAt: string;
  isOverwritten: boolean;
}

// Token storage key
const TOKEN_KEY = 'cns_gdrive_access_token_v1';
const TOKEN_EXPIRY_KEY = 'cns_gdrive_token_expiry_v1';
const FOLDER_ID_KEY = 'cns_gdrive_docs_folder_id_v1';
const DOC_MAP_KEY = 'cns_gdrive_equipment_doc_map_v1'; // maps equipment.id -> docId

class GoogleDriveDocsService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private gapiInited = false;
  private gisInited = false;

  constructor() {
    this.accessToken = localStorage.getItem(TOKEN_KEY);
  }

  // Load Google Identity Services & GAPI script dynamically
  public async loadScripts(): Promise<void> {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const checkDone = () => {
        loadedCount++;
        if (loadedCount >= 2) {
          this.initClients();
          resolve();
        }
      };

      if ((window as any).gapi) {
        checkDone();
      } else {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.async = true;
        script1.defer = true;
        script1.onload = checkDone;
        document.body.appendChild(script1);
      }

      if ((window as any).google?.accounts?.oauth2) {
        checkDone();
      } else {
        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.async = true;
        script2.defer = true;
        script2.onload = checkDone;
        document.body.appendChild(script2);
      }
    });
  }

  public getClientId(): string {
    return localStorage.getItem(CUSTOM_CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
  }

  public setClientId(id: string) {
    const trimmed = id.trim();
    if (trimmed) {
      localStorage.setItem(CUSTOM_CLIENT_ID_KEY, trimmed);
    } else {
      localStorage.removeItem(CUSTOM_CLIENT_ID_KEY);
    }
    this.tokenClient = null;
    this.initClients();
  }

  public resetClientId() {
    localStorage.removeItem(CUSTOM_CLIENT_ID_KEY);
    this.tokenClient = null;
    this.initClients();
  }

  public hasCustomClientId(): boolean {
    return !!localStorage.getItem(CUSTOM_CLIENT_ID_KEY);
  }

  private initClients() {
    if (typeof google !== 'undefined' && google.accounts?.oauth2) {
      const activeClientId = this.getClientId();
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.setToken(tokenResponse.access_token, tokenResponse.expires_in);
          }
        },
      });
      this.gisInited = true;
    }
  }

  public isAuthorized(): boolean {
    if (!this.accessToken) return false;
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      this.accessToken = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      return false;
    }
    return true;
  }

  public getAccessToken(): string | null {
    if (!this.isAuthorized()) return null;
    return this.accessToken;
  }

  public setToken(token: string, expiresInSeconds = 3599) {
    this.accessToken = token;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000));
  }

  public clearAuth() {
    this.accessToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  // Request token with popup
  public async requestAccessToken(): Promise<string> {
    await this.loadScripts();

    return new Promise((resolve, reject) => {
      if (!this.tokenClient && typeof google !== 'undefined' && google.accounts?.oauth2) {
        this.initClients();
      }

      if (!this.tokenClient) {
        reject(new Error('Thư viện Google Identity Services chưa tải xong. Vui lòng thử lại sau vài giây.'));
        return;
      }

      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          const rawErr = tokenResponse.error_description || tokenResponse.error;
          let friendlyMsg = rawErr;
          if (rawErr.includes('access_denied') || rawErr.includes('unauthorized_client') || rawErr.includes('redirect_uri_mismatch') || rawErr.includes('origin_mismatch')) {
            friendlyMsg = `Đã chặn quyền truy cập: Lỗi uỷ quyền từ Google. Vui lòng cấu hình OAuth Client ID hợp lệ hoặc chuyển sang dùng Google Apps Script Web App (Không cần Client ID, không bao giờ bị chặn).`;
          }
          reject(new Error(friendlyMsg));
          return;
        }
        if (tokenResponse.access_token) {
          this.setToken(tokenResponse.access_token, tokenResponse.expires_in);
          resolve(tokenResponse.access_token);
        } else {
          reject(new Error('Không lấy được Access Token từ Google.'));
        }
      };

      // Prompt consent / token
      try {
        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        reject(new Error(err.message || 'Lỗi mở cửa sổ xác thực Google'));
      }
    });
  }

  // Ensure valid token or prompt user
  public async ensureToken(): Promise<string> {
    if (this.isAuthorized() && this.accessToken) {
      return this.accessToken;
    }
    return this.requestAccessToken();
  }

  // Drive API: Get or create the central folder for all Equipment Google Docs
  public async getOrCreateCentralDocsFolder(token: string): Promise<GoogleDriveFolder> {
    const cachedFolderId = localStorage.getItem(FOLDER_ID_KEY);
    if (cachedFolderId) {
      // Validate folder still exists
      try {
        const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,name,webViewLink,trashed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (checkRes.ok) {
          const folderData = await checkRes.json();
          if (!folderData.trashed) {
            return {
              id: folderData.id,
              name: folderData.name,
              webViewLink: folderData.webViewLink
            };
          }
        }
      } catch (e) {
        console.warn('Cached folder invalid, searching anew...', e);
      }
    }

    // Search for existing folder by name
    const q = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        localStorage.setItem(FOLDER_ID_KEY, found.id);
        return {
          id: found.id,
          name: found.name,
          webViewLink: found.webViewLink
        };
      }
    }

    // If not found, create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Thư mục lưu trữ tập trung Sổ Lý Lịch Thiết Bị (Đội Thông Tin)'
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể tạo thư mục lưu trữ tập trung trên Google Drive.');
    }

    const newFolder = await createRes.json();
    localStorage.setItem(FOLDER_ID_KEY, newFolder.id);
    return {
      id: newFolder.id,
      name: newFolder.name,
      webViewLink: newFolder.webViewLink
    };
  }

  // Get doc mapping (equipment.id -> docId)
  private getEquipmentDocMap(): Record<string, string> {
    try {
      const raw = localStorage.getItem(DOC_MAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveEquipmentDocId(eqId: string, docId: string) {
    const map = this.getEquipmentDocMap();
    map[eqId] = docId;
    localStorage.setItem(DOC_MAP_KEY, JSON.stringify(map));
  }

  public getSavedDocId(eqId: string): string | null {
    const map = this.getEquipmentDocMap();
    return map[eqId] || null;
  }

  /**
   * Tạo mã HTML chuẩn văn bản kỹ thuật "LÝ LỊCH THIẾT BỊ" phục vụ chuyển đổi sang Google Docs
   * Tuân thủ 100% chuẩn biểu mẫu:
   * - Bìa: CÔNG TY QUẢN LÝ BAY MIỀN NAM, LÝ LỊCH THIẾT BỊ, Tên thiết bị, Hãng SX, Số hiệu, Mã số, Mã TS, Số
   * - Mục lục & 1. CƠ QUAN, ĐƠN VỊ QUẢN LÝ (Bảng 3 cột: NGÀY THÁNG | ĐƠN VỊ | TÌNH TRẠNG)
   * - 2. SƠ LƯỢC THIẾT BỊ (Thông tin & Bảng giấy phép 4 cột)
   * - 2.1 (1. ĐẶC TÍNH KỸ THUẬT)
   * - 2.2 (2. THÀNH PHẦN THIẾT BỊ - Bảng 5 cột: TT | TÊN THIẾT BỊ | ĐVT | SL | GHI CHÚ)
   * - 2.3 (3. TÀI LIỆU KỸ THUẬT KÈM THEO - Bảng 4 cột: TT | TÊN TÀI LIỆU | SL | GHI CHÚ)
   * - 3. BẢO DƯỠNG (Bảng 3 cột: THỜI GIAN | KẾT LUẬN KẾT QUẢ BẢO DƯỠNG | NGƯỜI THỰC HIỆN)
   * - 4. KIỂM TRA – SỬA CHỮA – THAY THẾ - THAY ĐỔI (Bảng 3 cột: THỜI GIAN | NỘI DUNG THỰC HIỆN | NGƯỜI THỰC HIỆN)
   */
  public generateStandardPassportHtml(eq: EquipmentData): string {
    const g = eq.general || ({} as any);
    const o = eq.org || ({} as any);
    const s = eq.spec || ({} as any);
    const components = eq.components || [];
    const maintenance = eq.maintenance || [];
    const repairs = eq.repair || [];
    const orgRows = eq.orgRows || [];
    const docs = eq.docs || [];
    const freqLicenses = eq.freqLicenses || [];
    const exploitLicenses = eq.exploitLicenses || [];

    const companyName = (o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM').toUpperCase();

    // Helper to pad arrays with empty null slots for notebook paper rows
    const padItems = <T>(arr: T[], minLength: number): (T | null)[] => {
      const copy: (T | null)[] = [...arr];
      while (copy.length < minLength) {
        copy.push(null);
      }
      return copy;
    };

    const paddedOrg = padItems(orgRows, 10);
    const maxLic = Math.max(freqLicenses.length, exploitLicenses.length, 4);
    const paddedLicenses = Array.from({ length: maxLic }).map((_, i) => ({
      freq: freqLicenses[i] || null,
      exp: exploitLicenses[i] || null
    }));
    const paddedComponents = padItems(components, Math.max(components.length, 10));
    const paddedDocs = padItems(docs, Math.max(docs.length, 4));
    const paddedMaint = padItems(maintenance, Math.max(maintenance.length, 8));
    const paddedRepairs = padItems(repairs, Math.max(repairs.length, 8));

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>LÝ LỊCH THIẾT BỊ - ${g.name || 'CNS'}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 20mm;
  }
  body {
    font-family: "Times New Roman", Times, "Liberation Serif", serif;
    font-size: 11pt;
    color: #000000;
    line-height: 1.4;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }
  .page {
    page-break-after: always;
    break-after: page;
    min-height: 980px;
    box-sizing: border-box;
    padding: 10px 0;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  table.doc-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
    margin-top: 10px;
    margin-bottom: 12px;
    font-size: 10.5pt;
  }
  table.doc-table th, table.doc-table td {
    border: 1px solid #000000;
    padding: 6px 8px;
    vertical-align: middle;
  }
  table.doc-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    font-size: 10pt;
  }
  .dotted-line {
    border-bottom: 1px dotted #000000;
    height: 30px;
    width: 100%;
  }
</style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- TRANG 1: BÌA SỔ LÝ LỊCH THIẾT BỊ -->
  <!-- ========================================================================= -->
  <div class="page" style="text-align: center; padding-top: 30px;">
    <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 100px;">
      ${companyName}
    </div>

    <h1 style="font-size: 28pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 120px;">
      LÝ LỊCH THIẾT BỊ
    </h1>

    <div style="width: 82%; margin: 0 auto 120px auto; text-align: left; font-size: 13pt; line-height: 2.2;">
      <p style="margin: 8px 0;"><b>Tên thiết bị:</b> ${g.name || ''}</p>
      <p style="margin: 8px 0;"><b>Hãng sản xuất:</b> ${g.manufacturer || ''}</p>
      <p style="margin: 8px 0;"><b>Số hiệu:</b> ${g.model || ''}</p>
      <p style="margin: 8px 0;"><b>Mã số:</b> ${g.serial || ''}</p>
      <p style="margin: 8px 0;"><b>Mã TS:</b> ${g.assetNo || ''}</p>
    </div>

    <div style="width: 82%; margin: 0 auto; text-align: right; font-size: 13pt;">
      <p style="margin: 0;"><b>Số:</b> ${g.assetNo || g.serial || '....................'}</p>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 2: MỤC LỤC & 1. CƠ QUAN, ĐƠN VỊ QUẢN LÝ -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 22px;">
      MỤC LỤC
    </h2>

    <table style="width: 100%; border-collapse: collapse; border: none; font-size: 11.5pt; line-height: 2.0; margin-bottom: 35px;">
      <tr>
        <td style="border: none; padding: 2px 0; font-weight: bold;">1. Cơ quan, đơn vị quản lý</td>
        <td style="border: none; padding: 2px 0; text-align: right; font-weight: bold; width: 40px;">2</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0; font-weight: bold;">2. Sơ lược thiết bị</td>
        <td style="border: none; padding: 2px 0; text-align: right; font-weight: bold; width: 40px;">3</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0 2px 24px;">2.1 Đặc tính kỹ thuật</td>
        <td style="border: none; padding: 2px 0; text-align: right; width: 40px;">4</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0 2px 24px;">2.2. Thành phần thiết bị</td>
        <td style="border: none; padding: 2px 0; text-align: right; width: 40px;">5</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0 2px 24px;">2.3. Tài liệu kỹ thuật kèm theo</td>
        <td style="border: none; padding: 2px 0; text-align: right; width: 40px;">6</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0; font-weight: bold;">3. Bảo dưỡng</td>
        <td style="border: none; padding: 2px 0; text-align: right; font-weight: bold; width: 40px;">7</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px 0; font-weight: bold;">4. Kiểm tra – Sửa chữa – Thay thế - Thay đổi</td>
        <td style="border: none; padding: 2px 0; text-align: right; font-weight: bold; width: 40px;">8</td>
      </tr>
    </table>

    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 30px; margin-bottom: 12px;">
      1. CƠ QUAN, ĐƠN VỊ QUẢN LÝ
    </h2>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th style="width: 25%;">NGÀY THÁNG</th>
          <th style="width: 50%;">ĐƠN VỊ</th>
          <th style="width: 25%;">TÌNH TRẠNG</th>
        </tr>
      </thead>
      <tbody>
        ${paddedOrg.map(r => `
          <tr style="height: 30px;">
            <td style="text-align: center; font-weight: bold;">${r ? (r.date || '') : '&nbsp;'}</td>
            <td style="padding-left: 8px;">${r ? (r.unit || o.unit || '') : '&nbsp;'}</td>
            <td style="text-align: center;">${r ? (r.status || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 3: 2. SƠ LƯỢC THIẾT BỊ -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">
      2. SƠ LƯỢC THIẾT BỊ
    </h2>

    <div style="font-size: 11.5pt; line-height: 2.2; margin-bottom: 28px;">
      <p style="margin: 5px 0;"><b>Tên thiết bị:</b> ${g.name || ''}</p>
      <p style="margin: 5px 0;"><b>Hãng sản xuất:</b> ${g.manufacturer || ''}</p>
      <p style="margin: 5px 0;"><b>Ký hiệu (Model):</b> ${g.model || ''}</p>
      <p style="margin: 5px 0;"><b>Mã số (S/N):</b> ${g.serial || ''}</p>
      <p style="margin: 5px 0;"><b>Năm sản xuất:</b> ${g.yearMade || ''}</p>
      <p style="margin: 5px 0;"><b>Nước sản xuất:</b> ${g.origin || ''}</p>
      <p style="margin: 5px 0;"><b>Thời gian sử dụng:</b> ${g.commissioned || ''}</p>
      <p style="margin: 5px 0;"><b>Thời gian bảo hành:</b> ${g.warrantyDate || ''}</p>
    </div>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th colspan="2" style="width: 50%;">Giấy phép sử dụng tần số và thiết bị VTĐ</th>
          <th colspan="2" style="width: 50%;">Giấy phép khai thác hệ thống kỹ thuật, thiết bị</th>
        </tr>
        <tr style="background-color: #f9f9f9; font-size: 9.5pt;">
          <th style="width: 27%;">Số</th>
          <th style="width: 23%;">Ngày hết hạn</th>
          <th style="width: 27%;">Số</th>
          <th style="width: 23%;">Ngày hết hạn</th>
        </tr>
      </thead>
      <tbody>
        ${paddedLicenses.map(item => `
          <tr style="height: 30px;">
            <td style="text-align: center;">${item.freq ? (item.freq.no || '') : '&nbsp;'}</td>
            <td style="text-align: center;">${item.freq ? (item.freq.expiryDate || '') : '&nbsp;'}</td>
            <td style="text-align: center; font-weight: bold;">${item.exp ? (item.exp.no || '') : '&nbsp;'}</td>
            <td style="text-align: center;">${item.exp ? (item.exp.expiryDate || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 4: 1. ĐẶC TÍNH KỸ THUẬT (2.1) -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">
      &nbsp;&nbsp;&nbsp;1. ĐẶC TÍNH KỸ THUẬT
    </h2>

    <div style="font-size: 11.5pt; line-height: 1.8; text-align: justify; margin-bottom: 30px;">
      <p style="margin: 0 0 16px 0;">
        ${s.text || 'Điều khiển chuyển mạch thoại, kết nối các bàn làm việc (CWP) và máy thu phát VHF, trực thoại, điện thoại phục vụ điều hành bay.'}
      </p>
    </div>

    <!-- Dòng kẻ chấm trang sổ mẫu -->
    <div style="width: 100%; margin-top: 40px;">
      ${Array.from({ length: 18 }).map(() => `
        <div class="dotted-line"></div>
      `).join('')}
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 5: 2. THÀNH PHẦN THIẾT BỊ (2.2) -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
      &nbsp;&nbsp;&nbsp;2. THÀNH PHẦN THIẾT BỊ
    </h2>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th style="width: 8%;">TT</th>
          <th style="width: 52%;">TÊN THIẾT BỊ</th>
          <th style="width: 12%;">ĐVT</th>
          <th style="width: 10%;">SL</th>
          <th style="width: 18%;">GHI CHÚ</th>
        </tr>
      </thead>
      <tbody>
        ${paddedComponents.map((c, i) => `
          <tr style="height: 30px;">
            <td style="text-align: center;">${c ? String(c.no || i + 1).padStart(2, '0') : '&nbsp;'}</td>
            <td style="padding-left: 8px;">${c ? c.name : '&nbsp;'}</td>
            <td style="text-align: center;">${c ? (c.unit || 'Cái') : '&nbsp;'}</td>
            <td style="text-align: center; font-weight: bold;">${c ? String(c.qty || 1).padStart(2, '0') : '&nbsp;'}</td>
            <td style="padding-left: 6px;">${c ? (c.note || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 6: 3. TÀI LIỆU KỸ THUẬT KÈM THEO (2.3) -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
      &nbsp;&nbsp;&nbsp;3. TÀI LIỆU KỸ THUẬT KÈM THEO
    </h2>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th style="width: 10%;">TT</th>
          <th style="width: 60%;">TÊN TÀI LIỆU</th>
          <th style="width: 12%;">SL</th>
          <th style="width: 18%;">GHI CHÚ</th>
        </tr>
      </thead>
      <tbody>
        ${paddedDocs.map((d, i) => `
          <tr style="height: 30px;">
            <td style="text-align: center;">${d ? String(d.no || i + 1).padStart(2, '0') : '&nbsp;'}</td>
            <td style="padding-left: 8px;">${d ? d.name : '&nbsp;'}</td>
            <td style="text-align: center; font-weight: bold;">${d ? String(d.qty || 1).padStart(2, '0') : '&nbsp;'}</td>
            <td style="padding-left: 6px;">${d ? (d.note || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 7: 3. BẢO DƯỠNG -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
      3. BẢO DƯỠNG
    </h2>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th style="width: 22%;">THỜI GIAN</th>
          <th style="width: 53%;">KẾT LUẬN KẾT QUẢ BẢO DƯỠNG</th>
          <th style="width: 25%;">NGƯỜI THỰC HIỆN</th>
        </tr>
      </thead>
      <tbody>
        ${paddedMaint.map(m => `
          <tr style="height: 34px;">
            <td style="text-align: center; font-weight: bold;">${m ? (m.date || '') : '&nbsp;'}</td>
            <td style="padding-left: 8px;">${m ? ([m.result, m.content].filter(Boolean).join(' - ') || '') : '&nbsp;'}</td>
            <td style="text-align: center; font-weight: bold;">${m ? (m.person || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- ========================================================================= -->
  <!-- TRANG 8: 4. KIỂM TRA – SỬA CHỮA – THAY THẾ - THAY ĐỔI -->
  <!-- ========================================================================= -->
  <div class="page" style="padding-top: 10px;">
    <h2 style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
      4. KIỂM TRA – SỬA CHỮA – THAY THẾ - THAY ĐỔI
    </h2>

    <table class="doc-table" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th style="width: 22%;">THỜI GIAN</th>
          <th style="width: 53%;">NỘI DUNG THỰC HIỆN</th>
          <th style="width: 25%;">NGƯỜI THỰC HIỆN</th>
        </tr>
      </thead>
      <tbody>
        ${paddedRepairs.map(r => `
          <tr style="height: 34px;">
            <td style="text-align: center; font-weight: bold;">${r ? (r.date || '') : '&nbsp;'}</td>
            <td style="padding-left: 8px;">${r ? ([r.incidentDescription, r.actionTaken, r.replacedParts].filter(Boolean).join('; ') || '') : '&nbsp;'}</td>
            <td style="text-align: center; font-weight: bold;">${r ? (r.person || '') : '&nbsp;'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

</body>
</html>`;
  }

  /**
   * Tải file HTML định dạng chuẩn Google Docs về máy tính
   */
  public downloadStandardGoogleDocHtml(eq: EquipmentData): void {
    const html = this.generateStandardPassportHtml(eq);
    const cleanName = (eq.general?.name ? eq.general.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'ThietBi');
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_Ly_Lich_${cleanName}_Chuan_Form.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sao chép nội dung chuẩn Google Docs vào clipboard (Rich Text + HTML)
   * Người dùng chỉ cần mở Google Docs trống và ấn Ctrl+V
   */
  public async copyStandardHtmlForGoogleDocs(eq: EquipmentData): Promise<boolean> {
    const html = this.generateStandardPassportHtml(eq);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([html], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);
        return true;
      } else {
        await navigator.clipboard.writeText(html);
        return true;
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  }

  /**
   * Đồng bộ / Ghi đè Google Doc trong thư mục tập trung Google Drive
   * - Tạo file dạng HTML chuẩn văn bản kỹ thuật và chuyển đổi tự động sang native Google Docs
   * - Nếu file Google Doc đã tồn tại -> Tự động CHÉP ĐÈ (Overwrite) toàn bộ nội dung mới nhất
   * - Nếu chưa tồn tại -> Tự động TẠO MỚI tài liệu Google Doc trong thư mục tập trung "CNS_SoLyLich_GoogleDocs"
   */
  public async syncEquipmentToGoogleDoc(equipment: EquipmentData): Promise<GoogleDocSyncResult> {
    const token = await this.ensureToken();

    // 1. Get or create central folder
    const folder = await this.getOrCreateCentralDocsFolder(token);

    const cleanName = (equipment.general?.name ? equipment.general.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'ThietBi');
    const docTitle = `Sổ_Lý_Lịch_${cleanName}_${equipment.general?.serial || equipment.id}`;

    let docId = this.getSavedDocId(equipment.id) || equipment.googleDocUrl?.match(/document\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    let isOverwritten = false;

    // Check if existing file is valid on Drive
    if (docId) {
      try {
        const fileCheck = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?fields=id,name,trashed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (fileCheck.ok) {
          const fileData = await fileCheck.json();
          if (fileData.trashed) {
            docId = undefined;
          } else {
            isOverwritten = true;
          }
        } else {
          docId = undefined;
        }
      } catch {
        docId = undefined;
      }
    }

    const htmlContent = this.generateStandardPassportHtml(equipment);
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    if (!docId) {
      // 2. Tạo mới file Google Doc bằng multipart upload (chuyển đổi trực tiếp từ HTML chuẩn sang Google Doc)
      const metadata = {
        name: docTitle,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folder.id]
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelim;

      const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Không thể tạo file Google Doc định dạng chuẩn trên Google Drive.');
      }

      const createdFile = await createRes.json();
      docId = createdFile.id;
      this.saveEquipmentDocId(equipment.id, docId!);
      isOverwritten = false;
    } else {
      // 3. Ghi đè (PATCH) file Google Doc hiện có bằng nội dung HTML chuẩn mới nhất
      const metadata = {
        name: docTitle
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        htmlContent +
        closeDelim;

      const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${docId}?uploadType=multipart&fields=id,name,webViewLink`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!updateRes.ok) {
        // Fallback: nếu ghi đè PATCH upload không được hỗ trợ bởi Drive API cho docId cũ, tạo mới và lưu lại
        const fallbackMetadata = {
          name: docTitle,
          mimeType: 'application/vnd.google-apps.document',
          parents: [folder.id]
        };

        const fallbackRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(fallbackMetadata) +
          delimiter +
          'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
          htmlContent +
          closeDelim;

        const fallbackRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: fallbackRequestBody
        });

        if (!fallbackRes.ok) {
          const err = await fallbackRes.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Lỗi khi cập nhật Google Doc chuẩn.');
        }
        const newFile = await fallbackRes.json();
        docId = newFile.id;
        this.saveEquipmentDocId(equipment.id, docId!);
      }

      isOverwritten = true;
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    const pdfDownloadUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

    return {
      docId: docId!,
      docUrl,
      pdfDownloadUrl,
      docTitle,
      folderId: folder.id,
      folderUrl: folder.webViewLink,
      updatedAt: new Date().toISOString(),
      isOverwritten
    };
  }

  // Insert content into newly created Google Doc
  private async insertDocContent(docId: string, text: string, token: string) {
    const requests = [
      {
        insertText: {
          location: { index: 1 },
          text: text
        }
      }
    ];

    const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Lỗi khi ghi nội dung vào Google Doc.');
    }
  }

  // Overwrite (Clear all existing content & insert updated content)
  private async overwriteDocContent(docId: string, newText: string, token: string) {
    // 1. Get document length
    const getRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể lấy thông tin Google Doc để ghi đè.');
    }

    const docData = await getRes.json();
    const bodyContent = docData.body?.content || [];
    const endIndex = bodyContent.length > 0 ? bodyContent[bodyContent.length - 1].endIndex : 1;

    const requests: any[] = [];

    // Delete existing content if document is not empty (endIndex > 2)
    if (endIndex > 2) {
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: 1,
            endIndex: endIndex - 1
          }
        }
      });
    }

    // Insert new full content
    requests.push({
      insertText: {
        location: { index: 1 },
        text: newText
      }
    });

    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Lỗi khi tự động ghi đè dữ liệu vào Google Doc.');
    }
  }

  // Batch sync all equipments to Drive folder (Creates or overwrites all)
  public async syncAllEquipmentsToDocs(equipments: EquipmentData[], onProgress?: (current: number, total: number, name: string) => void): Promise<GoogleDocSyncResult[]> {
    const results: GoogleDocSyncResult[] = [];
    for (let i = 0; i < equipments.length; i++) {
      const eq = equipments[i];
      if (onProgress) {
        onProgress(i + 1, equipments.length, eq.general.name);
      }
      try {
        const res = await this.syncEquipmentToGoogleDoc(eq);
        results.push(res);
      } catch (err) {
        console.error(`Failed to sync equipment ${eq.id} to Google Doc:`, err);
      }
    }
    return results;
  }
}

export const googleDriveDocsService = new GoogleDriveDocsService();
