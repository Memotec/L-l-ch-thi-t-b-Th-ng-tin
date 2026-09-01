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
        description: 'Thư mục lưu trữ tập trung Sổ Lý Lịch Thiết Bị Kỹ Thuật CNS (Đội Thông Tin)'
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

  // Build document content string for Google Docs API
  private buildDocumentContent(eq: EquipmentData): string {
    const g = eq.general;
    const o = eq.org;
    const s = eq.spec;
    const components = eq.components || [];
    const maintenance = eq.maintenance || [];
    const repairs = eq.repair || [];

    const lines: string[] = [];
    lines.push('================================================================================');
    lines.push(`${(o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM').toUpperCase()} - ${(o.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT').toUpperCase()}`);
    lines.push('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
    lines.push('Độc lập - Tự do - Hạnh phúc');
    lines.push('================================================================================\n');

    lines.push('SỔ LÝ LỊCH THIẾT BỊ KỸ THUẬT');
    lines.push(`Chủng loại: ${(g.category || 'VHF/UHF').toUpperCase()}  |  Tên thiết bị: ${(g.name || '').toUpperCase()}`);
    lines.push(`Model: ${g.model || '---'}  |  Serial No: ${g.serial || '---'}  |  Mã tài sản: ${g.assetNo || g.assetCode || '---'}`);
    lines.push(`Thời gian cập nhật đồng bộ: ${new Date().toLocaleString('vi-VN')}\n`);

    lines.push('--------------------------------------------------------------------------------');
    lines.push('I. THÔNG TIN CHUNG & QUẢN LÝ TÀI SẢN');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`• Tên thiết bị: ${g.name || '---'}`);
    lines.push(`• Chủng loại: ${g.category || '---'}`);
    lines.push(`• Ký hiệu / Model: ${g.model || '---'}`);
    lines.push(`• Số Serial: ${g.serial || '---'}`);
    lines.push(`• Hãng sản xuất: ${g.manufacturer || '---'}  -  Nước SX: ${g.origin || '---'}`);
    lines.push(`• Năm sản xuất: ${g.yearMade || '---'}  -  Ngày đưa vào SD: ${g.commissioned || '---'}`);
    lines.push(`• Hạn bảo hành: ${g.warrantyDate || '---'}  -  Hạn KĐ/Hiệu chuẩn kế tiếp: ${g.nextCalDate || '---'}`);
    lines.push(`• Trạng thái vận hành: ${g.status || '---'}  -  Mức độ ưu tiên: ${g.priority || '---'}`);
    lines.push(`• Đơn vị quản lý: ${o.unit || '---'}`);
    lines.push(`• Vị trí lắp đặt: ${o.location || '---'}`);
    lines.push(`• Kỹ sư phụ trách: ${o.primaryEngineer || '---'}  -  SĐT: ${o.phoneContact || '---'}`);
    lines.push(`• Cán bộ phụ trách đài/trạm: ${o.supervisor || '---'}`);
    if (g.notes) lines.push(`• Ghi chú tổng quát: ${g.notes}`);
    lines.push('');

    lines.push('--------------------------------------------------------------------------------');
    lines.push('II. THÔNG SỐ ĐẶC TÍNH KỸ THUẬT & CẤU HÌNH');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`• Công suất phát: ${s.power || '---'}  |  Mức ngõ ra / Độ nhạy: ${s.output || '---'}`);
    lines.push(`• Dải tần số / Kênh công tác: ${s.channelFreq || s.range || '---'}`);
    lines.push(`• Giao diện kết nối (Interface): ${s.interface || '---'}`);
    lines.push(`• Địa chỉ Quản trị IP: ${s.mgmtIp || '---'}  |  Subnet: ${s.subnetMask || '---'}  |  Gateway: ${s.gateway || '---'}`);
    lines.push(`• VLAN ID: ${s.vlanId || '---'}  |  SNMP: ${s.snmpCommunity || '---'}  |  Firmware: ${s.firmware || '---'}`);
    if (s.text) lines.push(`• Chi tiết kỹ thuật: ${s.text}`);
    lines.push('');

    lines.push('--------------------------------------------------------------------------------');
    lines.push(`III. DANH MỤC CÁC KHỐI, BO MẠCH & LINH KIỆN THAY THẾ (${components.length} hạng mục)`);
    lines.push('--------------------------------------------------------------------------------');
    if (components.length === 0) {
      lines.push('  (Chưa có danh mục linh kiện chi tiết)');
    } else {
      components.forEach((c, idx) => {
        lines.push(`${idx + 1}. [${c.healthStatus || 'Tốt'}] ${c.name} | PartNo: ${c.partNo || '---'} | Serial: ${c.serial || '---'} | SL: ${c.qty || 1} ${c.unit || 'Bộ'}`);
        if (c.note) lines.push(`    Ghi chú: ${c.note}`);
      });
    }
    lines.push('');

    lines.push('--------------------------------------------------------------------------------');
    lines.push(`IV. NHẬT KÝ BẢO DƯỠNG KỸ THUẬT ĐỊNH KỲ (${maintenance.length} lượt)`);
    lines.push('--------------------------------------------------------------------------------');
    if (maintenance.length === 0) {
      lines.push('  (Chưa có nhật ký bảo dưỡng)');
    } else {
      maintenance.forEach((m, idx) => {
        lines.push(`${idx + 1}. Ngày: ${m.date} | Chu kỳ: ${m.cycle || '---'} | Kết quả: ${m.result || '---'}`);
        lines.push(`   Nội dung: ${m.content || '---'}`);
        if (m.measuredParams) lines.push(`   Thông số đo: ${m.measuredParams}`);
        lines.push(`   Người thực hiện: ${m.person || '---'} | KTV giám sát: ${m.supervisor || '---'}`);
      });
    }
    lines.push('');

    lines.push('--------------------------------------------------------------------------------');
    lines.push(`V. THEO DÕI SỬA CHỮA, KHẮC PHỤC SỰ CỐ & BIẾN ĐỘNG (${repairs.length} lượt)`);
    lines.push('--------------------------------------------------------------------------------');
    if (repairs.length === 0) {
      lines.push('  (Không có sự cố hư hỏng ghi nhận)');
    } else {
      repairs.forEach((r, idx) => {
        lines.push(`${idx + 1}. Ngày: ${r.date} ${r.resolvedDate ? `(Hoàn thành: ${r.resolvedDate})` : ''} | [${r.status || 'Đã xử lý'}] Phân loại: ${r.type || 'Sự cố'}`);
        lines.push(`   Hiện tượng: ${r.incidentDescription || '---'}`);
        if (r.rootCause) lines.push(`   Nguyên nhân: ${r.rootCause}`);
        if (r.actionTaken) lines.push(`   Biện pháp xử lý: ${r.actionTaken}`);
        if (r.replacedParts) lines.push(`   Vật tư thay thế: ${r.replacedParts}`);
        lines.push(`   Kỹ sư thực hiện: ${r.person || '---'}`);
      });
    }
    lines.push('\n');

    lines.push('--------------------------------------------------------------------------------');
    lines.push('KHỐI CHỮ KÝ PHÊ DUYỆT HỒ SƠ');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(`NGƯỜI LẬP SỔ: ${o.primaryEngineer || 'Kỹ sư phụ trách'}`);
    lines.push(`CÁN BỘ TRƯỞNG ĐÀI/TRẠM: ${o.supervisor || 'Trưởng đài/trạm'}`);
    lines.push('LÃNH ĐẠO ĐƠN VỊ DUYỆT: Trưởng phòng / Giám đốc\n');
    lines.push(`[Hồ sơ điện tử CNS Multi-Manager - Google Docs Cloud Sync - ${new Date().toISOString()}]`);

    return lines.join('\n');
  }

  /**
   * Đồng bộ / Ghi đè Google Doc trong thư mục tập trung Google Drive
   * - Nếu file Google Doc đã tồn tại cho thiết bị này -> Tự động CHÉP ĐÈ (Overwrite) toàn bộ nội dung mới nhất.
   * - Nếu chưa tồn tại -> Tự động TẠO MỚI tài liệu Google Doc và chuyển vào thư mục tập trung "CNS_SoLyLich_GoogleDocs".
   */
  public async syncEquipmentToGoogleDoc(equipment: EquipmentData): Promise<GoogleDocSyncResult> {
    const token = await this.ensureToken();

    // 1. Get or create central folder
    const folder = await this.getOrCreateCentralDocsFolder(token);

    const cleanName = (equipment.general.name ? equipment.general.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'ThietBi');
    const docTitle = `Sổ_Lý_Lịch_${cleanName}_${equipment.general.serial || equipment.id}`;

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

    const contentText = this.buildDocumentContent(equipment);

    if (!docId) {
      // 2. Create new Google Doc using Docs API
      const createDocRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: docTitle
        })
      });

      if (!createDocRes.ok) {
        const err = await createDocRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Không thể tạo file Google Doc mới.');
      }

      const newDoc = await createDocRes.json();
      docId = newDoc.documentId;
      this.saveEquipmentDocId(equipment.id, docId!);

      // Move newly created doc to the central folder
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?addParents=${folder.id}&fields=id,parents`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.warn('Could not move file to folder:', e);
      }

      // Insert initial content
      await this.insertDocContent(docId!, contentText, token);
      isOverwritten = false;
    } else {
      // 3. Overwrite existing Google Doc
      await this.overwriteDocContent(docId, contentText, token);
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
