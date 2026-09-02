import { EquipmentData } from '../types';

declare const google: any;

const CLIENT_ID = '509124400040-o4n2t7b64qj7216l37861pkvlh3k46d3.apps.googleusercontent.com';
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

  private initClients() {
    if (typeof google !== 'undefined' && google.accounts?.oauth2) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
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
        reject(new Error('Google Identity Services client not loaded.'));
        return;
      }

      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
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
      this.tokenClient.requestAccessToken({ prompt: '' });
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
    const unitName = (o.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT').toUpperCase();

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Lý Lịch Thiết Bị - ${g.name || 'CNS'}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 20mm;
  }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    color: #000000;
    line-height: 1.35;
    background-color: #ffffff;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .font-bold { font-weight: bold; }
  .font-italic { font-style: italic; }
  .uppercase { text-transform: uppercase; }
  .page-break { page-break-before: always; margin-top: 30px; }

  /* Bảng chuẩn công văn kỹ thuật */
  table.doc-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
    margin-top: 6px;
    margin-bottom: 12px;
    font-size: 10.5pt;
  }
  table.doc-table th, table.doc-table td {
    border: 1px solid #000000;
    padding: 5px 7px;
    vertical-align: middle;
  }
  table.doc-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    font-size: 10pt;
  }
  table.grid-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
    margin-top: 6px;
    margin-bottom: 12px;
  }
  table.grid-table td {
    border: 1px solid #000000;
    padding: 5px 8px;
    font-size: 10.5pt;
  }
  table.grid-table td.label-col {
    background-color: #f8fafc;
    font-weight: bold;
    width: 22%;
  }

  /* Bảng không viền */
  table.no-border {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-bottom: 12px;
  }
  table.no-border td {
    border: none;
    padding: 4px 6px;
    vertical-align: top;
  }

  .cover-frame {
    border: 3px double #000000;
    padding: 24px 18px 20px 18px;
    min-height: 860px;
    box-sizing: border-box;
  }
  .section-heading {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 14px;
    margin-bottom: 6px;
    color: #000000;
  }
  .sub-heading {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 4px;
  }
</style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- TRANG 1: BÌA SỔ LÝ LỊCH THIẾT BỊ (CHUẨN FORM HÀNG KHÔNG) -->
  <!-- ========================================================================= -->
  <div class="cover-frame">
    <table class="no-border">
      <tr>
        <td style="width: 100%; text-align: center;">
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">${companyName}</div>
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 3px;">${unitName}</div>
          <div style="font-size: 10pt; margin-top: 2px;">-------------------------</div>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 90px; margin-bottom: 70px;">
      <h1 style="font-size: 26pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; padding: 0;">
        LÝ LỊCH THIẾT BỊ
      </h1>
      <div style="width: 200px; margin: 12px auto; border-bottom: 1px dotted #000000;"></div>
      <div style="font-size: 11pt; font-style: italic; margin-top: 6px;">(Ban hành kèm theo Quy trình Quản lý kỹ thuật thiết bị CNS)</div>
    </div>

    <!-- Khung thông tin bìa điền form chuẩn -->
    <div style="width: 85%; margin: 0 auto; font-size: 12pt; line-height: 2.2;">
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; width: 140px;">Tên thiết bị:</span>
        <span style="flex: 1; border-bottom: 1px dotted #000000; font-weight: bold; padding-left: 8px;">
          ${g.name || '---'}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; width: 140px;">Hãng sản xuất:</span>
        <span style="flex: 1; border-bottom: 1px dotted #000000; font-weight: bold; padding-left: 8px;">
          ${g.manufacturer || '---'}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; width: 140px;">Số hiệu (Model):</span>
        <span style="flex: 1; border-bottom: 1px dotted #000000; font-weight: bold; padding-left: 8px;">
          ${g.model || '---'}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; width: 140px;">Mã số (Serial):</span>
        <span style="flex: 1; border-bottom: 1px dotted #000000; font-weight: bold; font-family: monospace; padding-left: 8px;">
          ${g.serial || '---'}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; width: 140px;">Mã tài sản (Mã TS):</span>
        <span style="flex: 1; border-bottom: 1px dotted #000000; font-weight: bold; font-family: monospace; padding-left: 8px;">
          ${g.assetNo || g.assetCode || '---'}
        </span>
      </div>
    </div>

    <div style="margin-top: 110px; display: flex; justify-content: flex-end;">
      <div style="border: 1px solid #000000; padding: 6px 18px; text-align: center; min-width: 140px; font-size: 11pt;">
        <b>Số:</b> <span style="font-family: monospace; font-weight: bold;">${g.assetNo || g.serial || '....................'}</span>
      </div>
    </div>
  </div>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- HEADER QUỐC GIA & CƠ QUAN -->
  <!-- ========================================================================= -->
  <table class="no-border">
    <tr>
      <td style="width: 50%; text-align: center;">
        <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase;">${companyName}</div>
        <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase;">${unitName}</div>
        <div style="font-size: 9pt;">-----------------------</div>
      </td>
      <td style="width: 50%; text-align: center;">
        <div style="font-size: 10pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-size: 10pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
        <div style="font-size: 9pt;">----------------------------------</div>
      </td>
    </tr>
  </table>

  <!-- ========================================================================= -->
  <!-- MỤC LỤC -->
  <!-- ========================================================================= -->
  <div style="text-align: center; margin: 16px 0 10px 0;">
    <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0;">MỤC LỤC</h2>
  </div>

  <table class="no-border" style="width: 90%; margin: 0 auto 20px auto; font-size: 11pt; line-height: 1.8;">
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>1. Cơ quan, đơn vị quản lý</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 2</b></td>
    </tr>
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>2. Sơ lược thiết bị (Thông tin chung & Giấy phép)</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 3</b></td>
    </tr>
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>3. Đặc tính kỹ thuật & Cấu hình IP</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 4</b></td>
    </tr>
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>4. Thành phần linh kiện & Khối máy</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 5</b></td>
    </tr>
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>5. Lịch sử bảo dưỡng kỹ thuật</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 6</b></td>
    </tr>
    <tr>
      <td style="border-bottom: 1px dotted #888888;"><b>6. Theo dõi sửa chữa, sự cố, biến động</b></td>
      <td style="border-bottom: 1px dotted #888888; text-align: right; width: 40px; font-family: monospace;"><b>Trang 7</b></td>
    </tr>
  </table>

  <!-- ========================================================================= -->
  <!-- 1. CƠ QUAN, ĐƠN VỊ QUẢN LÝ -->
  <!-- ========================================================================= -->
  <div class="section-heading">1. CƠ QUAN, ĐƠN VỊ QUẢN LÝ</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 6%;">STT</th>
        <th style="width: 14%;">Ngày tháng</th>
        <th style="width: 25%;">Tên cơ quan, đơn vị quản lý</th>
        <th style="width: 25%;">Vị trí lắp đặt / Khai thác</th>
        <th style="width: 20%;">Căn cứ điều chuyển / Quyết định</th>
        <th style="width: 10%;">Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${orgRows.length > 0 ? orgRows.map((r: any, i: number) => `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td class="text-center">${r.date || ''}</td>
          <td><b>${r.unit || r.toUnit || unitName}</b>${r.fromUnit ? `<br><small>(Từ: ${r.fromUnit})</small>` : ''}</td>
          <td>${o.location || '---'}</td>
          <td>${r.handoverDocNo || r.decisionNo || r.reason || 'Bàn giao đưa vào khai thác'}</td>
          <td>${r.status || r.note || r.signer || ''}</td>
        </tr>
      `).join('') : `
        <tr>
          <td class="text-center">1</td>
          <td class="text-center">${g.commissioned || ''}</td>
          <td><b>${unitName}</b></td>
          <td>${o.location || '---'}</td>
          <td>Quyết định đưa vào khai thác chính thức</td>
          <td>${o.supervisor || ''}</td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- 2. SƠ LƯỢC THIẾT BỊ -->
  <!-- ========================================================================= -->
  <div class="section-heading">2. SƠ LƯỢC THIẾT BỊ</div>

  <div class="sub-heading">2.1. Thông tin chung</div>
  <table class="grid-table">
    <tr>
      <td class="label-col">Tên thiết bị:</td>
      <td><b>${g.name || '---'}</b></td>
      <td class="label-col">Chủng loại:</td>
      <td>${g.category || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Ký hiệu (Model):</td>
      <td><b>${g.model || '---'}</b></td>
      <td class="label-col">Số Serial:</td>
      <td><span style="font-family: monospace; font-weight: bold;">${g.serial || '---'}</span></td>
    </tr>
    <tr>
      <td class="label-col">Hãng sản xuất:</td>
      <td>${g.manufacturer || '---'}</td>
      <td class="label-col">Nước sản xuất:</td>
      <td>${g.origin || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Năm sản xuất:</td>
      <td>${g.yearMade || '---'}</td>
      <td class="label-col">Ngày đưa vào SD:</td>
      <td>${g.commissioned || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Mã thẻ tài sản:</td>
      <td><span style="font-family: monospace;">${g.assetNo || g.assetCode || '---'}</span></td>
      <td class="label-col">Hạn bảo hành:</td>
      <td>${g.warrantyDate || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Trạng thái vận hành:</td>
      <td><b>${g.status || 'Đang khai thác'}</b></td>
      <td class="label-col">Mức độ ưu tiên:</td>
      <td>${g.priority || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Đài / Trạm quản lý:</td>
      <td>${o.unit || '---'}</td>
      <td class="label-col">Vị trí lắp đặt:</td>
      <td>${o.location || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Kỹ sư phụ trách:</td>
      <td>${o.primaryEngineer || '---'} (SĐT: ${o.phoneContact || '---'})</td>
      <td class="label-col">Cán bộ phụ trách:</td>
      <td>${o.supervisor || '---'}</td>
    </tr>
  </table>

  <div class="sub-heading">2.2. Giấy phép</div>
  <table class="no-border" style="margin-bottom: 0;">
    <tr>
      <td style="width: 50%; padding-left: 0;">
        <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">a) Giấy phép tần số vô tuyến điện:</div>
        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 15%;">STT</th>
              <th style="width: 45%;">Số giấy phép</th>
              <th style="width: 40%;">Thời hạn</th>
            </tr>
          </thead>
          <tbody>
            ${freqLicenses.length > 0 ? freqLicenses.map((l: any, idx: number) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td><b>${l.no || l.licenseNo || '---'}</b></td>
                <td class="text-center">${l.expiryDate || '---'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td class="text-center">1</td>
                <td>GP-TS-${g.model || 'CNS'}</td>
                <td class="text-center">Còn hiệu lực</td>
              </tr>
            `}
          </tbody>
        </table>
      </td>
      <td style="width: 50%; padding-right: 0;">
        <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">b) Giấy phép khai thác thiết bị:</div>
        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 15%;">STT</th>
              <th style="width: 45%;">Số giấy phép</th>
              <th style="width: 40%;">Thời hạn</th>
            </tr>
          </thead>
          <tbody>
            ${exploitLicenses.length > 0 ? exploitLicenses.map((l: any, idx: number) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td><b>${l.no || l.licenseNo || '---'}</b></td>
                <td class="text-center">${l.expiryDate || '---'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td class="text-center">1</td>
                <td>GP-KT-${g.category || 'VHF'}</td>
                <td class="text-center">Còn hiệu lực</td>
              </tr>
            `}
          </tbody>
        </table>
      </td>
    </tr>
  </table>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- 3. ĐẶC TÍNH KỸ THUẬT -->
  <!-- ========================================================================= -->
  <div class="section-heading">3. ĐẶC TÍNH KỸ THUẬT</div>

  <div class="sub-heading">3.1. Thông số kỹ thuật chính</div>
  <table class="grid-table">
    <tr>
      <td class="label-col">Công suất phát (Power):</td>
      <td><b>${s.power || '---'}</b></td>
      <td class="label-col">Mức ngõ ra / Độ nhạy:</td>
      <td>${s.output || s.sensitivity || '---'}</td>
    </tr>
    <tr>
      <td class="label-col">Dải tần / Kênh tần số:</td>
      <td><b>${s.channelFreq || s.frequency || s.range || '---'}</b></td>
      <td class="label-col">Giao diện kết nối:</td>
      <td>${s.interface || '---'}</td>
    </tr>
  </table>

  <div class="sub-heading">3.2. Cấu hình mạng & Địa chỉ IP</div>
  <table class="grid-table">
    <tr>
      <td class="label-col">Địa chỉ IP Quản trị:</td>
      <td><span style="font-family: monospace; font-weight: bold;">${s.mgmtIp || '---'}</span></td>
      <td class="label-col">Subnet Mask / Gateway:</td>
      <td><span style="font-family: monospace;">${(s.subnetMask || '---') + ' / ' + (s.gateway || '---')}</span></td>
    </tr>
    <tr>
      <td class="label-col">VLAN ID / SNMP:</td>
      <td><span style="font-family: monospace;">${(s.vlanId || '---') + ' / ' + (s.snmpCommunity || '---')}</span></td>
      <td class="label-col">Phiên bản Firmware:</td>
      <td><b>${s.firmware || '---'}</b></td>
    </tr>
  </table>

  ${s.text ? `<div style="font-size: 10pt; margin-top: 4px; margin-bottom: 8px;"><b>Mô tả đặc tính bổ sung:</b> <i>${s.text}</i></div>` : ''}

  <div class="sub-heading">3.3. Tài liệu kỹ thuật kèm theo thiết bị</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 8%;">STT</th>
        <th style="width: 42%;">Tên tài liệu / Manual</th>
        <th style="width: 25%;">Ký hiệu / Mã hiệu</th>
        <th style="width: 12%;">Ngôn ngữ</th>
        <th style="width: 13%;">Nơi lưu trữ</th>
      </tr>
    </thead>
    <tbody>
      ${docs.length > 0 ? docs.map((d: any, idx: number) => `
        <tr>
          <td class="text-center">${d.no || idx + 1}</td>
          <td><b>${d.name}</b></td>
          <td>${d.code || d.format || '---'}</td>
          <td class="text-center">${d.lang || d.language || 'Tiếng Anh/Việt'}</td>
          <td>${d.location || d.storageLocation || 'Phòng KT'}</td>
        </tr>
      `).join('') : `
        <tr>
          <td class="text-center">1</td>
          <td>Tài liệu Hướng dẫn Vận hành & Bảo dưỡng (User & Maintenance Manual)</td>
          <td>OM-${g.model || 'CNS'}</td>
          <td class="text-center">Tiếng Anh</td>
          <td>Phòng Kỹ Thuật</td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- 4. THÀNH PHẦN LINH KIỆN -->
  <!-- ========================================================================= -->
  <div class="section-heading">4. THÀNH PHẦN LINH KIỆN, KHỐI MÁY & BO MẠCH</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 6%;">STT</th>
        <th style="width: 32%;">Tên linh kiện / Khối máy / Module</th>
        <th style="width: 18%;">Mã Part No.</th>
        <th style="width: 18%;">Số Serial</th>
        <th style="width: 8%;">ĐVT</th>
        <th style="width: 6%;">SL</th>
        <th style="width: 12%;">Tình trạng</th>
      </tr>
    </thead>
    <tbody>
      ${components.length > 0 ? components.map((c, idx) => `
        <tr>
          <td class="text-center">${c.no || idx + 1}</td>
          <td><b>${c.name}</b>${c.note ? `<br><small style="color: #444;">(${c.note})</small>` : ''}</td>
          <td style="font-family: monospace;">${c.partNo || '---'}</td>
          <td style="font-family: monospace;">${c.serial || '---'}</td>
          <td class="text-center">${c.unit || 'Bộ'}</td>
          <td class="text-center"><b>${c.qty || 1}</b></td>
          <td class="text-center">${c.healthStatus || 'Tốt'}</td>
        </tr>
      `).join('') : `
        <tr>
          <td class="text-center">1</td>
          <td>Khối máy chính đồng bộ theo thiết bị</td>
          <td>---</td>
          <td style="font-family: monospace;">${g.serial || '---'}</td>
          <td class="text-center">Bộ</td>
          <td class="text-center">1</td>
          <td class="text-center">Tốt</td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- 5. LỊCH SỬ BẢO DƯỠNG KỸ THUẬT -->
  <!-- ========================================================================= -->
  <div class="section-heading">5. LỊCH SỬ BẢO DƯỠNG KỸ THUẬT ĐỊNH KỲ</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 5%;">STT</th>
        <th style="width: 11%;">Ngày TH</th>
        <th style="width: 10%;">Chu kỳ</th>
        <th style="width: 36%;">Nội dung công việc & Thông số đo đạc</th>
        <th style="width: 14%;">Kết quả đánh giá</th>
        <th style="width: 12%;">Người TH</th>
        <th style="width: 12%;">Người kiểm tra</th>
      </tr>
    </thead>
    <tbody>
      ${maintenance.length > 0 ? maintenance.map((m, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center">${m.date}</td>
          <td class="text-center"><b>${m.cycle || '---'}</b></td>
          <td>
            ${m.content || '---'}
            ${m.measuredParams ? `<br><small style="color: #0369a1;"><b>Thông số đo:</b> ${m.measuredParams}</small>` : ''}
          </td>
          <td class="text-center"><b>${m.result || 'Đạt'}</b></td>
          <td class="text-center">${m.person || '---'}</td>
          <td class="text-center">${m.supervisor || '---'}</td>
        </tr>
      `).join('') : `
        <tr>
          <td class="text-center" colspan="7" style="padding: 12px; font-style: italic; color: #666;">
            Chưa có ghi nhận nhật ký bảo dưỡng định kỳ
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- NGẮT TRANG -->
  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- 6. THEO DÕI SỬA CHỮA, BIẾN ĐỘNG & SỰ CỐ -->
  <!-- ========================================================================= -->
  <div class="section-heading">6. THEO DÕI SỬA CHỮA, BIẾN ĐỘNG & KHẮC PHỤC SỰ CỐ</div>
  <table class="doc-table">
    <thead>
      <tr>
        <th style="width: 5%;">STT</th>
        <th style="width: 11%;">Ngày tháng</th>
        <th style="width: 12%;">Phân loại</th>
        <th style="width: 28%;">Hiện tượng hư hỏng & Nguyên nhân</th>
        <th style="width: 26%;">Biện pháp xử lý & Vật tư thay thế</th>
        <th style="width: 10%;">Người TH</th>
        <th style="width: 8%;">Tình trạng</th>
      </tr>
    </thead>
    <tbody>
      ${repairs.length > 0 ? repairs.map((r, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center">
            ${r.date}
            ${r.resolvedDate ? `<br><small style="color: #059669;">Xong: ${r.resolvedDate}</small>` : ''}
          </td>
          <td class="text-center"><b>${r.type || 'Sự cố'}</b></td>
          <td>
            ${r.incidentDescription || '---'}
            ${r.rootCause ? `<br><small style="color: #b91c1c;"><b>Nguyên nhân:</b> ${r.rootCause}</small>` : ''}
          </td>
          <td>
            ${r.actionTaken || '---'}
            ${r.replacedParts ? `<br><small style="color: #0284c7;"><b>Vật tư thay:</b> ${r.replacedParts}</small>` : ''}
          </td>
          <td class="text-center">${r.person || '---'}</td>
          <td class="text-center"><b>${r.status || 'Đã xử lý'}</b></td>
        </tr>
      `).join('') : `
        <tr>
          <td class="text-center" colspan="7" style="padding: 12px; font-style: italic; color: #666;">
            Không có ghi nhận sự cố hư hỏng hoặc biến động bất thường
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <!-- ========================================================================= -->
  <!-- KHỐI CHỮ KÝ PHÊ DUYỆT (3 CỘT CHUẨN) -->
  <!-- ========================================================================= -->
  <div style="margin-top: 30px; page-break-inside: avoid;">
    <table class="no-border">
      <tr>
        <td style="width: 33.33%; text-align: center;">
          <div style="font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">NGƯỜI LẬP SỔ</div>
          <div style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold; font-size: 10.5pt;">${o.primaryEngineer || 'Kỹ sư phụ trách'}</div>
        </td>
        <td style="width: 33.33%; text-align: center;">
          <div style="font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">CÁN BỘ PHỤ TRÁCH ĐÀI/TRẠM</div>
          <div style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold; font-size: 10.5pt;">${o.supervisor || 'Trưởng đài/trạm'}</div>
        </td>
        <td style="width: 33.33%; text-align: center;">
          <div style="font-weight: bold; font-size: 10.5pt; text-transform: uppercase;">LÃNH ĐẠO ĐƠN VỊ DUYỆT</div>
          <div style="font-size: 9.5pt; font-style: italic;">(Ký tên và đóng dấu)</div>
          <div style="height: 65px;"></div>
          <div style="font-weight: bold; font-size: 10.5pt;">Trưởng phòng / Giám đốc</div>
        </td>
      </tr>
    </table>
  </div>

</body>
</html>`;
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
