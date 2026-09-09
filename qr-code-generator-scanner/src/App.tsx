import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  UploadCloud, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  RotateCcw, 
  Sparkles, 
  Wifi, 
  Mail, 
  FileText, 
  Volume2, 
  VolumeX, 
  Trash2, 
  History, 
     Image as ImageIcon, 
  Video, 
  Globe, 
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

// Define structures
interface HistoryItem {
  id: string;
  type: 'generate' | 'scan';
  content: string;
  timestamp: number;
  label?: string;
}

interface DecodedDetails {
  type: 'url' | 'wifi' | 'email' | 'text';
  value: string;
  label: string;
  ssid?: string;
  password?: string;
  encryption?: string;
}

export default function App() {
  // Navigation & View Toggles
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
  
  // -- GENERATE REGISTERS --
  const [genInput, setGenInput] = useState<string>('https://ai.studio/build');
  const [qrColor, setQrColor] = useState<string>('#1E293B'); // slate-800 default
  const [logoMode, setLogoMode] = useState<'emoji' | 'custom' | 'none'>('emoji');
  const [centerIcon, setCenterIcon] = useState<string>('âœ¨'); // Emoji center overlay
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [centerBadgeStyle, setCenterBadgeStyle] = useState<'circle' | 'squircle'>('circle');
  const [genSize, setGenSize] = useState<number>(512); // High resolution for download
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Foreground color options
  const colorPresets = [
    { name: 'Slate', value: '#1E293B', bg: 'bg-slate-800' },
    { name: 'Royal Indigo', value: '#3730A3', bg: 'bg-indigo-800' },
    { name: 'Forest Green', value: '#065F46', bg: 'bg-emerald-800' },
    { name: 'Crimson Red', value: '#991B1B', bg: 'bg-red-800' },
    { name: 'Amethyst', value: '#6D28D9', bg: 'bg-violet-700' },
    { name: 'Teal Depth', value: '#0F766E', bg: 'bg-teal-700' },
  ];

  // Emojis representing overlay categories
  const iconPresets = [
    { label: 'None', value: 'none' },
    { label: 'Sparkle', value: 'âœ¨' },
    { label: 'Link', value: 'ðŸ”—' },
    { label: 'Wifi', value: 'ðŸ“¶' },
    { label: 'Mail', value: 'âœ‰ï¸' },
    { label: 'Heart', value: 'â¤ï¸' },
    { label: 'Profile', value: 'ðŸ‘¤' },
    { label: 'Music', value: 'ðŸŽµ' },
  ];

  // -- SCAN REGISTERS --
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Drag and Drop Upload states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // Global utilities
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // History Tracker
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  // Audio Beep Synthesizer using Web Audio API
  const playBeep = () => {
    if (isSoundMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch A5 (happy feedback)
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (err) {
      console.warn("Audio Context beep initialization failed:", err);
    }
  };

  // Toast Timer for Clipboard Copy Feedback
  const handleCopy = (text: string, identifier: string = "general") => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch local history on load
  useEffect(() => {
    const saved = localStorage.getItem('qr_studio_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed parsing QR studio history", e);
      }
    }
  }, []);

  // Sync history to LocalStorage
  const updateHistory = (newItems: HistoryItem[]) => {
    setHistory(newItems);
    localStorage.setItem('qr_studio_history', JSON.stringify(newItems));
  };

  const addToHistory = (type: 'generate' | 'scan', data: string) => {
    if (!data.trim()) return;
    // Avoid spamming identical duplicates consecutively
    if (history.length > 0 && history[0].content === data && history[0].type === type) {
      return;
    }
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type,
      content: data,
      timestamp: Date.now(),
      label: data.length > 32 ? data.substring(0, 32) + '...' : data
    };
    const updated = [newItem, ...history.slice(0, 19)]; // limit to 20 elements
    updateHistory(updated);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter(item => item.id !== id);
    updateHistory(filtered);
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear your local history?")) {
      updateHistory([]);
    }
  };

  // Draw the customized central overlay / badge with rich and professional layout
  const drawCustomOverlay = (
    canvas: HTMLCanvasElement,
    mode: 'none' | 'emoji' | 'custom',
    emoji: string,
    customUrl: string | null,
    style: 'circle' | 'squircle',
    callback?: () => void
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || mode === 'none') {
      if (callback) callback();
      return;
    }

    const canvasWidth = canvas.width;
    const badgeSize = canvasWidth * 0.22; // Keep in safe zone (max 22% size)
    const cx = canvasWidth / 2;
    const cy = canvasWidth / 2;
    const half = badgeSize / 2;

    ctx.save();

    // 1. Draw a high-contrast soft drop shadow around the badge
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = Math.max(3, canvasWidth * 0.012);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(2, canvasWidth * 0.006);

    // 2. Draw physical white background path
    ctx.beginPath();
    if (style === 'squircle') {
      const cornerRadius = badgeSize * 0.25;
      const x = cx - half;
      const y = cy - half;
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + badgeSize - cornerRadius, y);
      ctx.quadraticCurveTo(x + badgeSize, y, x + badgeSize, y + cornerRadius);
      ctx.lineTo(x + badgeSize, y + badgeSize - cornerRadius);
      ctx.quadraticCurveTo(x + badgeSize, y + badgeSize, x + badgeSize - cornerRadius, y + badgeSize);
      ctx.lineTo(x + cornerRadius, y + badgeSize);
      ctx.quadraticCurveTo(x, y + badgeSize, x, y + badgeSize - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    } else {
      ctx.arc(cx, cy, half, 0, 2 * Math.PI);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Restore shadow context to avoid duplicating shadows on nested elements
    ctx.restore();

    // 3. Draw dual accent brand line
    ctx.save();
    ctx.beginPath();
    if (style === 'squircle') {
      const cornerRadius = badgeSize * 0.25;
      const offset = badgeSize * 0.06;
      const innerSize = badgeSize - (offset * 2);
      const x = cx - (innerSize / 2);
      const y = cy - (innerSize / 2);
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + innerSize - cornerRadius, y);
      ctx.quadraticCurveTo(x + innerSize, y, x + innerSize, y + cornerRadius);
      ctx.lineTo(x + innerSize, y + innerSize - cornerRadius);
      ctx.quadraticCurveTo(x + innerSize, y + innerSize, x + innerSize - cornerRadius, y + innerSize);
      ctx.lineTo(x + cornerRadius, y + innerSize);
      ctx.quadraticCurveTo(x, y + innerSize, x, y + innerSize - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    } else {
      ctx.arc(cx, cy, half * 0.86, 0, 2 * Math.PI);
    }
    // Subtle premium border using the dynamic QR foreground color as accent
    ctx.strokeStyle = qrColor + '30'; // 30 in hex means ~18% opacity representing high fidelity
    ctx.lineWidth = Math.max(1.2, canvasWidth * 0.005);
    ctx.stroke();
    ctx.restore();

    // 4. Draw content (emoji or loaded custom image)
    if (mode === 'emoji') {
      ctx.save();
      ctx.font = `600 ${badgeSize * 0.52}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, cx, cy + (badgeSize * 0.03));
      ctx.restore();
      if (callback) callback();
    } else if (mode === 'custom' && customUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        
        // Circular / Squircle Clipping Area path
        ctx.beginPath();
        if (style === 'squircle') {
          const cornerRadius = badgeSize * 0.25;
          const offset = badgeSize * 0.08;
          const innerSize = badgeSize - (offset * 2);
          const x = cx - (innerSize / 2);
          const y = cy - (innerSize / 2);
          ctx.moveTo(x + cornerRadius, y);
          ctx.lineTo(x + innerSize - cornerRadius, y);
          ctx.quadraticCurveTo(x + innerSize, y, x + innerSize, y + cornerRadius);
          ctx.lineTo(x + innerSize, y + innerSize - cornerRadius);
          ctx.quadraticCurveTo(x + innerSize, y + innerSize, x + innerSize - cornerRadius, y + innerSize);
          ctx.lineTo(x + cornerRadius, y + innerSize);
          ctx.quadraticCurveTo(x, y + innerSize, x, y + innerSize - cornerRadius);
          ctx.lineTo(x, y + cornerRadius);
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        } else {
          ctx.arc(cx, cy, half * 0.84, 0, 2 * Math.PI);
        }
        ctx.clip();

        // Target centered scale bounds
        const drawingSize = badgeSize * 0.72;
        ctx.drawImage(img, cx - (drawingSize / 2), cy - (drawingSize / 2), drawingSize, drawingSize);
        ctx.restore();
        if (callback) callback();
      };
      img.onerror = () => {
        // Red fallback warning if can't draw
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.font = `bold ${badgeSize * 0.28}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ERR', cx, cy);
        ctx.restore();
        if (callback) callback();
      };
      img.src = customUrl;
    } else {
      if (callback) callback();
    }
  };

  // QR GENERATION: Loop effect on inputs
  useEffect(() => {
    if (activeTab === 'generate' && qrCanvasRef.current) {
      const canvas = qrCanvasRef.current;
      QRCode.toCanvas(
        canvas,
        genInput || " ",
        {
          width: 320,
          margin: 1.5,
          color: {
            dark: qrColor,
            light: '#FFFFFF'
          },
          errorCorrectionLevel: logoMode !== 'none' ? 'Q' : 'M' // High error levels if embedding design
        },
        (error) => {
          if (error) {
            console.error(error);
            return;
          }
          drawCustomOverlay(canvas, logoMode, centerIcon, customLogoUrl, centerBadgeStyle);
        }
      );
    }
  }, [genInput, qrColor, logoMode, centerIcon, customLogoUrl, centerBadgeStyle, activeTab]);

  // PNG High Resolution Downloader
  const downloadPNG = () => {
    if (!qrCanvasRef.current) return;
    
    // Create temporary high-res canvas purely for exporting premium quality
    const tempCanvas = document.createElement('canvas');
    QRCode.toCanvas(
      tempCanvas,
      genInput || " ",
      {
        width: genSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#FFFFFF'
        },
        errorCorrectionLevel: logoMode !== 'none' ? 'Q' : 'M'
      },
      (error) => {
        if (error) {
          console.error("Export failure:", error);
          return;
        }

        drawCustomOverlay(tempCanvas, logoMode, centerIcon, customLogoUrl, centerBadgeStyle, () => {
          // Trigger safe user download
          const url = tempCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = url;
          link.download = `qrcode_studio_${Date.now()}.png`;
          link.click();
          addToHistory('generate', genInput);
        });
      }
    );
  };

  // SVG Native Vector Downloader
  const downloadSVG = () => {
    QRCode.toString(
      genInput || " ",
      {
        type: 'svg',
        margin: 2,
        color: {
          dark: qrColor,
          light: '#FFFFFF'
        },
        errorCorrectionLevel: logoMode !== 'none' ? 'Q' : 'M'
      },
      (err, svgString) => {
        if (err) {
          console.error(err);
          return;
        }
        
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode_studio_${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        addToHistory('generate', genInput);
      }
    );
  };

  // CAMERA FEED ROUTING:
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Fetch media streams and populate camera options
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      if (activeTab !== 'scan' || scanMode !== 'camera' || !isCameraActive) {
        return;
      }

      try {
        setScanError(null);
        
        // Request immediate access to query devices
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId 
            ? { deviceId: { exact: selectedCameraId } }
            : { facingMode: 'environment' } // Default to back camera
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // support iOS
          await videoRef.current.play();
        }

        // Enumerate devices for selector
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoInputs);
        if (videoInputs.length > 0 && !selectedCameraId) {
          // If labels exist, pick environment or rear by default
          const backCam = videoInputs.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('environment') ||
            c.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
        }
      } catch (err: any) {
        console.error("Camera capture error:", err);
        setScanError("Failed accessing camera stream. Drop or import an image instead, or guarantee browser camera privileges.");
        setIsCameraActive(false);
      }
    };

    startCamera();

    // Clean tracking streams safely
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [activeTab, scanMode, isCameraActive, selectedCameraId]);

  // ACTIVE DECODING TICK ENGINE
  useEffect(() => {
    let animationFrameId: number;
    let keepAlive = true;

    const processFrame = () => {
      if (!keepAlive) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !scanResult) {
        // Draw physical video frame to dummy Canvas context
        const helperCanvas = document.createElement('canvas');
        helperCanvas.width = video.videoWidth;
        helperCanvas.height = video.videoHeight;
        
        const ctx = helperCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, helperCanvas.width, helperCanvas.height);
          const rawData = ctx.getImageData(0, 0, helperCanvas.width, helperCanvas.height);
          
          // Decode with jsQR library
          const decoded = jsQR(rawData.data, rawData.width, rawData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (decoded && decoded.data) {
            playBeep();
            setScanResult(decoded.data);
            addToHistory('scan', decoded.data);
            setIsCameraActive(false);
          }
        }
      }

      if (isCameraActive && !scanResult && activeTab === 'scan' && scanMode === 'camera') {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isCameraActive && !scanResult && activeTab === 'scan' && scanMode === 'camera') {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      keepAlive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, scanResult, activeTab, scanMode]);

  // PARSE FILE UPLOADS / DROP DATA:
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError("Dropped file is not a valid image format.");
      return;
    }

    setScanError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setUploadedImageSrc(dataUri);

      // Create dummy Image object to draw to rendering canvas
      const img = new Image();
      img.onload = () => {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = img.width;
        dummyCanvas.height = img.height;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const rawData = ctx.getImageData(0, 0, dummyCanvas.width, dummyCanvas.height);
          const decoded = jsQR(rawData.data, rawData.width, rawData.height);
          
          if (decoded && decoded.data) {
            playBeep();
            setScanResult(decoded.data);
            addToHistory('scan', decoded.data);
          } else {
            setScanError("Failed to detect a valid QR Code inside this image. Try another higher-contrast file.");
          }
        }
      };
      img.onerror = () => {
        setScanError("Corrupt or invalid image asset. Unable to render.");
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  // Drag listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  // SMART LINK & DATA TYPER PARSING:
  const parseDecodedContent = (content: string | null): DecodedDetails => {
    if (!content) return { type: 'text', value: '', label: 'Blank content' };

    const clean = content.trim();

    // WiFi logic: WIFI:S:Name;T:WPA;P:Password;;
    if (clean.startsWith('WIFI:')) {
      const sMatch = clean.match(/S:([^;]+)/);
      const pMatch = clean.match(/P:([^;]+)/);
      const tMatch = clean.match(/T:([^;]+)/);
      return {
        type: 'wifi',
        value: clean,
        label: 'Wi-Fi Connection Details',
        ssid: sMatch ? sMatch[1] : 'Unknown SSID',
        password: pMatch ? pMatch[1] : '',
        encryption: tMatch ? tMatch[1] : 'WPA/WPA2'
      };
    }

    // Email logic: mailto:test@gmail.com
    if (clean.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      const email = clean.replace(/^mailto:/, '');
      return {
        type: 'email',
        value: email,
        label: 'Email Dispatch Destination'
      };
    }

    // Web link checks
    try {
      new URL(clean);
      return { type: 'url', value: clean, label: 'Verified Web URL' };
    } catch (_) {
      // Relaxed checking for lazy links without http like google.com
      if (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(clean)) {
        const fullLink = clean.startsWith('http') ? clean : `https://${clean}`;
        return { type: 'url', value: fullLink, label: 'Inferred Web Link' };
      }
    }

    return {
      type: 'text',
      value: clean,
      label: 'Decoded Core Text'
    };
  };

  const parsedScanDetails = parseDecodedContent(scanResult);

  // RESET SCANNER STAGE
  const resetScannerState = () => {
    setScanResult(null);
    setScanError(null);
    setUploadedImageSrc(null);
    setIsCameraActive(true);
  };

  return (
    <div className="min-h-screen ts-page-bg dark font-sans text-neutral-100 flex flex-col justify-between items-center p-4 selection:bg-indigo-500 selection:text-white" id="main-container">
      
      {/* Decorative ambient background mesh blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main UI Header */}
      <header className="w-full max-w-lg mt-6 text-center z-10 flex flex-col items-center gap-2" id="app-header">
        <div className="bg-white/10 border border-white/20 p-3 rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-md">
          <QrCode className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
            QR Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">
            Premium Generator & Scanner
          </p>
        </div>
      </header>

      {/* Primary Glassmorphic Content Container */}
      <main className="w-full max-w-lg my-6 z-10 flex flex-col gap-6" id="app-body">
        
        <div className="bg-white/40 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
          
          {/* Glass header configuration panel row */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            {/* Sliding Pill Tab Switch */}
            <div className="bg-black/20 p-1 rounded-2xl flex items-center w-full max-w-[240px] border border-white/5 relative">
              <button
                id="tab-toggle-generate"
                onClick={() => {
                  setActiveTab('generate');
                  setScanResult(null);
                }}
                className={`flex-1 text-center py-2 text-sm font-semibold rounded-xl transition-all relative z-10 ${
                  activeTab === 'generate' ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Generate
                {activeTab === 'generate' && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white shadow-md rounded-xl z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              
              <button
                id="tab-toggle-scan"
                onClick={() => {
                  setActiveTab('scan');
                  if (!scanResult) {
                    setIsCameraActive(true);
                  }
                }}
                className={`flex-1 text-center py-2 text-sm font-semibold rounded-xl transition-all relative z-10 ${
                  activeTab === 'scan' ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Scan
                {activeTab === 'scan' && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white shadow-md rounded-xl z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Utility icons (Audio toggle) */}
            <div className="flex items-center gap-2">
              <button
                id="toggle-audio-beep"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="p-2.5 bg-black/25 hover:bg-black/40 border border-white/5 rounded-xl transition-all text-neutral-400 hover:text-white flex items-center justify-center"
                title={isSoundMuted ? "Unmute scanner beep" : "Mute scanner beep"}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Dynamic Switch Panel Viewport */}
          <AnimatePresence mode="wait">
            {activeTab === 'generate' ? (
              
              // -- GENERATE SCREEN VIEW --
              <motion.div
                key="generate-view"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
                id="generate-viewport"
              >
                {/* Text/URL input group */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 leading-none">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Link or Core Content
                  </label>
                  <div className="relative">
                    <input
                      id="qr-text-input"
                      type="text"
                      className="w-full bg-black/25 text-neutral-100 border border-white/10 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-sans pr-10"
                      placeholder="Type web addresses or paste copy snippets..."
                      value={genInput}
                      onChange={(e) => setGenInput(e.target.value)}
                    />
                    {genInput && (
                      <button
                        onClick={() => setGenInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs select-none cursor-pointer bg-white/5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Graphics Tweaks layout section */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 leading-none">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Foreground Theme
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 bg-black/20 rounded-2xl border border-white/5 min-h-[58px] items-center">
                        {colorPresets.map((preset) => (
                          <button
                            id={`color-preset-${preset.name}`}
                            key={preset.value}
                            onClick={() => setQrColor(preset.value)}
                            className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 relative flex items-center justify-center outline-none ${preset.bg}`}
                            title={preset.name}
                          >
                            {qrColor === preset.value && (
                              <motion.div
                                layoutId="activeColorBorder"
                                className="absolute inset-[-3px] border border-white rounded-xl"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Overlay Mode Toggle */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 leading-none">
                        Overlay Source
                      </label>
                      <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5 h-[58px] items-center">
                        <button
                          type="button"
                          id="logo-mode-none"
                          onClick={() => setLogoMode('none')}
                          className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
                            logoMode === 'none' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          id="logo-mode-emoji"
                          onClick={() => setLogoMode('emoji')}
                          className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
                            logoMode === 'emoji' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Preset Emoji
                        </button>
                        <button
                          type="button"
                          id="logo-mode-custom"
                          onClick={() => setLogoMode('custom')}
                          className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
                            logoMode === 'custom' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Custom Brand
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Logo Configuration */}
                  {logoMode === 'emoji' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 leading-none">
                          Preset Icon / Emoji
                        </label>
                        <select
                          id="center-icon-design-selector"
                          className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 px-3 text-sm text-neutral-100 outline-none focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                          value={centerIcon}
                          onChange={(e) => setCenterIcon(e.target.value)}
                        >
                          {iconPresets.filter(i => i.value !== 'none').map((icon) => (
                            <option key={icon.value} value={icon.value} className="bg-slate-900 text-white">
                              {icon.label} ({icon.value})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 leading-none">
                          Badge Frame Shape
                        </label>
                        <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                          <button
                            type="button"
                            onClick={() => setCenterBadgeStyle('circle')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                              centerBadgeStyle === 'circle' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Circle
                          </button>
                          <button
                            type="button"
                            onClick={() => setCenterBadgeStyle('squircle')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                              centerBadgeStyle === 'squircle' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Squircle
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {logoMode === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3 bg-black/20 p-4 rounded-3xl border border-white/5 animate-fade-in"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-neutral-200">
                            Upload Custom Brand Design / Logo
                          </span>
                          <span className="text-[10px] text-neutral-400 max-w-sm leading-relaxed">
                            Requires <strong>PNG, JPG, or SVG</strong> formats. Use <strong>1:1 square ratio</strong> with clear/transparent backdrops for an upscale professional aesthetic (max 2MB, 256px+ recommended).
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-mono">Frame:</span>
                          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                            <button
                              type="button"
                              onClick={() => setCenterBadgeStyle('circle')}
                              className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${centerBadgeStyle === 'circle' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                            >
                              Circle
                            </button>
                            <button
                              type="button"
                              onClick={() => setCenterBadgeStyle('squircle')}
                              className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${centerBadgeStyle === 'squircle' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                            >
                              Squircle
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {customLogoUrl ? (
                          <div className="relative group shrink-0">
                            <img
                              src={customLogoUrl}
                              alt="Brand design logo preview"
                              className="w-16 h-16 object-contain rounded-xl border border-white/20 p-1 bg-white/5 shadow-inner animate-pulse"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomLogoUrl(null)}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-[8px] cursor-pointer"
                              title="Delete custom logo"
                            >
                              âœ•
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-white/5 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-neutral-500 shrink-0 select-none">
                                                        <ImageIcon className="w-5 h-5 animate-pulse" />
                          </div>
                        )}

                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md">
                            <UploadCloud className="w-4 h-4" /> Browse Brand Logo
                            <input
                              id="custom-logo-input"
                              type="file"
                              accept="image/png, image/jpeg, image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    setCustomLogoUrl(evt.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Main live preview block */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="bg-white p-5 rounded-[2rem] shadow-2xl border border-white/10 inline-block relative group group-hover:scale-[1.02] transition-transform duration-300">
                    <canvas 
                      id="qr-preview-canvas"
                      ref={qrCanvasRef} 
                      className="mx-auto rounded-xl block max-w-full w-[220px] h-[220px]"
                    />
                    <div className="absolute top-2 right-2 bg-neutral-900/10 text-[10px] text-neutral-900 font-semibold uppercase px-2 py-0.5 rounded-full backdrop-blur-md">
                      Live
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 text-center mt-3 max-w-[280px]">
                    Updating in real-time. Choose overlays that align cleanly with your link logic.
                  </p>
                </div>

                {/* Export configurations */}
                <div className="bg-black/25 border border-white/5 rounded-2.5xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-widest font-mono">
                      Export Resolution
                    </span>
                    <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5">
                      <button
                        onClick={() => setGenSize(256)}
                        className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded ${genSize === 256 ? 'bg-indigo-600 font-bold text-white' : 'text-neutral-400 hover:text-white'}`}
                      >
                        SD
                      </button>
                      <button
                        onClick={() => setGenSize(512)}
                        className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded ${genSize === 512 ? 'bg-indigo-600 font-bold text-white' : 'text-neutral-400 hover:text-white'}`}
                      >
                        HD
                      </button>
                      <button
                        onClick={() => setGenSize(1024)}
                        className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded ${genSize === 1024 ? 'bg-indigo-600 font-bold text-white' : 'text-neutral-400 hover:text-white'}`}
                      >
                        UHD
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="button-download-png"
                      onClick={downloadPNG}
                      className="flex-1 bg-white hover:bg-neutral-100 text-neutral-900 py-3 rounded-xl font-bold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                    <button
                      id="button-download-svg"
                      onClick={downloadSVG}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" /> Download SVG
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              
              // -- SCAN SCREEN VIEW --
              <motion.div
                key="scan-view"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
                id="scan-viewport"
              >
                
                {/* Secondary navigation for Scan Modes */}
                <div className="flex bg-black/15 p-1 rounded-2xl border border-white/5">
                  <button
                    id="scan-mode-camera"
                    onClick={() => {
                      setScanMode('camera');
                      setScanResult(null);
                      setScanError(null);
                      setUploadedImageSrc(null);
                      setIsCameraActive(true);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      scanMode === 'camera' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Camera Stream
                  </button>
                  <button
                    id="scan-mode-upload"
                    onClick={() => {
                      setScanMode('upload');
                      setScanResult(null);
                      setScanError(null);
                      setUploadedImageSrc(null);
                      setIsCameraActive(false);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      scanMode === 'upload' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>

                {/* Screen error notice message */}
                {scanError && (
                  <div className="bg-red-500/15 border border-red-500/35 p-3.5 rounded-2xl text-xs text-red-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p>{scanError}</p>
                  </div>
                )}

                {/* Conditional scan method body */}
                <div className="bg-neutral-900/40 rounded-[2rem] border border-white/5 overflow-hidden relative">
                  
                  {scanMode === 'camera' ? (
                    // Camera live frame stream
                    <div className="aspect-square w-full relative flex items-center justify-center bg-black/50" id="camera-stream-box">
                      
                      {isCameraActive && !scanResult ? (
                        <>
                          {/* Live Video Feed */}
                          <video
                            id="scanner-video-feed"
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            playsInline
                          />

                          {/* Futuristic viewfinder overlays */}
                          <div className="absolute inset-8 border border-white/10 pointer-events-none rounded-2xl flex items-center justify-center">
                            
                            {/* Highlighting target brackets */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl"></div>

                            {/* Staggered Scanning Laser Line animated inside bracket box */}
                            <motion.div
                              id="vertical-laser-line"
                              className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,0.8)]"
                              animate={{ top: ['4%', '96%', '4%'] }}
                              transition={{
                                duration: 3.5,
                                repeat: Infinity,
                                ease: 'easeInOut'
                              }}
                            />
                            
                            <p className="text-[11px] text-light bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 font-medium tracking-wide">
                              Align QR Code here
                            </p>
                          </div>
                        </>
                      ) : (
                        // Muted/Inactive Camera placeholder prompt
                        <div className="flex flex-col items-center gap-4 text-center p-6" id="camera-prompt-container">
                          <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-lg">
                            <Camera className="w-8 h-8 text-indigo-400" />
                          </div>
                          <div className="max-w-[280px]">
                            <p className="text-sm font-semibold">Camera scanner deactivated</p>
                            <p className="text-xs text-neutral-400 mt-1">
                              Activate stream to read instantly with your front or back camera device.
                            </p>
                          </div>
                          {!scanResult && (
                            <button
                              id="button-start-camera"
                              onClick={() => {
                                setScanResult(null);
                                setIsCameraActive(true);
                              }}
                              className="bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold px-5  py-2.5 rounded-xl cursor-pointer transition-transform duration-200 hover:scale-105 shadow-md"
                            >
                              Activate Camera
                            </button>
                          )}
                        </div>
                      )}

                      {/* Decoded/scanned Successful notification banner overlay */}
                      {scanResult && (
                        <div className="absolute inset-0 bg-indigo-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
                          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                            <Check className="w-8 h-8 font-bold" />
                          </div>
                          <p className="text-lg font-bold text-emerald-300">QR Decoded Securely</p>
                          <p className="text-xs text-neutral-300 mt-1 max-w-[280px]">
                            Calculated string translated properly! Check outcomes below.
                          </p>
                          <button
                            id="reset-scanner-top"
                            onClick={resetScannerState}
                            className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Scan Another Code
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    // Drag and drop upload zone
                    <div
                      id="drop-upload-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`aspect-square w-full p-6 flex flex-col items-center justify-center text-center transition-all relative select-none ${
                        isDragging ? 'bg-indigo-500/10 border-2 border-dashed border-indigo-400' : 'bg-transparent'
                      }`}
                    >
                      
                      {uploadedImageSrc ? (
                        // Show thumbnail preview of dropped image
                        <div className="flex flex-col items-center gap-4 p-4 max-w-[280px] z-10" id="image-thumbnail-container">
                          <img
                            src={uploadedImageSrc}
                            alt="Uploaded original QR snippet"
                            className="w-36 h-36 object-contain rounded-xl shadow-lg border border-white/10 p-1.5 bg-neutral-800"
                          />
                          <div>
                            <p className="text-xs font-semibold text-neutral-300">Uploaded Image Loaded</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">Size processed successfully</p>
                          </div>
                          
                          {scanResult ? (
                            <button
                              id="button-clear-uploaded"
                              onClick={() => {
                                setUploadedImageSrc(null);
                                setScanResult(null);
                                setScanError(null);
                              }}
                              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                            >
                              Remove Image
                            </button>
                          ) : (
                            <p className="text-[11px] text-red-300">Analyzing content...</p>
                          )}
                        </div>
                      ) : (
                        // Drop Zone initial state
                        <div className="flex flex-col items-center gap-4 p-4 pointer-events-none" id="drop-prompt-container">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-all ${
                            isDragging ? 'bg-indigo-500/10 border-indigo-400 text-indigo-400' : 'bg-white/5 border-white/10 text-neutral-400'
                          }`}>
                            <UploadCloud className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Drag QR Code Image Here</p>
                            <p className="text-xs text-neutral-400 mt-1.5 max-w-[220px]">
                              Supports JPG, PNG, WEBP, or SVG formats
                            </p>
                          </div>
                          <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-mono">
                            or
                          </span>
                          <label className="bg-white hover:bg-neutral-100 text-neutral-900 py-2.5 px-5 rounded-xl cursor-pointer text-xs font-bold transition-all relative pointer-events-auto shadow-md">
                            Browse locally
                            <input
                              id="qr-file-browse-input"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileSelectChange}
                            />
                          </label>
                        </div>
                      )}

                      {/* Decoded Success overlay inside Image scanning box too */}
                      {scanResult && scanMode === 'upload' && (
                        <div className="absolute inset-0 bg-indigo-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
                          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                            <Check className="w-8 h-8" />
                          </div>
                          <p className="text-lg font-bold text-emerald-300">QR Decoded Securely</p>
                          <p className="text-xs text-neutral-300 mt-1 max-w-[280px]">
                            Input analyzed successfully. Review breakdown below.
                          </p>
                          <button
                            id="reset-scanner-img-top"
                            onClick={() => {
                              setScanResult(null);
                              setScanError(null);
                              setUploadedImageSrc(null);
                            }}
                            className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear & Reset
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Multi-camera selector dropdown utility if cameras exist */}
                  {scanMode === 'camera' && isCameraActive && cameras.length > 1 && (
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 border border-white/10 p-2 rounded-xl flex items-center justify-between gap-2 backdrop-blur-md z-15">
                      <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-semibold tracking-wider uppercase ml-1.5 leading-none">
                        <Video className="w-3.5 h-3.5 text-indigo-400" /> Sensor
                      </div>
                      <select
                        id="camera-device-selector"
                        className="bg-black/40 border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white max-w-[200px] font-sans focus:outline-none focus:border-indigo-400 cursor-pointer"
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                      >
                        {cameras.map((cam, idx) => (
                          <option key={cam.deviceId} value={cam.deviceId} className="bg-slate-900 text-white">
                            {cam.label || `Camera sensor ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>

                {/* Elegant Decoded Output Result Block if present */}
                <AnimatePresence>
                  {scanResult && (
                    <motion.div
                      id="decoded-output-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center bg-transparent px-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 font-mono">
                          Scanned Result Data
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-semibold font-mono">
                          {parsedScanDetails.label}
                        </span>
                      </div>

                      {/* Parsed styled response depending on type */}
                      <div className="bg-black/25 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                        
                        {parsedScanDetails.type === 'wifi' ? (
                          // Wifi specific premium layout Card
                          <div className="flex flex-col gap-3" id="scan-wifi-output-subgrid">
                            <div className="flex gap-3 items-center bg-white/5 border border-white/5 p-3 rounded-2xl">
                              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
                                <Wifi className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold leading-none">SSID Network Name</p>
                                <p id="wifi-network-ssid" className="text-sm font-semibold mt-1 text-white">{parsedScanDetails.ssid}</p>
                              </div>
                            </div>

                            <div className="flex gap-3 items-center bg-white/5 border border-white/5 p-3 rounded-2xl relative group">
                              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold leading-none">WiFi Password</p>
                                <p id="wifi-network-password" className="text-sm font-mono mt-1 text-white break-all whitespace-normal">
                                  {parsedScanDetails.password || <span className="italic text-neutral-500">None / Unsecured</span>}
                                </p>
                              </div>
                              {parsedScanDetails.password && (
                                <button
                                  onClick={() => handleCopy(parsedScanDetails.password || "", "pwd")}
                                  className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
                                  title="Copy password"
                                >
                                  {copiedText === "pwd" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : parsedScanDetails.type === 'email' ? (
                          // Email specific action route
                          <div className="flex flex-col gap-1" id="scan-email-output-subgrid">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold leading-none mb-1">Email Address</p>
                            <p className="text-sm font-semibold break-all text-white font-mono">{parsedScanDetails.value}</p>
                          </div>
                        ) : parsedScanDetails.type === 'url' ? (
                          // URL action route
                          <div className="flex flex-col gap-1" id="scan-url-output-subgrid">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold leading-none mb-1">Web Address Destination</p>
                            <p className="text-sm font-semibold break-all text-indigo-400 underline decoration-indigo-400/50 hover:text-indigo-300 transition-all font-mono">
                              <a href={parsedScanDetails.value} target="_blank" rel="noopener noreferrer">
                                {parsedScanDetails.value}
                              </a>
                            </p>
                          </div>
                        ) : (
                          // Plain Text display
                          <div className="flex flex-col gap-1" id="scan-text-output-subgrid">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold leading-none mb-1">Decoded Plain Text</p>
                            <p className="text-sm text-neutral-200 mt-1 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-48 overflow-y-auto pr-1">
                              {parsedScanDetails.value}
                            </p>
                          </div>
                        )}

                        {/* Combined copy and routing buttons */}
                        <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3.5 mt-1">
                          
                          {/* Copy trigger button */}
                          <button
                            id="button-copy-decoded"
                            onClick={() => handleCopy(parsedScanDetails.value, "decoded")}
                            className="flex-1 bg-white hover:bg-neutral-100 text-neutral-900 py-3 rounded-xl font-bold text-xs tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                          >
                            {copiedText === "decoded" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy String
                              </>
                            )}
                          </button>

                          {/* Action triggering button (Website jump/Email draft/Wifi configure tip) */}
                          {parsedScanDetails.type === 'url' && (
                            <a
                              id="action-visit-website"
                              href={parsedScanDetails.value}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs tracking-tight text-center flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                            >
                              Visit Website <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          
                          {parsedScanDetails.type === 'email' && (
                            <a
                              id="action-send-email"
                              href={`mailto:${parsedScanDetails.value}`}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs tracking-tight text-center flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                            >
                              Send Email <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {parsedScanDetails.type === 'wifi' && (
                            <button
                              id="action-wifi-info"
                              onClick={() => alert(`Connect instructions:\n1. Copy Network Identifier: "${parsedScanDetails.ssid}"\n2. Copy Wifi Password: "${parsedScanDetails.password}"\n3. Input these inside system Settings to safely connect.`)}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                            >
                              Connect Guide <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {parsedScanDetails.type === 'text' && (
                            <button
                              id="action-generic-search"
                              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(parsedScanDetails.value)}`, '_blank')}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                            >
                              Search Web <Globe className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Collapsible Local History Track Card */}
        {history.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl" id="history-panel">
            
            <button
              id="button-toggle-history"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 cursor-pointer outline-none select-none hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5 font-bold text-sm tracking-tight text-neutral-200">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Recent Operations ({history.length})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">{isHistoryExpanded ? 'Collapse' : 'Expand'}</span>
                <span className="text-neutral-400 text-[10px] transform transition-transform duration-300" style={{ transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  â–¼
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isHistoryExpanded && (
                <motion.div
                  id="history-list-contents"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 px-6 pb-5 bg-black/15 overflow-hidden"
                >
                  
                  {/* History item blocks */}
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1.5 mt-3.5 scrollbar-thin">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        id={`history-item-${item.id}`}
                        onClick={() => {
                          if (item.type === 'generate') {
                            setGenInput(item.content);
                            setActiveTab('generate');
                          } else {
                            // Load scan string directly in scanner
                            setScanResult(item.content);
                            setActiveTab('scan');
                          }
                          playBeep();
                        }}
                        className="bg-black/25 hover:bg-black/40 border border-white/5 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                              item.type === 'generate' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-pink-500/15 text-pink-300'
                            }`}>
                              {item.type}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 font-mono mt-1 pr-6 truncate">{item.content}</p>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.content, item.id);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy string"
                          >
                            {copiedText === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clean up commands */}
                  <div className="flex justify-end border-t border-white/5 pt-3 mt-3">
                    <button
                      id="button-clear-history"
                      onClick={clearAllHistory}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 cursor-pointer underline bg-transparent border-none outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear History
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

      </main>

      {/* Modern, clean aesthetic credit line */}
      <footer className="w-full text-center py-6 text-[11px] text-neutral-500 tracking-wider font-mono z-10" id="app-footer">
        QR Studio — ToolSy
      </footer>

    </div>
  );
}


