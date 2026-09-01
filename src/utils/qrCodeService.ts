import QRCode from 'qrcode';
import { EquipmentData } from '../types';

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
}

/**
 * Builds the scannable payload string for an equipment
 */
export function buildEquipmentQrData(equipment: EquipmentData, baseUrl?: string): {
  payloadText: string;
  lookupUrl: string;
  summaryText: string;
} {
  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://cns-passport.vn';
  const appBase = baseUrl || currentOrigin;
  const lookupUrl = `${appBase}#eq=${encodeURIComponent(equipment.id)}`;

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
- Tra cứu trực tuyến: ${lookupUrl}`;

  return {
    payloadText: lookupUrl,
    lookupUrl,
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
}

/**
 * Generates a Base64 Data URL (PNG) of the QR code
 */
export async function generateEquipmentQrDataUrl(
  equipment: EquipmentData,
  options?: QrRenderOptions
): Promise<string> {
  const { lookupUrl } = buildEquipmentQrData(equipment);
  return await QRCode.toDataURL(lookupUrl, {
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
  const { lookupUrl } = buildEquipmentQrData(equipment);
  return await QRCode.toString(lookupUrl, {
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
