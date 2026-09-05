import React from 'react';
import doiThongTinLogoImg from '../assets/images/doi_thong_tin_logo_1788449249724.jpg';
import { 
  EquipmentData, 
  ComponentRow, 
  DocRow, 
  MaintenanceRow, 
  RepairRow, 
  OrgTransferRow,
  SimpleLicenseRow
} from '../types';

interface EquipmentLogbookPrintPagesProps {
  equipment: EquipmentData;
  coverQrUrl?: string;
  itemsPerPageMaint?: number;
  keyPrefix?: string;
  paperSize?: 'A4' | 'A5';
}

export const EquipmentLogbookPrintPages: React.FC<EquipmentLogbookPrintPagesProps> = ({
  equipment,
  coverQrUrl,
  itemsPerPageMaint = 7,
  keyPrefix = 'logbook',
  paperSize = 'A4'
}) => {
  const isA5 = paperSize === 'A5';
  const g = equipment.general || ({} as any);
  const s = equipment.spec || ({} as any);
  const org = equipment.org || ({} as any);

  // Company Name
  const companyName = org.companyName || (typeof window !== 'undefined' ? localStorage.getItem('cns_default_company_name') || '' : '') || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM';
  const coverNote = org.coverNote || '';

  // Prepare Licenses for dual table on Page 3
  const freqList: SimpleLicenseRow[] = (equipment.freqLicenses && equipment.freqLicenses.length > 0) 
    ? equipment.freqLicenses 
    : (equipment.licenses || []).filter(l => l.startNo.includes('/GP') || l.content.toLowerCase().includes('tần số')).map(l => ({
        id: l.id,
        no: l.startNo,
        expiryDate: l.endDate
      }));

  const exploitList: SimpleLicenseRow[] = (equipment.exploitLicenses && equipment.exploitLicenses.length > 0) 
    ? equipment.exploitLicenses 
    : (equipment.licenses || []).filter(l => l.startNo.includes('/GP-CHK') || l.content.toLowerCase().includes('khai thác') || !l.startNo.includes('/GP')).map(l => ({
        id: l.id,
        no: l.startNo,
        expiryDate: l.endDate
      }));

  const maxLicRows = isA5 
    ? Math.max(4, Math.max(freqList.length, exploitList.length)) 
    : Math.max(8, Math.max(freqList.length, exploitList.length));
  const paddedFreq = Array.from({ length: maxLicRows }, (_, i) => freqList[i] || null);
  const paddedExploit = Array.from({ length: maxLicRows }, (_, i) => exploitList[i] || null);

  // Maintenance chunking per page: 4 rows for A5, default 7 for A4
  const effectiveItemsPerPageMaint = isA5 ? Math.min(itemsPerPageMaint, 4) : itemsPerPageMaint;

  // Chunk maintenance into pages (default 7 records per page like scanned book, 4 for A5)
  const chunkArray = <T extends unknown>(arr: T[], size: number): T[][] => {
    if (!arr || arr.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const maintPages = chunkArray<MaintenanceRow>(equipment.maintenance || [], effectiveItemsPerPageMaint);

  // Helper for empty rows in print
  function padList<T>(arr: T[] | undefined, minLength: number): (T | null)[] {
    const list = arr || [];
    if (list.length >= minLength) return list;
    return [...list, ...Array.from({ length: minLength - list.length }, () => null)];
  }

  return (
    <div className={`equipment-logbook-container space-y-8 print:space-y-0 ${isA5 ? 'a5-logbook' : 'a4-logbook'}`} key={keyPrefix} data-paper-size={paperSize}>
      <style>{`
        .page-sheet {
          width: ${isA5 ? '148mm' : '210mm'};
          min-height: ${isA5 ? '210mm' : '297mm'};
          height: ${isA5 ? '210mm' : '297mm'};
          margin: 0 auto;
          background: #ffffff;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: "Times New Roman", Times, "Liberation Serif", serif;
          color: #000000;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #000000;
          font-size: ${isA5 ? '8.5pt' : '11pt'};
          background: #ffffff;
        }
        .pdf-table th, .pdf-table td {
          border: 1px solid #000000;
          padding: ${isA5 ? '3px 4px' : '6px 8px'};
          vertical-align: middle;
          color: #000000;
        }
        .pdf-table th {
          background-color: #f8fafc;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .page-num {
          text-align: center;
          font-size: ${isA5 ? '9.5pt' : '12pt'};
          margin-top: auto;
          padding-top: ${isA5 ? '2mm' : '6mm'};
          font-weight: normal;
          color: #000000;
        }
        @media print {
          @page {
            size: ${isA5 ? 'A5 portrait' : 'A4 portrait'};
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-sheet {
            width: ${isA5 ? '148mm' : '210mm'} !important;
            height: ${isA5 ? '210mm' : '297mm'} !important;
            min-height: ${isA5 ? '210mm' : '297mm'} !important;
            padding: ${isA5 ? '6mm 8mm 6mm 10mm' : '12mm 15mm 12mm 18mm'} !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .page-sheet:last-child {
            page-break-after: auto !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* TRANG 1: BÌA SỔ LÝ LỊCH (EXACT SCAN PAGE 1) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-1`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 relative flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '12mm 15mm 12mm 18mm' 
        }}
      >
        {/* Double Frame Border */}
        <div 
          className="h-full flex flex-col justify-between"
          style={{
            border: '3px double #000',
            padding: isA5 ? '8mm 6mm 6mm' : '14mm 12mm 12mm',
            minHeight: isA5 ? '196mm' : '272mm'
          }}
        >
          {/* Top Unit / Company & Official Logo */}
          <div>
            <div className="flex flex-col items-center justify-center gap-1">
              <img 
                src={doiThongTinLogoImg} 
                alt="Logo Đội Thông Tin - TT BĐKT" 
                referrerPolicy="no-referrer"
                className={`${isA5 ? 'w-12 h-12 mb-0.5' : 'w-16 h-16 mb-1'} rounded-full object-cover border-2 border-black/80 shadow-xs`}
              />
              <div className="w-full text-center">
                <h1 
                  className="font-bold uppercase tracking-wider text-black"
                  style={{ fontSize: isA5 ? '11.5pt' : '15pt', lineHeight: 1.3 }}
                >
                  {companyName}
                </h1>
                <div 
                  className="font-bold uppercase tracking-widest text-gray-800 mt-0.5"
                  style={{ fontSize: isA5 ? '7pt' : '8pt' }}
                >
                  TRUNG TÂM BẢO ĐẢM KỸ THUẬT &bull; ĐỘI THÔNG TIN
                </div>
              </div>
              {coverNote && (
                <div 
                  className="absolute right-6 top-6 text-right font-semibold text-black opacity-80"
                  style={{ fontSize: isA5 ? '7pt' : '8pt' }}
                >
                  {coverNote}
                </div>
              )}
            </div>
          </div>

          {/* Middle Main Title */}
          <div className={`text-center my-auto ${isA5 ? 'space-y-4' : 'space-y-8'}`}>
            <div 
              className="font-bold uppercase tracking-widest text-black"
              style={{ fontSize: isA5 ? '19pt' : '28pt', letterSpacing: isA5 ? '1.5px' : '3px' }}
            >
              LÝ LỊCH THIẾT BỊ
            </div>

            {/* Dotted separator line */}
            <div className={`w-3/4 mx-auto border-b border-dotted border-black ${isA5 ? 'pt-2' : 'pt-4'}`}></div>

            {/* Fillable Metadata Fields with dotted lines matching the scan */}
            <div 
              className={`w-4/5 mx-auto text-left ${isA5 ? 'space-y-2 pt-2' : 'space-y-4 pt-4'}`}
              style={{ fontSize: isA5 ? '9.5pt' : '13pt' }}
            >
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1 truncate">
                  {g.name || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1 truncate">
                  {g.manufacturer || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Số hiệu:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1 truncate">
                  {g.model || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Mã số:</span>
                <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1 truncate">
                  {g.serial || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Mã TS:</span>
                <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1 truncate">
                  {g.assetNo || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Number Box & QR Code */}
          <div className={`flex items-end justify-between ${isA5 ? 'px-3 pb-1 pt-2' : 'px-6 pb-2 pt-4'}`}>
            <div className="text-left">
              {coverQrUrl ? (
                <div className={`flex items-center ${isA5 ? 'gap-2' : 'gap-3'}`}>
                  <img 
                    src={coverQrUrl} 
                    alt="Passport QR" 
                    className={`${isA5 ? 'w-14 h-14' : 'w-20 h-20'} border border-black p-0.5 object-contain`}
                  />
                  <div className="leading-tight text-black" style={{ fontSize: isA5 ? '7.5pt' : '9pt' }}>
                    <div className="font-bold uppercase tracking-tight">MÃ QR ĐỊNH DANH</div>
                    <div className="text-gray-700" style={{ fontSize: isA5 ? '6.5pt' : '8pt' }}>Quét tra cứu lý lịch</div>
                    <div className="font-mono font-semibold mt-0.5" style={{ fontSize: isA5 ? '6.5pt' : '8pt' }}>ID: {equipment.id}</div>
                  </div>
                </div>
              ) : (
                <div className={`${isA5 ? 'w-14 h-14 text-[7pt]' : 'w-20 h-20 text-[8pt]'} border border-dashed border-gray-400 flex items-center justify-center`}>
                  QR Code
                </div>
              )}
            </div>

            <div 
              className={`border border-black ${isA5 ? 'px-3 py-1.5' : 'px-6 py-2'} text-center`}
              style={{ minWidth: isA5 ? '100px' : '150px' }}
            >
              <span className={`font-semibold ${isA5 ? 'text-xs' : 'text-sm'}`}>Số: </span>
              <span className={`font-bold font-mono ${isA5 ? 'text-xs' : 'text-sm'}`}>{g.assetNo || g.serial || '....................'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ (EXACT SCAN PAGE 2) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-2`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          {/* Top Table of Contents */}
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-8'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt', marginBottom: isA5 ? '8px' : '24px' }}>
              MỤC LỤC
            </h2>

            <div className="space-y-1.5 text-left font-bold text-black" style={{ fontSize: isA5 ? '9pt' : '11.5pt', lineHeight: isA5 ? 1.5 : 1.8 }}>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>1. Cơ quan, đơn vị quản lý</span>
                <span className="font-mono">2</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>2. Sơ lược thiết bị</span>
                <span className="font-mono">3</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-3">
                <span>2.1. Đặc tính kỹ thuật</span>
                <span className="font-mono">4</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-3">
                <span>2.2. Thành phần thiết bị</span>
                <span className="font-mono">5</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-3">
                <span>2.3. Tài liệu kỹ thuật kèm theo</span>
                <span className="font-mono">6</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>3. Bảo dưỡng</span>
                <span className="font-mono">7</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>4. Kiểm tra - Sửa chữa - Thay thế - Thay đổi</span>
                <span className="font-mono">{7 + maintPages.length}</span>
              </div>
            </div>
          </div>

          <div className={`border-t-2 border-black ${isA5 ? 'my-2.5' : 'my-6'}`}></div>

          {/* Bottom Section: 1- Cơ quan, đơn vị quản lý */}
          <div>
            <h3 className={`text-center font-bold uppercase tracking-wide text-black ${isA5 ? 'mb-2' : 'mb-4'}`} style={{ fontSize: isA5 ? '10.5pt' : '13pt' }}>
              1 - CƠ QUAN, ĐƠN VỊ QUẢN LÝ
            </h3>

            {/* Table matching Page 2 in PDF */}
            <table className="pdf-table w-full border-collapse border border-black text-black">
              <thead>
                <tr className="bg-slate-50">
                  <th style={{ width: '8%', border: '1px solid #000', padding: isA5 ? '4px 2px' : '8px 4px' }}>TT</th>
                  <th style={{ width: '22%', border: '1px solid #000', padding: isA5 ? '4px 2px' : '8px 4px' }}>NGÀY THÁNG NĂM</th>
                  <th style={{ width: '42%', border: '1px solid #000', padding: isA5 ? '4px 4px' : '8px 6px' }}>CƠ QUAN, ĐƠN VỊ QUẢN LÝ</th>
                  <th style={{ width: '28%', border: '1px solid #000', padding: isA5 ? '4px 4px' : '8px 6px' }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {padList<OrgTransferRow>(equipment.orgRows || [
                  {
                    id: '1',
                    date: g.commissioned || '01/01/2018',
                    unit: `${companyName} - ${org.unit || 'Đội Thiết Bị Thông Tin'}`,
                    status: g.status || 'Đang khai thác'
                  }
                ], isA5 ? 4 : 6).map((row, i) => (
                  <tr key={i} style={{ height: isA5 ? '24px' : '36px' }}>
                    <td className="text-center font-bold" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '6px 4px' }}>
                      {row ? (i + 1 < 10 ? `0${i + 1}` : i + 1) : '\u00A0'}
                    </td>
                    <td className="text-center" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '6px 4px' }}>
                      {row ? row.date : '\u00A0'}
                    </td>
                    <td className="font-semibold" style={{ border: '1px solid #000', padding: isA5 ? '2px 4px' : '6px 8px' }}>
                      {row ? row.unit : '\u00A0'}
                    </td>
                    <td className="text-center" style={{ border: '1px solid #000', padding: isA5 ? '2px 4px' : '6px 8px' }}>
                      {row ? row.status : '\u00A0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Page Number 2 */}
        <div className="page-num">2</div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 3: 2 - SƠ LƯỢC THIẾT BỊ (EXACT SCAN PAGE 3) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-3`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt' }}>
              2 - SƠ LƯỢC THIẾT BỊ
            </h2>
          </div>

          {/* General Info Lines with Dotted Underlines */}
          <div className={`text-black ${isA5 ? 'space-y-1.5 mb-3' : 'space-y-3.5 mb-6'}`} style={{ fontSize: isA5 ? '9pt' : '12pt', lineHeight: isA5 ? 1.4 : 1.8 }}>
            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.name || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.manufacturer || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Ký hiệu (Model):</span>
              <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.model || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Mã số (S/N):</span>
              <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.serial || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Năm sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.yearMade || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Nước sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.origin || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Thời gian sử dụng:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.commissioned ? `Sử dụng từ ${g.commissioned}` : ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Thời gian bảo hành:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5 truncate">
                {g.warrantyDate || ''}
              </span>
            </div>
          </div>

          {/* Dual License Table (Frequency + Exploitation) */}
          <table className={`pdf-table w-full border-collapse border border-black text-black ${isA5 ? 'mt-2' : 'mt-4'}`}>
            <thead>
              <tr>
                <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '6px' }}>
                  Giấy phép sử dụng tần số<br />và thiết bị VTĐ
                </th>
                <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '6px' }}>
                  Giấy phép khai thác<br />hệ thống kỹ thuật, thiết bị
                </th>
              </tr>
              <tr className="bg-slate-50" style={{ fontSize: isA5 ? '7pt' : '8pt' }}>
                <th style={{ width: '26%', border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>Số</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>Ngày hết hạn</th>
                <th style={{ width: '26%', border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>Số</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>Ngày hết hạn</th>
              </tr>
            </thead>
            <tbody>
              {paddedFreq.map((freqItem, i) => {
                const expItem = paddedExploit[i];
                return (
                  <tr key={i} style={{ height: isA5 ? '20px' : '30px' }}>
                    <td className="font-mono font-semibold text-center" style={{ fontSize: isA5 ? '7pt' : '8.5pt', border: '1px solid #000', padding: isA5 ? '2px' : '4px 6px' }}>
                      {freqItem ? freqItem.no : '\u00A0'}
                    </td>
                    <td className="font-mono text-center" style={{ fontSize: isA5 ? '7pt' : '8.5pt', border: '1px solid #000', padding: isA5 ? '2px' : '4px 6px' }}>
                      {freqItem ? freqItem.expiryDate : '\u00A0'}
                    </td>
                    <td className="font-mono font-semibold text-center" style={{ fontSize: isA5 ? '7pt' : '8.5pt', border: '1px solid #000', padding: isA5 ? '2px' : '4px 6px' }}>
                      {expItem ? expItem.no : '\u00A0'}
                    </td>
                    <td className="font-mono text-center" style={{ fontSize: isA5 ? '7pt' : '8.5pt', border: '1px solid #000', padding: isA5 ? '2px' : '4px 6px' }}>
                      {expItem ? expItem.expiryDate : '\u00A0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Page Number 3 */}
        <div className="page-num">3</div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 4: 2.1 - ĐẶC TÍNH KỸ THUẬT (EXACT SCAN PAGE 4) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-4`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt' }}>
              2.1 - ĐẶC TÍNH KỸ THUẬT
            </h2>
          </div>

          {/* Ruled / Lined Notebook Sheet for Technical Specifications */}
          <div 
            className="w-full space-y-0 text-black leading-relaxed"
            style={{ fontSize: isA5 ? '9pt' : '12pt', lineHeight: isA5 ? '22px' : '30px' }}
          >
            {s.text && (
              <div className="border-b border-dotted border-black pb-0.5 font-medium">
                {s.text}
              </div>
            )}

            {/* Extra spec lines if available */}
            {s.power && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Nguồn điện cấp: <b>{s.power}</b>
              </div>
            )}
            {s.output && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Công suất phát danh định: <b>{s.output}</b>
              </div>
            )}
            {s.range && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Dải tần số công tác: <b>{s.range}</b>
              </div>
            )}
            {s.channelFreq && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Kênh tần số làm việc: <b>{s.channelFreq}</b>
              </div>
            )}
            {s.interface && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Giao diện kết nối & điều chế: <b>{s.interface}</b>
              </div>
            )}
            {s.mgmtIp && (
              <div className="border-b border-dotted border-black pb-0.5">
                - Địa chỉ IP & Cấu hình mạng: <b>{s.mgmtIp}</b> (Subnet: {s.subnetMask || '255.255.255.0'}, VLAN: {s.vlanId || 'Default'})
              </div>
            )}

            {/* Pad with ruled dotted lines to fill the whole page */}
            {Array.from({ length: isA5 ? 9 : 18 }).map((_, idx) => (
              <div key={idx} className={`border-b border-dotted border-black ${isA5 ? 'min-h-[22px]' : 'min-h-[30px]'}`}>&nbsp;</div>
            ))}
          </div>
        </div>

        {/* Footer Page Number 4 */}
        <div className="page-num">4</div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 5: 2.2 - THÀNH PHẦN THIẾT BỊ (EXACT SCAN PAGE 5) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-5`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt' }}>
              2.2 - THÀNH PHẦN THIẾT BỊ
            </h2>
          </div>

          {/* Table matching Page 5 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '8%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>TT</th>
                <th style={{ width: '48%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>TÊN THIẾT BỊ</th>
                <th style={{ width: '12%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>ĐVT</th>
                <th style={{ width: '12%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>SL</th>
                <th style={{ width: '20%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {padList<ComponentRow>(equipment.components, isA5 ? 10 : 20).map((comp, i) => (
                <tr key={i} style={{ height: isA5 ? '20px' : '30px' }}>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>
                    {comp ? (comp.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                  </td>
                  <td className="font-semibold truncate" style={{ border: '1px solid #000', padding: isA5 ? '2px 4px' : '4px 8px' }}>
                    {comp ? comp.name : '\u00A0'}
                  </td>
                  <td className="text-center" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>
                    {comp ? comp.unit : '\u00A0'}
                  </td>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>
                    {comp ? comp.qty : '\u00A0'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: isA5 ? '2px 3px' : '4px 6px' }}>
                    {comp ? comp.note : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Page Number 5 */}
        <div className="page-num">5</div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 6: 2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO (EXACT SCAN PAGE 6) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-6`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt' }}>
              2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO
            </h2>
          </div>

          {/* Table matching Page 6 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '8%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>TT</th>
                <th style={{ width: '54%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>TÊN TÀI LIỆU</th>
                <th style={{ width: '14%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>SL</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {padList<DocRow>(equipment.docs, isA5 ? 10 : 20).map((doc, i) => (
                <tr key={i} style={{ height: isA5 ? '20px' : '30px' }}>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>
                    {doc ? (doc.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                  </td>
                  <td className="font-semibold truncate" style={{ border: '1px solid #000', padding: isA5 ? '2px 4px' : '4px 8px' }}>
                    {doc ? doc.name : '\u00A0'}
                  </td>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: isA5 ? '2px' : '4px' }}>
                    {doc ? doc.qty : '\u00A0'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: isA5 ? '2px 3px' : '4px 6px' }}>
                    {doc ? (doc.note || doc.location) : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Page Number 6 */}
        <div className="page-num">6</div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 7, 8, 9...: 3 - BẢO DƯỠNG (EXACT SCAN PAGES 7, 8, 9) */}
      {/* ========================================================================= */}
      {maintPages.map((pageRows, pageIdx) => {
        const paddedMaint = padList<MaintenanceRow>(pageRows, effectiveItemsPerPageMaint);
        const pageNum = 7 + pageIdx;

        return (
          <div 
            key={`${keyPrefix}-maint-page-${pageIdx}`}
            className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
            data-paper-size={paperSize}
            style={{ 
              width: isA5 ? '148mm' : '210mm', 
              minHeight: isA5 ? '210mm' : '297mm', 
              height: isA5 ? '210mm' : '297mm',
              padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
            }}
          >
            <div>
              <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
                <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11.5pt' : '14pt' }}>
                  3 - BẢO DƯỠNG
                </h2>
              </div>

              {/* Table matching Page 7, 8, 9 in PDF */}
              <table className="pdf-table w-full border-collapse border border-black text-black">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '20%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>
                      THỜI GIAN
                    </th>
                    <th style={{ width: '56%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>
                      KẾT LUẬN KẾT QUẢ BẢO DƯỠNG
                    </th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>
                      NGƯỜI THỰC HIỆN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paddedMaint.map((mt, i) => (
                    <tr key={i} style={{ height: isA5 ? '36px' : '70px' }}>
                      <td 
                        className="text-center font-bold align-middle" 
                        style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 3px' : '6px 4px' }}
                      >
                        {mt ? mt.date : '\u00A0'}
                      </td>
                      <td 
                        className="align-middle leading-relaxed" 
                        style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 4px' : '6px 8px', whiteSpace: 'pre-line' }}
                      >
                        {mt ? mt.content : '\u00A0'}
                      </td>
                      <td 
                        className="text-center font-semibold align-middle" 
                        style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 3px' : '6px 4px' }}
                      >
                        {mt ? mt.person : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Page Number 7, 8, 9... */}
            <div className="page-num">{pageNum}</div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* TRANG CUỐI: 4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI (EXACT SCAN PAGE 10) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-repair-page`}
        className={`page-sheet ${isA5 ? 'a5-sheet' : ''} bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between`}
        data-paper-size={paperSize}
        style={{ 
          width: isA5 ? '148mm' : '210mm', 
          minHeight: isA5 ? '210mm' : '297mm', 
          height: isA5 ? '210mm' : '297mm',
          padding: isA5 ? '6mm 8mm 6mm 10mm' : '14mm 15mm 12mm 18mm' 
        }}
      >
        <div>
          <div className={`text-center ${isA5 ? 'mb-3' : 'mb-6'}`}>
            <h2 className="font-bold uppercase tracking-wider text-black" style={{ fontSize: isA5 ? '11pt' : '13.5pt' }}>
              4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI
            </h2>
          </div>

          {/* Table matching Page 10 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '20%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>
                  THỜI GIAN
                </th>
                <th style={{ width: '56%', border: '1px solid #000', padding: isA5 ? '3px 4px' : '8px 6px' }}>
                  NỘI DUNG THỰC HIỆN
                </th>
                <th style={{ width: '24%', border: '1px solid #000', padding: isA5 ? '3px 2px' : '8px 4px' }}>
                  NGƯỜI THỰC HIỆN
                </th>
              </tr>
            </thead>
            <tbody>
              {padList<RepairRow>(equipment.repair, isA5 ? 6 : 12).map((rp, i) => (
                <tr key={i} style={{ height: isA5 ? '28px' : '45px' }}>
                  <td 
                    className="text-center font-bold align-middle" 
                    style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 3px' : '6px 4px' }}
                  >
                    {rp ? rp.date : '\u00A0'}
                  </td>
                  <td 
                    className="align-middle leading-relaxed" 
                    style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 4px' : '6px 8px' }}
                  >
                    {rp ? (
                      <div>
                        <div className="font-semibold">{rp.incidentDescription || rp.actionTaken}</div>
                        {rp.actionTaken && rp.actionTaken !== rp.incidentDescription && (
                          <div className="text-slate-700 mt-0.5">{rp.actionTaken}</div>
                        )}
                      </div>
                    ) : '\u00A0'}
                  </td>
                  <td 
                    className="text-center font-semibold align-middle" 
                    style={{ fontSize: isA5 ? '7.5pt' : '9pt', border: '1px solid #000', padding: isA5 ? '2px 3px' : '6px 4px' }}
                  >
                    {rp ? rp.person : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Page Number 8 or next */}
        <div className="page-num">{7 + maintPages.length}</div>
      </div>
    </div>
  );
};
