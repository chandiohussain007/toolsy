import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  Layers,
  Sparkles
} from 'lucide-react';
import { ImageFile, PDFSettings } from './types';
import DropZone from './components/DropZone';
import SettingsPanel from './components/SettingsPanel';
import ImageGrid from './components/ImageGrid';
import { generatePDFAndSave } from './utils/pdfGenerator';

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<PDFSettings>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'none',
    compression: 0.85,
    filename: 'converted_document',
  });

  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleImagesAdded = (newImages: ImageFile[]) => {
    setImages((prev) => [...prev, ...newImages]);
    if (errorMessage) setErrorMessage('');
  };

  const handleMove = (id: string, direction: 'left' | 'right') => {
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.id === id);
      if (idx === -1) return prev;
      const nextIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;

      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[nextIdx];
      updated[nextIdx] = temp;
      return updated;
    });
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setErrorMessage('');
  };

  const handleGeneratePDF = async () => {
    if (images.length === 0) {
      setErrorMessage('Please add at least one image to compile.');
      return;
    }

    setGenerationState('generating');
    setGenerationProgress(0);
    setErrorMessage('');

    try {
      await generatePDFAndSave(images, settings, (progress) => {
        setGenerationProgress(progress);
      });
      setGenerationState('success');
      setTimeout(() => {
        setGenerationState('idle');
      }, 3000);
    } catch (err: any) {
      setGenerationState('error');
      setErrorMessage(err.message || 'Failed to assemble high-fidelity PDF.');
      setTimeout(() => {
        setGenerationState('idle');
      }, 4000);
    }
  };

  return (
    <div 
      className="relative min-h-screen ts-page-bg overflow-x-hidden flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans selection:bg-indigo-500/10 selection:text-indigo-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 0% 0%, #E0E7FF 0%, transparent 50%), radial-gradient(circle at 100% 100%, #FDF2F8 0%, transparent 50%)'
      }}
    >
      {/* Absolute Decorative Watermark Backdrops */}
      <div className="fixed bottom-10 left-10 text-slate-300/30 text-[120px] font-black -z-10 select-none pointer-events-none font-display">PDF</div>
      <div className="fixed top-10 right-10 text-slate-300/30 text-[120px] font-black -z-10 select-none pointer-events-none font-display">01</div>

      {/* Main Glassmorphic Wrapper */}
      <div
        id="converter-glass-container"
        className="relative bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 space-y-6 overflow-hidden md:my-10"
      >
        {/* Subtle ambient light reflective border line on top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Premium Professional Polish Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Pic2PDF</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Premium Converter Tool</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>On-Device Safe</span>
          </div>
        </div>

        {/* Step-by-Step Interactive Workflow */}
        <div className="space-y-6">
          {/* Unuploaded state or Upload triggers */}
          <DropZone onImagesAdded={handleImagesAdded} isLoading={generationState === 'generating'} />

          {/* Error Feedbacks */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                id="error-feedback-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start space-x-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                <div className="text-sm font-medium">{errorMessage}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected thumbnails area */}
          {images.length > 0 && (
            <div className="space-y-6">
              {/* Image Grid with ordering controls */}
              <ImageGrid
                images={images}
                onMove={handleMove}
                onRemove={handleRemove}
                onClearAll={handleClearAll}
              />

              {/* Dynamic parameters settings panel */}
              <SettingsPanel
                settings={settings}
                onChange={setSettings}
                disabled={generationState === 'generating'}
              />
            </div>
          )}

          {/* Big Action compilation block */}
          {images.length > 0 && (
            <div className="pt-2">
              <button
                id="btn-generate-pdf"
                type="button"
                disabled={generationState === 'generating'}
                onClick={handleGeneratePDF}
                className={`relative w-full overflow-hidden flex items-center justify-center space-x-2.5 py-4 px-8 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 shadow-xl shadow-indigo-100 group active:scale-[0.98] ${
                  generationState === 'success'
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : generationState === 'generating'
                    ? 'bg-indigo-600/80 text-white cursor-none pointer-events-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {/* Micro Animated Background Shine during compiling */}
                {generationState === 'generating' && (
                  <div
                    className="absolute inset-y-0 left-0 bg-white/15 transition-all duration-300 pointer-events-none"
                    style={{ width: `${generationProgress}%` }}
                  />
                )}

                <AnimatePresence mode="wait">
                  {generationState === 'generating' ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-2.5 z-10"
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>
                        Assembling pages... {generationProgress}%
                      </span>
                    </motion.div>
                  ) : generationState === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5 text-white animate-bounce" />
                      <span>Document Compiled & Saved!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2.5"
                    >
                      <span>Generate & Download PDF</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}

          {/* Quick Informational Tip (under client layout rules, clear labels) */}
          <div className="flex items-start space-x-2 text-slate-500 px-1 pt-1 justify-center">
            <FileImage className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-center max-w-md antialiased leading-normal">
              PROCESSED LOCALLY â€¢ ALL IMAGES ARE PRIVATELY ASSEMBLED ON-DEVICE â€¢ NO SERVERS INVOLVED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


