import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  Download,
  RotateCcw,
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
  Info,
  Sliders,
  Maximize2,
  FileCode,
  ArrowRightLeft
} from 'lucide-react';

import { ImageMetadata, ResizeSettings, CompressedImageResult } from './types';
import { loadImage, processImage, formatBytes } from './utils/imageProcessor';
import UploadZone from './components/UploadZone';
import CompareSlider from './components/CompareSlider';

export default function App() {
  const [image, setImage] = useState<ImageMetadata | null>(null);
  const [settings, setSettings] = useState<ResizeSettings>({
    width: 0,
    height: 0,
    lockAspectRatio: true,
    quality: 0.85,
    format: 'image/jpeg',
  });
  const [output, setOutput] = useState<CompressedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('custom');

  // Keep a reference to the loaded HTMLImageElement in memory
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Common quick output size presets
  const presets = [
    { id: 'custom', name: 'Original Ratio' },
    { id: 'square', name: 'Instagram Square (1:1)', w: 1080, h: 1080 },
    { id: 'story', name: 'Instagram Story (9:16)', w: 1080, h: 1920 },
    { id: 'youtube', name: 'YouTube Thumbnail', w: 1280, h: 720 },
    { id: 'fhd', name: 'Full HD (16:9)', w: 1920, h: 1080 },
    { id: 'web', name: 'Optimized Standard Web', w: 800, h: 600 },
  ];

  // Callback when a file is chosen at UploadZone
  const handleImageSelected = async (
    dataUrl: string,
    name: string,
    size: number,
    type: string
  ) => {
    try {
      setIsProcessing(true);
      const imgElement = await loadImage(dataUrl);
      imageElementRef.current = imgElement;

      // Extract details
      const width = imgElement.naturalWidth;
      const height = imgElement.naturalHeight;
      const aspectRatio = width / height;

      // Determine output format based on loaded image type, defaults to jpeg
      let initialFormat: ResizeSettings['format'] = 'image/jpeg';
      if (type === 'image/png') initialFormat = 'image/png';
      if (type === 'image/webp') initialFormat = 'image/webp';

      const initialMetadata: ImageMetadata = {
        name,
        size,
        type,
        width,
        height,
        aspectRatio,
        dataUrl,
      };

      setImage(initialMetadata);
      setSettings({
        width,
        height,
        lockAspectRatio: true,
        quality: 0.82, // Balanced sweet spot for JPEG/WEBP
        format: initialFormat,
      });
      setActivePresetId('custom');
    } catch (err) {
      console.error('Error loading image', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run dynamic compression & resize when settings or input image changes
  useEffect(() => {
    if (!image || !imageElementRef.current) return;

    // Small debounce to protect against high frequency slider updates
    const debounceTimeout = setTimeout(async () => {
      try {
        setIsProcessing(true);
        const result = await processImage(imageElementRef.current!, settings);
        setOutput(result);
      } catch (err) {
        console.error('Processing error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 120);

    return () => clearTimeout(debounceTimeout);
  }, [settings, image]);

  const handleWidthChange = (valStr: string) => {
    const val = parseInt(valStr.replace(/\D/g, '')) || 0;
    if (val > 16384) return; // Prevent hardware crash limits

    setSettings((prev) => {
      const nextWidth = val;
      let nextHeight = prev.height;

      if (prev.lockAspectRatio && image) {
        nextHeight = Math.round(nextWidth / image.aspectRatio);
      }

      return {
        ...prev,
        width: nextWidth,
        height: nextHeight,
      };
    });
    setActivePresetId('custom');
  };

  const handleHeightChange = (valStr: string) => {
    const val = parseInt(valStr.replace(/\D/g, '')) || 0;
    if (val > 16384) return;

    setSettings((prev) => {
      const nextHeight = val;
      let nextWidth = prev.width;

      if (prev.lockAspectRatio && image) {
        nextWidth = Math.round(nextHeight * image.aspectRatio);
      }

      return {
        ...prev,
        width: nextWidth,
        height: nextHeight,
      };
    });
    setActivePresetId('custom');
  };

  const toggleAspectLock = () => {
    setSettings((prev) => {
      // If locking, sync height with width based on original aspect ratio immediately
      let nextHeight = prev.height;
      if (!prev.lockAspectRatio && image) {
        nextHeight = Math.round(prev.width / image.aspectRatio);
      }
      return {
        ...prev,
        lockAspectRatio: !prev.lockAspectRatio,
        height: nextHeight,
      };
    });
  };

  const applyScaleFactor = (factor: number) => {
    if (!image) return;
    const targetWidth = Math.round(image.width * factor);
    const targetHeight = Math.round(image.height * factor);

    setSettings((prev) => ({
      ...prev,
      width: targetWidth,
      height: targetHeight,
    }));
    setActivePresetId('custom');
  };

  const applyPresetLayout = (pId: string) => {
    if (!image) return;
    const preset = presets.find((p) => p.id === pId);
    if (!preset) return;

    setActivePresetId(pId);

    if (pId === 'custom') {
      setSettings((prev) => ({
        ...prev,
        width: image.width,
        height: image.height,
        lockAspectRatio: true,
      }));
      return;
    }

    if (preset.w && preset.h) {
      setSettings((prev) => ({
        ...prev,
        width: preset.w!,
        height: preset.h!,
        lockAspectRatio: false, // Override to fit exact preset size
      }));
    }
  };

  const handleDownload = () => {
    if (!output || !image) return;

    const link = document.createElement('a');
    link.href = output.dataUrl;

    // Generate neat name: e.g. photo_resized.webp
    const originalNameNoExt = image.name.substring(0, image.name.lastIndexOf('.')) || image.name;
    const targetExt = settings.format.replace('image/', '');
    link.download = `${originalNameNoExt}_resized.${targetExt}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage(null);
    setOutput(null);
    imageElementRef.current = null;
    setActivePresetId('custom');
  };

  // Format ratio reduction
  const renderSizeReduction = () => {
    if (!image || !output) return null;
    const reduction = ((image.size - output.size) / image.size) * 100;
    if (reduction <= 0) {
      return {
        text: 'Slightly Larger',
        percent: `${Math.abs(Math.round(reduction))}% Increase`,
        class: 'text-amber-600 bg-amber-50 border-amber-100',
        positive: false,
      };
    }
    return {
      text: 'Size Saved',
      percent: `${Math.round(reduction)}% Smaller`,
      class: 'text-emerald-700 bg-emerald-50/70 border-emerald-100',
      positive: true,
    };
  };

  const reductionStats = renderSizeReduction();

  return (
    <div className="min-h-screen w-full ts-page-bg relative flex flex-col items-center justify-center p-4 md:p-8 font-sans overflow-x-hidden select-none">
      {/* Premium ambient light backgrounds to enrich backdrop-blur visual depth */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-indigo-200/50 filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-pink-100/40 filter blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-20 w-60 h-60 rounded-full bg-purple-200/30 filter blur-[80px] pointer-events-none" />

      {/* Main Container with White Glassmorphism styling */}
      <div className="relative w-full max-w-xl z-10">
        
        {/* Apple Style Brand Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 border border-white/50 shadow-xs mb-3 text-slate-600 text-[11px] font-medium tracking-wide pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Local Web-canvas Engine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1.5"
          >
            OptiPress
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs md:text-sm text-slate-500 max-w-xs mx-auto font-light"
          >
            Resize, convert format &amp; compress with client-side canvas precision.
          </motion.p>
        </div>

        {/* Central Core Glassmorphic Frame */}
        <motion.div
          id="glass-core-card"
          layout
          className="w-full bg-white/45 backdrop-blur-md border border-white/40 shadow-[0_24px_50px_-12px_rgba(99,102,241,0.08)] rounded-3xl p-5 md:p-6 flex flex-col items-center"
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait">
            {!image ? (
              /* Phase 1: Upload State */
              <motion.div
                key="upload-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="w-full"
              >
                <UploadZone onImageSelected={handleImageSelected} />
              </motion.div>
            ) : (
              /* Phase 2: Editor State */
              <motion.div
                key="editor-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="w-full space-y-5"
              >
                {/* Visual Image Preview Compare Frame */}
                {output && (
                  <CompareSlider
                    originalUrl={image.dataUrl}
                    compressedUrl={output.dataUrl}
                    aspectRatio={image.aspectRatio}
                  />
                )}

                {/* File Metadata Overview (Pill label) */}
                <div className="flex items-center justify-between gap-3 bg-white/60 rounded-2xl p-3 border border-slate-100/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-850 truncate leading-snug">
                        {image.name}
                      </p>
                      <p className="text-[10px] text-slate-450 font-medium">
                        Original: {formatBytes(image.size)} Â· {image.width}Ã—{image.height}px
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="h-8 p-2 rounded-xl border border-slate-100/80 hover:border-slate-200 bg-white shadow-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center gap-1 text-[11px] font-medium transition-all duration-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>

                {/* Resolution & Format Settings Dashboard */}
                <div className="space-y-4">
                  
                  {/* Aspect Dimension & Presets Card */}
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 select-none">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Target Image Dimensions
                      </h4>
                      {/* Presets Profile Dropdown */}
                      <select
                        value={activePresetId}
                        onChange={(e) => applyPresetLayout(e.target.value)}
                        className="text-[11px] font-semibold text-indigo-650 bg-white border border-slate-150/80 rounded-lg px-2 py-1 max-w-[170px] cursor-pointer hover:border-indigo-300 transition-colors focus:ring-1 focus:ring-indigo-405 focus:outline-hidden"
                      >
                        {presets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Numeric Input pair representing Dimensions and Lock aspect ratio */}
                    <div className="grid grid-cols-11 gap-2 items-center">
                      <div className="col-span-12 xs:col-span-5 relative">
                        <label className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-400 select-none">Width</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={settings.width || ''}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          className="w-full bg-white h-10 border border-slate-200 rounded-xl pl-3 pr-14 text-sm font-semibold text-slate-800 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden hover:border-slate-300"
                        />
                      </div>

                      {/* Aspect ratio Lock in middle */}
                      <div className="col-span-12 xs:col-span-1 flex justify-center py-1">
                        <button
                          onClick={toggleAspectLock}
                          title={settings.lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xs ${
                            settings.lockAspectRatio
                              ? 'bg-indigo-50 border-indigo-150 text-indigo-600 hover:bg-indigo-100/60'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-350'
                          }`}
                        >
                          {settings.lockAspectRatio ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="col-span-12 xs:col-span-5 relative">
                        <label className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-400 select-none">Height</label>
                        <input
                          type="text"
                          pattern="[0-9]*"
                          value={settings.height || ''}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          className="w-full bg-white h-10 border border-slate-200 rounded-xl pl-3 pr-14 text-sm font-semibold text-slate-800 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden hover:border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Simple scaling percentage shortcuts (Pill selectors) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-medium text-slate-400 mr-1.5 select-none">Scale:</span>
                      {[0.25, 0.50, 0.75, 1.0].map((factor) => {
                        const isCurrent =
                          image &&
                          settings.width === Math.round(image.width * factor) &&
                          settings.height === Math.round(image.height * factor);

                        return (
                          <button
                            key={factor}
                            onClick={() => applyScaleFactor(factor)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all duration-200 cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white border-slate-250/70 text-slate-650 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {factor * 100}%
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format & Compression quality layout wrapper */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Format Selector panel */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 p-4 space-y-3">
                      <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 select-none">
                        <FileCode className="w-3.5 h-3.5" />
                        Target Output Format
                      </h4>
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => {
                          const isActive = settings.format === fmt;
                          const label = fmt.replace('image/', '').toUpperCase();

                          return (
                            <button
                              key={fmt}
                              onClick={() => setSettings((prev) => ({ ...prev, format: fmt }))}
                              className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer text-center ${
                                isActive
                                  ? 'bg-white text-indigo-650 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[9.5px] text-slate-450 font-normal leading-normal">
                        WEBP provides excellent ratio with high fidelity, while JPEG offers wide compatibility.
                      </p>
                    </div>

                    {/* Compression slider control */}
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100/50 p-4 space-y-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 select-none">
                          <Sliders className="w-3.5 h-3.5" />
                          Quality Level
                        </h4>
                        <span className="text-xs font-bold text-indigo-650">
                          {Math.round(settings.quality * 100)}%
                        </span>
                      </div>

                      {/* Slider element */}
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.01"
                        disabled={settings.format === 'image/png'}
                        value={settings.format === 'image/png' ? 1.0 : settings.quality}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, quality: parseFloat(e.target.value) }))
                        }
                        className={`w-full accent-indigo-650 h-1.5 rounded-lg bg-slate-200 focus:outline-none transition-opacity ${
                          settings.format === 'image/png' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />

                      {/* Quality label analysis fallback */}
                      <div className="text-[10px] font-medium leading-none text-slate-450 mt-1">
                        {settings.format === 'image/png' ? (
                          <span className="text-slate-450 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400" />
                            PNG uses lossless format.
                          </span>
                        ) : settings.quality < 0.4 ? (
                          <span className="text-amber-600 font-semibold">Aggressive high compression (Low size)</span>
                        ) : settings.quality < 0.70 ? (
                          <span className="text-indigo-600/80">Average balance optimize (Standard)</span>
                        ) : settings.quality < 0.90 ? (
                          <span className="text-indigo-650 font-semibold">High output quality ratio</span>
                        ) : (
                          <span className="text-teal-600 font-bold">Near lossless fidelity</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Output Statistics comparison results */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 flex flex-col items-center justify-between gap-4 border border-slate-800">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {/* Left stats: Original Size */}
                    <div className="space-y-0.5 text-center xs:text-left border-r border-slate-800">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Input Size
                      </span>
                      <p className="text-base font-bold text-slate-350">{formatBytes(image.size)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Original File Size</p>
                    </div>

                    {/* Right stats: New Size with animated savings representation */}
                    <div className="space-y-0.5 text-center xs:text-left relative">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                        Processed Output
                      </span>
                      {isProcessing ? (
                        <div className="h-6 flex items-center justify-center xs:justify-start">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                          <span className="text-xs text-slate-450 ml-2 animate-pulse">Estimating Size...</span>
                        </div>
                      ) : (
                        <p className="text-base font-bold text-emerald-400">
                          {output ? formatBytes(output.size) : 'Calculating...'}
                        </p>
                      )}
                      
                      {/* Dynamic green saving badge */}
                      {!isProcessing && reductionStats && (
                        <div className="absolute top-0 right-0">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${reductionStats.class}`}>
                            {reductionStats.percent}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        Resolution: {settings.width}Ã—{settings.height}px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Compressor Trigger and Download */}
                <div className="pt-2">
                  <button
                    onClick={handleDownload}
                    id="compress-download-btn"
                    disabled={isProcessing || !output}
                    className={`relative overflow-hidden w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 shadow-lg cursor-pointer ${
                      isProcessing || !output
                        ? 'bg-slate-200 text-slate-400 pointer-events-none'
                        : 'bg-indigo-650 text-white hover:bg-indigo-700 active:scale-[0.99] shadow-indigo-650/15'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing on Canvas...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Optimized Image</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dynamic client info footnote */}
        <div className="mt-4 text-center select-none pointer-events-none">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-normal">
            Secure client-side canvas render Â· Your images never leave your computer
          </p>
        </div>
      </div>
    </div>
  );
}


