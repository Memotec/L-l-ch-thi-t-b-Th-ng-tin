import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { EquipmentData } from '../types';

export interface PdfExportProgress {
  current: number;
  total: number;
  message: string;
}

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  filename?: string;
  marginMm?: number;
  onProgress?: ((progress: PdfExportProgress) => void) | ((current: number, total: number) => void);
}

class PdfExportService {
  /**
   * Export an HTML element (or collection of .page-sheet / .page-sheet-landscape elements) as a genuine .pdf file
   */
  async exportElementToPdf(
    element: HTMLElement,
    options?: PdfExportOptions
  ): Promise<void> {
    const isLandscape = options?.orientation === 'landscape';
    const filename = (options?.filename || 'So_Ly_Lich_Thiet_Bi')
      .replace(/\.pdf$/i, '')
      .replace(/[\/\\?%*:|"<>]/g, '_') + '.pdf';

    // Look for individual A4 page sheets
    let pageElements = Array.from(
      element.querySelectorAll<HTMLElement>('.page-sheet, .page-sheet-landscape')
    );

    // If no dedicated page sheets are found, treat the element itself as one page
    if (pageElements.length === 0) {
      pageElements = [element];
    }

    const totalPages = pageElements.length;
    const notifyProgress = (current: number, total: number, message: string) => {
      if (!options?.onProgress) return;
      try {
        (options.onProgress as any)({ current, total, message });
        (options.onProgress as any)(current, total);
      } catch {
        // ignore callback error
      }
    };

    notifyProgress(0, totalPages, `Bắt đầu khởi tạo bản in PDF (${totalPages} trang)...`);

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      const pageNum = i + 1;

      notifyProgress(pageNum, totalPages, `Đang kết xuất trang ${pageNum}/${totalPages}...`);

      // Render page element to high-res canvas (2x scale for 300 DPI crisp typography)
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
      }

      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        undefined,
        'FAST'
      );
    }

    notifyProgress(totalPages, totalPages, 'Hoàn tất! Đang lưu file PDF về máy...');

    pdf.save(filename);
  }

  /**
   * Quick trigger print via browser (Save as PDF)
   */
  triggerBrowserPrint(): void {
    window.print();
  }
}

export const pdfExportService = new PdfExportService();
