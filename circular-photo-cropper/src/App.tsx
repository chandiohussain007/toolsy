import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Trash2, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Grid, 
  Image as ImageIcon,
  MessageSquare,
  Twitter,
  Linkedin,
  Eye,
  Camera,
  Layers,
  Info
} from 'lucide-react';

// Preset filters for premium Apple-like styling
interface CreativeFilter {
  id: string;
  name: string;
  css: string;
  canvas: string;
}

const FILTERS: CreativeFilter[] = [
  { id: 'original', name: 'Original', css: 'none', canvas: 'none' },
  { id: 'noir', name: 'Noir (Crisp B&W)', css: 'grayscale(100%) contrast(120%) brightness(100%)', canvas: 'grayscale(100%) contrast(120%) brightness(100%)' },
  { id: 'warm', name: 'Golden Hour', css: 'sepia(25%) saturate(140%) contrast(105%) brightness(103%)', canvas: 'sepia(25%) saturate(140%) contrast(105%) brightness(103%)' },
  { id: 'cool', name: 'Nordic Blue', css: 'saturate(90%) hue-rotate(10deg) contrast(105%) brightness(98%)', canvas: 'saturate(90%) hue-rotate(10deg) contrast(105%) brightness(98%)' },
  { id: 'cyber', name: 'Glaze', css: 'saturate(130%) contrast(115%) brightness(102%)', canvas: 'saturate(130%) contrast(115%) brightness(102%)' },
];

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  
  // Crop adjustments
  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // in degrees: 0, 90, 180, 270
  
  // Custom interactive settings
  const [gridLines, setGridLines] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<CreativeFilter>(FILTERS[0]);
  const [linkedinBadge, setLinkedinBadge] = useState<boolean>(false);
  const [simulatorTab, setSimulatorTab] = useState<'slack' | 'twitter' | 'linkedin'>('slack');
  
  // Drag states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  
  // References
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unsplash safe, pre-configured high-res demo picture loaded with proper CORS support
  const demoPhotoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000';

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Handle load metadata
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    // Reset positions
    setPosition({ x: 0, y: 0 });
    setScale(1.0);
    setRotation(0);
  };

  // Convert File object to local url
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeInMB} MB`);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const loadDemoPhoto = () => {
    setFileName('demo-portrait.jpg');
    setFileSize('1.45 MB');
    setImageSrc(demoPhotoUrl);
  };

  // Dragging event handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!imageSrc) return;
    setIsDragging(true);
    dragStart.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !imageSrc) return;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Compute scale fitted values
  const isLandscape = naturalSize.width > naturalSize.height;
  const initialWidth = isLandscape ? 288 * (naturalSize.width / naturalSize.height) : 288;
  const initialHeight = isLandscape ? 288 : 288 * (naturalSize.height / naturalSize.width);

  // Download high-resolution Canvas cropped output
  const handleDownload = () => {
    if (!imageSrc || !imgRef.current) return;
    
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const EXPORT_SIZE = 1000; // pristine size for avatars
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Transparent Background representation
    ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    
    // Clip transparent Circle Mask
    ctx.beginPath();
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    
    // Scale modifier from 288px container to canvas output
    const F = EXPORT_SIZE / 288;
    
    // We translate coordinates to the canvas center (500, 500)
    ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2);
    
    // Apply visual positional offset scaled up by F
    ctx.translate(position.x * F, position.y * F);
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply scale multiplier
    ctx.scale(scale, scale);
    
    // Apply creative preset filters inside the exported canvas itself
    if (activeFilter.canvas !== 'none') {
      ctx.filter = activeFilter.canvas;
    }
    
    // Base width/height mapping
    const drawW = initialWidth * F;
    const drawH = initialHeight * F;
    
    // Draw centered image relative to transform origin
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    // Apply LinkedIn #OpenToWork Badge Overlay if active
    if (linkedinBadge) {
      ctx.restore(); // reset filters/translate back for the fixed overlay paint
      // Save canvas state before drawing fixed badge
      ctx.save();
      
      // Draw Linkedin Green #OpenToWork Curved Accent Ribbon along bottom arc
      const badgeColor = '#02825c';
      ctx.beginPath();
      // Outer border arc
      ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0.45 * Math.PI, 1.05 * Math.PI);
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 110; // Bold noticeable banner ring
      ctx.stroke();

      // Draw beautiful text on the outer badge circle
      ctx.font = 'bold 34px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Since drawing text along curved path on raw canvas is verbose, we output clean bold graphic text over the arc nicely!
      // Add stylish secondary white layout helper
      ctx.beginPath();
      ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0.45 * Math.PI, 1.05 * Math.PI);
      ctx.restore();
    }
    
    // Trigger download
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = fileName ? `circular-${fileName.split('.')[0]}.png` : 'cropped-circular-avatar.png';
    link.href = dataUrl;
    link.click();
  };

  // Reset adjustments
  const handleReset = () => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setActiveFilter(FILTERS[0]);
    setLinkedinBadge(false);
  };

  return (
    <div 
      className="min-h-screen\ ts-page-bg relative flex flex-col items-center justify-center p-4 py-12 select-none overflow-y-auto antialiased"
      style={{
        backgroundImage: 'radial-gradient(circle at 0% 0%, #ffffff 0%, transparent 50%), radial-gradient(circle at 100% 100%, #d1d5db 0%, transparent 50%)'
      }}
    >
      {/* Main Immersive Glass Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        id="cropper-container"
        className="w-full max-w-lg bg-white/40 backdrop-blur-xl border border-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] p-8 md:p-10 flex flex-col items-center relative"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Edit Profile Photo</h1>
          <p className="text-gray-500 text-sm mt-1">Drag to position and zoom to fit</p>
        </div>

        {/* Workspace Container */}
        <AnimatePresence mode="wait">
          {!imageSrc ? (
            /* FILE UPLOAD DROP-ZONE */
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.2 }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-72 h-72 border-2 border-dashed rounded-full flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 ${
                dragOver 
                  ? 'border-indigo-500 bg-indigo-50/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'border-gray-300 bg-white/30 hover:border-gray-400 hover:bg-white/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden" 
              />
              <motion.div 
                animate={{ y: dragOver ? -4 : 0 }}
                className="bg-white p-3.5 rounded-full shadow-sm text-gray-800 border border-slate-100 mb-2"
              >
                <Upload className="w-5 h-5 text-gray-500" />
              </motion.div>
              <span className="font-semibold text-xs text-gray-900">Upload Photo</span>
              <span className="text-[10px] text-gray-400 mt-1">Drag file or click</span>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadDemoPhoto();
                }}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-medium hover:bg-gray-800 transition-all shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" /> Try Demo Portrait
              </button>
            </motion.div>
          ) : (
            /* ACTIVE IMAGE WORKSPACE */
            <motion.div
              key="cropper"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex flex-col items-center w-full"
            >
              {/* Image Editor Viewport inside a gorgeous w-72 h-72 frame */}
              <div 
                ref={viewportRef}
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart ? (e) => {
                  if (e.touches.length === 1) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                } : undefined}
                onTouchMove={handleDragMove ? (e) => {
                  if (e.touches.length === 1) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                } : undefined}
                onTouchEnd={handleDragEnd}
                className="relative w-72 h-72 rounded-full border-4 border-white shadow-inner bg-gray-100 flex items-center justify-center overflow-hidden cursor-grab select-none active:cursor-grabbing"
              >
                {/* Checkerboard Backdrop Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:10px_10px] [background-position:0_0,0_5px,5px_-5px,-5px_0] opacity-40" />

                {/* Cropped Target Image Element */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    alt="Active target portrait"
                    draggable={false}
                    className="max-w-none origin-center"
                    style={{
                      width: initialWidth,
                      height: initialHeight,
                      transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                      filter: activeFilter.css,
                      pointerEvents: 'none'
                    }}
                  />
                </div>

                {/* Subtle Guidelines Overlay (Rule of Thirds) */}
                <AnimatePresence>
                  {gridLines && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10"
                    >
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-r border-b border-white"></div>
                        <div className="border-b border-white"></div>
                        <div className="border-r border-white"></div>
                        <div className="border-r border-white"></div>
                        <div></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* LinkedIn #OpenToWork badge circular banner overlay */}
                {linkedinBadge && (
                  <div 
                    className="absolute inset-0 rounded-full border-[15px] border-emerald-600 pointer-events-none z-20"
                    style={{
                      clipPath: 'polygon(0% 64%, 100% 64%, 100% 100%, 0% 100%)'
                    }}
                  />
                )}

                {/* Indicator Overlay badge */}
                <div className="absolute bottom-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono text-white tracking-wider uppercase select-none pointer-events-none z-30">
                  {naturalSize.width} Ã— {naturalSize.height} PX
                </div>
              </div>

              {/* Adjustments Tool Control Suite */}
              <div className="w-full mt-8 space-y-6">
                
                {/* Zoom Control Slider */}
                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-3.5 rounded-2xl border border-white/40 shadow-sm">
                  <ZoomOut className="w-4 h-4 text-gray-400 select-none" />
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer accent-indigo-600 focus:outline-none"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-400 select-none" />
                  <span className="text-xs font-semibold text-gray-500 w-8 text-right">
                    {scale.toFixed(1)}x
                  </span>
                </div>

                {/* Controls grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    title="Rotate 90 degrees"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="h-12 inline-flex flex-col items-center justify-center rounded-xl bg-white/50 hover:bg-white/80 border border-white text-gray-700 font-medium transition-all shadow-sm group"
                  >
                    <RotateCw className="w-4 h-4 text-gray-500 group-hover:rotate-45 transition-all" />
                    <span className="text-[10px] text-gray-500 mt-1 font-medium select-none">Rotate</span>
                  </button>

                  <button
                    type="button"
                    title="Toggle grid guidelines"
                    onClick={() => setGridLines(!gridLines)}
                    className={`h-12 inline-flex flex-col items-center justify-center rounded-xl border transition-all shadow-sm ${
                      gridLines 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white/50 hover:bg-white/80 border-white text-gray-700'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span className={`text-[10px] mt-1 font-medium select-none ${gridLines ? 'text-white/95' : 'text-gray-500'}`}>Grid</span>
                  </button>

                  <button
                    type="button"
                    title="Apply LinkedIn ribbon badge"
                    onClick={() => setLinkedinBadge(!linkedinBadge)}
                    className={`h-12 inline-flex flex-col items-center justify-center rounded-xl border transition-all shadow-sm ${
                      linkedinBadge 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'bg-white/50 hover:bg-white/80 border-white text-gray-700'
                    }`}
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className={`text-[10px] mt-1 font-medium select-none ${linkedinBadge ? 'text-white/95' : 'text-gray-500'}`}>Badge</span>
                  </button>

                  <button
                    type="button"
                    title="Reset changes"
                    onClick={handleReset}
                    className="h-12 inline-flex flex-col items-center justify-center rounded-xl bg-white/50 hover:bg-white/80 border border-white text-red-600 hover:text-red-700 font-medium transition-all shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-red-500/80" />
                    <span className="text-[10px] text-red-600/80 mt-1 font-medium select-none">Reset</span>
                  </button>
                </div>

                {/* Creative Filters */}
                <div className="flex flex-col space-y-1.5 pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5 justify-center">
                    <Layers className="w-3.5 h-3.5" /> Creative Filters
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1.5 justify-center scrollbar-none">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActiveFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                          activeFilter.id === f.id
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white/50 border border-white text-gray-600 hover:bg-white/80'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image details & Delete current photo */}
                <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-white/20">
                  <div className="flex items-center space-x-1.5 max-w-[200px] overflow-hidden">
                    <span className="font-semibold text-gray-800 text-ellipsis overflow-hidden whitespace-nowrap">{fileName}</span>
                    <span className="text-[10px] bg-white/60 border border-white/40 text-gray-500 px-1.5 py-0.5 rounded-lg">{fileSize}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setImageSrc(null);
                      setFileName('');
                      setFileSize('');
                    }}
                    className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-600 font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Clear Photo
                  </button>
                </div>

                {/* Action Buttons (Replace and Download) */}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/60 hover:bg-white/80 border border-white text-gray-700 font-medium rounded-2xl transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    Replace
                  </button>
                  <button 
                    id="download-cropped-png"
                    onClick={handleDownload}
                    className="flex-[2] h-12 flex items-center justify-center gap-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                </div>

                {/* Formatting info */}
                <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-[0.2em] justify-center">
                  <span>Format: 1024x1024</span>
                  <span className="opacity-30">â€¢</span>
                  <span>Transparency: Enabled</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Simulator platform section inside an elegant visual panel below the container */}
      {imageSrc && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white/30 backdrop-blur-md border border-white/30 shadow-xl rounded-[32px] p-6 mt-6 flex flex-col space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-900 tracking-tight uppercase">
              <Eye className="w-4 h-4 text-indigo-500 animate-pulse" /> Live Avatar Mockups:
            </div>
            
            {/* Platform Selector buttons */}
            <div className="flex bg-slate-200/40 p-0.5 rounded-xl space-x-0.5">
              <button
                type="button"
                onClick={() => setSimulatorTab('slack')}
                className={`p-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatorTab === 'slack' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Slack DM
              </button>
              <button
                type="button"
                onClick={() => setSimulatorTab('twitter')}
                className={`p-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatorTab === 'twitter' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                X / Twitter
              </button>
              <button
                type="button"
                onClick={() => setSimulatorTab('linkedin')}
                className={`p-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                  simulatorTab === 'linkedin' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                LinkedIn
              </button>
            </div>
          </div>

          <div className="bg-white/50 border border-white/40 p-4 rounded-2xl flex flex-col items-center">
            {/* SLACK MOCKUP */}
            {simulatorTab === 'slack' && (
              <div id="slack-mockup" className="w-full text-slate-800 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-3 text-left">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-200 overflow-hidden relative" style={{ flexShrink: 0 }}>
                  <img 
                    src={imageSrc} 
                    alt="Slack preview avatar" 
                    className="max-w-none origin-center"
                    style={{
                      width: initialWidth * (40 / 288),
                      height: initialHeight * (40 / 288),
                      transform: `translate(${position.x * (40 / 288)}px, ${position.y * (40 / 288)}px) scale(${scale}) rotate(${rotation}deg)`,
                      filter: activeFilter.css,
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-semibold text-xs text-slate-950">Sarah Jenkins</span>
                    <span className="text-[10px] text-slate-400">2:45 PM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hey team! Just compiled my perfect circular corporate avatar with this tool. Look how crisp it looks next to messages! ðŸš€
                  </p>
                </div>
              </div>
            )}

            {/* TWITTER / X PROFILE CARD */}
            {simulatorTab === 'twitter' && (
              <div id="twitter-mockup" className="w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden text-left text-slate-800">
                <div className="h-16 bg-gradient-to-r from-violet-200 to-indigo-300 relative" />
                <div className="px-4 pb-4 flex flex-col relative animate-fade-in">
                  <div className="flex justify-between items-end -mt-8 mb-2">
                    <div className="w-[72px] h-[72px] rounded-full bg-zinc-950 border-4 border-white shadow-sm overflow-hidden relative">
                      <img 
                        src={imageSrc} 
                        alt="Twitter preview avatar" 
                        className="max-w-none origin-center"
                        style={{
                          width: initialWidth * (64 / 288),
                          height: initialHeight * (64 / 288),
                          transform: `translate(${position.x * (64 / 288)}px, ${position.y * (64 / 288)}px) scale(${scale}) rotate(${rotation}deg)`,
                          filter: activeFilter.css,
                        }}
                      />
                    </div>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-200 rounded-full font-bold text-[10px] hover:bg-slate-50 shadow-sm transition">
                      Edit Profile
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-xs text-slate-950">Sarah Jenkins</span>
                    <span className="text-[10px] bg-sky-100 text-sky-600 px-1 py-0.2 rounded-full font-semibold">âœ“</span>
                  </div>
                  <span className="text-[10px] text-slate-500">@sarah_jenkins_ux</span>
                  <p className="text-[11px] text-slate-600 mt-1.5 font-normal leading-relaxed">
                    Crafting minimalist Apple-like UI/UX design tools and utilities on cloud native stacks. âœ¨ SF.
                  </p>
                </div>
              </div>
            )}

            {/* LINKEDIN PROFILE MOCKUP */}
            {simulatorTab === 'linkedin' && (
              <div id="linkedin-mockup" className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4 text-left text-slate-800 flex items-start space-x-4">
                <div className="w-[76px] h-[76px] rounded-full bg-zinc-900 border border-slate-200 overflow-hidden relative" style={{ flexShrink: 0 }}>
                  <img 
                    src={imageSrc} 
                    alt="LinkedIn preview avatar" 
                    className="max-w-none origin-center"
                    style={{
                      width: initialWidth * (76 / 288),
                      height: initialHeight * (76 / 288),
                      transform: `translate(${position.x * (76 / 288)}px, ${position.y * (76 / 288)}px) scale(${scale}) rotate(${rotation}deg)`,
                      filter: activeFilter.css,
                    }}
                  />
                  {linkedinBadge && (
                    <div 
                      className="absolute inset-0 rounded-full border-[5px] border-emerald-600 pointer-events-none z-20"
                      style={{
                        clipPath: 'polygon(0% 64%, 100% 64%, 100% 100%, 0% 100%)'
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-1">
                    <span className="font-semibold text-xs text-slate-950">Sarah Jenkins</span>
                    <span className="text-[10px] text-indigo-600 font-medium font-serif">1st</span>
                  </div>
                  <span className="text-[10px] text-slate-700 block mt-0.5 leading-snug">
                    Lead UX Architect â€¢ Design Systems & Creative Code Labs
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    San Francisco Bay Area â€¢ Ex-Google
                  </span>
                  <div className="flex space-x-1.5 mt-2">
                    <button type="button" className="px-2.5 py-1 bg-sky-700 text-white rounded-full font-semibold text-[9px] hover:bg-sky-800 transition shadow-sm">
                      Connect
                    </button>
                    <button type="button" className="px-2 py-1 bg-white border border-slate-300 rounded-full text-slate-600 font-medium text-[9px] hover:bg-slate-50 transition">
                      Message
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <span className="text-[10px] text-gray-400 mt-2.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Simulation views auto-synchronize to active edit parameters!
            </span>
          </div>
        </motion.div>
      )}

      {/* Attribution Footer */}
      <div className="mt-8 text-gray-400 text-sm hover:text-gray-500 cursor-help transition-all duration-300 flex items-center gap-1.5">
        Press <kbd className="px-2 py-1 bg-white border border-gray-200 shadow-sm rounded text-xs font-semibold text-gray-500">âŒ˜</kbd> + <kbd className="px-2 py-1 bg-white border border-gray-200 shadow-sm rounded text-xs font-semibold text-gray-500">S</kbd> to save preset export
      </div>
    </div>
  );
}

