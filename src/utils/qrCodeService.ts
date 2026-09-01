import QRCode from 'qrcode';
import { EquipmentData } from '../types';

export type QrTargetMode = 'pdf' | 'google_doc' | 'app';

export interface EquipmentQrPayload {
  version: string;
  app: string;
  id: string;
  name: string;
  category: string;
  model: string;
  serial: string;
  assetNo: string;
  unit: string;
  location: string;
  engineer: string;
  phone: string;
  status: string;
  webUrl: string;
  googleDocUrl?: string;
  pdfUrl?: string;
}

/**
 * Builds the scannable payload string for an equipment
 */
export function buildEquipmentQrData(
  equipment: EquipmentData, 
  baseUrl?: string,
  targetMode: QrTargetMode = 'pdf'
): {
  payloadText: string;
  lookupUrl: string;
  targetUrl: string;
  googleDocUrl: string;
  pdfViewerUrl: string;
  summaryText: string;
} {
  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const currentOrigin = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname 
    : 'https://cns-passport.vn';
  const appBase = baseUrl || currentOrigin;
  
  const lookupUrl = `${appBase}#eq=${encodeURIComponent(equipment.id)}`;
  const pdfViewerUrl = `${appBase}#eq=${encodeURIComponent(equipment.id)}&view=pdf`;
  
  // Clean default Google Doc URL or user configured one
  const googleDocUrl = equipment.googleDocUrl || 
    `https://docs.google.com/document/create?title=${encodeURIComponent('Sổ_Lý_Lịch_' + (g.name || equipment.id))}`;

  let targetUrl = pdfViewerUrl;
  if (targetMode === 'google_doc') {
    targetUrl = equipment.googleDocUrl || googleDocUrl;
  } else if (targetMode === 'app') {
    targetUrl = lookupUrl;
  } else {
    targetUrl = pdfViewerUrl;
  }

  // Human-readable summary for generic scanners
  const summaryText = 
`[SỔ LÝ LỊCH THIẾT BỊ CNS]
- Tên: ${g.name || 'Thiết bị'}
- Chủng loại: ${g.category || 'VHF/UHF'}
- Model: ${g.model || 'N/A'} | SN: ${g.serial || 'N/A'}
- Mã TS: ${g.assetNo || 'N/A'}
- Đơn vị: ${o.unit || '---'} - ${o.location || '---'}
- Kỹ sư phụ trách: ${o.primaryEngineer || '---'} (${o.phoneContact || '---'})
- Trạng thái: ${g.status || 'Đang khai thác'}
- Xem File PDF Sổ Lý Lịch: ${pdfViewerUrl}
- Mở File Google Docs: ${googleDocUrl}`;

  return {
    payloadText: targetUrl,
    lookupUrl,
    targetUrl,
    googleDocUrl,
    pdfViewerUrl,
    summaryText
  };
}

export interface QrRenderOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  targetMode?: QrTargetMode;
}

/**
 * Generates a Base64 Data URL (PNG) of the QR code
 */
export async function generateEquipmentQrDataUrl(
  equipment: EquipmentData,
  options?: QrRenderOptions
): Promise<string> {
  const { targetUrl } = buildEquipmentQrData(equipment, undefined, options?.targetMode || 'pdf');
  return await QRCode.toDataURL(targetUrl, {
    width: options?.width || 320,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff'
    }
  });
}

/**
 * Generates SVG string of the QR code
 */
export async function generateEquipmentQrSvg(
  equipment: EquipmentData,
  options?: QrRenderOptions
): Promise<string> {
  const { targetUrl } = buildEquipmentQrData(equipment, undefined, options?.targetMode || 'pdf');
  return await QRCode.toString(targetUrl, {
    type: 'svg',
    width: options?.width || 320,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff'
    }
  });
}

