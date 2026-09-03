import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Download, FileCode, CheckCircle, AlertCircle, 
  Settings, Image, Layers, Sparkles, RefreshCw, X, ArrowRight
} from 'lucide-react';

const DEFAULT_SVG = `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
  </defs>
  
  <!-- Ambient background glow -->
  <circle cx="50" cy="50" r="45" fill="url(#glow)"/>
  
  <!-- Premium stylized abstract checkmark shield -->
  <rect x="20" y="20" width="60" height="60" rx="16" fill="url(#blueGrad)" shadow="0 10px 20px rgba(59,130,246,0.3)"/>
  <path d="M40 50L47 57L62 42" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

export default function App() {
  const [svgInput, setSvgInput] = useState<string>(DEFAULT_SVG);
  const [fileName, setFileName] = useState<string>('vector_graphic');
  const [scale, setScale] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse direct dimensions of input SVGs
  const parseDimensions = (svg: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return { width: 300, height: 300 };

      let width = 300;
      let height = 300;

      const wAttr = svgEl.getAttribute('width');
      const hAttr = svgEl.getAttribute('height');
      const viewBox = svgEl.getAttribute('viewBox');

      if (wAttr && !wAttr.includes('%')) {
        width = parseFloat(wAttr);
      } else if (viewBox) {
        const parts = viewBox.trim().split(/\s+/);
        if (parts.length === 4) {
          width = parseFloat(parts[2]);
        }
      }

      if (hAttr && !hAttr.includes('%')) {
        height = parseFloat(hAttr);
      } else if (viewBox) {
        const parts = viewBox.trim().split(/\s+/);
        if (parts.length === 4) {
          height = parseFloat(parts[3]);
        }
      }

      return { width, height };
    } catch (e) {
      return { width: 300, height: 300 };
    }
  };

  const dimensions = parseDimensions(svgInput);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setError('Invalid file format. Please drop or specify a valid vector .svg file.');
      return;
    }
    setError(null);
    setFileName(file.name.replace(/\.svg$/i, ''));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSvgInput(text);
      setSuccess('SVG file loaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    };
    reader.readAsText(file);
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (!svgInput.trim()) {
      setError('The SVG workspace is currently empty.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const { width, height } = parseDimensions(svgInput);
      const canvas = document.createElement('canvas');
      
      const targetWidth = width * scale;
      const targetHeight = height * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not retrieve browser 2D rendering canvas context.');

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Clean raw input and verify namespace compatibility
      let processedSvg = svgInput.trim();
      if (!processedSvg.match(/xmlns=['"]http:\/\/www\.w3\.org\/2000\/svg['"]/)) {
        processedSvg = processedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${fileName || 'vector_graphic'}_${scale}x.png`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
        setIsConverting(false);
        setSuccess('Rasterized PNG downloaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      };

      img.onerror = () => {
        setError('High-DPI rasterization failed. Check if your SVG string contains complex external fonts, stylesheets or invalid XML formatting.');
        URL.revokeObjectURL(url);
        setIsConverting(false);
      };

      img.src = url;
    } catch (err: any) {
      setError(err?.message || 'Drawing pipeline failed.');
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setSvgInput(DEFAULT_SVG);
    setFileName('vector_graphic');
    setScale(2);
    setError(null);
    setSuccess('Restored default workspace.');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Safe object URL preview of active work
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    try {
      let processedSvg = svgInput.trim();
      if (!processedSvg) return;
      if (!processedSvg.match(/xmlns=['"]http:\/\/www\.w3\.org\/2000\/svg['"]/)) {
        processedSvg = processedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      // Ignore preview rebuild errors
    }
  }, [svgInput]);

  return (
    <div className="min-h-screen\ ts-page-bg flex items-center justify-center p-4 md:p-8 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Absolute Header Info (Pure premium aesthetics) */}
      <div className="absolute top-6 left-6 hidden md:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-450 font-mono">
          GPU RASTER ENGINE ONLINE
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-6 sm:p-10 flex flex-col gap-6"
      >
        
        {/* Header Section */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            High DPI Rasterizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">SVG to PNG</h1>
          <p className="text-slate-505 text-sm sm:text-base font-light text-slate-500">
            Convert scalable vector paths into lossless raster graphics
          </p>
        </div>

        {/* Input Toggle Tabs */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4 text-slate-500" />
            Paste Raw Code
          </button>
        </div>

        {/* Dynamic Warning Notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200/80 text-rose-800 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm text-xs leading-relaxed"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Box */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[1.7rem] opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <div className="relative bg-white/60 border border-slate-200 rounded-[1.7rem] overflow-hidden p-4 min-h-[160px] flex flex-col justify-between">
            {activeTab === 'upload' ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-blue-550 bg-blue-50/20' 
                    : 'border-slate-300 hover:border-blue-450 hover:bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 text-blue-500 shadow-sm border border-blue-100/50">
                  <Upload className="w-6 h-6" />
                </div>
                
                <p className="text-slate-750 font-bold text-center text-sm md:text-base">
                  Paste vector workspace or drop SVG
                </p>
                <p className="text-slate-400 text-xs mt-1 text-center">
                  Supports standard vector files up to 5MB
                </p>

                {fileName !== 'vector_graphic' && (
                  <div className="mt-3.5 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-bold flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{fileName}.svg</span>
                  </div>
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".svg,image/svg+xml"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2 flex-1">
                <textarea
                  value={svgInput}
                  onChange={(e) => {
                    setError(null);
                    setSvgInput(e.target.value);
                  }}
                  rows={6}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner resize-y leading-relaxed"
                  placeholder="Paste your raw XML <svg> code here..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Configurations Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Controls Column */}
          <div className="flex flex-col gap-5 bg-white/40 p-5 rounded-[1.7rem] border border-white/20">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-widest font-mono">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Export Scale
              </label>
              
              <div className="space-y-4 mt-3">
                <input 
                  type="range" 
                  min="1" 
                  max="4" 
                  step="1"
                  value={scale} 
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                
                <div className="flex justify-between text-[11px] font-extrabold text-slate-400 px-1">
                  {['1x', '2x', '3x', '4x'].map((val, i) => (
                    <span 
                      key={val} 
                      className={scale === i + 1 ? "text-blue-600 underline underline-offset-4 decoration-2" : ""}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scale calculations */}
            <div className="pt-2 border-t border-slate-200/50">
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Render Resolution</span>
                  <span className="text-slate-800 font-bold font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">
                    {Math.round(dimensions.width * scale)} &times; {Math.round(dimensions.height * scale)} px
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Source Size</span>
                  <span className="text-slate-600 font-mono">
                    {dimensions.width} &times; {dimensions.height}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Real-time preview panel */}
          <div className="flex flex-col gap-2.5 bg-white/40 p-5 rounded-[1.7rem] border border-white/20 h-full">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-widest font-mono">
              <Image className="w-3.5 h-3.5 text-slate-500" />
              Real-time Preview
            </span>
            
            <div className="flex-1 min-h-[141px] rounded-2xl bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZEACDAwM/8G4AAzDOKAZYFwYBySADIAIAwAAoAsB06vYqgAAAABJRU5ErkJggg==')] bg-repeat border border-slate-200 flex items-center justify-center p-4 relative group">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="SVG Preview" 
                  className="max-h-[110px] w-auto max-w-full object-contain filter drop-shadow-md select-none pointer-events-none" 
                />
              ) : (
                <span className="text-slate-400 text-xs">Awaiting valid graphic...</span>
              )}

              {/* Reset to Default trigger */}
              <button
                onClick={handleReset}
                title="Reset Workspace"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 shadow-sm border border-slate-200 transition opacity-0 group-hover:opacity-100 duration-300"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        {/* Action Rasterize Button */}
        <button
          onClick={handleDownload}
          disabled={isConverting}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-2xl font-extrabold text-lg shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-slate-400"
        >
          {isConverting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Compiling Canvas...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 text-indigo-300" />
              <span>Download PNG</span>
            </>
          )}
        </button>

        {/* Footer info badges */}
        <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-t border-slate-200/50 pt-5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Local Compiler
          </span>
          <span>•</span>
          <span>Lossless HD</span>
          <span>•</span>
          <span>DPI Multiplier</span>
        </div>

      </motion.div>
    </div>
  );
}

