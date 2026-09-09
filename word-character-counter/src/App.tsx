/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Sparkles,
  Trash2,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Type,
  Search,
  BookOpen,
  Volume2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Download,
  Target,
  FileText,
  BarChart2,
  ListFilter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-defined filler words (stop words) to toggle keyword filtering
const FILLER_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "at", "by",
  "for", "with", "about", "against", "between", "into", "through", "during", "before", "after",
  "above", "below", "from", "up", "down", "out", "this", "that", "these", "those", "am", "been", "being",
  "have", "has", "had", "having", "do", "does", "did", "doing", "i", "me", "my", "myself", "we", "our",
  "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself",
  "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
  "as", "if", "then", "so", "than", "no", "not", "can", "will", "just", "should", "your", "its", "who", "which"
]);

const SAMPLE_TEXT = `In the modern digital workspace, pristine aesthetics and mechanical utility are no longer distinct; they have merged. Elegant software behaves like frosted glassâ€”revealing depth without introducing chaos.

This premium Word Counter demonstrates how custom calculations, syllable analysis, and real-time metric updates coexist in a single, lag-free canvas. Every keystroke triggers immediate recalibrations: readability grades shift, syllable density is analyzed, and the most frequent keyword metrics are instantly updated. 

Start editing this paragraph, or drop your own text document right here to experience typographic analysis at its absolute finest.`;

// Spring animations configurations
const animationSpring = { type: "spring", stiffness: 350, damping: 25 };

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

// A micro-animated bounce tag for number updates
function AnimatedValue({ value }: { value: string | number }) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 0.9, opacity: 0.5, y: -4 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="inline-block font-mono font-bold text-gray-900 tracking-tight"
    >
      {value}
    </motion.span>
  );
}

// Floating layout background widgets resembling Apple's wallpaper blobs
function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 80, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 25, ease: "easeInOut", repeat: Infinity }}
        className="absolute w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl -top-20 -left-20"
      />
      <motion.div
        animate={{
          x: [0, -90, 60, 0],
          y: [0, 80, -50, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{ duration: 30, ease: "easeInOut", repeat: Infinity }}
        className="absolute w-96 h-96 rounded-full bg-pink-100/50 blur-3xl top-1/3 -right-20"
      />
      <motion.div
        animate={{
          x: [0, 50, -60, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 0.85, 1],
        }}
        transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
        className="absolute w-96 h-96 rounded-full bg-cyan-150/40 blur-3xl -bottom-20 left-1/3"
      />
    </div>
  );
}

export default function App() {
  const [text, setText] = useState<string>(SAMPLE_TEXT);
  const [copied, setCopied] = useState<boolean>(false);
  const [wpmReading, setWpmReading] = useState<number>(200);
  const [wpmSpeaking, setWpmSpeaking] = useState<number>(130);
  const [excludeFillers, setExcludeFillers] = useState<boolean>(true);
  
  // Custom interactive features
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  // Target tracking features
  const [goalEnabled, setGoalEnabled] = useState<boolean>(false);
  const [goalType, setGoalType] = useState<"words" | "characters">("words");
  const [goalValue, setGoalValue] = useState<number>(300);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Instant Copy Handler
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Case Modifiers with instant layout feedback
  const convertCase = (type: "upper" | "lower" | "title" | "sentence") => {
    if (!text) return;
    let modifiedText = "";
    if (type === "upper") {
      modifiedText = text.toUpperCase();
    } else if (type === "lower") {
      modifiedText = text.toLowerCase();
    } else if (type === "title") {
      modifiedText = text.replace(/\b[a-zA-Z]/g, (char) => char.toUpperCase());
    } else if (type === "sentence") {
      modifiedText = text.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, delimiter, char) => delimiter + char.toUpperCase());
    }
    setText(modifiedText);
  };

  // Clear Text with animation transition
  const handleClear = () => {
    setText("");
    setSearchQuery("");
  };

  // Load sample text
  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  // Drag and Drop Text Files Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setText((event.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  // Native Selector File Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setText((event.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  // Export as TXT file utility
  const handleExportTxt = () => {
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Typography-Metrics-Export.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Core Metrics Calculations using reactive useMemo optimization
  const wordsArray = useMemo(() => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0);
  }, [text]);

  const wordCount = wordsArray.length;
  const charWithSpaces = text.length;
  const charNoSpaces = useMemo(() => {
    return text.replace(/\s/g, "").length;
  }, [text]);

  const sentencesCount = useMemo(() => {
    if (!text.trim()) return 0;
    // Split on standard punctuation followed by whitespace or line breaks
    const sentences = text.split(/[.!?]+(?=\s|$)/);
    return sentences.filter((s) => s.trim().length > 0).length;
  }, [text]);

  const paragraphsCount = useMemo(() => {
    if (!text.trim()) return 0;
    return text.split(/\n+/).filter((p) => p.trim().length > 0).length;
  }, [text]);

  // Readability statistics calculated via robust Flesh-Kincaid formula
  const readabilityMetrics = useMemo(() => {
    if (wordCount === 0) {
      return { score: 100, label: "None", note: "Insert text to map readability grade", bg: "bg-gray-50 border-gray-100 text-gray-500", progressColor: "#9ca3af" };
    }

    // Interactive approximation syllable count for real-time responsiveness
    let totalSyllables = 0;
    wordsArray.forEach((word) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
      if (cleanWord.length === 0) return;
      if (cleanWord.length <= 3) {
        totalSyllables += 1;
        return;
      }
      const cleaned = cleanWord
        .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
        .replace(/^y/, "");
      const matches = cleaned.match(/[aeiouy]{1,2}/g);
      const syll = matches ? matches.length : 1;
      totalSyllables += Math.max(1, syll);
    });

    const activeSentences = sentencesCount === 0 ? 1 : sentencesCount;
    const asl = wordCount / activeSentences; // Average Sentence Length
    const asw = totalSyllables / wordCount; // Average Syllables per Word

    // Standard Flesch Reading Ease Formula calculation
    const scoreVal = 206.835 - (1.015 * asl) - (84.6 * asw);
    const score = Math.max(0, Math.min(100, Math.round(scoreVal)));

    let label = "Standard";
    let note = "Perfect for web readers & standard text summaries.";
    let bg = "bg-blue-50/70 border-blue-100 text-blue-600";
    let progressColor = "#3b82f6"; // Tailwind Blue

    if (score >= 90) {
      label = "5th Grade (Very Easy)";
      note = "Extremely easy to read and digest, suitable for kids.";
      bg = "bg-teal-50/70 border-teal-100 text-teal-600";
      progressColor = "#14b8a6"; // Teal
    } else if (score >= 80) {
      label = "6th Grade (Easy)";
      note = "Conversational English, easily understood by tourists.";
      bg = "bg-emerald-50/70 border-emerald-100 text-emerald-600";
      progressColor = "#10b981"; // Emerald
    } else if (score >= 70) {
      label = "7th Grade (Fairly Easy)";
      note = "Easily understood by standard school students.";
      bg = "bg-lime-50/70 border-lime-100 text-lime-600";
      progressColor = "#84cc16"; // Lime
    } else if (score >= 50) {
      label = "High School (Fairly Hard)";
      note = "Requires focused attention, standard news level.";
      bg = "bg-amber-50/70 border-amber-100 text-amber-600";
      progressColor = "#f59e0b"; // Amber
    } else if (score >= 30) {
      label = "College Level (Hard)";
      note = "Academic text structure, optimized for professionals.";
      bg = "bg-orange-50/70 border-orange-100 text-orange-600";
      progressColor = "#f97316"; // Orange
    } else if (score < 30) {
      label = "College Graduate (Very Hard)";
      note = "Scientific and technical papers. Extremely complex.";
      bg = "bg-red-50/70 border-red-100 text-red-600";
      progressColor = "#ef4444"; // Red
    }

    return { score, label, note, bg, progressColor };
  }, [wordsArray, wordCount, sentencesCount]);

  // Readability score chart distribution metrics
  const vowelConsonantBreakdown = useMemo(() => {
    if (charWithSpaces === 0) return { vowels: 0, consonants: 0, mathPct: 0, symbolsPct: 0 };
    const vowels = (text.match(/[aeiou]/gi) || []).length;
    const consonants = (text.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    const digits = (text.match(/[0-9]/g) || []).length;
    const symbols = (text.replace(/\s/g, "").match(/[^a-zA-Z0-9]/g) || []).length;
    
    const sum = vowels + consonants + digits + symbols;
    if (sum === 0) return { vowels: 0, consonants: 0, digits: 0, symbols: 0 };

    return {
      vowels: Math.round((vowels / sum) * 100),
      consonants: Math.round((consonants / sum) * 100),
      digits: Math.round((digits / sum) * 100),
      symbols: Math.round((symbols / sum) * 100),
      counts: { vowels, consonants, digits, symbols }
    };
  }, [text, charWithSpaces]);

  // Keyword Density calculation: Extracts top 5 used words
  const topWords = useMemo(() => {
    if (wordCount === 0) return [];
    
    const wordCounts: Record<string, number> = {};
    wordsArray.forEach((word) => {
      // Clean leading and trailing punctuation tokens
      const cleaned = word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
      if (cleaned.length <= 1) return; // ignore isolated letter variables
      
      // Filter filler words if exclude toggle is checked
      if (excludeFillers && FILLER_WORDS.has(cleaned)) return;
      
      wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .map(([word, freq]) => ({
        word,
        count: freq,
        density: Math.round((freq / wordCount) * 100)
      }))
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
      .slice(0, 5);
  }, [wordsArray, wordCount, excludeFillers]);

  // Interactive Live Search Match Count helper
  const searchQueryMatches = useMemo(() => {
    if (!searchQuery.trim() || !text) return 0;
    try {
      // Escape special characters to prevent regex crashes
      const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedQuery}\\b`, "gi");
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [searchQuery, text]);

  // Reading duration estimates format: "X min Y sec" or similar
  const readingDurationStr = useMemo(() => {
    const totalSecs = Math.ceil((wordCount / wpmReading) * 60);
    if (totalSecs < 60) return `${totalSecs} sec`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }, [wordCount, wpmReading]);

  // Speaking duration formatting
  const speakingDurationStr = useMemo(() => {
    const totalSecs = Math.ceil((wordCount / wpmSpeaking) * 60);
    if (totalSecs < 60) return `${totalSecs} sec`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }, [wordCount, wpmSpeaking]);

  // Typing speed estimate (averaging 40 WPM)
  const typingDurationStr = useMemo(() => {
    const totalSecs = Math.ceil((wordCount / 40) * 60);
    if (totalSecs < 60) return `${totalSecs} sec`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }, [wordCount]);

  // Interactive Target tracking completion percentage
  const goalProgress = useMemo(() => {
    if (!goalEnabled || goalValue <= 0) return 0;
    const currentVal = goalType === "words" ? wordCount : charWithSpaces;
    return Math.min(100, Math.round((currentVal / goalValue) * 100));
  }, [goalEnabled, goalType, goalValue, wordCount, charWithSpaces]);

  return (
    <div className="relative min-h-screen ts-page-bg flex flex-col justify-start items-center px-4 py-8 md:py-12 select-none">
      {/* Premium blur background wallpaper */}
      <BackgroundBlobs />

      {/* Primary glass workspace layout container */}
      <div 
        id="app-glass-container"
        className="w-full max-w-5xl rounded-3xl bg-white/40 border border-white/20 backdrop-blur-xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-6 md:gap-8 transition-all duration-300"
      >
        
        {/* Apple-style Dashboard Header */}
        <div id="dashboard-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center justify-center bg-indigo-500 text-white rounded-lg p-1.5 shadow-md shadow-indigo-500/20">
                <Sparkles size={18} />
              </span>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                Typography Studio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600/80 font-medium">
              Premium Apple macOS-inspired interactive analytical text desk
            </p>
          </div>

          {/* Mini Quick Utilities Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Load Sample Essay button */}
            <button
              onClick={handleLoadSample}
              id="btn-load-sample"
              className="px-3 py-1.5 rounded-xl bg-white/60 border border-gray-200/50 hover:bg-white hover:border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
              title="Fill dashboard with a beautifully structured sample essay layout"
            >
              <RefreshCw size={13} className="text-indigo-500 animate-spin-slow" />
              Sample Text
            </button>

            {/* Quick Export as Text asset */}
            <button
              onClick={handleExportTxt}
              disabled={!text}
              id="btn-export-text"
              className="px-3 py-1.5 rounded-xl bg-white/60 border border-gray-200/50 hover:bg-white hover:border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              title="Export current written text straight as an offline document file"
            >
              <Download size={13} className="text-indigo-500" />
              Export .txt
            </button>

            {/* Instant Copy text */}
            <button
              onClick={handleCopy}
              disabled={!text}
              id="btn-copy-clipboard"
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-40 disabled:pointer-events-none active:scale-95 ${
                copied
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                  : "bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white shadow-md shadow-indigo-600/15"
              }`}
              title="Copy the entire active canvas content directly"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
        </div>

        {/* Master Column Split Layout. Responsive Grid: Left canvas + toolbar, Right analytical bento sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left Main Module: Active canvas + drag zone & casing shortcuts */}
          <div className="lg:col-span-12 xl:lg:col-span-7 flex flex-col gap-5 lg:col-span-7">
            
            {/* Draggable upload canvas zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              id="canvas-dropzone-wrapper"
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-inner"
                  : "border-gray-200/60 bg-white/50 hover:bg-white/60"
              }`}
            >
              {/* Inside overlay prompt during drag-and-drop operations */}
              <AnimatePresence>
                {isDragOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs rounded-2xl flex flex-col justify-center items-center pointer-events-none z-20"
                  >
                    <div className="bg-white rounded-2xl p-4 shadow-xl border border-indigo-100 flex flex-col items-center gap-2">
                      <div className="bg-indigo-50 text-indigo-600 rounded-full p-3 animate-bounce">
                        <Upload size={24} />
                      </div>
                      <p className="font-bold text-sm text-gray-900">Drop your file anywhere</p>
                      <p className="text-xs text-gray-500">Supports pure .txt and markdown documents</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Responsive Toolbar header */}
              <div className="flex flex-wrap items-center justify-between pointer-events-auto p-3 bg-white/30 border-b border-gray-200/40 rounded-t-2xl gap-3">
                
                {/* Visual statistics metrics headers */}
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-500" />
                  Visual Workspace Canvas
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".txt,.md"
                    className="hidden"
                  />
                  {/* Standard file selector activator */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    id="btn-upload-manual"
                    className="px-2.5 py-1.5 rounded-lg hover:bg-white/80 active:bg-white text-gray-600 hover:text-indigo-600 transition-all text-xs font-bold border border-gray-200/20 flex items-center gap-1"
                    title="Load a file via selector"
                  >
                    <Upload size={13} />
                    Import File
                  </button>

                  {/* Fast clear button */}
                  <button
                    onClick={handleClear}
                    disabled={!text}
                    id="btn-clear-canvas"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
                    title="Wipe current keyboard entry pristine"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Pure interactive typing textarea canvas */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  id="canvas-textarea"
                  placeholder="Drop a file here, paste sample text above, or start typing your thoughts natively with zero lag..."
                  className="w-full h-80 sm:h-96 md:h-[420px] p-4 md:p-5 outline-none text-gray-800 text-sm sm:text-base leading-relaxed bg-transparent resize-none font-sans z-10 transition-all font-normal placeholder-gray-400/80"
                  style={{ caretColor: "#4f46e5" }}
                />

                {/* Counter visual overlay tags */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
                  {text.length > 0 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white/80 backdrop-blur-xs border border-gray-200/40 rounded-lg py-1 px-2.5 shadow-sm flex items-center gap-2 text-[10px] sm:text-xs font-medium text-gray-500"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-indigo-600">{wordCount}</span> words
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-gray-700">{charWithSpaces}</span> characters
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Case conversion tool belt with smooth layouts */}
            <div id="casing-toolbelt" className="bg-white/50 border border-white/30 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                <Type size={14} className="text-indigo-500" />
                Case Transformations:
              </span>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => convertCase("upper")}
                  disabled={!text}
                  id="btn-case-upper"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/50 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-all hover:border-gray-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-xs active:scale-95 text-center"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={() => convertCase("lower")}
                  disabled={!text}
                  id="btn-case-lower"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/50 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-all hover:border-gray-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-xs active:scale-95 text-center"
                >
                  lowercase
                </button>
                <button
                  onClick={() => convertCase("title")}
                  disabled={!text}
                  id="btn-case-title"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/50 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-all hover:border-gray-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-xs active:scale-95 text-center"
                >
                  Title Case
                </button>
                <button
                  onClick={() => convertCase("sentence")}
                  disabled={!text}
                  id="btn-case-sentence"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/50 hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-all hover:border-gray-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-xs active:scale-95 text-center"
                >
                  Sentence case
                </button>
              </div>
            </div>

            {/* Interactive Search Matches & Highlighting tools */}
            <div id="search-high-box" className="bg-white/50 border border-white/30 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Search size={15} className="text-indigo-500 shrink-0" />
                <span className="text-xs font-bold text-gray-700 shrink-0">In-Text Keyword Query:</span>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto grow max-w-md">
                <input
                  type="text"
                  placeholder="Type a word to highlight density count..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search-highlight-input"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-gray-400"
                />
                
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery("")}
                    id="btn-clear-search-query"
                    className="p-1 px-1.5 text-[10px] hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {searchQuery.trim() && (
                <div id="search-matches-pill">
                  <span className={`text-[11px] font-bold py-1 px-2.5 rounded-full border shadow-xs animate-pulse ${
                    searchQueryMatches > 0 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                      : "text-amber-700 bg-amber-50 border-amber-100"
                  }`}>
                    Found {searchQueryMatches} {searchQueryMatches === 1 ? "match" : "matches"}
                  </span>
                </div>
              )}
            </div>

            {/* Copywriter Goals Setting and reactive progress visualization */}
            <div id="goalstracker-pnl" className="bg-white/50 border border-white/30 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target size={16} className={`text-indigo-500 ${goalEnabled ? "animate-pulse" : ""}`} />
                  <span className="text-xs font-bold text-gray-700">Writing targets & thresholds:</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={goalEnabled}
                      onChange={(e) => setGoalEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      id="checkbox-goal-activation"
                    />
                    Enable Goal Tracker
                  </label>
                  
                  {goalEnabled && (
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5" id="goal-type-selector">
                      <button
                        onClick={() => setGoalType("words")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          goalType === "words" ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Words
                      </button>
                      <button
                        onClick={() => setGoalType("characters")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          goalType === "characters" ? "bg-indigo-500 text-white" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Chars
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {goalEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3 pt-2 border-t border-gray-200/30 overflow-hidden"
                  id="goal-progress-subpanel"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-500">
                      Target Goal:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="99999"
                        value={goalValue}
                        onChange={(e) => setGoalValue(Math.max(10, parseInt(e.target.value) || 0))}
                        className="w-20 bg-white border border-gray-200 rounded-lg py-0.5 px-2 text-xs font-mono font-bold text-gray-800 text-center"
                        id="input-goal-value"
                      />
                      <span className="text-xs font-bold text-gray-500">{goalType}</span>
                    </div>
                  </div>

                  {/* Reactive horizontal progress tracker with spring ease */}
                  <div className="relative">
                    <div className="w-full h-3 bg-gray-200/60 border border-gray-300/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ type: "spring", stiffness: 85, damping: 15 }}
                        className={`h-full rounded-full relative ${
                          goalProgress >= 100
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500"
                        }`}
                      />
                    </div>
                    
                    {/* Floating check indicator if goal completed */}
                    {goalProgress >= 100 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1 -top-2 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-md shadow-emerald-500/10"
                      >
                        <Check size={9} strokeWidth={4} />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold">
                    <span>
                      {goalType === "words" ? wordCount : charWithSpaces} / {goalValue} {goalType}
                    </span>
                    <span className={`font-mono ${goalProgress >= 100 ? "text-emerald-500" : "text-indigo-500"}`}>
                      {goalProgress}% Complete
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

          </div>

          {/* Right Bento Column: Stats layout + density analysis + reading benchmarks */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6 lg:col-span-11 xl:lg:col-span-5">
            
            {/* Core Stats Bento grid */}
            <div id="stats-widget-grid" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-4">
              
              {/* Words Card */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">WORDS</span>
                  <span className="bg-indigo-50 text-indigo-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <FileText size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={wordCount} />
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Distinct words mapped</p>
                </div>
              </div>

              {/* Characters With Spaces Card */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">CHARACTERS</span>
                  <span className="bg-purple-50 text-purple-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <Type size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={charWithSpaces} />
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">With blank spaces</p>
                </div>
              </div>

              {/* Characters no spaces Card */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">CHARS NO SPACES</span>
                  <span className="bg-pink-50 text-pink-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <Sparkles size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={charNoSpaces} />
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Core character blocks</p>
                </div>
              </div>

              {/* Sentences & Paragraphs Card */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">SENTENCES</span>
                  <span className="bg-teal-50 text-teal-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <TrendingUp size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={sentencesCount} />
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                    {paragraphsCount} {paragraphsCount === 1 ? "paragraph" : "paragraphs"} mapped
                  </p>
                </div>
              </div>

              {/* Estimate Reading Speed Card with responsive speed controls */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">READING TIME</span>
                  <span className="bg-amber-50 text-amber-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <BookOpen size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={readingDurationStr} />
                  </h3>
                  
                  {/* Quick toggle slider */}
                  <div className="mt-2" id="reading-slider-container">
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <span>Speed:</span>
                      <span>{wpmReading} WPM</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="320"
                      step="10"
                      value={wpmReading}
                      onChange={(e) => setWpmReading(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 h-1 rounded cursor-pointer mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Estimate Speaking speed with responsive speaking speeds toggle */}
              <div className="bg-white/50 border border-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider">SPEAKING TIME</span>
                  <span className="bg-cyan-50 text-cyan-500 rounded-lg p-1 group-hover:scale-105 transition-transform duration-200">
                    <Volume2 size={14} />
                  </span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-mono font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={speakingDurationStr} />
                  </h3>
                  
                  {/* Slider controls speaking time estimations */}
                  <div className="mt-2" id="speaking-slider-container">
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <span>Speed:</span>
                      <span>{wpmSpeaking} WPM</span>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="210"
                      step="10"
                      value={wpmSpeaking}
                      onChange={(e) => setWpmSpeaking(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 h-1 rounded cursor-pointer mt-1"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Readability gauge metrics details widget */}
            <div id="readability-card-diagnostics" className="bg-white/50 border border-white/30 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <Award size={14} className="text-indigo-500" />
                  Readability Index (Flesch Score)
                </span>

                {text.trim() && (
                  <span className={`text-[10px] font-bold py-0.5 px-2 rounded-lg border shadow-xs ${readabilityMetrics.bg}`}>
                    {readabilityMetrics.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-5">
                {/* Score gauge circle indicator */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${readabilityMetrics.score}, 100` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      stroke={readabilityMetrics.progressColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-mono font-black text-gray-800 tracking-tighter leading-none">
                      {readabilityMetrics.score}
                    </span>
                    <span className="text-[8px] uppercase tracking-wide text-gray-400 font-bold">score</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pr-1">
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-gray-800">
                    {wordCount > 0 ? readabilityMetrics.label : "Write to evaluate readability"}
                  </h4>
                  <p className="text-xs text-gray-500 leading-normal">
                    {readabilityMetrics.note}
                  </p>
                </div>
              </div>

              {/* Interactive speech / typing duration details */}
              {wordCount > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/30 text-[11px] text-gray-500 font-semibold">
                  <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-lg border border-gray-200/20">
                    <Clock size={11} className="text-gray-400" />
                    <span>Est. Typing Speed: <strong className="text-gray-700 font-mono font-bold">{typingDurationStr}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-lg border border-gray-200/20">
                    <Clock size={11} className="text-gray-400" />
                    <span>Avg Reading Speeds: <strong className="text-gray-700 font-mono font-bold">{wpmReading} WPM</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Vowels, Consonants, Digits, Symbols stacked layout distribution */}
            {charWithSpaces > 0 && (
              <div id="character-ratio-subpnl" className="bg-white/50 border border-white/30 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <BarChart2 size={14} className="text-indigo-500" />
                  Character Ratio Distribution
                </span>

                <div className="flex h-3 bg-gray-200/50 rounded-full overflow-hidden border border-gray-300/10">
                  <div
                    style={{ width: `${vowelConsonantBreakdown.vowels}%` }}
                    className="bg-indigo-500 h-full transition-all duration-500"
                    title={`Vowels: ${vowelConsonantBreakdown.counts?.vowels} (${vowelConsonantBreakdown.vowels}%)`}
                  />
                  <div
                    style={{ width: `${vowelConsonantBreakdown.consonants}%` }}
                    className="bg-pink-400 h-full transition-all duration-500"
                    title={`Consonants: ${vowelConsonantBreakdown.counts?.consonants} (${vowelConsonantBreakdown.consonants}%)`}
                  />
                  <div
                    style={{ width: `${vowelConsonantBreakdown.digits}%` }}
                    className="bg-amber-400 h-full transition-all duration-500"
                    title={`Digits: ${vowelConsonantBreakdown.counts?.digits} (${vowelConsonantBreakdown.digits}%)`}
                  />
                  <div
                    style={{ width: `${vowelConsonantBreakdown.symbols}%` }}
                    className="bg-teal-400 h-full transition-all duration-500"
                    title={`Punctuation: ${vowelConsonantBreakdown.counts?.symbols} (${vowelConsonantBreakdown.symbols}%)`}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-bold text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
                    <span>Vowels: {vowelConsonantBreakdown.vowels}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-pink-400 shrink-0" />
                    <span>Cons: {vowelConsonantBreakdown.consonants}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0" />
                    <span>Digits: {vowelConsonantBreakdown.digits}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-teal-400 shrink-0" />
                    <span>Symbols: {vowelConsonantBreakdown.symbols}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Keyword insights bento card panel */}
            <div id="keyword-insights-pnl" className="bg-white/50 border border-white/30 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <TrendingUp size={14} className="text-indigo-500" />
                  Top 5 Most Used Words
                </span>

                {/* exclude common stop words toggle */}
                <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={excludeFillers}
                    onChange={(e) => setExcludeFillers(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-500 focus:ring-0 w-3 h-3"
                    id="checkbox-exclude-filler-words"
                  />
                  Skip Fillers
                </label>
              </div>

              {/* Render dynamic words as sleek tag pills */}
              <div className="flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                  {topWords.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium py-3 italic text-center">
                      No matching keywords analyzed.
                    </p>
                  ) : (
                    topWords.map((item) => (
                      <motion.div
                        key={item.word}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={animationSpring}
                        onClick={() => setSearchQuery(item.word)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all duration-200 hover:-translate-x-0.5 ${
                          searchQuery === item.word
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-white/60 border-gray-200/40 hover:bg-white text-gray-700 hover:border-indigo-200"
                        }`}
                        title={`Click to find appearances in text`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.word}</span>
                          <span className={`text-[9px] font-bold py-0.5 px-1.5 rounded-md ${
                            searchQuery === item.word 
                              ? "bg-white/20 text-white" 
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {item.density}% density
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-xs ${
                          searchQuery === item.word ? "text-indigo-150" : "text-indigo-500"
                        }`}>
                          Ã—{item.count}
                        </span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Mini user assistant tip */}
              <div className="bg-indigo-50/40 border border-indigo-100/35 rounded-xl p-2.5 text-[10px] text-gray-500 flex items-start gap-1.5 font-medium leading-relaxed">
                <span className="text-indigo-500 font-bold shrink-0">Tip:</span>
                <span>Clicking on any keyword pill above automatically isolates and outputs matches in your typing canvas.</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Elegant structural footer */}
      <footer className="w-full max-w-5xl py-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center px-4 gap-2">
        <span>&copy; {new Date().getFullYear()} Typography Studio. Locally managed logic.</span>
        <span>Aesthetic Apple layout workspace</span>
      </footer>
    </div>
  );
}


