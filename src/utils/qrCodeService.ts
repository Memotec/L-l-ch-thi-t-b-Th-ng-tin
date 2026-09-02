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

// In-memory cache for QR code generation
const qrDataUrlCache = new Map<string, string>();
const qrSvgCache = new Map<string, string>();

/**
 * Generates a Base64 Data URL (PNG) of the QR code with LRU memory caching
 */
export async function generateEquipmentQrDataUrl(
  equipment: EquipmentData,
  options?: QrRenderOptions
): Promise<string> {
  const { targetUrl } = buildEquipmentQrData(equipment, undefined, options?.targetMode || 'pdf');
  const cacheKey = `${targetUrl}_${options?.width || 320}_${options?.margin ?? 2}_${options?.errorCorrectionLevel || 'M'}_${options?.color?.dark || '#0f172a'}_${options?.color?.light || '#ffffff'}`;

  if (qrDataUrlCache.has(cacheKey)) {
    return qrDataUrlCache.get(cacheKey)!;
  }

  const result = await QRCode.toDataURL(targetUrl, {
    width: options?.width || 320,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff'
    }
  });

  // Keep cache size bounded
  if (qrDataUrlCache.size > 200) {
    const firstKey = qrDataUrlCache.keys().next().value;
    if (firstKey) qrDataUrlCache.delete(firstKey);
  }

  qrDataUrlCache.set(cacheKey, result);
  return result;
}

/**
 * Generates SVG string of the QR code with memory caching
 */
export async function generateEquipmentQrSvg(
  equipment: EquipmentData,
  options?: QrRenderOptions
): Promise<string> {
  const { targetUrl } = buildEquipmentQrData(equipment, undefined, options?.targetMode || 'pdf');
  const cacheKey = `${targetUrl}_${options?.width || 320}_${options?.margin ?? 2}_${options?.errorCorrectionLevel || 'M'}_${options?.color?.dark || '#0f172a'}_${options?.color?.light || '#ffffff'}`;

  if (qrSvgCache.has(cacheKey)) {
    return qrSvgCache.get(cacheKey)!;
  }

  const result = await QRCode.toString(targetUrl, {
    type: 'svg',
    width: options?.width || 320,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff'
    }
  });

  if (qrSvgCache.size > 200) {
    const firstKey = qrSvgCache.keys().next().value;
    if (firstKey) qrSvgCache.delete(firstKey);
  }

  qrSvgCache.set(cacheKey, result);
  return result;
}

