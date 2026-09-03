import { useState, useRef, useMemo } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  ArrowDownUp, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Settings, 
  Info,
  Layers,
  Percent,
  Cpu
} from "lucide-react";
import { 
  COMPREHENSIVE_ENTITIES, 
  encodeText, 
  decodeText 
} from "./entities";

export default function App() {
  // Input and settings state
  const [inputText, setInputText] = useState<string>("const greeting = \"Hello & Welcome!\";\nif (score > 10) {\n  console.log(\"Done\");\n}");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [mapping, setMapping] = useState<"basic" | "comprehensive">("comprehensive");
  const [format, setFormat] = useState<"named" | "decimal" | "hex">("named");
  const [range, setRange] = useState<"matched_only" | "all_non_ascii" | "all_chars">("matched_only");
  
  // Navigation & UI state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copied, setCopied] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [copiedItemValue, setCopiedItemValue] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live conversion output
  const outputText = useMemo(() => {
    if (mode === "encode") {
      return encodeText(inputText, { mapping, format, range });
    } else {
      return decodeText(inputText);
    }
  }, [inputText, mode, mapping, format, range]);

  // Handle mode swap
  const handleSwapMode = () => {
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    setInputText(outputText); // Transfer output to input for easy roundtrip!
  };

  // Clear input
  const handleClear = () => {
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Load sample content
  const handleLoadSample = () => {
    if (mode === "encode") {
      setInputText(
        `<h1>HTML Entity Forge</h1> Â© 2026 â€¢ Currencies: â‚¬150 & Â£99. Symbols: "Quotes" / 'Apostrophe'. Math: x Ã· 2 Â± 10 â‰¤ y â‡’ z. Special: Î± + Î» = Ï‰.`
      );
    } else {
      setInputText(
        `&lt;h1&gt;HTML Entity Forge&lt;/h1&gt; &copy; 2026 &bull; Currencies: &euro;150 &amp; &pound;99. Symbols: &quot;Quotes&quot; / &apos;Apostrophe&apos;. Math: x &divide; 2 &plusmn; 10 &le; y &rArr; z. Special: &alpha; + &lambda; = &omega;.`
      );
    }
  };

  // Live copy action
  const handleCopyAll = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Unable to copy to clipboard", err);
    }
  };

  // Copy single specific entity from cheat sheet or helper grid
  const handleCopySingle = async (entity: string, itemKey: string) => {
    try {
      await navigator.clipboard.writeText(entity);
      setCopiedItemValue(itemKey);
      setTimeout(() => setCopiedItemValue(null), 1500);
    } catch (err) {
      console.error("Error copy", err);
    }
  };

  // Push single character at current focus cursor
  const handleInsertChar = (char: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText((prev) => prev + char);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = textarea.value;

    const nextText =
      originalText.substring(0, start) + char + originalText.substring(end);
    setInputText(nextText);

    // Reposition cursor right after inserted token
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  // Unique categories for Cheat Sheet
  const categories = useMemo(() => {
    const cats = new Set(COMPREHENSIVE_ENTITIES.map((e) => e.category));
    return ["All", ...Array.from(cats)];
  }, []);

  // Filtered cheat sheet list based on categories + search query
  const filteredEntities = useMemo(() => {
    return COMPREHENSIVE_ENTITIES.filter((entity) => {
      const matchCat = selectedCategory === "All" || entity.category === selectedCategory;
      const matchSearch =
        entity.char.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.decimal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.hex.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Live structural counts
  const stats = useMemo(() => {
    const inputChars = inputText.length;
    const outputChars = outputText.length;
    let ratio = 0;
    if (inputChars > 0) {
      ratio = Math.round(((outputChars - inputChars) / inputChars) * 100);
    }
    return {
      inputChars,
      outputChars,
      ratio,
    };
  }, [inputText, outputText]);

  // High-intensity quick-access deck characters
  const deckCharacters = [
    { char: "<", desc: "Less than" },
    { char: ">", desc: "Greater than" },
    { char: "&", desc: "Ampersand" },
    { char: '"', desc: "Double Quote" },
    { char: "'", desc: "Single Quote" },
    { char: "Â©", desc: "Copyright" },
    { char: "Â®", desc: "Registered" },
    { char: "â„¢", desc: "Trademark" },
    { char: "â‚¬", desc: "Euro" },
    { char: "Â£", desc: "Pound" },
    { char: "Â¥", desc: "Yen" },
    { char: "Â°", desc: "Degree" },
    { char: "Â±", desc: "Plus-Minus" },
    { char: "Ã—", desc: "Multiply" },
    { char: "Ã·", desc: "Divide" },
    { char: "âˆž", desc: "Infinity" },
    { char: "Î»", desc: "Lambda" },
    { char: "Ï€", desc: "Pi" },
  ];

  return (
    <div className="min-h-screen ts-page-bg text-slate-700 font-sans flex items-center justify-center p-4 sm:p-12 relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Central Clean Minimalist Glass Card */}
      <div className="relative z-10 w-full max-w-xl glass rounded-[2.5rem] p-6 sm:p-10 flex flex-col gap-8 transition-all duration-300">
        
        {/* Header Block matching theme guidelines */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-slate-900">
              Entity<span className="font-bold text-indigo-600">Forge</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Character Encoding Engine
            </p>
          </div>
          
          {/* Slider Config Segmenter Pills */}
          <div className="flex bg-white/50 p-1 rounded-full border border-white/60 shadow-xs">
            <button
              onClick={() => setMapping("basic")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest cursor-pointer ${
                mapping === "basic"
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setMapping("comprehensive")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest cursor-pointer ${
                mapping === "comprehensive"
                  ? "bg-white shadow-sm text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Full Mappings
            </button>
          </div>
        </header>

        {/* Tab Selection Underline Bar */}
        <nav className="flex items-center gap-6 border-b border-slate-200/40 pb-0.5">
          <button
            onClick={() => setMode("encode")}
            className={`pb-3 px-1 border-b-2 text-sm transition-all cursor-pointer ${
              mode === "encode"
                ? "border-indigo-500 font-semibold text-indigo-600"
                : "border-transparent font-medium text-slate-400 hover:text-slate-600"
            }`}
          >
            Encoder
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`pb-3 px-1 border-b-2 text-sm transition-all cursor-pointer ${
              mode === "decode"
                ? "border-indigo-500 font-semibold text-indigo-600"
                : "border-transparent font-medium text-slate-400 hover:text-slate-600"
            }`}
          >
            Decoder
          </button>
          
          <div className="pb-3 px-1 text-slate-400 ml-auto flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span>Format: {format === "named" ? "HTML Entity" : format.toUpperCase()}</span>
          </div>
        </nav>

        {/* Utility Input tools (Load sample or Wipe input) */}
        <div className="flex items-center justify-between -mb-4 px-1 text-[11px] font-medium text-slate-400">
          <span className="uppercase tracking-widest text-[10px] font-bold">
            {mode === "encode" ? "Source Character" : "Encoded Entities Input"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              onMouseEnter={() => setTooltipText("Loads diverse quote, copyright & standard math representations")}
              onMouseLeave={() => setTooltipText(null)}
              className="hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles size={11} /> Load Sample
            </button>
            <span className="text-slate-200">|</span>
            <button
              onClick={handleClear}
              onMouseEnter={() => setTooltipText("Clear current editor frame")}
              onMouseLeave={() => setTooltipText(null)}
              className="hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>

        {/* Text Input area */}
        <div className="flex flex-col gap-2">
          <div className="relative group">
            <textarea
              id="text-input"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Type or copy raw symbols < > & \"'..."
                  : "Type or copy encoded HTML references like &amp; &lt;..."
              }
              className="w-full h-32 bg-white/60 border border-white/80 rounded-2xl p-5 text-slate-700 placeholder-slate-300 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/5 resize-none font-mono text-sm shadow-inner transition-all duration-300"
            />
          </div>
        </div>

        {/* Flip direction button */}
        <div className="flex justify-center -my-6 sm:-my-7 relative z-20">
          <motion.button
            id="btn-direction-swap"
            onClick={handleSwapMode}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="bg-white rounded-full p-2.5 shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Swap encoding direction"
          >
            <ArrowDownUp size={16} />
          </motion.button>
        </div>

        {/* Output view block */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {mode === "encode" ? "Encoded HTML Entities" : "Decoded Conversions"}
            </span>
            {stats.inputChars > 0 && mode === "encode" && (
              <span className="text-[10px] font-mono text-indigo-500/80 bg-indigo-50/50 px-1.5 py-0.5 rounded-sm">
                Volume: {stats.ratio > 0 ? `+${stats.ratio}%` : `${stats.ratio}%`}
              </span>
            )}
          </div>

          <div className="group relative bg-indigo-900/[0.03] border border-indigo-100/50 rounded-2xl p-5 min-h-[108px] flex items-center justify-between transition-all duration-300 relative select-text">
            <div 
              id="text-output-card" 
              className="font-mono text-xs text-indigo-900 leading-relaxed pr-10 overflow-x-auto whitespace-pre-wrap break-all w-full select-text"
            >
              {outputText ? (
                outputText
              ) : (
                <span className="text-slate-400 font-sans italic">Output generated instantly...</span>
              )}
            </div>

            <div className="absolute right-4 top-4 flex flex-col items-center">
              <motion.button
                id="btn-copy-all"
                onClick={handleCopyAll}
                disabled={!outputText}
                whileHover={outputText ? { scale: 1.05 } : {}}
                whileTap={outputText ? { scale: 0.95 } : {}}
                className={`flex-shrink-0 p-2.5 bg-white rounded-xl shadow-md border border-white hover:bg-slate-50 transition-all ${
                  !outputText ? "opacity-40 cursor-not-allowed" : "text-indigo-500 hover:text-indigo-600"
                }`}
                title="Copy result to clipboard"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.7 }}
                    >
                      <Check size={16} className="text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.7 }}
                    >
                      <Copy size={16} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              
              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 6, scale: 1 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase mt-1 bg-emerald-50 border border-emerald-100/30 px-1 py-0.2 rounded-sm"
                  >
                    Copied
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Extra configuration controls (Formats, Ranges) */}
        {mode === "encode" && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 bg-white/30 rounded-2xl border border-white p-4"
          >
            <div className="flex items-center gap-1 flex-row text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/40 pb-2">
              <Settings size={12} className="text-indigo-400" />
              Configure Target Encoding Characteristics
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Output format options */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Format</span>
                <div className="flex bg-white/50 p-0.5 rounded-lg border border-white shadow-2xs">
                  {(["named", "decimal", "hex"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all uppercase tracking-wider cursor-pointer ${
                        format === fmt
                          ? "bg-white text-indigo-600 shadow-xs font-bold"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Options */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Intensity Range</span>
                <div className="flex bg-white/50 p-0.5 rounded-lg border border-white shadow-2xs">
                  {[
                    { val: "matched_only" as const, label: "Match" },
                    { val: "all_non_ascii" as const, label: "ASCII+" },
                    { val: "all_chars" as const, label: "All" }
                  ].map((rg) => (
                    <button
                      key={rg.val}
                      onClick={() => setRange(rg.val)}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all uppercase tracking-wider cursor-pointer ${
                        range === rg.val
                          ? "bg-indigo-500 text-white shadow-xs font-bold"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {rg.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Quick character deck clicker area */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
            Quick symbols insert deck:
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center p-2 rounded-xl bg-white/30 border border-white/60">
            {deckCharacters.map((item) => (
              <button
                key={`deck-${item.char}`}
                onClick={() => handleInsertChar(item.char)}
                onMouseEnter={() => setTooltipText(item.desc)}
                onMouseLeave={() => setTooltipText(null)}
                className="w-7 h-7 rounded-md bg-white border border-slate-100/60 shadow-2xs hover:shadow-sm text-slate-600 hover:text-indigo-600 text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer active:scale-90"
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>

        {/* Tooltip log block */}
        <div className="h-5 -my-3 text-center text-[10px] font-medium text-slate-400/80">
          <AnimatePresence mode="wait">
            {tooltipText && (
              <motion.span
                key={tooltipText}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                className="inline-block"
              >
                âœ¦ {tooltipText}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Reference Cheat Sheet Expandable Block */}
        <div className="border-t border-slate-200/40 pt-4 flex flex-col gap-2">
          
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-xs font-semibold py-1 px-1"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} className="text-indigo-500" />
              <span>HTML Entities Reference Cheat Sheet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-150/20 px-1.5 py-0.5 rounded-sm">
                Interactive Grid
              </span>
              {showCheatSheet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          <AnimatePresence>
            {showCheatSheet && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-3 pt-2"
              >
                
                {/* Search & Categories inside reference card */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={12} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter entity symbols, decimals or hex codes..."
                      className="w-full pl-8 pr-2 py-1.5 text-[11px] rounded-lg bg-white/70 border border-white/95 text-slate-700 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[9px] font-bold px-2 py-1.5 rounded-md border whitespace-nowrap uppercase tracking-wider cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-indigo-500 text-white border-indigo-400 shadow-3xs"
                            : "bg-white text-slate-400 border-slate-150 hover:bg-slate-50 hover:text-slate-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity list references list */}
                <div className="max-h-[220px] overflow-y-auto border border-slate-200/40 rounded-xl bg-slate-50/50 p-2 scrollbar-thin">
                  {filteredEntities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filteredEntities.map((item) => {
                        const isCopiedName = copiedItemValue === `${item.char}-name`;
                        const isCopiedChar = copiedItemValue === `${item.char}-char`;
                        
                        return (
                          <div
                            key={item.char}
                            className="p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-300 shadow-3xs transition-all flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-[15px] border border-indigo-100/20 select-all">
                                {item.char}
                              </div>
                              <div className="flex flex-col text-[10px]">
                                <span className="font-bold text-slate-700 max-w-[95px] truncate" title={item.description}>
                                  {item.description}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">
                                  Dec: {item.decimal}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopySingle(item.name, `${item.char}-name`)}
                                className={`px-1.5 py-0.5 rounded-sm font-mono text-[9px] border flex items-center gap-1 transition-all cursor-pointer ${
                                  isCopiedName
                                    ? "bg-emerald-500 text-white border-emerald-400"
                                    : "bg-slate-50 hover:bg-slate-100 text-indigo-600 border-slate-200"
                                }`}
                              >
                                <span>{item.name}</span>
                                {isCopiedName ? <Check size={7} /> : <Copy size={7} />}
                              </button>

                              <button
                                onClick={() => handleCopySingle(item.char, `${item.char}-char`)}
                                className={`p-1 rounded-sm text-[8px] border flex items-center justify-center transition-all cursor-pointer ${
                                  isCopiedChar
                                    ? "bg-emerald-500 text-white border-emerald-400"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {isCopiedChar ? <Check size={7} /> : <span className="font-bold uppercase tracking-wider text-[7px]">Raw</span>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-[10px] text-slate-400 italic">
                      No matching entities found. Clear filter and retry.
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-slate-100/50 rounded-lg border border-slate-250/30 text-[10px] text-slate-500 flex items-start gap-1.5">
                  <Info size={11} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Entities prevent browser layout engines from breaking when serving reserve syntax elements. Use copy buttons to use in code templates safely.
                  </span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Minimal theme footer */}
        <footer className="flex items-center justify-between border-t border-slate-200/40 pt-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-[11px] font-medium text-slate-400">
              {stats.inputChars} input characters parsed
            </span>
          </div>

          <div className="flex gap-2">
            <div 
              onMouseEnter={() => setTooltipText("Fully sandboxed in browser sandbox environment")}
              onMouseLeave={() => setTooltipText(null)}
              className="w-8 h-8 rounded-lg bg-white/60 hover:bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-3xs cursor-help transition-all"
            >
              <Cpu size={14} />
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}


