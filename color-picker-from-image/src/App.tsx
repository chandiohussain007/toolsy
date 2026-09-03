/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Trash2, 
  Sliders, 
  Contrast, 
  Eye, 
  Info, 
  History 
} from 'lucide-react';

interface ColorState {
  r: number;
  g: number;
  b: number;
  hex: string;
}

interface TargetContrast {
  whiteRatio: string;
  whiteScore: string;
  blackRatio: string;
  blackScore: string;
  bestColor: 'white' | 'black';
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function App() {
  // Base states
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<ColorState | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorState | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isHoveringImage, setIsHoveringImage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ColorState[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Mouse coordinate states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image element and canvas references
  const imageRef = useRef<HTMLImageElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Keep offscreen canvas variables in refs for extreme 60fps performance
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Copy timer ref to clean up timeouts
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load color history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spectra_color_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setSelectedColor(parsed[0]);
        }
      } catch (e) {
        console.error('Failed to parse color history:', e);
      }
    }
  }, []);

  // Set up initial state of selected color
  useEffect(() => {
    if (!selectedColor && hoverColor) {
      setSelectedColor(hoverColor);
    }
  }, [hoverColor, selectedColor]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Procedural preset generators to avoid broken external image URLs and enable zero-network play
  const loadPreset = (type: 'neon' | 'earth' | 'nordic') => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 800;
    tempCanvas.height = 600;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    if (type === 'neon') {
      // Draw neon grid synthwave landscape
      const grad = ctx.createLinearGradient(0, 0, 0, 600);
      grad.addColorStop(0, '#0f051d');
      grad.addColorStop(0.5, '#29094c');
      grad.addColorStop(1, '#05020a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // Deep vibrant neon glowing circles
      const rGrad1 = ctx.createRadialGradient(250, 200, 20, 250, 200, 300);
      rGrad1.addColorStop(0, 'rgba(255, 0, 128, 0.85)');
      rGrad1.addColorStop(0.5, 'rgba(128, 0, 255, 0.4)');
      rGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGrad1;
      ctx.beginPath();
      ctx.arc(250, 200, 300, 0, Math.PI * 2);
      ctx.fill();

      const rGrad2 = ctx.createRadialGradient(600, 400, 10, 600, 400, 250);
      rGrad2.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
      rGrad2.addColorStop(0.5, 'rgba(0, 100, 255, 0.35)');
      rGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGrad2;
      ctx.beginPath();
      ctx.arc(600, 400, 250, 0, Math.PI * 2);
      ctx.fill();

      // Cyber lines grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 800; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
      }
      for (let j = 0; j < 600; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(800, j);
        ctx.stroke();
      }
    } else if (type === 'earth') {
      // Rich earthy desert watercolor
      ctx.fillStyle = '#E6D7C3'; // Pale sand
      ctx.fillRect(0, 0, 800, 600);

      // Organic curved topography layers
      ctx.fillStyle = '#C2593F'; // Terracotta
      ctx.beginPath();
      ctx.arc(100, 650, 500, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#5A6E55'; // Juniper Green
      ctx.beginPath();
      ctx.arc(750, 650, 400, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D9A036'; // Mustard Gold
      ctx.beginPath();
      ctx.arc(450, 320, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E8E1D5'; // Warm cream highlight
      ctx.beginPath();
      ctx.arc(280, 200, 90, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Oceanic nordic blue abstraction
      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, '#102A43');
      grad.addColorStop(0.3, '#243B53');
      grad.addColorStop(0.7, '#486581');
      grad.addColorStop(1, '#829AB1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // Artistic waves
      ctx.fillStyle = 'rgba(240, 244, 248, 0.15)';
      ctx.beginPath();
      ctx.ellipse(300, 200, 200, 400, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#BCCCDC'; // Cool ice blue
      ctx.beginPath();
      ctx.arc(500, 180, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334E68'; // Deep slate
      ctx.beginPath();
      ctx.arc(620, 480, 180, 0, Math.PI * 2);
      ctx.fill();
    }

    const dataUrl = tempCanvas.toDataURL('image/png');
    setImgSrc(dataUrl);
    setHoverColor(null);
    setRipples([]);
    
    // Auto-select center color as placeholder highlight
    setTimeout(() => {
      const centerR = type === 'neon' ? 41 : type === 'earth' ? 217 : 51;
      const centerG = type === 'neon' ? 9 : type === 'earth' ? 160 : 78;
      const centerB = type === 'neon' ? 76 : type === 'earth' ? 54 : 104;
      const initialColor = {
        r: centerR,
        g: centerG,
        b: centerB,
        hex: rgbToHex(centerR, centerG, centerB)
      };
      setSelectedColor(initialColor);
      addSelectedToHistory(initialColor);
    }, 150);
  };

  // Helper converters
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
      const hex = c.toString(16).toUpperCase();
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // WCAG Relative Luminance / Contrast Calculator
  const getContrastAnalysis = (r: number, g: number, b: number): TargetContrast => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    
    const contrastWithWhite = (1.0 + 0.05) / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / (0.0 + 0.05);
    
    const whiteScore = contrastWithWhite >= 4.5 ? 'Pass (AAA)' : contrastWithWhite >= 3.0 ? 'Pass (AA)' : 'Fail';
    const blackScore = contrastWithBlack >= 4.5 ? 'Pass (AAA)' : contrastWithBlack >= 3.0 ? 'Pass (AA)' : 'Fail';
    
    return {
      whiteRatio: contrastWithWhite.toFixed(1),
      whiteScore,
      blackRatio: contrastWithBlack.toFixed(1),
      blackScore,
      bestColor: contrastWithWhite > contrastWithBlack ? 'white' : 'black'
    };
  };

  // Trigger general toast notification
  const triggerToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Safe file loader
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast('Incorrect file format. Please upload an image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImgSrc(e.target.result as string);
        setHoverColor(null);
        setRipples([]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave' || e.type === 'drop') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const selectFileManually = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Setup offscreen canvas when the main visible image is fully loaded
  const handleVisibleImageLoad = () => {
    const img = imageRef.current;
    if (!img) return;

    // Create a physical offscreen canvas mirroring natural dimensions to read raw data
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      offscreenCanvasRef.current = canvas;
      offscreenCtxRef.current = ctx;
      
      // Auto-extract first loaded point color as initial selection
      try {
        const midX = Math.floor(canvas.width / 2);
        const midY = Math.floor(canvas.height / 2);
        const p = ctx.getImageData(midX, midY, 1, 1).data;
        const initial = { r: p[0], g: p[1], b: p[2], hex: rgbToHex(p[0], p[1], p[2]) };
        setSelectedColor(initial);
      } catch (_) {
        // Fallback
        const initial = { r: 120, g: 120, b: 120, hex: '#787878' };
        setSelectedColor(initial);
      }
    }
  };

  // Real-time hover coordinate calculation & rendering of pixel grid loupe
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    const container = e.currentTarget;
    if (!img || !offscreenCtxRef.current) return;

    const rect = container.getBoundingClientRect();
    
    // Cursor position relative to display dimensions
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Clamp inside boundaries
    const cx = Math.max(0, Math.min(x, rect.width));
    const cy = Math.max(0, Math.min(y, rect.height));
    
    setMousePos({ x: cx, y: cy });

    // Map to original high-res coordinates
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    const natX = Math.floor(cx * scaleX);
    const natY = Math.floor(cy * scaleY);

    // Read pixel using rapid offscreen context
    try {
      const ctx = offscreenCtxRef.current;
      const pixel = ctx.getImageData(
        Math.max(0, Math.min(natX, img.naturalWidth - 1)), 
        Math.max(0, Math.min(natY, img.naturalHeight - 1)), 
        1, 
        1
      ).data;

      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const hex = rgbToHex(r, g, b);
      
      const newHoverColor = { r, g, b, hex };
      setHoverColor(newHoverColor);

      // Now draw crisp zoom on the Magnifier canvas
      const loupeCanvas = loupeCanvasRef.current;
      if (loupeCanvas) {
        const lCtx = loupeCanvas.getContext('2d');
        if (lCtx) {
          lCtx.imageSmoothingEnabled = false;
          lCtx.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
          
          // Width of grid slice (9x9 grid works best for high clarity)
          const sliceSize = 9;
          const halfSlice = Math.floor(sliceSize / 2);
          
          // Draw standard slice centered at coordinates
          lCtx.drawImage(
            img,
            natX - halfSlice,
            natY - halfSlice,
            sliceSize,
            sliceSize,
            0,
            0,
            loupeCanvas.width,
            loupeCanvas.height
          );

          // Render subtle transparent pixel partitions
          lCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          lCtx.lineWidth = 1;
          const cellWidth = loupeCanvas.width / sliceSize;

          for (let i = 1; i < sliceSize; i++) {
            // vertical gridline
            lCtx.beginPath();
            lCtx.moveTo(i * cellWidth, 0);
            lCtx.lineTo(i * cellWidth, loupeCanvas.height);
            lCtx.stroke();
            
            // horizontal gridline
            lCtx.beginPath();
            lCtx.moveTo(0, i * cellWidth);
            lCtx.lineTo(loupeCanvas.width, i * cellWidth);
            lCtx.stroke();
          }

          // Render targeting indicator around middle center cell
          lCtx.strokeStyle = '#ffffff';
          lCtx.lineWidth = 1.5;
          lCtx.strokeRect(
            halfSlice * cellWidth,
            halfSlice * cellWidth,
            cellWidth,
            cellWidth
          );
          
          // Outer black shadow line to isolate white marker over white pixels
          lCtx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          lCtx.lineWidth = 0.5;
          lCtx.strokeRect(
            halfSlice * cellWidth - 1,
            halfSlice * cellWidth - 1,
            cellWidth + 2,
            cellWidth + 2
          );
        }
      }
    } catch (err) {
      console.error('Error sampling coordinates:', err);
    }
  };

  // Handle capture on click
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverColor) return;
    
    // Set targeted color
    setSelectedColor(hoverColor);
    
    // Add custom expanding ripple at mouse position
    const newRipple = {
      id: Date.now(),
      x: mousePos.x,
      y: mousePos.y,
      color: hoverColor.hex
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Add to palette history list
    addSelectedToHistory(hoverColor);
  };

  // Add sample of color to the list of historical swatches
  const addSelectedToHistory = (color: ColorState) => {
    setHistory(prev => {
      // Avoid duplicate placements adjacent or in general list
      const filtered = prev.filter(c => c.hex !== color.hex);
      const updated = [color, ...filtered].slice(0, 10);
      localStorage.setItem('spectra_color_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove history
  const clearHistoryPalettes = () => {
    setHistory([]);
    localStorage.removeItem('spectra_color_history');
    triggerToast('History cleared successfully');
  };

  // High performance clipboard copy
  const copyStringToClipboard = (text: string, designation: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${designation}: ${text}`);
  };

  // Reset the loaded image state
  const resetWorkspace = () => {
    setImgSrc(null);
    setHoverColor(null);
    setSelectedColor(null);
    setRipples([]);
    offscreenCanvasRef.current = null;
    offscreenCtxRef.current = null;
  };

  // Contrast scores
  const contrastAnalysis = selectedColor 
    ? getContrastAnalysis(selectedColor.r, selectedColor.g, selectedColor.b)
    : null;

  return (
    <div className="min-h-screen w-full ts-page-bg text-slate-800 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Immersive blurred background graphics simulating organic glowing backlights */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-pink-300/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-blue-300/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-300/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[35%] rounded-full bg-teal-200/10 blur-[110px] pointer-events-none" />

      {/* Main glass container */}
      <div className="w-full max-w-2xl bg-white/45 backdrop-blur-xl border border-white/30 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.08)] rounded-[32px] p-6 md:p-8 relative z-10 overflow-hidden flex flex-col gap-6">
        
        {/* Apple-style interface header */}
        <div className="flex items-center justify-between border-b border-slate-200/40 pb-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-600/95 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Spectra v1.2
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Spectra Color Picker
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Local, pixel-accurate eyedropper tools powered by high-speed hardware reading.
            </p>
          </div>

          {imgSrc && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetWorkspace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/50 shadow-sm transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Image
            </motion.button>
          )}
        </div>

        {/* Content switch */}
        <AnimatePresence mode="wait">
          {!imgSrc ? (
            /* Upload / Presets Landpage */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {/* Drag n drop card */}
              <div
                onDragEnter={handleDragEvents}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragEvents}
                onDrop={handleDrop}
                onClick={selectFileManually}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  isDragActive 
                    ? 'border-indigo-500 bg-indigo-50/45 shadow-inner' 
                    : 'border-slate-300/60 hover:border-indigo-400/80 bg-white/30 hover:bg-white/50'
                }`}
              >
                {/* Visual glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />

                <motion.div 
                  className={`p-4 rounded-full transition-all duration-300 ${
                    isDragActive ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                  }`}
                  animate={isDragActive ? { y: [0, -8, 0], transition: { repeat: Infinity, duration: 1.2 } } : {}}
                >
                  <UploadCloud className="h-8 w-8" />
                </motion.div>

                <div className="text-center relative z-10">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                    Click to browse your photos or drag and drop here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts PNG, JPG, WEBP, SVG under 15MB. No files are uploaded to servers.
                  </p>
                </div>
              </div>

              {/* Sample presets panel */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Presampled Design Palettes
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => loadPreset('neon')}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-white/30 hover:bg-white/75 border border-slate-200/50 hover:border-indigo-300/70 hover:shadow-md transition text-left group"
                  >
                    <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-[#ff007f] via-[#7f00ff] to-[#00f0ff] shadow-inner group-hover:scale-[1.02] transition" />
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-700 leading-tight">Neon Dream</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vivid Pinks & Cyans</p>
                    </div>
                  </button>

                  <button
                    onClick={() => loadPreset('earth')}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-white/30 hover:bg-white/75 border border-slate-200/50 hover:border-indigo-300/70 hover:shadow-md transition text-left group"
                  >
                    <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-[#C86A4B] via-[#E5A93B] to-[#2C5E43] shadow-inner group-hover:scale-[1.02] transition" />
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-700 leading-tight">Warm Terracotta</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Earth & Clay Tones</p>
                    </div>
                  </button>

                  <button
                    onClick={() => loadPreset('nordic')}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-white/30 hover:bg-white/75 border border-slate-200/50 hover:border-indigo-300/70 hover:shadow-md transition text-left group"
                  >
                    <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-[#102A43] via-[#486581] to-[#D9CDBC] shadow-inner group-hover:scale-[1.02] transition" />
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-700 leading-tight">Nordic Minimal</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sage, Ocean & Cream</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security info note */}
              <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200/50 text-slate-500 text-xs text-left leading-normal">
                <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>100% Client-Side Privacy:</strong> Spectra reads color hashes inside safe browser memory using native HTML5 Canvas context. Your images remain absolutely offline.
                </p>
              </div>

            </motion.div>
          ) : (
            /* Active Image Color Picker Interface */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {/* Interactive Canvas Viewport Frame */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                    Interactive Active Screen
                  </span>
                  <span>Hover to magnify â€¢ Click to extract</span>
                </div>

                <div 
                  onMouseMove={handleImageMouseMove}
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                  onClick={handleImageClick}
                  className="w-full rounded-2xl bg-slate-100/50 border border-slate-200/40 relative overflow-hidden flex items-center justify-center cursor-none group shadow-inner"
                  style={{ maxHeight: '350px' }}
                >
                  {/* Invisible Image acting as sizing driver and raw buffer */}
                  <img
                    ref={imageRef}
                    src={imgSrc}
                    onLoad={handleVisibleImageLoad}
                    alt="Source viewport"
                    className="w-full h-auto object-contain select-none max-h-[350px] pointer-events-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Absolute coordinate ripples container */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {ripples.map(ripple => (
                      <motion.div
                        key={ripple.id}
                        initial={{ scale: 0, opacity: 1, border: `3px solid ${ripple.color}` }}
                        animate={{ scale: 7, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute rounded-full"
                        style={{
                          left: ripple.x,
                          top: ripple.y,
                          width: '18px',
                          height: '18px',
                          transform: 'translate(-50%, -50%)',
                        }}
                        onAnimationComplete={() => {
                          setRipples(prev => prev.filter(r => r.id !== ripple.id));
                        }}
                      />
                    ))}
                  </div>

                  {/* Circular Magnifying Loupe (Cursor Follower) */}
                  {isHoveringImage && hoverColor && (
                    <div
                      className="absolute rounded-full pointer-events-none shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
                      style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        width: '124px',
                        height: '124px',
                        transform: 'translate(-50%, -50%)',
                        // Outer color band indicator
                        border: `4px solid ${hoverColor.hex}`,
                        outline: '2px solid rgba(0,0,0,0.25)',
                        backgroundColor: '#1e293b',
                        overflow: 'hidden'
                      }}
                    >
                      <canvas
                        ref={loupeCanvasRef}
                        width={124}
                        height={124}
                        className="w-full h-full"
                      />
                      {/* Loupe inner micro readout */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wider border border-white/10 shadow-sm font-mono whitespace-nowrap">
                        {hoverColor.hex}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Interactive Panel Split (Workspace Output controls) */}
              {selectedColor && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column: Big active swatch and contrast checker */}
                  <div className="md:col-span-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Selected Shade</span>
                      <div className="relative group rounded-2xl overflow-hidden shadow-md border border-slate-200/50 aspect-square w-full flex items-center justify-center">
                        <div 
                          className="absolute inset-0 transition-colors duration-200"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        {/* Sample preview text matching actual contrast rating directly */}
                        <div 
                          className="relative z-10 flex flex-col items-center justify-center p-3 text-center"
                          style={{ color: contrastAnalysis?.bestColor === 'white' ? '#FFFFFF' : '#0F172A' }}
                        >
                          <span className="text-xs uppercase tracking-widest font-bold opacity-60">Sample Color</span>
                          <span className="text-xl font-extrabold mt-1 tracking-tight leading-none">Spectra</span>
                        </div>
                      </div>
                    </div>

                    {/* WCAG Contrast panel */}
                    {contrastAnalysis && (
                      <div className="bg-slate-50/70 border border-slate-200/40 rounded-xl p-3 flex flex-col gap-2.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <Contrast className="h-3.5 w-3.5 text-slate-500" />
                          Text Contrast Compatibility
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/85 rounded-lg p-2 border border-slate-200/30 flex flex-col">
                            <span className="text-[10px] text-slate-400">White Typeface</span>
                            <span className="font-bold text-slate-700 mt-0.5">{contrastAnalysis.whiteRatio}:1</span>
                            <span className={`text-[10px] font-semibold mt-0.5 ${contrastAnalysis.whiteScore.includes('Fail') ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {contrastAnalysis.whiteScore}
                            </span>
                          </div>
                          <div className="bg-white/85 rounded-lg p-2 border border-slate-200/30 flex flex-col">
                            <span className="text-[10px] text-slate-400">Black Typeface</span>
                            <span className="font-bold text-slate-700 mt-0.5">{contrastAnalysis.blackRatio}:1</span>
                            <span className={`text-[10px] font-semibold mt-0.5 ${contrastAnalysis.blackScore.includes('Fail') ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {contrastAnalysis.blackScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code outputs copy and Palette records */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    
                    {/* Copy buttons */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Extraction Codes</span>
                      
                      <div className="flex flex-col gap-2.5">
                        {/* HEX code container */}
                        <div 
                          onClick={() => copyStringToClipboard(selectedColor.hex, 'HEX')}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/40 cursor-pointer active:scale-[0.98] transition group "
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 leading-none font-semibold uppercase">Hexcode</span>
                            <span className="text-sm font-bold font-mono text-slate-800 mt-1">{selectedColor.hex}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200/40 text-slate-500 group-hover:text-indigo-600 transition shadow-sm">
                            <Copy className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        {/* RGB code container */}
                        <div 
                          onClick={() => copyStringToClipboard(`rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`, 'RGB')}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/40 cursor-pointer active:scale-[0.98] transition group"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 leading-none font-semibold uppercase">Rgb Format</span>
                            <span className="text-sm font-bold font-mono text-slate-800 mt-1">
                              rgb({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200/40 text-slate-500 group-hover:text-indigo-600 transition shadow-sm">
                            <Copy className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        {/* HSL code container */}
                        {(() => {
                          const hsl = rgbToHsl(selectedColor.r, selectedColor.g, selectedColor.b);
                          const hslString = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                          return (
                            <div 
                              onClick={() => copyStringToClipboard(hslString, 'HSL')}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/40 cursor-pointer active:scale-[0.98] transition group"
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 leading-none font-semibold uppercase">Hsl Format</span>
                                <span className="text-sm font-bold font-mono text-slate-800 mt-1">{hslString}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200/40 text-slate-500 group-hover:text-indigo-600 transition shadow-sm">
                                <Copy className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Color history palette */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                          <History className="h-3 w-3" /> Selected History
                        </span>
                        {history.length > 0 && (
                          <button 
                            onClick={clearHistoryPalettes}
                            className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Clear History
                          </button>
                        )}
                      </div>

                      {history.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                          Captured colors show up here as quick-select panels
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2.5 bg-slate-50/70 border border-slate-200/40 rounded-xl p-3.5">
                          {history.map((color, idx) => (
                            <motion.button
                              key={`${color.hex}-${idx}`}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedColor(color)}
                              className={`w-8 h-8 rounded-full border shadow-sm transition relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                selectedColor.hex === color.hex ? 'ring-2 ring-indigo-500 scale-110 border-white' : 'border-slate-300'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={`${color.hex}`}
                            >
                              {selectedColor.hex === color.hex && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                                  <Check className="h-3 w-3 text-white stroke-[3px]" />
                                </span>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating copied micro notification toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="fixed bottom-6 bg-slate-900 border border-slate-800 text-white font-medium text-xs py-3 px-5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] z-50 flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}


