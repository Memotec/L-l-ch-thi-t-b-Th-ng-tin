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
}

export const EquipmentLogbookPrintPages: React.FC<EquipmentLogbookPrintPagesProps> = ({
  equipment,
  coverQrUrl,
  itemsPerPageMaint = 7,
  keyPrefix = 'logbook'
}) => {
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

  const maxLicRows = Math.max(8, Math.max(freqList.length, exploitList.length));
  const paddedFreq = Array.from({ length: maxLicRows }, (_, i) => freqList[i] || null);
  const paddedExploit = Array.from({ length: maxLicRows }, (_, i) => exploitList[i] || null);

  // Chunk maintenance into pages (default 7 records per page like scanned book)
  const chunkArray = <T extends unknown>(arr: T[], size: number): T[][] => {
    if (!arr || arr.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const maintPages = chunkArray<MaintenanceRow>(equipment.maintenance || [], itemsPerPageMaint);

  // Helper for empty rows in print
  function padList<T>(arr: T[] | undefined, minLength: number): (T | null)[] {
    const list = arr || [];
    if (list.length >= minLength) return list;
    return [...list, ...Array.from({ length: minLength - list.length }, () => null)];
  }

  return (
    <div className="equipment-logbook-container space-y-8 print:space-y-0" key={keyPrefix}>
      {/* ========================================================================= */}
      {/* TRANG 1: BÌA SỔ LÝ LỊCH (EXACT SCAN PAGE 1) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-1`}
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 relative flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '12mm 15mm 12mm 18mm' }}
      >
        {/* Double Frame Border */}
        <div 
          className="h-full flex flex-col justify-between"
          style={{
            border: '3px double #000',
            padding: '14mm 12mm 12mm',
            minHeight: '272mm'
          }}
        >
          {/* Top Unit / Company & Official Logo */}
          <div>
            <div className="flex flex-col items-center justify-center gap-2">
              <img 
                src={doiThongTinLogoImg} 
                alt="Logo Đội Thông Tin - TT BĐKT" 
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-black/80 shadow-xs mb-1"
              />
              <div className="w-full text-center">
                <h1 
                  className="text-xl font-bold uppercase tracking-wider text-black"
                  style={{ fontSize: '15pt', lineHeight: 1.4 }}
                >
                  {companyName}
                </h1>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-800 mt-0.5">
                  TRUNG TÂM BẢO ĐẢM KỸ THUẬT &bull; ĐỘI THÔNG TIN
                </div>
              </div>
              {coverNote && (
                <div className="absolute right-8 top-8 text-right font-semibold text-xs text-black opacity-80">
                  {coverNote}
                </div>
              )}
            </div>
          </div>

          {/* Middle Main Title */}
          <div className="text-center my-auto space-y-8">
            <div 
              className="font-bold uppercase tracking-widest text-black"
              style={{ fontSize: '28pt', letterSpacing: '3px' }}
            >
              LÝ LỊCH THIẾT BỊ
            </div>

            {/* Dotted separator line */}
            <div className="w-3/4 mx-auto border-b border-dotted border-black pt-4"></div>

            {/* Fillable Metadata Fields with dotted lines matching the scan */}
            <div className="w-4/5 mx-auto text-left space-y-4 pt-4 text-base" style={{ fontSize: '13pt' }}>
              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                  {g.name || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                  {g.manufacturer || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Số hiệu:</span>
                <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                  {g.model || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Mã số:</span>
                <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                  {g.serial || ''}
                </span>
              </div>

              <div className="flex items-baseline">
                <span className="font-semibold whitespace-nowrap">Mã TS:</span>
                <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pb-0.5 pl-1">
                  {g.assetNo || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Number Box & QR Code */}
          <div className="flex items-end justify-between px-6 pb-2 pt-4">
            <div className="text-left">
              {coverQrUrl ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={coverQrUrl} 
                    alt="Passport QR" 
                    className="w-20 h-20 border border-black p-0.5 object-contain"
                  />
                  <div className="text-[9pt] leading-tight text-black">
                    <div className="font-bold uppercase tracking-tight">MÃ QR ĐỊNH DANH</div>
                    <div className="text-[8pt] text-gray-700">Quét để tra cứu nhật ký</div>
                    <div className="font-mono text-[8pt] font-semibold mt-0.5">ID: {equipment.id}</div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 border border-dashed border-gray-400 flex items-center justify-center text-[8pt]">
                  QR Code
                </div>
              )}
            </div>

            <div 
              className="border border-black px-6 py-2 text-center"
              style={{ minWidth: '150px' }}
            >
              <span className="font-semibold text-sm">Số: </span>
              <span className="font-bold text-sm font-mono">{g.assetNo || g.serial || '....................'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANG 2: MỤC LỤC & 1- CƠ QUAN, ĐƠN VỊ QUẢN LÝ (EXACT SCAN PAGE 2) */}
      {/* ========================================================================= */}
      <div 
        key={`${keyPrefix}-page-2`}
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          {/* Top Table of Contents */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-6" style={{ fontSize: '14pt' }}>
              MỤC LỤC
            </h2>

            <div className="space-y-2 text-left font-bold text-black" style={{ fontSize: '11.5pt', lineHeight: 1.8 }}>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>1. Cơ quan, đơn vị quản lý</span>
                <span className="font-mono">2</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5">
                <span>2. Sơ lược thiết bị</span>
                <span className="font-mono">3</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
                <span>2.1. Đặc tính kỹ thuật</span>
                <span className="font-mono">4</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
                <span>2.2. Thành phần thiết bị</span>
                <span className="font-mono">5</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dotted border-slate-400 pb-0.5 pl-4">
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

          <div className="border-t-2 border-black my-6"></div>

          {/* Bottom Section: 1- Cơ quan, đơn vị quản lý */}
          <div>
            <h3 className="text-center font-bold uppercase tracking-wide text-black mb-4" style={{ fontSize: '13pt' }}>
              1 - CƠ QUAN, ĐƠN VỊ QUẢN LÝ
            </h3>

            {/* Table matching Page 2 in PDF */}
            <table className="pdf-table w-full border-collapse border border-black text-black">
              <thead>
                <tr className="bg-slate-50">
                  <th style={{ width: '8%', border: '1px solid #000', padding: '8px 4px' }}>TT</th>
                  <th style={{ width: '22%', border: '1px solid #000', padding: '8px 4px' }}>NGÀY THÁNG NĂM</th>
                  <th style={{ width: '42%', border: '1px solid #000', padding: '8px 6px' }}>CƠ QUAN, ĐƠN VỊ QUẢN LÝ</th>
                  <th style={{ width: '28%', border: '1px solid #000', padding: '8px 6px' }}>TRẠNG THÁI</th>
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
                ], 6).map((row, i) => (
                  <tr key={i} style={{ height: '36px' }}>
                    <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '6px 4px' }}>
                      {row ? (i + 1 < 10 ? `0${i + 1}` : i + 1) : '\u00A0'}
                    </td>
                    <td className="text-center" style={{ border: '1px solid #000', padding: '6px 4px' }}>
                      {row ? row.date : '\u00A0'}
                    </td>
                    <td className="font-semibold" style={{ border: '1px solid #000', padding: '6px 8px' }}>
                      {row ? row.unit : '\u00A0'}
                    </td>
                    <td className="text-center" style={{ border: '1px solid #000', padding: '6px 8px' }}>
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
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
              2 - SƠ LƯỢC THIẾT BỊ
            </h2>
          </div>

          {/* General Info Lines with Dotted Underlines */}
          <div className="space-y-3.5 text-black mb-6" style={{ fontSize: '12pt', lineHeight: 1.8 }}>
            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Tên thiết bị:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.name || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Hãng sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.manufacturer || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Ký hiệu (Model):</span>
              <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.model || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Mã số (S/N):</span>
              <span className="ml-2 font-bold font-mono flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.serial || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Năm sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.yearMade || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Nước sản xuất:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.origin || ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Thời gian sử dụng:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.commissioned ? `Sử dụng từ ${g.commissioned}` : ''}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-semibold whitespace-nowrap">Thời gian bảo hành:</span>
              <span className="ml-2 font-bold flex-1 border-b border-dotted border-black pl-1 pb-0.5">
                {g.warrantyDate || ''}
              </span>
            </div>
          </div>

          {/* Dual License Table (Frequency + Exploitation) */}
          <table className="pdf-table w-full border-collapse border border-black text-black mt-4">
            <thead>
              <tr>
                <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: '6px' }}>
                  Giấy phép sử dụng tần số<br />và thiết bị VTĐ
                </th>
                <th colSpan={2} style={{ width: '50%', border: '1px solid #000', padding: '6px' }}>
                  Giấy phép khai thác<br />hệ thống kỹ thuật, thiết bị
                </th>
              </tr>
              <tr className="bg-slate-50 text-xs">
                <th style={{ width: '26%', border: '1px solid #000', padding: '4px' }}>Số</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: '4px' }}>Ngày hết hạn</th>
                <th style={{ width: '26%', border: '1px solid #000', padding: '4px' }}>Số</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: '4px' }}>Ngày hết hạn</th>
              </tr>
            </thead>
            <tbody>
              {paddedFreq.map((freqItem, i) => {
                const expItem = paddedExploit[i];
                return (
                  <tr key={i} style={{ height: '30px' }}>
                    <td className="font-mono font-semibold text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                      {freqItem ? freqItem.no : '\u00A0'}
                    </td>
                    <td className="font-mono text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                      {freqItem ? freqItem.expiryDate : '\u00A0'}
                    </td>
                    <td className="font-mono font-semibold text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
                      {expItem ? expItem.no : '\u00A0'}
                    </td>
                    <td className="font-mono text-center text-xs" style={{ border: '1px solid #000', padding: '4px 6px' }}>
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
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
              2.1 - ĐẶC TÍNH KỸ THUẬT
            </h2>
          </div>

          {/* Ruled / Lined Notebook Sheet for Technical Specifications */}
          <div 
            className="w-full space-y-0 text-black leading-relaxed"
            style={{ fontSize: '12pt', lineHeight: '30px' }}
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
            {Array.from({ length: 18 }).map((_, idx) => (
              <div key={idx} className="border-b border-dotted border-black min-h-[30px]">&nbsp;</div>
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
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
              2.2 - THÀNH PHẦN THIẾT BỊ
            </h2>
          </div>

          {/* Table matching Page 5 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '8%', border: '1px solid #000', padding: '8px 4px' }}>TT</th>
                <th style={{ width: '48%', border: '1px solid #000', padding: '8px 6px' }}>TÊN THIẾT BỊ</th>
                <th style={{ width: '12%', border: '1px solid #000', padding: '8px 4px' }}>ĐVT</th>
                <th style={{ width: '12%', border: '1px solid #000', padding: '8px 4px' }}>SL</th>
                <th style={{ width: '20%', border: '1px solid #000', padding: '8px 6px' }}>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {padList<ComponentRow>(equipment.components, 20).map((comp, i) => (
                <tr key={i} style={{ height: '30px' }}>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                    {comp ? (comp.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                  </td>
                  <td className="font-semibold" style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {comp ? comp.name : '\u00A0'}
                  </td>
                  <td className="text-center" style={{ border: '1px solid #000', padding: '4px' }}>
                    {comp ? comp.unit : '\u00A0'}
                  </td>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                    {comp ? comp.qty : '\u00A0'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
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
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
              2.3 - TÀI LIỆU KỸ THUẬT KÈM THEO
            </h2>
          </div>

          {/* Table matching Page 6 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '8%', border: '1px solid #000', padding: '8px 4px' }}>TT</th>
                <th style={{ width: '54%', border: '1px solid #000', padding: '8px 6px' }}>TÊN TÀI LIỆU</th>
                <th style={{ width: '14%', border: '1px solid #000', padding: '8px 4px' }}>SL</th>
                <th style={{ width: '24%', border: '1px solid #000', padding: '8px 6px' }}>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {padList<DocRow>(equipment.docs, 20).map((doc, i) => (
                <tr key={i} style={{ height: '30px' }}>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                    {doc ? (doc.no || (i + 1 < 10 ? `0${i + 1}` : i + 1)) : '\u00A0'}
                  </td>
                  <td className="font-semibold" style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {doc ? doc.name : '\u00A0'}
                  </td>
                  <td className="text-center font-bold" style={{ border: '1px solid #000', padding: '4px' }}>
                    {doc ? doc.qty : '\u00A0'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px' }}>
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
        const paddedMaint = padList<MaintenanceRow>(pageRows, itemsPerPageMaint);
        const pageNum = 7 + pageIdx;

        return (
          <div 
            key={`${keyPrefix}-maint-page-${pageIdx}`}
            className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
            style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
          >
            <div>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '14pt' }}>
                  3 - BẢO DƯỠNG
                </h2>
              </div>

              {/* Table matching Page 7, 8, 9 in PDF */}
              <table className="pdf-table w-full border-collapse border border-black text-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th style={{ width: '20%', border: '1px solid #000', padding: '8px 4px' }}>
                      THỜI GIAN
                    </th>
                    <th style={{ width: '56%', border: '1px solid #000', padding: '8px 6px' }}>
                      KẾT LUẬN KẾT QUẢ BẢO DƯỠNG
                    </th>
                    <th style={{ width: '24%', border: '1px solid #000', padding: '8px 4px' }}>
                      NGƯỜI THỰC HIỆN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paddedMaint.map((mt, i) => (
                    <tr key={i} style={{ height: '70px' }}>
                      <td 
                        className="text-center font-bold align-middle text-xs" 
                        style={{ border: '1px solid #000', padding: '6px 4px' }}
                      >
                        {mt ? mt.date : '\u00A0'}
                      </td>
                      <td 
                        className="align-middle text-xs leading-relaxed" 
                        style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'pre-line' }}
                      >
                        {mt ? mt.content : '\u00A0'}
                      </td>
                      <td 
                        className="text-center font-semibold align-middle text-xs" 
                        style={{ border: '1px solid #000', padding: '6px 4px' }}
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
        className="page-sheet bg-white mx-auto shadow-md border border-slate-300 flex flex-col justify-between"
        style={{ width: '210mm', minHeight: '297mm', padding: '14mm 15mm 12mm 18mm' }}
      >
        <div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black" style={{ fontSize: '13.5pt' }}>
              4 - KIỂM TRA - SỬA CHỮA - THAY THẾ - THAY ĐỔI
            </h2>
          </div>

          {/* Table matching Page 10 in PDF */}
          <table className="pdf-table w-full border-collapse border border-black text-black text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th style={{ width: '20%', border: '1px solid #000', padding: '8px 4px' }}>
                  THỜI GIAN
                </th>
                <th style={{ width: '56%', border: '1px solid #000', padding: '8px 6px' }}>
                  NỘI DUNG THỰC HIỆN
                </th>
                <th style={{ width: '24%', border: '1px solid #000', padding: '8px 4px' }}>
                  NGƯỜI THỰC HIỆN
                </th>
              </tr>
            </thead>
            <tbody>
              {padList<RepairRow>(equipment.repair, 12).map((rp, i) => (
                <tr key={i} style={{ height: '45px' }}>
                  <td 
                    className="text-center font-bold align-middle text-xs" 
                    style={{ border: '1px solid #000', padding: '6px 4px' }}
                  >
                    {rp ? rp.date : '\u00A0'}
                  </td>
                  <td 
                    className="align-middle text-xs leading-relaxed" 
                    style={{ border: '1px solid #000', padding: '6px 8px' }}
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
                    className="text-center font-semibold align-middle text-xs" 
                    style={{ border: '1px solid #000', padding: '6px 4px' }}
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
