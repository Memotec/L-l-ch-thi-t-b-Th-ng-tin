import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Check, 
  Copy,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { EquipmentData } from '../types';
import { generateEquipmentQrDataUrl, buildEquipmentQrData } from '../utils/qrCodeService';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentData;
  onShowToast: (msg: string) => void;
  onOpenGoogleDoc?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  equipment,
  onShowToast,
  onOpenGoogleDoc
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const docPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !equipment) return;
    let isMounted = true;
    generateEquipmentQrDataUrl(equipment, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
      targetMode: 'pdf'
    }).then(url => {
      if (isMounted) setQrUrl(url);
    });
    return () => { isMounted = false; };
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const { googleDocUrl, pdfViewerUrl } = buildEquipmentQrData(equipment);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPdfLink = () => {
    navigator.clipboard.writeText(pdfViewerUrl);
    setCopiedLink(true);
    onShowToast('✓ Đã sao chép liên kết xem trực tiếp PDF Sổ lý lịch!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPdfHtml = () => {
    if (!docPrintRef.current) return;
    const content = docPrintRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Sổ Lý Lịch Thiết Bị - ${equipment.general.name || equipment.id}</title>
<style>
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body { 
  margin: 0; 
  padding: 0; 
  font-family: "Times New Roman", Times, "Liberation Serif", serif; 
  color: #000; 
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page-sheet { 
  width: 210mm; 
  min-height: 297mm; 
  padding: 12mm 15mm 10mm 18mm; 
  margin: 0 auto; 
  page-break-after: always; 
  position: relative; 
  background: #fff; 
  display: flex;
  flex-direction: column;
}
.pdf-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 10pt; }
.pdf-table th, .pdf-table td { border: 1px solid #000; padding: 4px 6px; }
.pdf-table th { background: #f1f5f9; font-weight: bold; text-align: center; }
</style>
</head>
<body>
  ${content}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_Ly_Lich_${(equipment.general.name || equipment.id).replace(/\W/g, '_')}.html`;
    a.click();
    onShowToast('✓ Đã tải tệp tài liệu Sổ lý lịch (In PDF) thành công!');
  };

  const g = equipment.general || ({} as any);
  const o = equipment.org || ({} as any);
  const s = equipment.spec || ({} as any);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-[#091533] border-b border-[#182d5a] px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">File PDF Sổ Lý Lịch Thiết Bị</h3>
              <span className="px-2 py-0.5 bg-sky-600/30 text-sky-300 rounded text-[10px] font-bold border border-sky-400/40 uppercase">
                {g.category || 'VHF/UHF'}
              </span>
            </div>
            <p className="text-xs text-sky-200/70">
              {g.name} &bull; Model: <b>{g.model || 'N/A'}</b> &bull; Serial: <span className="font-mono text-sky-300">{g.serial || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom buttons */}
          <div className="hidden sm:flex items-center bg-[#060e24] rounded-xl border border-[#1e3c7a] p-1 text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 10, 60))}
              className="p-1.5 hover:bg-[#12224d] text-sky-200 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-sky-300">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 10, 150))}
              className="p-1.5 hover:bg-[#12224d] text-sky-200 rounded-lg transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyPdfLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#060e24] hover:bg-[#12224d] text-sky-200 border border-[#1e3c7a] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Sao chép link xem PDF"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span className="hidden md:inline">{copiedLink ? 'Đã sao chép' : 'Sao chép link PDF'}</span>
          </button>

          <a
            href={googleDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở Google Docs</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main PDF Viewport with zoom */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#040817]">
        <div 
          ref={docPrintRef}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out font-serif text-black space-y-8"
        >
          {/* TRANG 1: TRANG BÌA SỔ LÝ LỊCH */}
          <div className="w-[210mm] min-h-[297mm] h-[297mm] bg-white p-[12mm_15mm_10mm_18mm] shadow-2xl flex flex-col justify-between select-text border border-slate-200">
            <div className="border-[3px] border-double border-black h-full p-[10mm] flex flex-col justify-between text-center relative">
              {/* Header Cơ Quan */}
              <div className="space-y-1">
                <div className="font-bold text-[11pt] uppercase tracking-wider">
                  {o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}
                </div>
                <div className="font-bold text-[10pt] uppercase text-slate-700">
                  {o.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT'}
                </div>
                <div className="w-24 h-[1px] bg-black mx-auto mt-1"></div>
              </div>

              {/* Title Center */}
              <div className="my-auto space-y-4 py-8">
                <div className="text-[26pt] font-extrabold uppercase tracking-wide text-sky-950 font-serif leading-tight">
                  SỔ LÝ LỊCH THIẾT BỊ
                </div>
                <div className="text-[14pt] font-bold uppercase text-slate-800 tracking-wider">
                  HỆ THỐNG {g.category || 'VHF/UHF'}
                </div>
                <div className="w-36 h-[2px] bg-sky-900 mx-auto"></div>

                <div className="pt-4 max-w-md mx-auto space-y-1.5 text-[12pt]">
                  <div className="text-[13pt] font-bold text-black uppercase">
                    {g.name}
                  </div>
                  <div className="text-slate-800">
                    Ký hiệu (Model): <b>{g.model || 'N/A'}</b>
                  </div>
                  <div className="text-slate-800">
                    Số Serial: <span className="font-mono font-bold">{g.serial || 'N/A'}</span>
                  </div>
                  <div className="text-slate-800">
                    Mã tài sản: <span className="font-mono">{g.assetNo || '---'}</span>
                  </div>
                  <div className="text-slate-700 italic pt-1">
                    Vị trí lắp đặt: <b>{o.location || '---'}</b>
                  </div>
                </div>
              </div>

              {/* QR Code & Footer */}
              <div className="border-t border-slate-300 pt-4 flex items-center justify-between px-4">
                <div className="text-left text-[9pt] leading-relaxed text-slate-600 max-w-xs">
                  <div><b>Tra cứu điện tử:</b> Quét mã QR để truy cập trực tiếp file Google Docs và nhật ký bảo dưỡng thiết bị.</div>
                  <div className="mt-1 font-mono text-[8pt] text-slate-400">ID: {equipment.id}</div>
                </div>
                {qrUrl && (
                  <div className="text-center">
                    <img src={qrUrl} alt="QR" className="w-24 h-24 p-1 border border-black inline-block bg-white" />
                    <div className="text-[7.5pt] font-bold text-slate-700 mt-0.5 uppercase">Tem QR Nhận Diện</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TRANG 2: NỘI DUNG CHI TIẾT SỔ LÝ LỊCH */}
          <div className="w-[210mm] min-h-[297mm] bg-white p-[12mm_15mm_10mm_18mm] shadow-2xl flex flex-col justify-between select-text text-[10pt] leading-snug border border-slate-200">
            <div className="space-y-4">
              {/* Quốc hiệu */}
              <div className="flex justify-between items-start border-b border-black pb-2 text-[9.5pt]">
                <div className="text-center font-bold uppercase">
                  <div>{o.companyName || 'CÔNG TY QUẢN LÝ BAY MIỀN NAM'}</div>
                  <div className="text-[8.5pt] font-normal">{o.unit || 'TRUNG TÂM BẢO ĐẢM KỸ THUẬT'}</div>
                </div>
                <div className="text-center font-bold">
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="text-[8.5pt] font-normal">Độc lập - Tự do - Hạnh phúc</div>
                </div>
              </div>

              {/* Section I */}
              <div>
                <h4 className="font-bold text-[11pt] uppercase text-sky-950 mb-1 border-b border-slate-300 pb-0.5">
                  I. THÔNG TIN CHUNG VỀ THIẾT BỊ
                </h4>
                <table className="w-full border-collapse border border-black text-[9pt]">
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50 w-1/4">Tên thiết bị:</td>
                      <td className="border border-black p-1.5 font-semibold w-1/4">{g.name}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50 w-1/4">Chủng loại CNS:</td>
                      <td className="border border-black p-1.5 font-semibold w-1/4">{g.category}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Model / Ký hiệu:</td>
                      <td className="border border-black p-1.5 font-mono">{g.model || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Số Serial:</td>
                      <td className="border border-black p-1.5 font-mono font-bold">{g.serial || '---'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Hãng sản xuất:</td>
                      <td className="border border-black p-1.5">{g.manufacturer || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Nước sản xuất:</td>
                      <td className="border border-black p-1.5">{g.origin || '---'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Năm sản xuất:</td>
                      <td className="border border-black p-1.5">{g.yearMade || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Mã tài sản:</td>
                      <td className="border border-black p-1.5 font-mono">{g.assetNo || '---'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Đưa vào khai thác:</td>
                      <td className="border border-black p-1.5">{g.commissioned || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Trạng thái:</td>
                      <td className="border border-black p-1.5 font-bold">{g.status || '---'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Đài / Trạm quản lý:</td>
                      <td className="border border-black p-1.5">{o.unit || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Vị trí lắp đặt:</td>
                      <td className="border border-black p-1.5">{o.location || '---'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section II: Đặc tính kỹ thuật */}
              <div>
                <h4 className="font-bold text-[11pt] uppercase text-sky-950 mb-1 border-b border-slate-300 pb-0.5">
                  II. THÔNG SỐ ĐẶC TÍNH KỸ THUẬT
                </h4>
                <table className="w-full border-collapse border border-black text-[9pt]">
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50 w-1/4">Công suất phát:</td>
                      <td className="border border-black p-1.5 w-1/4">{s.power || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50 w-1/4">Tần số / Dải tần:</td>
                      <td className="border border-black p-1.5 w-1/4 font-mono font-bold">{s.channelFreq || s.range || '---'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Giao diện kết nối:</td>
                      <td className="border border-black p-1.5">{s.interface || '---'}</td>
                      <td className="border border-black p-1.5 font-bold bg-slate-50">Địa chỉ IP / Cấu hình:</td>
                      <td className="border border-black p-1.5 font-mono">{s.mgmtIp || '---'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section III: Thành phần linh kiện chính */}
              <div>
                <h4 className="font-bold text-[11pt] uppercase text-sky-950 mb-1 border-b border-slate-300 pb-0.5">
                  III. THÀNH PHẦN LINH KIỆN & KHỐI CHỨC NĂNG ({equipment.components?.length || 0})
                </h4>
                <table className="w-full border-collapse border border-black text-[8.5pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-1 w-8">TT</th>
                      <th className="border border-black p-1 text-left">Tên linh kiện / Khối chức năng</th>
                      <th className="border border-black p-1 w-24">Part Number</th>
                      <th className="border border-black p-1 w-24">Số Serial</th>
                      <th className="border border-black p-1 w-12">SL</th>
                      <th className="border border-black p-1 w-20">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(equipment.components || []).slice(0, 6).map((c, i) => (
                      <tr key={c.id || i}>
                        <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                        <td className="border border-black p-1 font-medium">{c.name}</td>
                        <td className="border border-black p-1 text-center font-mono">{c.partNo || '---'}</td>
                        <td className="border border-black p-1 text-center font-mono">{c.serial || '---'}</td>
                        <td className="border border-black p-1 text-center">{c.qty || 1}</td>
                        <td className="border border-black p-1 text-center font-semibold">{c.healthStatus || 'Tốt'}</td>
                      </tr>
                    ))}
                    {(equipment.components || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="border border-black p-2 text-center text-slate-500 italic">
                          Chưa ghi nhận linh kiện rời.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section IV: Lịch sử bảo dưỡng gần nhất */}
              <div>
                <h4 className="font-bold text-[11pt] uppercase text-sky-950 mb-1 border-b border-slate-300 pb-0.5">
                  IV. NHẬT KÝ BẢO DƯỠNG & SỬA CHỮA GẦN NHẤT
                </h4>
                <table className="w-full border-collapse border border-black text-[8.5pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-black p-1 w-24">Ngày thực hiện</th>
                      <th className="border border-black p-1 text-left">Nội dung công việc</th>
                      <th className="border border-black p-1 w-32">Kết quả đánh giá</th>
                      <th className="border border-black p-1 w-28">Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(equipment.maintenance || []).slice(0, 4).map((m, i) => (
                      <tr key={m.id || i}>
                        <td className="border border-black p-1 text-center font-mono">{m.date}</td>
                        <td className="border border-black p-1">{m.content}</td>
                        <td className="border border-black p-1 text-center font-semibold">{m.result || 'Đạt yêu cầu'}</td>
                        <td className="border border-black p-1 text-center">{m.person}</td>
                      </tr>
                    ))}
                    {(equipment.maintenance || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="border border-black p-2 text-center text-slate-500 italic">
                          Chưa có nhật ký bảo dưỡng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[9pt]">
              <div>
                <div className="font-bold uppercase">NGƯỜI LẬP SỔ</div>
                <div className="text-[8pt] text-slate-500 italic">(Ký & ghi rõ họ tên)</div>
                <div className="h-14"></div>
                <div className="font-bold">{o.primaryEngineer || 'Kỹ sư trực'}</div>
              </div>
              <div>
                <div className="font-bold uppercase">ĐỘI TRƯỞNG / TRƯỞNG ĐÀI</div>
                <div className="text-[8pt] text-slate-500 italic">(Ký & ghi rõ họ tên)</div>
                <div className="h-14"></div>
                <div className="font-bold">{o.supervisor || 'Trưởng Đài CNS'}</div>
              </div>
              <div>
                <div className="font-bold uppercase">LÃNH ĐẠO TRUNG TÂM</div>
                <div className="text-[8pt] text-slate-500 italic">(Ký duyệt & đóng dấu)</div>
                <div className="h-14"></div>
                <div className="font-bold">TRƯỞNG TRUNG TÂM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
