import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  UploadCloud, 
  X, 
  Trash2, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Layers, 
  Grid, 
  Eye, 
  ArrowDownRight, 
  Type, 
  Sliders, 
  Maximize2 
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

// Preset configurations for swift template applications
const PRESETS = [
  { label: 'CONFIDENTIAL', text: 'CONFIDENTIAL', color: '#ef4444', font: 'Helvetica', rotation: -45, opacity: 25, placement: 'center' },
  { label: 'DRAFT', text: 'DRAFT COPY', color: '#4b5563', font: 'Helvetica', rotation: -45, opacity: 20, placement: 'center' },
  { label: 'SECURE GRID', text: 'DO NOT DUPLICATE', color: '#b45309', font: 'Courier', rotation: -30, opacity: 15, placement: 'grid' },
  { label: 'COPYRIGHT', text: 'Â© COPYRIGHT SECURED', color: '#1d4ed8', font: 'Times', rotation: 0, opacity: 40, placement: 'corner' },
];

// Color slate options
const COLOR_PRESETS = [
  { hex: '#4b5563', name: 'Slate Gray' },
  { hex: '#ef4444', name: 'Crimson Red' },
  { hex: '#1d4ed8', name: 'Corporate Blue' },
  { hex: '#15803d', name: 'Forest Green' },
  { hex: '#b45309', name: 'Luxury Amber' },
];

export default function App() {
  // App primary states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMetadata, setPdfMetadata] = useState<{ name: string; size: string; pages: number } | null>(null);
  
  // Custom watermark parameters
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [selectedFont, setSelectedFont] = useState<'Helvetica' | 'Times' | 'Courier'>('Helvetica');
  const [selectedColor, setSelectedColor] = useState('#4b5563');
  const [customColor, setCustomColor] = useState('#4b5563');
  const [isCustomColorActive, setIsCustomColorActive] = useState(false);
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(-45);
  const [placementMode, setPlacementMode] = useState<'center' | 'grid' | 'corner'>('center');

  // Interactive Drag & Drop States
  const [isDragActive, setIsDragActive] = useState(false);

  // Status & Progress States
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedFileName, setSavedFileName] = useState('');
  const [savedBlobUrl, setSavedBlobUrl] = useState('');

  // File picker reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic file formatter
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Safe color interpreter for Hex -> pdf-lib Decimal RGB
  const hexToPdfRgb = (hex: string) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
    return rgb(r, g, b);
  };

  // Process the uploaded PDF file to extract page counts and validity
  const loadPdfMetadata = async (file: File) => {
    setError(null);
    setSuccess(false);
    setProgress(0);
    
    if (file.type !== 'application/pdf') {
      setError('Unsupported file type. Please upload a standard PDF document.');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Load document structure in background
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPageCount();
      
      setPdfFile(file);
      setPdfMetadata({
        name: file.name,
        size: formatFileSize(file.size),
        pages: pages
      });
    } catch (err: any) {
      console.error(err);
      setError('Unable to parse PDF. The file may be password-protected or corrupted.');
    }
  };

  // Drag handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadPdfMetadata(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadPdfMetadata(file);
    }
  };

  const resetUploader = () => {
    setPdfFile(null);
    setPdfMetadata(null);
    setSuccess(false);
    setError(null);
    setProgress(0);
    if (savedBlobUrl) {
      URL.revokeObjectURL(savedBlobUrl);
      setSavedBlobUrl('');
    }
  };

  // Apply quick master presets
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setWatermarkText(preset.text);
    setSelectedColor(preset.color);
    setIsCustomColorActive(false);
    setSelectedFont(preset.font as any);
    setRotation(preset.rotation);
    setOpacity(preset.opacity);
    setPlacementMode(preset.placement as any);
  };

  // Complete mathematical multi-page watermarker routine using pdf-lib
  const applyWatermarkToPdf = async () => {
    if (!pdfFile) return;

    setProcessing(true);
    setError(null);
    setProgress(15);

    try {
      const activeColor = isCustomColorActive ? customColor : selectedColor;
      const existingPdfBytes = await pdfFile.arrayBuffer();
      setProgress(40);

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      setProgress(60);

      // Map dynamic embed fonts matching select
      let embeddedFont;
      if (selectedFont === 'Courier') {
        embeddedFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
      } else if (selectedFont === 'Times') {
        embeddedFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      } else {
        embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      }

      const pages = pdfDoc.getPages();
      const col = hexToPdfRgb(activeColor);
      const rad = (rotation * Math.PI) / 180;
      const opacityDecimal = opacity / 100;

      for (let index = 0; index < pages.length; index++) {
        const page = pages[index];
        const { width, height } = page.getSize();

        if (placementMode === 'center') {
          // Calculate font dimensions
          const textWidth = embeddedFont.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = embeddedFont.heightAtSize(fontSize);

          // Center coordinate grid
          const cx = width / 2;
          const cy = height / 2;

          // Precision trigonometric positioning equations.
          // Maps bottom-left render coordinates pivot perfectly about visual center.
          const cosT = Math.cos(rad);
          const sinT = Math.sin(rad);
          const x = cx - ((textWidth / 2) * cosT - (textHeight / 2) * sinT);
          const y = cy - ((textWidth / 2) * sinT + (textHeight / 2) * cosT);

          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font: embeddedFont,
            color: col,
            opacity: opacityDecimal,
            rotate: degrees(rotation),
          });
        } else if (placementMode === 'grid') {
          // Dynamic repeating matrix coordinates
          const stepX = Math.max(200, fontSize * 4.5);
          const stepY = Math.max(140, fontSize * 3.5);
          
          for (let xOffset = 40; xOffset < width; xOffset += stepX) {
            for (let yOffset = 50; yOffset < height; yOffset += stepY) {
              page.drawText(watermarkText, {
                x: xOffset,
                y: yOffset,
                size: fontSize * 0.45, // grid items slightly scaled back
                font: embeddedFont,
                color: col,
                opacity: opacityDecimal * 0.75, // soft grid blend
                rotate: degrees(rotation),
              });
            }
          }
        } else {
          // Bottom-Right signature stamp
          const textWidth = embeddedFont.widthOfTextAtSize(watermarkText, fontSize * 0.45);
          page.drawText(watermarkText, {
            x: width - textWidth - 28,
            y: 28,
            size: fontSize * 0.45,
            font: embeddedFont,
            color: col,
            opacity: opacityDecimal,
            rotate: degrees(0), // Keep footers flat for maximum elegance
          });
        }

        // Progress increment
        setProgress(Math.round(60 + (30 * (index + 1)) / pages.length));
      }

      const pdfBytes = await pdfDoc.save();
      setProgress(95);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const newName = pdfFile.name.replace(/\.pdf$/i, '_watermarked.pdf');
      setSavedBlobUrl(downloadUrl);
      setSavedFileName(newName);

      // Trigger standard in-browser download
      const downloader = document.createElement('a');
      downloader.href = downloadUrl;
      downloader.download = newName;
      document.body.appendChild(downloader);
      downloader.click();
      document.body.removeChild(downloader);

      setProgress(100);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failure writing watermarks. Check file parameters.');
    } finally {
      setProcessing(false);
    }
  };

  const activeColorValue = isCustomColorActive ? customColor : selectedColor;

  return (
    <div className="min-h-screen ts-page-bg flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 font-sans overflow-x-hidden relative">
      
      {/* Backdrops - luxury floating blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Core */}
      <div className="w-full flex-1 flex items-center justify-center z-10 py-6">
        <div id="watermarker-card" className="bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-xl transition-all duration-300">
          
          {/* Header branding block */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-white/60 shadow-xs mb-3 text-indigo-600 font-medium text-xs tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Client-Side</span>
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600 animate-pulse" />
              <span>PDF Watermarker</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
              Overlay beautiful text onto your documents completely offline. Your files never touch a server.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* View 1: Unselected Upload Area / Success Area */}
            {!pdfFile && !success && (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Drag zone container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${
                    isDragActive 
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-inner' 
                      : 'border-slate-300/80 bg-white/20 hover:border-indigo-400 hover:bg-white/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800 text-base">
                    Drag and drop your PDF
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    or click to search computer directories
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 bg-white/50 border border-white/60 rounded-md px-2.5 py-1">
                    <FileText className="w-3 h-3 text-indigo-500" />
                    <span>Supports PDF files up to 100MB</span>
                  </div>
                </div>

                {/* Direct Presets Hint */}
                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Standard:</strong> This utility utilizes standard browser APIs. Documents stay securely isolated inside your temporary browser cache.
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error Message banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-center gap-2.5 mb-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="flex-1 font-medium">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* View 2: Watermarker Active Settings Pane */}
            {pdfFile && !success && (
              <motion.div
                key="config-pane"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Active file status card */}
                <div className="bg-slate-900/5 hover:bg-slate-900/10 border border-slate-200/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-800 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate text-slate-800">{pdfMetadata?.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{pdfMetadata?.size}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="font-medium text-slate-600">{pdfMetadata?.pages} pages</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetUploader}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white/80 rounded-xl transition-all shadow-xs shrink-0"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-Layout: Live Aspect PDF Preview & Config controls stacked */}
                <div className="space-y-5">
                  
                  {/* Real-time Document Mockup Simulator */}
                  <div className="bg-slate-900/5 border border-slate-200/50 rounded-2xl p-4 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400ID" />
                        Live Layout Simulator
                      </span>
                      <span>Page 1 of {pdfMetadata?.pages}</span>
                    </div>

                    {/* Paper Container */}
                    <div className="relative w-full max-w-[210px] aspect-[1/1.414] bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden select-none p-3.5 flex flex-col justify-between transition-shadow duration-300">
                      
                      {/* Fake header writing */}
                      <div className="flex justify-between items-center opacity-30 select-none">
                        <div className="h-1.5 w-16 bg-slate-400 rounded-xs" />
                        <div className="h-1.5 w-6 bg-slate-400 rounded-xs" />
                      </div>

                      {/* Fake body lines representing printed text */}
                      <div className="space-y-3.5 my-3 pointer-events-none opacity-15">
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-slate-400 rounded-xs" />
                          <div className="h-2 w-5/6 bg-slate-400 rounded-xs" />
                          <div className="h-2 w-11/12 bg-slate-400 rounded-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-slate-400 rounded-xs" />
                          <div className="h-2 w-4/6 bg-slate-400 rounded-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-5/6 bg-slate-400 rounded-xs" />
                          <div className="h-2 w-11/12 bg-slate-400 rounded-xs" />
                          <div className="h-2 w-2/3 bg-slate-400 rounded-xs" />
                        </div>
                      </div>

                      {/* Floating Watermark Layer */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                        
                        {placementMode === 'center' && (
                          <div 
                            style={{ 
                              transform: `rotate(${rotation}deg)`,
                              opacity: opacity / 100,
                              color: activeColorValue,
                              fontFamily: selectedFont === 'Courier' ? 'monospace' : selectedFont === 'Times' ? 'serif' : 'sans-serif',
                              fontSize: `${Math.min(18, Math.max(8, fontSize / 3.8))}px`
                            }}
                            className="font-bold text-center select-none whitespace-nowrap transition-all duration-150 tracking-wider"
                          >
                            {watermarkText || 'WATERMARK'}
                          </div>
                        )}

                        {placementMode === 'grid' && (
                          <div className="w-full h-full p-2 flex flex-col justify-around absolute inset-0 select-none opacity-30">
                            {[0, 1, 2].map((row) => (
                              <div key={row} className="flex justify-around">
                                {[0, 1].map((col) => (
                                  <div 
                                    key={col}
                                    style={{ 
                                      transform: `rotate(${rotation}deg)`,
                                      opacity: opacity / 100,
                                      color: activeColorValue,
                                      fontFamily: selectedFont === 'Courier' ? 'monospace' : selectedFont === 'Times' ? 'serif' : 'sans-serif',
                                      fontSize: `${Math.min(11, Math.max(6, fontSize / 5.5))}px`
                                    }}
                                    className="font-bold whitespace-nowrap transition-all duration-150 select-none"
                                  >
                                    {watermarkText || 'WATERMARK'}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {placementMode === 'corner' && (
                          <div 
                            style={{ 
                              opacity: opacity / 100,
                              color: activeColorValue,
                              fontFamily: selectedFont === 'Courier' ? 'monospace' : selectedFont === 'Times' ? 'serif' : 'sans-serif',
                              fontSize: `${Math.min(10, Math.max(5, fontSize / 5.5))}px`
                            }}
                            className="font-bold absolute bottom-2.5 right-2.5 flex items-center gap-0.5 select-none text-right whitespace-nowrap transition-all duration-150 max-w-[80%]"
                          >
                            <span>{watermarkText || 'WATERMARK'}</span>
                            <ArrowDownRight className="w-2.5 h-2.5 opacity-55" />
                          </div>
                        )}

                      </div>

                      {/* Fake footer writing */}
                      <div className="flex justify-between items-center opacity-30 select-none">
                        <div className="h-1.5 w-12 bg-slate-400 rounded-xs" />
                        <div className="h-1.5 w-4 bg-slate-400 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Configuration Parameter Controls */}
                  <div className="bg-white/75 border border-white/60 rounded-2xl p-5 space-y-4 shadow-xs">
                    
                    {/* Presets Toolbar shortcut */}
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1 mb-2">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        Quick Presets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-indigo-50/50" />

                    {/* Watermark text string input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between items-center">
                        <span>Watermark Text</span>
                        <span className="text-[10px] font-mono text-slate-400 lowercase">{watermarkText.length}/30 chars</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={30}
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. STRICTLY CONFIDENTIAL"
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 placeholder-slate-400 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Font Family Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Type className="w-3 h-3 text-slate-400" />
                        <span>Font Variant</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        {(['Helvetica', 'Times', 'Courier'] as const).map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => setSelectedFont(font)}
                            className={`py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                              selectedFont === font
                                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                            }`}
                          >
                            {font === 'Helvetica' ? 'Classic Sans' : font === 'Times' ? 'Editorial Serif' : 'Technical Mono'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Placements buttons layout indicators */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Grid className="w-3 h-3 text-slate-400" />
                          Placement Alignment
                        </span>
                        <span className="text-[10px] font-mono capitalize text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {placementMode === 'center' ? 'single center' : placementMode === 'grid' ? 'full matrix' : 'footer stamp'}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        {(['center', 'grid', 'corner'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPlacementMode(mode)}
                            className={`py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                              placementMode === mode
                                ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-100'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                            }`}
                          >
                            {mode === 'center' ? 'Center' : mode === 'grid' ? 'Grid Matrix' : 'Bottom-Right'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Range Sliders Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Opacity slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <span>Opacity</span>
                          <span className="font-mono text-indigo-600">{opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          step="5"
                          value={opacity}
                          onChange={(e) => setOpacity(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-ew-resize opacity-85 hover:opacity-100 transition-opacity"
                        />
                      </div>

                      {/* Font size slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <span>Scale Size</span>
                          <span className="font-mono text-indigo-600">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="100"
                          step="2"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-ew-resize opacity-85 hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Rotation degrees slider */}
                      <div className={placementMode === 'corner' ? 'opacity-45 pointer-events-none' : ''}>
                        <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            <RotateCw className="w-3 h-3 text-slate-400" />
                            Rotation Axis
                          </span>
                          <span className="font-mono text-indigo-600">{rotation}Â°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={rotation}
                          onChange={(e) => setRotation(Number(e.target.value))}
                          disabled={placementMode === 'corner'}
                          className="w-full accent-indigo-600 cursor-ew-resize opacity-85 hover:opacity-100 transition-opacity"
                        />
                      </div>

                      {/* Color Palette Choices */}
                      <div>
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Aesthetic Color
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                            {COLOR_PRESETS.map((col) => (
                              <button
                                key={col.hex}
                                type="button"
                                onClick={() => {
                                  setSelectedColor(col.hex);
                                  setIsCustomColorActive(false);
                                }}
                                style={{ backgroundColor: col.hex }}
                                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                  !isCustomColorActive && selectedColor === col.hex
                                    ? 'ring-2 ring-indigo-500 ring-offset-2 border-transparent scale-110'
                                    : 'border-slate-300 hover:scale-105'
                                }`}
                                title={col.name}
                              />
                            ))}

                            {/* Color Selector */}
                            <label className="relative flex items-center justify-center cursor-pointer select-none">
                              <input
                                type="color"
                                value={customColor}
                                onChange={(e) => {
                                  setCustomColor(e.target.value);
                                  setIsCustomColorActive(true);
                                }}
                                className="sr-only"
                              />
                              <div 
                                style={{ backgroundColor: isCustomColorActive ? customColor : '#ffffff' }}
                                className={`w-5 h-5 rounded-full border border-slate-300 transition-all hover:scale-105 flex items-center justify-center bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-orange-400 via-rose-500 to-indigo-600`}
                                title="Custom Hex Picker"
                              >
                                {isCustomColorActive && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow-xs" />
                                )}
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Progress rendering state bar container */}
                {processing && (
                  <div className="bg-white/80 border border-slate-200/50 p-4 rounded-2xl shadow-xs space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        Rendering Watermarks offline...
                      </span>
                      <span className="font-mono text-indigo-700 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/20">
                      <motion.div
                        className="bg-indigo-600 h-2 rounded-full shadow-xs"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Apply execution download luxury button button */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={applyWatermarkToPdf}
                  disabled={processing}
                  className="w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-45 disabled:pointer-events-none transition-all"
                >
                  <Download className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Apply Watermark & Download</span>
                </motion.button>

              </motion.div>
            )}

            {/* View 3: Complete Success confirmation screen */}
            {success && (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center py-6 space-y-5"
              >
                {/* Successful visual splash */}
                <div className="relative inline-block">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="p-4 bg-green-50 text-green-600 rounded-full border border-green-100 shadow-xl inline-flex relative z-10"
                  >
                    <CheckCircle2 className="w-14 h-14" />
                  </motion.div>
                  {/* CSS Sparkles particles ring */}
                  <div className="absolute top-0 left-0 w-full h-full bg-green-400/20 rounded-full scale-150 blur-xl animate-ping opacity-45 pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                    Document Watermarked!
                  </h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Your new document has been generated and successfully saved locally via your downloads directory.
                  </p>
                </div>

                {/* Final download result report */}
                <div className="bg-white/80 border border-slate-100 rounded-2xl p-4 max-w-sm mx-auto shadow-xs text-left">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 block mb-1.5 uppercase p-0.5">
                    Merged File Output
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-green-50 text-green-700 rounded-xl size-10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={savedFileName}>
                        {savedFileName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Pages processed: <span className="font-medium text-slate-700">{pdfMetadata?.pages}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Double download or Reset buttons workflow */}
                <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
                  <button
                    onClick={() => {
                      if (savedBlobUrl) {
                        const link = document.createElement('a');
                        link.href = savedBlobUrl;
                        link.download = savedFileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold py-2.5 rounded-xl text-white text-sm shadow-md transition-colors cursor-pointer"
                  >
                    Download Output Again
                  </button>
                  
                  <button
                    onClick={resetUploader}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer border border-slate-200/50"
                  >
                    Watermark Another Document
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Humble Footer brand detail */}
      <footer className="w-full max-w-xl mx-auto text-center mt-6 text-[11px] text-slate-400 select-none pb-4">
        <p>
          Secure Browser Utility â€¢ Compliant with PDF-v1.7 Specifications â€¢ Powered by <span className="font-semibold text-indigo-500">pdf-lib</span>
        </p>
      </footer>

    </div>
  );
}


