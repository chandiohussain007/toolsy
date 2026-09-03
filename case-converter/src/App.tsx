import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  ArrowLeftRight, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Trash2, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Hash,
  BookOpen,
  Info
} from 'lucide-react';

// Case transform functions matching exact specifications
const convertToUppercase = (val: string) => val.toUpperCase();

const convertToLowercase = (val: string) => val.toLowerCase();

const convertToTitleCase = (val: string) => {
  return val.split('\n').map(line =>
    line.split(' ').map(word => {
      if (!word) return '';
      // Capitalize first character, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ')
  ).join('\n');
};

const convertToCamelCase = (val: string) => {
  return val.split('\n').map(line => {
    // split by space, hyphen, underscore
    const words = line.trim().split(/[\s\-_]+/);
    if (words.length === 0 || (words.length === 1 && words[0] === '')) return line;
    return words.map((word, i) => {
      const cleaned = word.replace(/[^a-zA-Z0-9]/g, '');
      if (i === 0) {
        return cleaned.toLowerCase();
      }
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }).join('');
  }).join('\n');
};

const convertToSnakeCase = (val: string) => {
  return val.split('\n').map(line => {
    const words = line.trim().split(/[\s\-_]+/);
    if (!words || words.length === 0 || (words.length === 1 && words[0] === '')) return line;
    return words
      .map(word => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      .filter(Boolean)
      .join('_');
  }).join('\n');
};

const convertToSlug = (val: string) => {
  return val.split('\n').map(line => {
    const words = line.trim().split(/[\s\-_]+/);
    if (!words || words.length === 0 || (words.length === 1 && words[0] === '')) return line;
    return words
      .map(word => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      .filter(Boolean)
      .join('-');
  }).join('\n');
};

type CaseType = 'UPPER' | 'lower' | 'Title' | 'camel' | 'snake' | 'slug' | null;

export default function App() {
  const [text, setText] = useState<string>('');
  
  // History state for premium Client-side Undo/Redo tracking
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // Visual state managers
  const [activeCase, setActiveCase] = useState<CaseType>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Focus ref for the primary interaction text arena
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Standard character / stats parsers
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const sentenceCount = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphCount = text.trim() === '' ? 0 : text.split('\n').filter(p => p.trim().length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Handle typing manually
  const handleTextChange = (newVal: string) => {
    setText(newVal);
    // Reset active toggle selection as user is inputting custom manual characters
    setActiveCase(null);

    // Save state changes into history stacks cleanly
    const nextHistory = history.slice(0, historyIndex + 1);
    const updated = [...nextHistory, newVal];
    
    // Limit history stack size to preserve client performance
    if (updated.length > 40) {
      updated.shift();
      setHistory(updated);
      setHistoryIndex(updated.length - 1);
    } else {
      setHistory(updated);
      setHistoryIndex(updated.length - 1);
    }
  };

  // Transformation callback handler
  const handleTransform = (transformFn: (v: string) => string, caseType: CaseType, label: string) => {
    if (!text.trim()) {
      triggerToast('Enter some text first to transform!');
      return;
    }
    
    const transformed = transformFn(text);
    if (transformed === text) {
      setActiveCase(caseType);
      return;
    }

    setText(transformed);
    setActiveCase(caseType);

    // Synchronize history registers
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, transformed]);
    setHistoryIndex(nextHistory.length);

    setLastAction(`Transformed to ${label}`);
    setTimeout(() => setLastAction(null), 2500);
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setText(history[nextIdx]);
      setActiveCase(null);
      setLastAction('Undo action');
      setTimeout(() => setLastAction(null), 1500);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setText(history[nextIdx]);
      setActiveCase(null);
      setLastAction('Redo action');
      setTimeout(() => setLastAction(null), 1500);
    }
  };

  // Copy with dynamic confirmation notification toast
  const handleCopyToClipboard = async () => {
    if (!text) {
      triggerToast('Nothing to copy!');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      triggerToast('Copied to Clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback selector capture if sandbox blocks navigator api
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        triggerToast('Copied to Clipboard! (Fallback)');
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // Clear text with micro rotation transition animation
  const handleClear = () => {
    if (!text) return;
    setIsClearing(true);
    setText('');
    setActiveCase(null);

    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, '']);
    setHistoryIndex(nextHistory.length);

    triggerToast('Cleared Editor');
    setTimeout(() => {
      setIsClearing(false);
    }, 600);
  };

  // Toast message controller
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Quick preset loader
  const loadPresetSample = () => {
    const sample = "The quick brown fox jumps over the lazy dog. Swiftly built with React, Tailwind v4 and framer-motion. Switch casing options below!";
    handleTextChange(sample);
    triggerToast('Sample text loaded');
  };

  return (
    <div className="min-h-screen w-full ts-page-bg flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans select-none">
      
      {/* ðŸ”® Background Abstract Glass Spheres (Apple mesh aesthetic) */}
      <motion.div 
        animate={{ 
          y: [0, 20, -20, 0], 
          x: [0, -15, 15, 0] 
        }} 
        transition={{ 
          duration: 18, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-[12%] left-[10%] w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl -z-10 pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          y: [0, -25, 25, 0], 
          x: [0, 20, -20, 0] 
        }} 
        transition={{ 
          duration: 22, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-rose-200/30 rounded-full blur-3xl -z-10 pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.05, 1]
        }} 
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-[45%] left-[30%] w-80 h-80 bg-amber-100/30 rounded-full blur-3xl -z-10 pointer-events-none" 
      />

      {/* ðŸ–¥ï¸ Main Glassmorphic Container Wrapper (Animate height fluidly) */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        id="case-converter-container"
        className="w-full max-w-2xl bg-white/45 backdrop-blur-xl border border-white/50 shadow-[0_32px_60px_-15px_rgba(0,0,0,0.08)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative"
      >
        {/* Glowing glass overlay for premium hardware reflections */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/10 to-white/40 pointer-events-none -z-10" />

        {/* ðŸ“‹ Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 text-white p-2 rounded-xl shadow-md">
              <ArrowLeftRight size={18} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                Case Converter
              </h1>
              <p className="text-xs text-slate-500 mt-1">Premium minimal text formatting workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/50 transition cursor-pointer"
              title="Show info"
              id="info-toggle-btn"
            >
              <Info size={16} />
            </button>
            <button
              onClick={loadPresetSample}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 transition border border-indigo-100/40 px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
              id="load-sample-btn"
            >
              <Sparkles size={11} /> Load Sample
            </button>
          </div>
        </div>

        {/* â„¹ï¸ Info Section (Sliding Framer Motion drawer) */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden bg-white/70 border border-slate-150 rounded-2xl px-4 py-3 text-xs leading-relaxed text-slate-600 space-y-2 shadow-xs"
              id="info-section-drawer"
            >
              <p className="font-semibold text-slate-800">Transform formulas applied:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li><strong className="text-slate-700">UPPERCASE:</strong> Converted into all-capital lettering blocks.</li>
                <li><strong className="text-slate-700">lowercase:</strong> Restructured to uniform little alphabet representations.</li>
                <li><strong className="text-slate-700">Title Case:</strong> Capitalizes every individual word token across formatting boundaries.</li>
                <li><strong className="text-slate-700">camelCase:</strong> Concatenates word lines stripping spaces, setting first word to small capital.</li>
                <li><strong className="text-slate-700">snake_case:</strong> Formats to lowercase with underscore linkages, perfect for code properties.</li>
                <li><strong className="text-slate-700">slug-ify:</strong> Structures words separating with clean url hyphens, safe for parameters.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* âœï¸ Core Editor Layer */}
        <div className="flex flex-col gap-2">
          
          {/* Header Utilities (Undo/Redo history control bar) */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium">Text Input Canvas</span>
            
            <div className="flex items-center gap-3">
              {/* Last applied Action message banner */}
              <AnimatePresence>
                {lastAction && (
                  <motion.span 
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"
                  >
                    {lastAction}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Undo / Redo controllers */}
              <div className="flex items-center bg-white/60 border border-slate-200/40 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`p-1 rounded-md transition cursor-pointer ${historyIndex <= 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-slate-900 shadow-3xs'}`}
                  title="Undo last change"
                  id="undo-action-btn"
                >
                  <Undo2 size={13} />
                </button>
                <div className="w-[1px] h-3 bg-slate-200" />
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-1 rounded-md transition cursor-pointer ${historyIndex >= history.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-slate-900 shadow-3xs'}`}
                  title="Redo next change"
                  id="redo-action-btn"
                >
                  <Redo2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Textarea container styled beautifully as white glossy card */}
          <div className="relative bg-white/65 hover:bg-white/80 focus-within:bg-white focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200/80 focus-within:border-indigo-400/90 focus-within:ring-4 focus-within:ring-indigo-100/30 rounded-2xl transition-all duration-300 p-4">
            <textarea
              ref={textareaRef}
              id="case-converter-textarea"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste or type your text here to transform cases instantly..."
              className="w-full text-base font-sans leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent min-h-[190px] max-h-[400px] resize-y select-text outline-none border-0 p-0"
              spellCheck="false"
            />

            {/* Micro clean float clear triggers inside textbox when populated */}
            {text && (
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-slate-100 p-1.5 rounded-lg shadow-sm">
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-600 transition flex items-center justify-center p-1 cursor-pointer"
                  title="Clear all text"
                  id="clear-action-btn"
                >
                  <motion.div
                    animate={isClearing ? { rotate: -180, scale: 0.8 } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  >
                    <Trash2 size={14} className="pointer-events-none" />
                  </motion.div>
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar metrics in fluid modern grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-500 font-medium text-[11px] px-1.5 mt-1" id="metrics-tracker-row">
            <div className="flex items-center gap-1 bg-white/30 border border-white/40 rounded-xl px-2.5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
              <Hash size={11} className="text-indigo-400" />
              <span>Characters:</span>
              <strong className="text-slate-800 font-mono text-[11px]">{charCount}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/30 border border-white/40 rounded-xl px-2.5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
              <BookOpen size={11} className="text-indigo-400" />
              <span>Words:</span>
              <strong className="text-slate-800 font-mono text-[11px]">{wordCount}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/30 border border-white/40 rounded-xl px-2.5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
              <FileText size={11} className="text-indigo-400" />
              <span>Sentences:</span>
              <strong className="text-slate-800 font-mono text-[11px]">{sentenceCount}</strong>
            </div>

            <div className="flex items-center gap-1 bg-white/30 border border-white/40 rounded-xl px-2.5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
              <RotateCcw size={11} className="text-indigo-400" />
              <span>Paragraphs:</span>
              <strong className="text-slate-800 font-mono text-[11px]">{paragraphCount}</strong>
            </div>
          </div>

        </div>

        {/* ðŸŽ›ï¸ Segmented Toggle Buttons bar */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-slate-400 tracking-wide px-1">Case Conversions</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 bg-black/[0.03] border border-black/[0.02] p-1.5 rounded-2xl relative z-10">
            {/* UPPERCASE */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-uppercase"
                onClick={() => handleTransform(convertToUppercase, 'UPPER', 'UPPERCASE')}
                className={`w-full text-center py-2.5 text-xs font-bold leading-normal tracking-wide transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'UPPER' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                UPPERCASE
              </button>
              {activeCase === 'UPPER' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>

            {/* lowercase */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-lowercase"
                onClick={() => handleTransform(convertToLowercase, 'lower', 'lowercase')}
                className={`w-full text-center py-2.5 text-xs font-semibold leading-normal transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'lower' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                lowercase
              </button>
              {activeCase === 'lower' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>

            {/* Title Case */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-title"
                onClick={() => handleTransform(convertToTitleCase, 'Title', 'Title Case')}
                className={`w-full text-center py-2.5 text-xs font-semibold leading-normal transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'Title' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Title Case
              </button>
              {activeCase === 'Title' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>

            {/* camelCase */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-camel"
                onClick={() => handleTransform(convertToCamelCase, 'camel', 'camelCase')}
                className={`w-full text-center py-2.5 text-xs font-mono tracking-tight transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'camel' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                camelCase
              </button>
              {activeCase === 'camel' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>

            {/* snake_case */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-snake"
                onClick={() => handleTransform(convertToSnakeCase, 'snake', 'snake_case')}
                className={`w-full text-center py-2.5 text-xs font-mono tracking-tight transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'snake' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                snake_case
              </button>
              {activeCase === 'snake' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>

            {/* slug-ify-text */}
            <div className="relative">
              <button
                type="button"
                id="btn-case-slug"
                onClick={() => handleTransform(convertToSlug, 'slug', 'slug-ify-text')}
                className={`w-full text-center py-2.5 text-xs font-mono tracking-tighter transition rounded-xl relative z-10 cursor-pointer ${activeCase === 'slug' ? 'text-indigo-900 font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                slug-ify
              </button>
              {activeCase === 'slug' && (
                <motion.div
                  layoutId="activeCasingPill"
                  className="absolute inset-0 bg-white border border-slate-200/50 shadow-xs rounded-xl -z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ðŸš€ Primary Copy Action pill button */}
        <motion.button
          type="button"
          id="copy-to-clipboard-btn"
          onClick={handleCopyToClipboard}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-4 rounded-2xl shadow-lg shadow-black/5 hover:shadow-black/10 transition flex items-center justify-center gap-2 cursor-pointer mt-2 group relative overflow-hidden"
        >
          {copied ? (
            <>
              <Check size={16} className="text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} className="text-slate-400 group-hover:text-white transition" />
              <span>Copy to Clipboard</span>
            </>
          )}

          {/* Shimmer reflection sweep line on button hover for high-end styling */}
          <div className="absolute inset-y-0 -left-full w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_1.2s_ease-out_infinite]" />
        </motion.button>

        {/* Informative helper label */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
          <span>Preset rate: {readingTime}m read</span>
          <span>Apple Minimal Casing Suite</span>
        </div>

      </motion.div>

      {/* ðŸ¥‚ Framer Motion Beautiful Glass Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="sandbox-toast"
            initial={{ opacity: 0, y: 55, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-6 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/40 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-2.5 z-50 text-xs font-semibold"
            id="toast-notification"
          >
            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded-lg">
              <Check size={14} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


