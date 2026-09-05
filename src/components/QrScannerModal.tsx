import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  Upload, 
  Search, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  ExternalLink,
  FileText
} from 'lucide-react';
import { EquipmentData } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentData[];
  onSelectEquipment: (id: string, viewMode?: 'detail' | 'pdf') => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  equipments,
  onSelectEquipment
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [matchedEquipment, setMatchedEquipment] = useState<EquipmentData | null>(null);
  const [scanFeedbackError, setScanFeedbackError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasDetectedRef = useRef<boolean>(false);

  // Stop camera and scanning loop
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Quick sound effect & vibration on QR capture
  const triggerSuccessFeedback = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 60]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio or vibration not permitted or supported, benign
    }
  }, []);

  // Decode code string and find matching equipment
  const processScannedCode = useCallback((rawCode: string) => {
    if (!rawCode || !rawCode.trim() || hasDetectedRef.current) return;
    const clean = rawCode.trim();

    // 1. Try match by direct ID
    let found = equipments.find(e => e.id.toLowerCase() === clean.toLowerCase());

    // 2. Try match by Serial
    if (!found) {
      found = equipments.find(e => e.general.serial && e.general.serial.toLowerCase() === clean.toLowerCase());
    }

    // 3. Try match by Asset No
    if (!found) {
      found = equipments.find(e => e.general.assetNo && e.general.assetNo.toLowerCase() === clean.toLowerCase());
    }

    // 4. Try parse URL / Hash: #eq=eq-xxx or ?eq=eq-xxx or ?id=xxx or ?pdf=xxx
    if (!found) {
      try {
        let queryVal: string | null = null;
        if (clean.includes('?')) {
          const qs = clean.split('?')[1]?.split('#')[0];
          if (qs) {
            const sp = new URLSearchParams(qs);
            queryVal = sp.get('eq') || sp.get('id') || sp.get('pdf');
          }
        }
        if (!queryVal && clean.includes('#')) {
          const hs = clean.split('#')[1];
          if (hs) {
            const hp = new URLSearchParams(hs.includes('=') ? hs : `eq=${hs}`);
            queryVal = hp.get('eq') || hp.get('id') || hp.get('pdf') || (hs.startsWith('eq-') ? hs.split('&')[0] : null);
          }
        }
        if (queryVal) {
          const targetId = decodeURIComponent(queryVal).toLowerCase();
          found = equipments.find(e => 
            e.id.toLowerCase() === targetId || 
            (e.general.serial && e.general.serial.toLowerCase() === targetId) ||
            (e.general.assetNo && e.general.assetNo.toLowerCase() === targetId)
          );
        }
      } catch (e) {
        // Not a URL
      }
      if (!found && clean.includes('eq=')) {
        const match = clean.match(/[?#&]eq=([^&]+)/);
        if (match && match[1]) {
          const targetId = decodeURIComponent(match[1]).toLowerCase();
          found = equipments.find(e => e.id.toLowerCase() === targetId);
        }
      }
    }

    // 5. Try parse JSON payload
    if (!found && (clean.startsWith('{') && clean.endsWith('}'))) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.id) {
          found = equipments.find(e => e.id === parsed.id);
        }
      } catch {
        // ignore
      }
    }

    // 6. Partial match by name
    if (!found) {
      found = equipments.find(e => 
        e.general.name.toLowerCase().includes(clean.toLowerCase()) ||
        e.general.model.toLowerCase().includes(clean.toLowerCase())
      );
    }

    if (found) {
      hasDetectedRef.current = true;
      triggerSuccessFeedback();
      stopCamera();
      
      // AUTO-OPEN PDF DIRECTLY WITHOUT EXTRA STEPS (User requirement: Quét sẽ tự động mở file PDF "Sổ Lý lịch" Tương ứng)
      onSelectEquipment(found.id, 'pdf');
      onClose();
    } else {
      setScanFeedbackError(`Không tìm thấy thiết bị nào khớp với mã: "${clean}". Vui lòng kiểm tra lại!`);
    }
  }, [equipments, stopCamera, triggerSuccessFeedback, onSelectEquipment, onClose]);

  // Frame-by-frame scanner loop
  const tickScanner = useCallback(() => {
    if (!isScanning || hasDetectedRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      if (!scanCanvasRef.current) {
        scanCanvasRef.current = document.createElement('canvas');
      }
      const canvas = scanCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data && code.data.trim()) {
          processScannedCode(code.data);
          return; // stop loop
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tickScanner);
  }, [isScanning, processScannedCode]);

  // Start camera helper
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setMatchedEquipment(null);
    hasDetectedRef.current = false;
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Trình duyệt hoặc thiết bị không hỗ trợ truy cập Camera trực tiếp.');
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        // Start scanning loop
        animationFrameRef.current = requestAnimationFrame(tickScanner);
      }
    } catch (err: any) {
      console.warn('Camera access denied/error:', err);
      setCameraError('Không thể mở Camera. Vui lòng cấp quyền máy ảnh hoặc sử dụng tính năng "Nhập mã / Tra cứu nhanh".');
      setIsScanning(false);
    }
  }, [tickScanner]);

  useEffect(() => {
    if (isOpen) {
      hasDetectedRef.current = false;
      if (activeMode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
      setManualCode('');
      setMatchedEquipment(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScannedCode(manualCode);
  };

  // Upload image file and decode QR with jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        setIsProcessingImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          setIsProcessingImage(false);
          if (code && code.data) {
            processScannedCode(code.data);
          } else {
            // Fallback: search by filename without extension
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            processScannedCode(fileName);
          }
        } else {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setScanFeedbackError('Không thể đọc tệp hình ảnh. Vui lòng thử lại với ảnh khác.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Quét Mã QR Sổ Lý Lịch</h3>
              <p className="text-[11px] text-slate-400">Tra cứu nhanh hồ sơ thiết bị CNS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setScanFeedbackError(null);
              setActiveMode('camera');
            }}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeMode === 'camera'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Quét</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanFeedbackError(null);
              setActiveMode('manual');
            }}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeMode === 'manual'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Nhập Mã / Serial</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setScanFeedbackError(null);
              setActiveMode('upload');
            }}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeMode === 'upload'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh QR</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {scanFeedbackError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{scanFeedbackError}</span>
              </div>
              <button 
                type="button"
                onClick={() => setScanFeedbackError(null)}
                className="text-amber-600 hover:text-amber-900 font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}
          {matchedEquipment ? (
            /* Result Found Screen */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ĐÃ TÌM THẤY HỒ SƠ THIẾT BỊ!</span>
                </div>
                <div className="text-base font-bold text-slate-900 leading-snug">
                  {matchedEquipment.general.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-slate-500">Chủng loại:</span>
                    <div className="font-semibold text-slate-800">{matchedEquipment.general.category}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Model:</span>
                    <div className="font-semibold text-slate-800">{matchedEquipment.general.model || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Serial No:</span>
                    <div className="font-mono font-semibold text-slate-800">{matchedEquipment.general.serial || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Mã TS:</span>
                    <div className="font-mono font-semibold text-slate-800">{matchedEquipment.general.assetNo || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectEquipment(matchedEquipment.id, 'pdf');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Mở File PDF Sổ Lý Lịch</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectEquipment(matchedEquipment.id, 'detail');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Xem Chi Tiết Hồ Sơ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMatchedEquipment(null);
                  if (activeMode === 'camera') startCamera();
                }}
                className="w-full py-2 text-center text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Quét mã thiết bị khác
              </button>
            </div>
          ) : (
            <>
              {activeMode === 'camera' && (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Scanner Framing Box */}
                    <div className="absolute inset-8 border-2 border-blue-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-2xl">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                        <div className="w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                      </div>
                      {/* Animated Scan Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                        <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                      </div>
                    </div>

                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center text-rose-300 text-xs space-y-2">
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                        <span>{cameraError}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-slate-500 leading-relaxed">
                    Hướng camera điện thoại về phía tem mã QR dán trên thiết bị kỹ thuật CNS.
                  </p>

                  {/* Quick select equipment fallback shortcut */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                      Hoặc chọn nhanh thiết bị trong danh sách:
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto">
                      {equipments.slice(0, 6).map(eq => (
                        <button
                          key={eq.id}
                          type="button"
                          onClick={() => processScannedCode(eq.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer truncate max-w-[140px]"
                        >
                          {eq.general.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeMode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Nhập mã thiết bị, Serial Number hoặc Asset ID:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Ví dụ: eq-vhf-01, T6T-2023-01, TS-CNS-2024..."
                        className="form-input-standard py-2.5 pr-10 text-sm font-mono"
                        autoFocus
                        required
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Tra Cứu Hồ Sơ Thiết Bị</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Gợi ý thiết bị mẫu trong hệ thống:
                    </div>
                    <div className="space-y-1">
                      {equipments.map(eq => (
                        <div
                          key={eq.id}
                          onClick={() => processScannedCode(eq.id)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{eq.general.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              SN: {eq.general.serial || 'N/A'} • Mã TS: {eq.general.assetNo || 'N/A'}
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0 ml-2">
                            {eq.general.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {activeMode === 'upload' && (
                <div className="space-y-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Chọn hoặc chụp ảnh tem mã QR
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Tải lên hình ảnh tem mã QR chụp từ điện thoại để nhận diện tự động hồ sơ thiết bị.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
