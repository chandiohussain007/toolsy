/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  FileUp, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  Download, 
  Check, 
  RefreshCw, 
  Layers, 
  Sliders, 
  AlertCircle, 
  Info,
  ChevronRight,
  FileCheck,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Formats file sizes elegantly
function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Converts a list of selected page numbers (e.g., [1, 3, 5, 6, 7]) into a consolidated range string (e.g., "1, 3, 5-7")
function generatePageRangeString(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      if (start === end) {
        ranges.push(`${start}`);
      } else {
        ranges.push(`${start}-${end}`);
      }
      if (i < sorted.length) {
        start = sorted[i];
        end = sorted[i];
      }
    }
  }
  return ranges.join(', ');
}

// Parses arbitrary input range strings (like "1, 3, 5-7") into structured page numbers limited to maxPages
function parseRangeString(rangeStr: string, maxPages: number): number[] {
  const selected: Set<number> = new Set();
  const tokens = rangeStr.split(',');

  for (let token of tokens) {
    token = token.trim();
    if (!token) continue;

    if (/^\d+$/.test(token)) {
      const val = parseInt(token, 10);
      if (val >= 1 && val <= maxPages) {
        selected.add(val);
      }
    } else if (/^\d+\s*-\s*\d+$/.test(token)) {
      const parts = token.split('-');
      const start = parseInt(parts[0].trim(), 10);
      const end = parseInt(parts[1].trim(), 10);
      if (isNaN(start) || isNaN(end)) continue;
      
      const realStart = Math.min(start, end);
      const realEnd = Math.max(start, end);
      
      for (let i = realStart; i <= realEnd; i++) {
        if (i >= 1 && i <= maxPages) {
          selected.add(i);
        }
      }
    }
  }
  return Array.from(selected).sort((a, b) => a - b);
}

export default function App() {
  // Library Loading States
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Uploaded PDF Source States
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [metadata, setMetadata] = useState<{
    title?: string;
    author?: string;
    creationDate?: string;
    creator?: string;
  } | null>(null);

  // Extraction Customization Configuration States
  const [rangeInput, setRangeInput] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Compilation / Extraction States
  const [extractionLoading, setExtractionLoading] = useState<boolean>(false);
  const [extractionProgressText, setExtractionProgressText] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [extractedBlobUrl, setExtractedBlobUrl] = useState<string | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string | null>(null);
  const [extractedSize, setExtractedSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Securely fetch and load the pdf-lib library from CDN completely encapsulated
  useEffect(() => {
    if ((window as any).PDFLib) {
      setPdfLibLoaded(true);
      return;
    }

    const existingScript = document.getElementById('pdf-lib-cdn-script');
    if (existingScript) {
      const handleLoad = () => setPdfLibLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    const script = document.createElement('script');
    script.id = 'pdf-lib-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.async = true;
    script.onload = () => {
      setPdfLibLoaded(true);
    };
    script.onerror = () => {
      setLoadingError('Failed to initialize the PDF processing backend from local CDN CDN. Please check your internet connection.');
    };
    document.head.appendChild(script);
  }, []);

  // Process File handler
  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Unsupported file format. Please select or drop a valid .pdf file.');
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    setIsSuccess(false);
    setExtractedBlobUrl(null);

    // Clean up temporary previous URLs to avoid memory leaks
    if (extractedBlobUrl) {
      URL.revokeObjectURL(extractedBlobUrl);
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      setPdfBytes(arrayBuffer);

      if ((window as any).PDFLib) {
        const { PDFDocument } = (window as any).PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        setNumPages(pageCount);

        // Fetch inner metadata descriptors safely
        let metaObj = null;
        try {
          metaObj = {
            title: pdfDoc.getTitle() || undefined,
            author: pdfDoc.getAuthor() || undefined,
            creationDate: pdfDoc.getCreationDate()?.toLocaleDateString() || undefined,
            creator: pdfDoc.getCreator() || undefined,
          };
        } catch (err) {
          console.warn('Could not read partial PDF meta attributes', err);
        }
        setMetadata(metaObj);

        // Initialize Output file name
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setOutputFileName(`${cleanName}_extracted`);

        // Default: Select all pages upon initial ingestion
        const initialSelected = Array.from({ length: pageCount }, (_, i) => i + 1);
        setSelectedPages(initialSelected);
        setRangeInput(generatePageRangeString(initialSelected));
      } else {
        setErrorMessage('PDF processor library isnâ€™t initialized yet. Please wait a millisecond and retry.');
        setFile(null);
      }
    } catch (e: any) {
      console.error('Core PDF parsing failure', e);
      setErrorMessage('Could not load or read this PDF. It might be corrupt, encrypted, or password-protected.');
      setFile(null);
    }
  };

  // Drag & drop responders
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Page interaction modifiers
  const togglePageSelection = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setRangeInput(generatePageRangeString(next));
  };

  const handleRangeInputChange = (inputVal: string) => {
    setRangeInput(inputVal);
    // Sync to selected numerical grid
    const parsed = parseRangeString(inputVal, numPages);
    setSelectedPages(parsed);
  };

  // Selection presets triggers
  const applyPresetAll = () => {
    const list = Array.from({ length: numPages }, (_, i) => i + 1);
    setSelectedPages(list);
    setRangeInput(generatePageRangeString(list));
  };

  const applyPresetOdd = () => {
    const list = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0);
    setSelectedPages(list);
    setRangeInput(generatePageRangeString(list));
  };

  const applyPresetEven = () => {
    const list = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0);
    setSelectedPages(list);
    setRangeInput(generatePageRangeString(list));
  };

  const clearAllSelections = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  // Perform client-side extracting with stylish progress microphases
  const handleExtractPages = async () => {
    if (selectedPages.length === 0) {
      setErrorMessage('Choose at least one page in your range to process.');
      return;
    }

    setExtractionLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);

    // Luxury sequential phase feedback for sensory pacing
    setExtractionProgressText('Locating PDF references...');
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      if (!(window as any).PDFLib) {
        throw new Error('Processing backend failed to keep loaded. Try refreshing.');
      }
      if (!pdfBytes) {
        throw new Error('Lost connection to PDF document bytes.');
      }

      setExtractionProgressText('Accessing original channels...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { PDFDocument } = (window as any).PDFLib;
      const originalDoc = await PDFDocument.load(pdfBytes);
      const extractedDoc = await PDFDocument.create();

      setExtractionProgressText(`Clipping ${selectedPages.length} designated pages...`);
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Translate 1-based page numbers to 0-based index array
      const pageIndices = selectedPages.map((pageNum) => pageNum - 1);
      const copiedPages = await extractedDoc.copyPages(originalDoc, pageIndices);

      setExtractionProgressText('Writing a streamlined document layout...');
      await new Promise((resolve) => setTimeout(resolve, 400));

      copiedPages.forEach((page: any) => {
        extractedDoc.addPage(page);
      });

      const processedBytes = await extractedDoc.save();

      setExtractionProgressText('Encapsulating output file...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      const finalBlob = new Blob([processedBytes], { type: 'application/pdf' });
      const finalUrl = URL.createObjectURL(finalBlob);

      const targetName = (outputFileName.trim() || 'extracted_document') + '.pdf';

      setExtractedBlobUrl(finalUrl);
      setExtractedFileName(targetName);
      setExtractedSize(processedBytes.byteLength);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while compiling your destination PDF structure.');
    } finally {
      setExtractionLoading(false);
    }
  };

  const triggerReset = () => {
    setFile(null);
    setPdfBytes(null);
    setNumPages(0);
    setMetadata(null);
    setSelectedPages([]);
    setRangeInput('');
    setOutputFileName('');
    setIsSuccess(false);
    setErrorMessage(null);
    if (extractedBlobUrl) {
      URL.revokeObjectURL(extractedBlobUrl);
      setExtractedBlobUrl(null);
    }
  };

  // Find out of bounds alerts
  const checkOutOfBounds = () => {
    if (!rangeInput || numPages === 0) return false;
    const tokens = rangeInput.split(',').map((t) => t.trim()).filter(Boolean);
    for (let t of tokens) {
      if (/^\d+$/.test(t)) {
        if (parseInt(t, 10) > numPages) return true;
      } else if (/^\d+\s*-\s*\d+$/.test(t)) {
        const [s, e] = t.split('-').map((val) => parseInt(val.trim(), 10));
        if (s > numPages || e > numPages) return true;
      }
    }
    return false;
  };

  const hasOutOfBounds = checkOutOfBounds();

  return (
    <div className="relative\ min-h-screen\ w-full\ ts-page-bg\ flex flex-col justify-between p-6 sm:p-12 selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[8%] left-[12%] w-[24rem] h-[24rem] sm:w-[32rem] sm:h-[32rem] bg-gradient-to-tr from-blue-300/20 to-indigo-300/25 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[8%] right-[12%] w-[24rem] h-[24rem] sm:w-[34rem] sm:h-[34rem] bg-gradient-to-tr from-fuchsia-200/25 to-violet-300/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Core */}
      <div className="w-full flex-grow flex items-center justify-center py-6">
        <motion.div 
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white/45 backdrop-blur-2xl border border-white/30 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.12)] rounded-[2.5rem] overflow-hidden"
          id="main_glass_card"
        >
          
          {/* Subtle upper light gradient rim */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none" />

          {/* Card Body */}
          <div className="p-8 sm:p-10">
            
            {/* Header Identity Display */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/[0.04] border border-slate-900/[0.03] text-[11px] font-semibold text-slate-700 tracking-wider uppercase mb-3"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse fill-blue-500/10" />
                Browser local engine
              </motion.div>
              
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                PDF Page Extractor
              </h1>
              
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Extract specified pages from any PDF instantly. Processed completely client-side. Your files remain entirely private.
              </p>
            </div>

            {/* Error Message Toast Banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-800 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <span className="font-semibold block mb-0.5">Configuration Notification</span>
                      {errorMessage}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Workflow Stages Controller */}
            <AnimatePresence mode="wait">

              {/* STAGE A: CDN NOT READY STATE */}
              {!pdfLibLoaded && !loadingError && (
                <motion.div
                  key="loading_cdn"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin stroke-[1.5] mb-4" />
                  <h3 className="text-sm font-semibold text-slate-700">Calibrating PDF Library...</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Fetching high-performance web assembly dependencies cleanly inside your browser context.
                  </p>
                </motion.div>
              )}

              {/* STAGE B: CDN INITIALIZATION FAIL STATE */}
              {loadingError && (
                <motion.div
                  key="cdn_fail"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                    <AlertCircle className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Connection Interrupted</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    {loadingError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 tracking-wide inline-flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Connection
                  </button>
                </motion.div>
              )}

              {/* STAGE C: COMPILATION IN PROGRESS */}
              {pdfLibLoaded && extractionLoading && (
                <motion.div
                  key="extracting_work"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  {/* Glowing custom processing orb animation */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                    <div className="absolute inset-2 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center">
                      <Layers className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>

                  <p className="text-base font-bold text-slate-800 tracking-tight">
                    Performing Extraction
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-1 tracking-widest uppercase bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                    {extractionProgressText}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 max-w-xs leading-relaxed">
                    Page data is being duplicated and packed into a self-contained PDF layout stream.
                  </p>
                </motion.div>
              )}

              {/* STAGE D: FILE CHOOSE VIEW */}
              {pdfLibLoaded && !extractionLoading && !file && !isSuccess && (
                <motion.div
                  key="dropzone_view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-500/[0.04] scale-[0.99] shadow-inner shadow-blue-500/5' 
                        : 'border-slate-300/80 bg-white/30 hover:border-slate-400/80 hover:bg-white/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      accept=".pdf" 
                      className="hidden" 
                    />

                    {/* Uplink Icon visual stack */}
                    <div className="relative mb-5 flex items-center justify-center">
                      {/* Aura circle backing */}
                      <div className="absolute w-12 h-12 bg-blue-100 rounded-full scale-110 opacity-60 group-hover:scale-125 transition-transform duration-300" />
                      <div className="relative w-12 h-12 bg-white ring-4 ring-slate-100/50 rounded-full flex items-center justify-center shadow-sm">
                        <FileUp className="w-5 h-5 text-blue-600 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Upload PDF Document
                    </h3>
                    
                    <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Drag and drop your file here, or <span className="text-blue-600 font-semibold group-hover:underline">browse your folders</span>.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Max 250MB
                      </span>
                      <span className="text-slate-300">â€¢</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Chrome / Firefox / Safari
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STAGE E: RANGE ADJUSTMENT VIEW */}
              {pdfLibLoaded && !extractionLoading && file && !isSuccess && (
                <motion.div
                  key="configuration_view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  
                  {/* File Profile Row */}
                  <div className="flex items-center justify-between p-4 bg-white/75 border border-slate-200/60 shadow-sm rounded-2xl relative">
                    <div className="flex items-center gap-3 overflow-hidden pr-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span>{numPages} {numPages === 1 ? 'Page' : 'Pages'}</span>
                          <span>â€¢</span>
                          <span>{formatBytes(file.size)}</span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={triggerReset}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional File Metadata Drawer (Title, Author, Dates) */}
                  {metadata && (metadata.title || metadata.author) && (
                    <div className="px-4 py-3 bg-slate-900/[0.02] rounded-xl border border-slate-900/[0.03] text-[10px] text-slate-500 space-y-1">
                      {metadata.title && (
                        <p className="truncate flex items-center gap-1">
                          <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Title:</span> {metadata.title}
                        </p>
                      )}
                      {metadata.author && (
                        <p className="truncate flex items-center gap-1">
                          <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Author:</span> {metadata.author}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Output Config Inputs Section */}
                  <div className="space-y-4">
                    
                    {/* Output File Name */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                        Output File Name
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={outputFileName}
                          onChange={(e) => setOutputFileName(e.target.value)}
                          placeholder="document_extracted"
                          className="w-full text-xs font-semibold text-slate-800 bg-white/70 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3.5 py-2.5 outline-none transition-all pr-12 shadow-sm"
                        />
                        <span className="absolute right-3.5 text-xs text-slate-400/80 font-bold select-none">
                          .pdf
                        </span>
                      </div>
                    </div>

                    {/* Range input field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Custom Page Range
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          E.g. "1, 3, 5-7"
                        </span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          value={rangeInput}
                          onChange={(e) => handleRangeInputChange(e.target.value)}
                          placeholder='e.g., 1, 3, 5-8'
                          className={`w-full text-xs font-semibold text-slate-800 bg-white/70 border rounded-xl px-3.5 py-2.5 outline-none transition-all shadow-sm ${
                            hasOutOfBounds 
                              ? 'border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                              : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                      </div>

                      {hasOutOfBounds && (
                        <p className="text-[10px] font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 inline" /> Warning: Pages above {numPages} are ignored.
                        </p>
                      )}
                    </div>

                    {/* Visual Preset Choices */}
                    <div className="flex flex-wrap items-center justify-between gap-2 py-1 border-t border-b border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Quick Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={applyPresetAll}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-900/[0.04] text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={applyPresetOdd}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-900/[0.04] text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Odds
                        </button>
                        <button
                          type="button"
                          onClick={applyPresetEven}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-900/[0.04] text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Evens
                        </button>
                        <button
                          type="button"
                          onClick={clearAllSelections}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-900/[0.04] text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Interactive Click Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Click grid to choose pages
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {selectedPages.length} of {numPages} selected
                        </span>
                      </div>

                      {/* Paper Grid wrapper with scroll limits */}
                      <div className="grid grid-cols-4 gap-3 bg-slate-900/[0.02] border border-slate-900/[0.03] rounded-2.5xl p-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
                        {Array.from({ length: numPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isSelected = selectedPages.includes(pageNum);
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => togglePageSelection(pageNum)}
                              className={`relative flex flex-col justify-between p-2.5 aspect-[3/4] rounded-xl border transition-all duration-300 select-none cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/10 text-blue-600 transform -translate-y-0.5'
                                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300 text-slate-500 shadow-sm hover:shadow'
                              }`}
                            >
                              {/* Horizontal mock page stripes */}
                              <div className="w-full flex flex-col gap-1 opacity-35">
                                <div className={`h-1 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-300'} w-1/2`} />
                                <div className={`h-0.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-slate-200'} w-full`} />
                                <div className={`h-0.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-slate-200'} w-3/4`} />
                              </div>

                              <div className="flex items-end justify-between mt-auto">
                                <span className="text-xs font-extrabold">{pageNum}</span>
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-200 ${
                                  isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'border-slate-300 bg-white scale-90'
                                }`}>
                                  {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Extract CTA Button */}
                  <div className="pt-2">
                    <motion.button
                      whileHover={selectedPages.length > 0 ? { scale: 1.02 } : {}}
                      whileTap={selectedPages.length > 0 ? { scale: 0.98 } : {}}
                      onClick={handleExtractPages}
                      disabled={selectedPages.length === 0}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                        selectedPages.length > 0
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Layers className="w-4 h-4 shrink-0" />
                      {selectedPages.length === 0 
                        ? 'Select Pages to Extract' 
                        : `Extract & Compile ${selectedPages.length} ${selectedPages.length === 1 ? 'Page' : 'Pages'}`}
                      {selectedPages.length > 0 && <ChevronRight className="w-4 h-4 opacity-75 shrink-0" />}
                    </motion.button>
                  </div>

                </motion.div>
              )}

              {/* STAGE F: EXTRACT SUCCESS VIEW */}
              {pdfLibLoaded && !extractionLoading && isSuccess && extractedBlobUrl && (
                <motion.div
                  key="success_view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-center py-4"
                >
                  
                  {/* Rotating Success Check Visual */}
                  <div className="relative inline-flex items-center justify-center mb-1">
                    <div className="absolute w-20 h-20 bg-emerald-100 rounded-full animate-ping scale-75 opacity-20" />
                    <div className="absolute w-16 h-16 bg-emerald-500/15 rounded-full scale-110" />
                    <div className="relative w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <FileCheck className="w-6 h-6 stroke-[2]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      PDF Extraction Complete
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Your pages were parsed and cleanly assembled. File is ready to download.
                    </p>
                  </div>

                  {/* Summary properties */}
                  <div className="max-w-md mx-auto p-4 bg-white/75 border border-slate-200/50 rounded-2xl space-y-2 text-left shadow-sm">
                    <div className="flex justify-between text-xs pb-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Compiled:</span>
                      <span className="font-bold text-slate-800 line-clamp-1 break-all max-w-[220px]" title={extractedFileName || ''}>
                        {extractedFileName}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pb-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Final Size:</span>
                      <span className="font-extrabold text-slate-800">
                        {formatBytes(extractedSize)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Extracted Range:</span>
                      <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {selectedPages.length} {selectedPages.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>

                  {/* High Quality Download Direct CTA */}
                  <div className="pt-2">
                    <motion.a
                      href={extractedBlobUrl}
                      download={extractedFileName || 'extracted.pdf'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm tracking-wide hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      Save Compiled PDF File
                    </motion.a>
                  </div>

                  {/* Segmented control to start over or extract another range */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-900/[0.03] rounded-xl transition-all inline-flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Adjust Pages
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={triggerReset}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-500/[0.04] rounded-xl transition-all inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      New Document
                    </button>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </motion.div>
      </div>

      {/* Elegant, clean Footer */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 font-semibold flex flex-col sm:flex-row items-center justify-center gap-2 bg-white/5 backdrop-blur-sm rounded-full py-2.5 max-w-lg mx-auto border border-white/10 shadow-sm relative overflow-hidden">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          Processed 100% locally
        </span>
        <span className="hidden sm:inline">â€¢</span>
        <span>Secure PDF-LIB Engine</span>
        <span className="hidden sm:inline">â€¢</span>
        <span className="text-slate-500">No personal data enters external servers</span>
      </footer>

    </div>
  );
}


