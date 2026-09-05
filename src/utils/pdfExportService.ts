import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { EquipmentData } from '../types';

export interface PdfExportProgress {
  current: number;
  total: number;
  message: string;
}

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'A5';
  format?: 'a4' | 'a5';
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

    // Look for individual page sheets (A4 or A5)
    let pageElements = Array.from(
      element.querySelectorAll<HTMLElement>('.page-sheet, .page-sheet-landscape')
    );

    // If no dedicated page sheets are found, treat the element itself as one page
    if (pageElements.length === 0) {
      pageElements = [element];
    }

    // Determine if exporting in A5 format
    const isA5 = options?.paperSize === 'A5' || 
      options?.format === 'a5' || 
      element.getAttribute('data-paper-size') === 'A5' ||
      element.querySelector('[data-paper-size="A5"]') !== null ||
      pageElements.some(el => el.classList.contains('a5-sheet') || el.style.width === '148mm');

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

    notifyProgress(0, totalPages, `Bắt đầu khởi tạo bản in PDF ${isA5 ? 'A5' : 'A4'} (${totalPages} trang)...`);

    const firstIsLandscape = pageElements[0]?.classList.contains('page-sheet-landscape') || isLandscape;
    const pdf = new jsPDF({
      orientation: firstIsLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: isA5 ? 'a5' : 'a4',
      compress: true
    });

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      const pageNum = i + 1;
      const isLandscapePage = pageEl.classList.contains('page-sheet-landscape') || 
        (!pageEl.classList.contains('page-sheet') && isLandscape);
      
      const pageWidthMm = isA5 
        ? (isLandscapePage ? 210 : 148) 
        : (isLandscapePage ? 297 : 210);
      const pageHeightMm = isA5 
        ? (isLandscapePage ? 148 : 210) 
        : (isLandscapePage ? 210 : 297);

      notifyProgress(pageNum, totalPages, `Đang kết xuất trang ${pageNum}/${totalPages} (${isA5 ? 'A5' : 'A4'})...`);

      // Render page element to high-res canvas (2x scale for 300 DPI crisp typography)
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (_clonedDoc, clonedElement) => {
          // Reset transform/zoom on clonedElement and all parents up to document body
          let cur: HTMLElement | null = clonedElement;
          while (cur && cur !== _clonedDoc.body) {
            cur.style.transform = 'none';
            cur.style.transformOrigin = 'top left';
            cur = cur.parentElement;
          }
          // Remove preview-only shadow, border, and margin
          clonedElement.style.margin = '0 auto';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.borderRadius = '0';
          clonedElement.style.backgroundColor = '#ffffff';

          // Lock to exact standard size
          if (isA5) {
            if (isLandscapePage) {
              clonedElement.style.width = '210mm';
              clonedElement.style.minHeight = '148mm';
            } else {
              clonedElement.style.width = '148mm';
              clonedElement.style.minHeight = '210mm';
            }
          } else {
            if (isLandscapePage) {
              clonedElement.style.width = '297mm';
              clonedElement.style.minHeight = '210mm';
            } else {
              clonedElement.style.width = '210mm';
              clonedElement.style.minHeight = '297mm';
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      if (i > 0) {
        pdf.addPage(isA5 ? 'a5' : 'a4', isLandscapePage ? 'landscape' : 'portrait');
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

    notifyProgress(totalPages, totalPages, `Hoàn tất! Đang lưu file PDF ${isA5 ? 'A5' : 'A4'} về máy...`);

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
