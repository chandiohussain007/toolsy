import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  BookOpen, 
  Code, 
  Search, 
  ArrowRight, 
  FileText,
  Trash2,
  FileCode,
  Info,
  ChevronRight,
  ClipboardList,
  Eye,
  Settings2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Interfaces ---

type DiffResolution = 'line' | 'word' | 'char';
type ViewMode = 'split' | 'unified';

interface DiffChange<T> {
  type: 'added' | 'removed' | 'normal';
  value: T;
}

interface AlignedRow {
  left?: {
    lineNum: number;
    type: 'removed' | 'normal';
    value: string;
    wordChanges?: DiffChange<string>[];
  };
  right?: {
    lineNum: number;
    type: 'added' | 'normal';
    value: string;
    wordChanges?: DiffChange<string>[];
  };
}

interface UnifiedRow {
  lineNumLeft?: number;
  lineNumRight?: number;
  type: 'added' | 'removed' | 'normal';
  value: string;
  wordChanges?: DiffChange<string>[];
}

interface Preset {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'prose';
  original: string;
  modified: string;
}

// --- Presets Data ---

const CUSTOM_PRESETS: Preset[] = [
  {
    id: 'code-typescript',
    title: 'TypeScript Refactory',
    description: 'Compare legacy fetch routine with modern robust typed version.',
    category: 'code',
    original: `// Legacy users fetched from old REST API
function fetchUsers() {
  const response = fetch('/api/users');
  const data = response.json();
  return data.users.sort((a,b) => a.id - b.id);
}`,
    modified: `// Optimized fetch with typed response & robust error handling
interface User {
  id: number;
  name: string;
  role: string;
}

async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/v2/users');
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    return (data.users as User[]).sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('User fetch error:', err);
    return [];
  }
}`
  },
  {
    id: 'prose-edit',
    title: 'Marketing Copy',
    description: 'Corporate copy edited for maximum engagement and brevity.',
    category: 'prose',
    original: `Welcome to our platform! We are dedicated to providing the ultimate software service for developers. Our product is designed to easily automate workflows, allowing teams of all sizes to collaborate and speed up their productivity. With our cutting-edge AI-assisted helper tools, writing applications becomes simple and fast. Try it now!`,
    modified: `Welcome to Google AI Studio Build! We build highly automated software spaces for productive developers. Our platform untangles your daily dev workflow, enabling cohesive modern teams to build, iterate, and deploy apps in real time. Backed by state-of-the-art Google Gemini models, you can turn natural ideas into running software in minutes.`
  },
  {
    id: 'empty',
    title: 'Blank Editor',
    description: 'Wipe all text and start from a clean canvas.',
    category: 'prose',
    original: '',
    modified: ''
  }
];

// --- Diff Parsing Engine (LCS) ---

/**
 * Tokenize a paragraph into separate words, keeping whitespace tokens intact
 * to preserve pixel-perfect spacing during reconstructions.
 */
function tokenizeWords(text: string): string[] {
  if (!text) return [];
  // Keep whitespaces, line feeds, and words isolated in the list
  return text.split(/(\s+)/).filter(token => token.length > 0);
}

/**
 * Basic dynamic programming LCS implementation to compute differences.
 */
function diffLCS<T>(
  original: T[],
  modified: T[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b
): DiffChange<T>[] {
  const n = original.length;
  const m = modified.length;

  // We guard extreme lengths to prevent memory allocation or thread freezes in the browser
  if (n * m > 3500000) {
    // Return direct chunk alignment if too large (fallback to avoid visual freeze)
    const result: DiffChange<T>[] = [];
    original.forEach(v => result.push({ type: 'removed', value: v }));
    modified.forEach(v => result.push({ type: 'added', value: v }));
    return result;
  }

  // Pre-allocate DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (equals(original[i - 1], modified[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffChange<T>[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(original[i - 1], modified[j - 1])) {
      result.unshift({ type: 'normal', value: original[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: modified[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', value: original[i - 1] });
      i--;
    }
  }

  return result;
}

// --- Circular Similarity Widget ---

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-gray-100 dark:stroke-zinc-800"
          strokeWidth="4"
          fill="transparent"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          className={`${
            percentage > 80 
              ? 'stroke-emerald-500' 
              : percentage > 50 
                ? 'stroke-amber-500' 
                : 'stroke-rose-400'
          }`}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
        {percentage}%
      </span>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [originalText, setOriginalText] = useState<string>(CUSTOM_PRESETS[0].original);
  const [modifiedText, setModifiedText] = useState<string>(CUSTOM_PRESETS[0].modified);
  
  const [viewStatus, setViewStatus] = useState<'edit' | 'compare'>('edit');
  const [resolution, setResolution] = useState<DiffResolution>('line');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPreset, setCurrentPreset] = useState<string>(CUSTOM_PRESETS[0].id);

  // Success state for "Copied!" triggers
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedModified, setCopiedModified] = useState(false);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // --- Scroll Synchronization Toggle & Refs ---
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const scrollSource = useRef<'left' | 'right' | null>(null);

  // Sync scrolling of parallel split panels
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;
    
    const left = leftColRef.current;
    const right = rightColRef.current;
    if (!left || !right) return;

    if (scrollSource.current === null) {
      scrollSource.current = source;
    }

    if (scrollSource.current === source) {
      if (source === 'left') {
        right.scrollTop = left.scrollTop;
        right.scrollLeft = left.scrollLeft;
      } else {
        left.scrollTop = right.scrollTop;
        left.scrollLeft = right.scrollLeft;
      }
    }
  };

  const handleScrollEnd = () => {
    scrollSource.current = null;
  };

  // Reset scroll source variables on mouse events
  useEffect(() => {
    const resetScroll = () => { scrollSource.current = null; };
    window.addEventListener('mouseup', resetScroll);
    return () => window.removeEventListener('mouseup', resetScroll);
  }, []);

  // Preset loader
  const handleLoadPreset = (preset: Preset) => {
    setOriginalText(preset.original);
    setModifiedText(preset.modified);
    setCurrentPreset(preset.id);
  };

  // Clean form
  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setCurrentPreset('empty');
  };

  // Copy helpers
  const handleCopyClipboard = (text: string, type: 'orig' | 'mod' | 'diff') => {
    navigator.clipboard.writeText(text);
    if (type === 'orig') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else if (type === 'mod') {
      setCopiedModified(true);
      setTimeout(() => setCopiedModified(false), 2000);
    } else {
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  // --- Core Diff Calculation ---

  const diffResult = useMemo(() => {
    // Split into arrays
    const originalLines = originalText.split(/\r?\n/);
    const modifiedLines = modifiedText.split(/\r?\n/);

    // 1. Line-by-Line calculation
    const rawLineDiffs = diffLCS<string>(originalLines, modifiedLines);
    
    // Process align rows for side-by-side splits
    const alignedRows: AlignedRow[] = [];
    let leftLineCounter = 1;
    let rightLineCounter = 1;
    let idx = 0;

    while (idx < rawLineDiffs.length) {
      const current = rawLineDiffs[idx];
      if (current.type === 'normal') {
        alignedRows.push({
          left: {
            lineNum: leftLineCounter++,
            type: 'normal',
            value: current.value
          },
          right: {
            lineNum: rightLineCounter++,
            type: 'normal',
            value: current.value
          }
        });
        idx++;
      } else if (current.type === 'removed') {
        // Gather consecutive removed lines
        const removedGroup: { lineNum: number; value: string }[] = [];
        while (idx < rawLineDiffs.length && rawLineDiffs[idx].type === 'removed') {
          removedGroup.push({
            lineNum: leftLineCounter++,
            value: rawLineDiffs[idx].value
          });
          idx++;
        }

        // Gather consecutive added lines immediately following
        const addedGroup: { lineNum: number; value: string }[] = [];
        while (idx < rawLineDiffs.length && rawLineDiffs[idx].type === 'added') {
          addedGroup.push({
            lineNum: rightLineCounter++,
            value: rawLineDiffs[idx].value
          });
          idx++;
        }

        const minLen = Math.min(removedGroup.length, addedGroup.length);

        // Treat overlapping replacements with word-level highlight
        for (let k = 0; k < minLen; k++) {
          const rem = removedGroup[k];
          const add = addedGroup[k];
          const wordChanges = diffLCS<string>(tokenizeWords(rem.value), tokenizeWords(add.value));

          alignedRows.push({
            left: {
              lineNum: rem.lineNum,
              type: 'removed',
              value: rem.value,
              wordChanges
            },
            right: {
              lineNum: add.lineNum,
              type: 'added',
              value: add.value,
              wordChanges
            }
          });
        }

        // Leftover removed
        for (let k = minLen; k < removedGroup.length; k++) {
          alignedRows.push({
            left: {
              lineNum: removedGroup[k].lineNum,
              type: 'removed',
              value: removedGroup[k].value
            }
          });
        }

        // Leftover added
        for (let k = minLen; k < addedGroup.length; k++) {
          alignedRows.push({
            right: {
              lineNum: addedGroup[k].lineNum,
              type: 'added',
              value: addedGroup[k].value
            }
          });
        }
      } else {
        // Standalone added block
        alignedRows.push({
          right: {
            lineNum: rightLineCounter++,
            type: 'added',
            value: current.value
          }
        });
        idx++;
      }
    }

    // Build flat list Unified lines
    const unifiedRows: UnifiedRow[] = [];
    alignedRows.forEach(row => {
      if (row.left && row.right) {
        if (row.left.type === 'normal') {
          unifiedRows.push({
            lineNumLeft: row.left.lineNum,
            lineNumRight: row.right.lineNum,
            type: 'normal',
            value: row.left.value
          });
        } else {
          // Paired difference rows
          unifiedRows.push({
            lineNumLeft: row.left.lineNum,
            type: 'removed',
            value: row.left.value,
            wordChanges: row.left.wordChanges
          });
          unifiedRows.push({
            lineNumRight: row.right.lineNum,
            type: 'added',
            value: row.right.value,
            wordChanges: row.right.wordChanges
          });
        }
      } else if (row.left) {
        unifiedRows.push({
          lineNumLeft: row.left.lineNum,
          type: 'removed',
          value: row.left.value
        });
      } else if (row.right) {
        unifiedRows.push({
          lineNumRight: row.right.lineNum,
          type: 'added',
          value: row.right.value
        });
      }
    });

    // 2. Pure Word-by-Word calculation (Global)
    const origWordTokens = tokenizeWords(originalText);
    const modWordTokens = tokenizeWords(modifiedText);
    const globalWordDiff = diffLCS<string>(origWordTokens, modWordTokens);

    // 3. Pure Character-by-Character calculation (Global)
    const origChars = originalText.split('');
    const modChars = modifiedText.split('');
    const globalCharDiff = diffLCS<string>(origChars, modChars);

    // Calculate core statistics
    let additions = 0;
    let deletions = 0;
    let sameWords = 0;

    // We base statistics on word counts for high semantic value
    globalWordDiff.forEach(change => {
      const isWord = change.value.trim().length > 0;
      if (isWord) {
        if (change.type === 'added') additions++;
        else if (change.type === 'removed') deletions++;
        else sameWords++;
      }
    });

    const totalWords = sameWords * 2 + additions + deletions;
    const similarityScore = totalWords > 0 
      ? Math.round(((sameWords * 2) / totalWords) * 100) 
      : 100;

    return {
      alignedRows,
      unifiedRows,
      globalWordDiff,
      globalCharDiff,
      stats: {
        additions,
        deletions,
        similarityScore
      }
    };
  }, [originalText, modifiedText]);

  // Handle Search Filtering
  const filteredAlignedRows = useMemo(() => {
    if (!searchQuery.trim()) return diffResult.alignedRows;
    const query = searchQuery.toLowerCase();
    
    return diffResult.alignedRows.filter(row => {
      const leftMatch = row.left?.value.toLowerCase().includes(query) ?? false;
      const rightMatch = row.right?.value.toLowerCase().includes(query) ?? false;
      return leftMatch || rightMatch;
    });
  }, [diffResult.alignedRows, searchQuery]);

  const filteredUnifiedRows = useMemo(() => {
    if (!searchQuery.trim()) return diffResult.unifiedRows;
    const query = searchQuery.toLowerCase();

    return diffResult.unifiedRows.filter(row => {
      return row.value.toLowerCase().includes(query);
    });
  }, [diffResult.unifiedRows, searchQuery]);

  // Export utility for full diff outputs
  const handleExportDiff = () => {
    let output = `==================================================\n`;
    output += `DIFF CHECKER REPORT (Computed 2026-06-18)\n`;
    output += `Similarity Index: ${diffResult.stats.similarityScore}%\n`;
    output += `Additions: ${diffResult.stats.additions} | Deletions: ${diffResult.stats.deletions}\n`;
    output += `==================================================\n\n`;

    if (resolution === 'line') {
      diffResult.unifiedRows.forEach(row => {
        const sign = row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' ';
        output += `${sign} ${row.value}\n`;
      });
    } else {
      const items = resolution === 'word' ? diffResult.globalWordDiff : diffResult.globalCharDiff;
      items.forEach(part => {
        if (part.type === 'added') output += `[+] ${part.value}`;
        else if (part.type === 'removed') output += `[-] ${part.value}`;
        else output += part.value;
      });
    }

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diff-checker-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute\ top-0\ left-0 w-full min-h-screen ts-page-bg text-slate-800 py-12 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-between font-sans selection:bg-indigo-200">
      
      {/* Decorative Pastel Background Blobs */}
      <div 
        id="bg-blob-indigo"
        className="absolute top-[-10%] left-[-10%] w-[55%] aspect-square rounded-full bg-indigo-200/40 gradient-blob" 
      />
      <div 
        id="bg-blob-rose"
        className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-rose-200/30 gradient-blob" 
      />

      <div className="max-w-5xl w-full mx-auto relative z-10 space-y-8 flex-1 flex flex-col justify-center">
        
        {/* Apple-esque Elegant Top Bar / Header */}
        <div id="header-container" className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI-Powered Text Synthesizer
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-linear-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent font-sans">
            Diff Checker
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Verify lines, words, or character-level additions and deletions with a premium synced live comparison workspace.
          </p>
        </div>

        {/* Floating White Glassmorphic Deck */}
        <div 
          id="glass-card-deck" 
          className="bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-start"
        >

          {/* Quick Controls & Preset Launcher */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pb-2 border-b border-white/20">
            
            {/* Left Options / Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 mr-1">
                Load Preset:
              </span>
              {CUSTOM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  onClick={() => handleLoadPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-300 flex items-center gap-1.5 ${
                    currentPreset === preset.id
                      ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                      : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/60 shadow-xs'
                  }`}
                >
                  {preset.category === 'code' ? (
                    <Code className="w-3.5 h-3.5" />
                  ) : preset.id === 'empty' ? (
                    <Trash2 className="w-3.5 h-3.5" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                  {preset.title}
                </button>
              ))}
            </div>

            {/* Toggle comparing views */}
            <div className="bg-slate-200/60 p-0.5 rounded-2xl flex items-center relative self-start md:self-auto">
              <button
                id="toggle-edit-mode"
                onClick={() => setViewStatus('edit')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all duration-300 relative ${
                  viewStatus === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                âœï¸ Editor
              </button>
              <button
                id="toggle-compare-mode"
                onClick={() => setViewStatus('compare')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all duration-300 relative ${
                  viewStatus === 'compare'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                ðŸ” Comparison
              </button>
            </div>
          </div>

          {/* Core Content Box with Framer Motion transitions */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              
              {viewStatus === 'edit' ? (
                // --- INPUT MODE VIEW ---
                <motion.div
                  key="edit-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Original Input Card */}
                    <div id="card-original-input" className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          Original Text
                        </label>
                        <span className="text-xs text-slate-500 font-mono">
                          {originalText.length} Chars / {tokenizeWords(originalText).filter(w => w.trim().length > 0).length} Words
                        </span>
                      </div>
                      <div className="relative group">
                        <textarea
                          id="textarea-original"
                          value={originalText}
                          onChange={(e) => {
                            setOriginalText(e.target.value);
                            setCurrentPreset('custom');
                          }}
                          placeholder="Paste or type original document text here..."
                          className="w-full h-80 px-4 py-3 text-sm font-mono border border-slate-200/90 rounded-2xl bg-white/70 focus:bg-white focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-400 outline-hidden transition-all duration-300 resize-none outline-none"
                        />
                        {originalText && (
                          <button
                            id="clear-orig-btn"
                            onClick={() => setOriginalText('')}
                            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                            title="Clear"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Modified Input Card */}
                    <div id="card-modified-input" className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Modified Text
                        </label>
                        <span className="text-xs text-slate-500 font-mono">
                          {modifiedText.length} Chars / {tokenizeWords(modifiedText).filter(w => w.trim().length > 0).length} Words
                        </span>
                      </div>
                      <div className="relative group">
                        <textarea
                          id="textarea-modified"
                          value={modifiedText}
                          onChange={(e) => {
                            setModifiedText(e.target.value);
                            setCurrentPreset('custom');
                          }}
                          placeholder="Paste or type modified document text here..."
                          className="w-full h-80 px-4 py-3 text-sm font-mono border border-slate-200/90 rounded-2xl bg-white/70 focus:bg-white focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-400 outline-hidden transition-all duration-300 resize-none outline-none"
                        />
                        {modifiedText && (
                          <button
                            id="clear-mod-btn"
                            onClick={() => setModifiedText('')}
                            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                            title="Clear"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compare Action Section */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Info className="w-4 h-4 text-slate-400" />
                      We compute line, word, and letter mappings instantly.
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        id="wipe-all-btn"
                        onClick={handleClear}
                        className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-slate-200 bg-white/50 hover:bg-white/80 hover:border-slate-300 text-slate-700 text-sm font-medium transition duration-200"
                      >
                        Wipe Canvas
                      </button>
                      <button
                        id="compare-action-btn"
                        onClick={() => {
                          setViewStatus('compare');
                        }}
                        className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
                      >
                        Analyze Difference
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                
                // --- LIVE COMPARED VIEW MODE ---
                <motion.div
                  key="compare-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  
                  {/* Stats Ribbon */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/80 border border-white/60 shadow-xs">
                    
                    {/* Additions */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        +
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest leading-none">
                          Additions
                        </span>
                        <span className="text-lg font-bold text-slate-900 font-mono">
                          {diffResult.stats.additions} {resolution === 'line' ? 'line(s)' : 'word(s)'}
                        </span>
                      </div>
                    </div>

                    {/* Deletions */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-lg">
                        -
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest leading-none">
                          Deletions
                        </span>
                        <span className="text-lg font-bold text-slate-900 font-mono">
                          {diffResult.stats.deletions} {resolution === 'line' ? 'line(s)' : 'word(s)'}
                        </span>
                      </div>
                    </div>

                    {/* Total Original Words */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest leading-none">
                          Original
                        </span>
                        <span className="text-lg font-bold text-slate-900 font-mono">
                          {tokenizeWords(originalText).filter(w => w.trim().length > 0).length} Words
                        </span>
                      </div>
                    </div>

                    {/* Similarity score meter */}
                    <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200/60 pt-4 md:pt-0 md:pl-5 flex items-center justify-between md:justify-end gap-3">
                      <div className="flex flex-col text-left md:text-right">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest leading-none">
                          Similarity Index
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Cosine word matching ratio
                        </span>
                      </div>
                      <CircularProgress percentage={diffResult.stats.similarityScore} />
                    </div>

                  </div>

                  {/* Comparer Internal Filter & Layout Toolbar */}
                  <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center bg-white/40 p-4 rounded-2xl border border-white/50">
                    
                    {/* Left side: Diff Settings resolution & view mode selectors */}
                    <div className="flex flex-wrap items-center gap-4">
                      
                      {/* Resolution Selector Segment Slider */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">
                          Diff Resolution
                        </span>
                        <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center">
                          <button
                            id="res-line-btn"
                            onClick={() => setResolution('line')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              resolution === 'line' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Line
                          </button>
                          <button
                            id="res-word-btn"
                            onClick={() => setResolution('word')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              resolution === 'word' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Word
                          </button>
                          <button
                            id="res-char-btn"
                            onClick={() => setResolution('char')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                              resolution === 'char' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Char
                          </button>
                        </div>
                      </div>

                      {/* Display toggle mode */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">
                          View Presentation
                        </span>
                        <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center">
                          <button
                            id="view-split-btn"
                            onClick={() => setViewMode('split')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                              viewMode === 'split' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Side-by-Side
                          </button>
                          <button
                            id="view-unified-btn"
                            onClick={() => setViewMode('unified')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                              viewMode === 'unified' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Unified Inline
                          </button>
                        </div>
                      </div>

                      {/* Scroll sync checkbox for split mode */}
                      {viewMode === 'split' && resolution === 'line' && (
                        <div className="flex flex-col gap-1 justify-end h-full">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">
                            Scroll Alignment
                          </span>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-200/40 border border-slate-200/80 px-2.5 py-1 rounded-xl cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={syncScroll}
                              onChange={(e) => setSyncScroll(e.target.checked)}
                              className="accent-indigo-600 rounded"
                            />
                            Synced Scrolling
                          </label>
                        </div>
                      )}

                    </div>

                    {/* Right side: Search live filter */}
                    <div className="flex flex-col gap-1 justify-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">
                        Filter Matches
                      </span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="diff-search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search matching words..."
                          className="w-full md:w-56 pl-9 pr-4 py-1.5 text-xs font-mono rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                  </div>

                  {/* DISPLAY ENGINE BOX */}
                  <div id="diff-output-stage" className="relative">
                    
                    {resolution === 'line' ? (
                      
                      // --- LINE BY LINE DISPLAY ---
                      viewMode === 'split' ? (
                        
                        // 1. Parallel side-by-side split structure
                        <div className="w-full border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl relative">
                          
                          {/* Inner double column block */}
                          <div className="flex min-w-[700px] text-white">
                            
                            {/* Left header pane indicator */}
                            <div className="w-1/2 bg-slate-900 border-r border-slate-800 flex items-center justify-between px-4 py-2 relative">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Original Code/Text
                              </span>
                              <button
                                id="copy-orig-btn"
                                onClick={() => handleCopyClipboard(originalText, 'orig')}
                                className="text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition flex items-center gap-1"
                              >
                                {copiedOriginal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedOriginal ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            {/* Right header pane indicator */}
                            <div className="w-1/2 bg-slate-900 flex items-center justify-between px-4 py-2 relative">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Modified Code/Text
                              </span>
                              <button
                                id="copy-mod-btn"
                                onClick={() => handleCopyClipboard(modifiedText, 'mod')}
                                className="text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition flex items-center gap-1"
                              >
                                {copiedModified ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedModified ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                          </div>

                          {/* Outer Dual containers with Synced Scrolling */}
                          <div className="flex min-w-[700px] max-h-[460px] overflow-hidden">
                            
                            {/* Original Left Container */}
                            <div
                              id="split-original-scrollpane"
                              ref={leftColRef}
                              onScroll={() => handleScroll('left')}
                              onScrollEnd={handleScrollEnd}
                              className="w-1/2 overflow-auto divide-y divide-white/5 font-mono text-xs border-r border-slate-800 bg-slate-950/60"
                            >
                              {filteredAlignedRows.map((row, idx) => {
                                const l = row.left;
                                const isRemoved = l?.type === 'removed';
                                const lineBg = isRemoved ? 'bg-rose-950/40 text-rose-300' : 'text-slate-300';
                                
                                return (
                                  <div key={idx} className={`flex min-h-[22px] hover:bg-white/5 transition-colors duration-100 ${lineBg}`}>
                                    {/* Line Number */}
                                    <div className="w-12 shrink-0 select-none text-right pr-3 py-0.5 text-slate-600 border-r border-slate-800/80 bg-slate-900/40">
                                      {l?.lineNum ?? ''}
                                    </div>
                                    {/* Symbol Indicator */}
                                    <div className="w-6 shrink-0 select-none text-center py-0.5 text-rose-500 font-semibold font-mono">
                                      {isRemoved ? '-' : ''}
                                    </div>
                                    {/* Text content with custom inner-word highlight overlay */}
                                    <div className="flex-1 px-3 py-0.5 whitespace-pre break-all">
                                      {l ? (
                                        l.wordChanges ? (
                                          l.wordChanges.map((part, pIdx) => {
                                            if (part.type === 'added') return null; // skip added items from the original column view
                                            const wordBg = part.type === 'removed' 
                                              ? 'bg-rose-500/35 text-rose-100 px-0.5 rounded border border-rose-500/45 font-medium' 
                                              : '';
                                            return <span key={pIdx} className={wordBg}>{part.value}</span>;
                                          })
                                        ) : (
                                          l.value || '\u00A0'
                                        )
                                      ) : (
                                        // Render a subtle grid spacer line keeping row pairs aligned
                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/10 to-slate-900/20" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {filteredAlignedRows.length === 0 && (
                                <div className="py-8 text-center text-slate-500 font-sans">
                                  No matching original lines found.
                                </div>
                              )}
                            </div>

                            {/* Modified Right Container */}
                            <div
                              id="split-modified-scrollpane"
                              ref={rightColRef}
                              onScroll={() => handleScroll('right')}
                              onScrollEnd={handleScrollEnd}
                              className="w-1/2 overflow-auto divide-y divide-white/5 font-mono text-xs bg-slate-950/60"
                            >
                              {filteredAlignedRows.map((row, idx) => {
                                const r = row.right;
                                const isAdded = r?.type === 'added';
                                const lineBg = isAdded ? 'bg-emerald-950/30 text-emerald-300' : 'text-slate-300';

                                return (
                                  <div key={idx} className={`flex min-h-[22px] hover:bg-white/5 transition-colors duration-100 ${lineBg}`}>
                                    {/* Line Number */}
                                    <div className="w-12 shrink-0 select-none text-right pr-3 py-0.5 text-slate-600 border-r border-slate-800/80 bg-slate-900/40">
                                      {r?.lineNum ?? ''}
                                    </div>
                                    {/* Symbol Indicator */}
                                    <div className="w-6 shrink-0 select-none text-center py-0.5 text-emerald-400 font-semibold font-mono">
                                      {isAdded ? '+' : ''}
                                    </div>
                                    {/* Interactive highlighted tokens block */}
                                    <div className="flex-1 px-3 py-0.5 whitespace-pre break-all">
                                      {r ? (
                                        r.wordChanges ? (
                                          r.wordChanges.map((part, pIdx) => {
                                            if (part.type === 'removed') return null; // skip deleted items from modified column view
                                            const wordBg = part.type === 'added' 
                                              ? 'bg-emerald-500/35 text-emerald-100 px-0.5 rounded border border-emerald-500/45 font-medium' 
                                              : '';
                                            return <span key={pIdx} className={wordBg}>{part.value}</span>;
                                          })
                                        ) : (
                                          r.value || '\u00A0'
                                        )
                                      ) : (
                                        // Render a subtle container spacer keeping heights in grid alignment
                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/10 to-slate-900/20" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {filteredAlignedRows.length === 0 && (
                                <div className="py-8 text-center text-slate-500 font-sans">
                                  No matching modified lines found.
                                </div>
                              )}
                            </div>

                          </div>
                        </div>

                      ) : (
                        
                        // 2. UNIFIED INLINE DISPLAY for Line resolution
                        <div className="w-full border border-slate-200/85 rounded-2xl overflow-hidden bg-slate-950 shadow-2xl">
                          <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-2 text-white">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              Unified Inline stream
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Deletions preceding additions
                            </span>
                          </div>

                          <div className="max-h-[460px] overflow-auto divide-y divide-white/5 font-mono text-xs text-white">
                            {filteredUnifiedRows.map((row, idx) => {
                              const isAdded = row.type === 'added';
                              const isRemoved = row.type === 'removed';
                              const lineBg = isAdded 
                                ? 'bg-emerald-950/30 text-emerald-300' 
                                : isRemoved 
                                  ? 'bg-rose-950/40 text-rose-300' 
                                  : 'text-slate-300';
                              
                              return (
                                <div key={idx} className={`flex min-h-[22px] hover:bg-white/5 transition-colors duration-100 ${lineBg}`}>
                                  {/* Left original Line number */}
                                  <div className="w-12 shrink-0 select-none text-right pr-3 py-0.5 text-slate-600 border-r border-slate-800/80 bg-slate-900/40">
                                    {row.lineNumLeft ?? ''}
                                  </div>
                                  {/* Right modified Line number */}
                                  <div className="w-12 shrink-0 select-none text-right pr-3 py-0.5 text-slate-600 border-r border-slate-800/80 bg-slate-900/40">
                                    {row.lineNumRight ?? ''}
                                  </div>
                                  {/* Symbol */}
                                  <div className={`w-6 shrink-0 select-none text-center py-0.5 font-semibold leading-relaxed font-mono ${isAdded ? 'text-emerald-400' : isRemoved ? 'text-rose-500' : 'text-transparent'}`}>
                                    {isAdded ? '+' : isRemoved ? '-' : ''}
                                  </div>
                                  {/* Code / Text contents inline with word highlight parameters */}
                                  <div className="flex-1 px-3 py-0.5 whitespace-pre break-all">
                                    {row.wordChanges ? (
                                      row.wordChanges.map((part, pIdx) => {
                                        if (isRemoved && part.type === 'added') return null;
                                        if (isAdded && part.type === 'removed') return null;

                                        const wordClass = part.type === 'added'
                                          ? 'bg-emerald-500/35 text-emerald-100 px-0.5 rounded border border-emerald-500/45 font-medium'
                                          : part.type === 'removed'
                                            ? 'bg-rose-500/35 text-rose-100 px-0.5 rounded line-through border border-rose-500/45'
                                            : '';
                                        return <span key={pIdx} className={wordClass}>{part.value}</span>;
                                      })
                                    ) : (
                                      row.value || '\u00A0'
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {filteredUnifiedRows.length === 0 && (
                              <div className="py-12 text-center text-slate-500 font-sans">
                                No matching unified lines found.
                              </div>
                            )}
                          </div>
                        </div>
                      )

                    ) : (

                      // --- GLOBAL WORD OR CHARACTER DIFF DISPLAY ---
                      viewMode === 'split' ? (
                        
                        // 1. Split display blocks for raw text paragraphs
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Original Column Flow */}
                          <div id="split-paragraph-original" className="bg-white/80 border border-slate-200/85 shadow-lg rounded-2xl p-5 sm:p-6 text-slate-800 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                Deletions Left Screen
                              </span>
                              <span className="text-[10px] bg-slate-100 border text-slate-500 px-2 py-0.5 rounded-full font-mono">
                                Original Stream
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-sm font-sans" style={{ minHeight: '120px' }}>
                              {(resolution === 'word' ? diffResult.globalWordDiff : diffResult.globalCharDiff).map((part, idx) => {
                                if (part.type === 'added') return null; // skip added items from deleted viewport
                                
                                const highlightStyle = part.type === 'removed' 
                                  ? 'bg-rose-500/15 text-rose-700 line-through px-0.5 rounded border-b-2 border-rose-400 font-medium' 
                                  : 'text-slate-700';

                                return <span key={idx} className={highlightStyle}>{part.value}</span>;
                              })}
                            </div>
                          </div>

                          {/* Modified Column Flow */}
                          <div id="split-paragraph-modified" className="bg-white/80 border border-slate-200/85 shadow-lg rounded-2xl p-5 sm:p-6 text-slate-800 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                Additions Right Screen
                              </span>
                              <span className="text-[10px] bg-slate-100 border text-slate-500 px-2 py-0.5 rounded-full font-mono">
                                Modified Stream
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed text-sm font-sans" style={{ minHeight: '120px' }}>
                              {(resolution === 'word' ? diffResult.globalWordDiff : diffResult.globalCharDiff).map((part, idx) => {
                                if (part.type === 'removed') return null; // skip removed items from added viewport

                                const highlightStyle = part.type === 'added'
                                  ? 'bg-emerald-500/15 text-emerald-700 px-0.5 rounded border-b-2 border-emerald-400 font-semibold'
                                  : 'text-slate-700';

                                return <span key={idx} className={highlightStyle}>{part.value}</span>;
                              })}
                            </div>
                          </div>

                        </div>

                      ) : (

                        // 2. Beautiful unified flow displaying both in the same paragraph
                        <div id="unified-paragraph-flow" className="bg-white/80 border border-slate-200/85 shadow-lg rounded-2xl p-6 sm:p-8 text-slate-800 space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-indigo-50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Unified Inline Flow
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 border rounded-full">
                              Color-synchronized highlights
                            </span>
                          </div>
                          
                          <div className="whitespace-pre-wrap leading-loose text-sm sm:text-base font-sans font-light">
                            {(resolution === 'word' ? diffResult.globalWordDiff : diffResult.globalCharDiff).map((part, idx) => {
                              const highlightStyle = part.type === 'added' 
                                ? 'bg-emerald-500/15 text-emerald-700 font-semibold px-0.5 rounded border-b-2 border-emerald-400 mx-0.5 inline-block' 
                                : part.type === 'removed' 
                                  ? 'bg-rose-500/10 text-rose-600 line-through px-0.5 rounded border-b-2 border-rose-300 mx-0.5 inline-block' 
                                  : 'text-slate-700 font-normal';

                              return <span key={idx} className={highlightStyle}>{part.value}</span>;
                            })}
                          </div>
                        </div>

                      )

                    )}

                  </div>

                  {/* Comparer Foot Navigation */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/20">
                    <button
                      id="viewmode-back-btn"
                      onClick={() => setViewStatus('edit')}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white/70 hover:bg-white text-slate-700 text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-xs group"
                    >
                      <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                      Adjust Input Texts
                    </button>

                    <div className="flex gap-3">
                      <button
                        id="copy-report-btn"
                        onClick={() => {
                          let plain = '';
                          const items = resolution === 'word' ? diffResult.globalWordDiff : diffResult.globalCharDiff;
                          if (resolution === 'line') {
                            diffResult.unifiedRows.forEach(r => {
                              const s = r.type === 'added' ? '+' : r.type === 'removed' ? '-' : ' ';
                              plain += `${s} ${r.value}\n`;
                            });
                          } else {
                            items.forEach(p => {
                              if (p.type === 'added') plain += `[+] ${p.value}`;
                              else if (p.type === 'removed') plain += `[-] ${p.value}`;
                              else plain += p.value;
                            });
                          }
                          handleCopyClipboard(plain, 'diff');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {copiedDiff ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedDiff ? 'Copied Report!' : 'Copy Flat Report'}
                      </button>

                      <button
                        id="download-report-btn"
                        onClick={handleExportDiff}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Export Report (.txt)
                      </button>
                    </div>

                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

        {/* Humbler Professional Footnote */}
        <div className="text-center text-[11px] text-slate-400 font-mono tracking-wide pb-4">
          Google AI Studio &copy; 2026 Diff Engine Framework. All calculations run client-side.
        </div>

      </div>

    </div>
  );
}


