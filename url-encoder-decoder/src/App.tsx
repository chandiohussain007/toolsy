import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Hash,
  ArrowUpDown,
  Search,
  Code,
  FileJson,
  Undo
} from "lucide-react";

interface ParamItem {
  id: string;
  key: string;
  value: string;
}

// Visual theme configurations
const PRESETS = [
  {
    name: "Google Campaign",
    desc: "AdWords UTM Tracking URL",
    value: "https://example.com/checkout?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale&utm_content=banner_v2&discount=20OFF"
  },
  {
    name: "Stripe API Request",
    desc: "Complex webhook query string",
    value: "https://api.stripe.com/v1/refunds?charge=ch_3Mv8xK&reason=requested_by_customer&limit=3&expanded[]=charge.customer"
  },
  {
    name: "Complex Encoded JSON",
    desc: "Escaped nested payload string",
    value: "%7B%22auth%22%3A%7B%22uid%22%3A%22usr_89201%22%2C%22role%22%3A%22architect%22%7D%2C%22action%22%3A%22read_logs%22%2C%22filter%22%3A%22%25%22%7D"
  }
];

export default function App() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [paramSearch, setParamSearch] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  // Custom alert state for action notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 1. Core Conversion Logic
  const { processedResult, derivationError } = useMemo(() => {
    if (!inputText) return { processedResult: "", derivationError: null };
    try {
      if (mode === "encode") {
        return { processedResult: encodeURIComponent(inputText), derivationError: null };
      } else {
        return { processedResult: decodeURIComponent(inputText), derivationError: null };
      }
    } catch (err: any) {
      return {
        processedResult: "",
        derivationError: err?.message || "Malformed percent-encoded URI sequence."
      };
    }
  }, [inputText, mode]);

  // 2. URL Query Parameters Parser Logic (Safe derived state)
  const parsedInfo = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return { hasParams: false, params: [] as ParamItem[], isFullUrl: false, baseUrl: "" };
    }

    let searchString = "";
    let isFullUrl = false;
    let baseUrl = trimmed;

    try {
      // Check absolute URLs (http, https, www.)
      if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
        let urlStr = trimmed;
        if (/^www\./i.test(trimmed)) {
          urlStr = "https://" + trimmed;
        }
        const parsed = new URL(urlStr);
        searchString = parsed.search;
        isFullUrl = true;
        baseUrl = parsed.origin + parsed.pathname + parsed.hash;
      } else {
        // Handle paths with query strings or plain key-values
        const qIndex = trimmed.indexOf("?");
        if (qIndex !== -1) {
          searchString = trimmed.substring(qIndex);
          baseUrl = trimmed.substring(0, qIndex);
        } else if (trimmed.includes("=") && (trimmed.includes("&") || !trimmed.includes(" "))) {
          searchString = "?" + trimmed;
          baseUrl = "";
        }
      }

      if (searchString) {
        const searchParams = new URLSearchParams(searchString);
        const params: ParamItem[] = [];
        let index = 0;
        searchParams.forEach((value, key) => {
          params.push({
            id: `${key}-${index++}`,
            key,
            value,
          });
        });
        return {
          hasParams: params.length > 0,
          params,
          isFullUrl,
          baseUrl,
        };
      }
    } catch (e) {
      // Gracefully bypass error
    }

    return { hasParams: false, params: [] as ParamItem[], isFullUrl: false, baseUrl: trimmed };
  }, [inputText]);

  // Helpers to update URL state through edits in the parameter sub-panel
  const updateUrlWithQuery = (queryStr: string) => {
    if (parsedInfo.isFullUrl) {
      try {
        let urlStr = inputText;
        if (/^www\./i.test(inputText)) {
          urlStr = "https://" + inputText;
        }
        const parsed = new URL(urlStr);
        parsed.search = queryStr ? "?" + queryStr : "";
        let result = parsed.href;
        if (inputText.startsWith("www.")) {
          result = result.replace(/^https?:\/\//, "");
        }
        setInputText(result);
      } catch {
        setInputText(parsedInfo.baseUrl + (queryStr ? "?" + queryStr : ""));
      }
    } else {
      setInputText(parsedInfo.baseUrl + (queryStr ? "?" + queryStr : ""));
    }
  };

  const handleParamChange = (id: string, updatedField: "key" | "value", newValue: string) => {
    const currentParams = [...parsedInfo.params];
    const itemIndex = currentParams.findIndex((p) => p.id === id);
    if (itemIndex === -1) return;

    const query = new URLSearchParams();
    currentParams.forEach((p, idx) => {
      let k = p.key;
      let v = p.value;
      if (idx === itemIndex) {
        if (updatedField === "key") k = newValue;
        else v = newValue;
      }
      if (k || v) {
        query.append(k, v);
      }
    });

    updateUrlWithQuery(query.toString());
  };

  const handleParamDelete = (id: string) => {
    const currentParams = parsedInfo.params.filter((p) => p.id !== id);
    const query = new URLSearchParams();
    currentParams.forEach((p) => {
      query.append(p.key, p.value);
    });
    updateUrlWithQuery(query.toString());
    triggerToast("Parameter deleted");
  };

  const handleParamAdd = () => {
    const currentParams = [...parsedInfo.params];
    currentParams.push({
      id: `new-${Date.now()}`,
      key: "new_param",
      value: "value"
    });

    const query = new URLSearchParams();
    currentParams.forEach((p) => {
      query.append(p.key, p.value);
    });
    updateUrlWithQuery(query.toString());
    triggerToast("New parameter row added");
  };

  const handleSortParams = () => {
    const currentParams = [...parsedInfo.params];
    const nextSort = sortAsc === true ? false : true;
    setSortAsc(nextSort);

    currentParams.sort((a, b) => {
      const kA = a.key.toLowerCase();
      const kB = b.key.toLowerCase();
      if (kA < kB) return nextSort ? -1 : 1;
      if (kA > kB) return nextSort ? 1 : -1;
      return 0;
    });

    const query = new URLSearchParams();
    currentParams.forEach((p) => {
      query.append(p.key, p.value);
    });
    updateUrlWithQuery(query.toString());
    triggerToast(`Sorted parameters ${nextSort ? "A to Z" : "Z to A"}`);
  };

  // Live filtered parameters list for representation
  const filteredParams = useMemo(() => {
    if (!paramSearch.trim()) return parsedInfo.params;
    const term = paramSearch.toLowerCase();
    return parsedInfo.params.filter(
      (p) => p.key.toLowerCase().includes(term) || p.value.toLowerCase().includes(term)
    );
  }, [parsedInfo.params, paramSearch]);

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    triggerToast("Copied to clipboard!");
    setTimeout(() => {
      setCopiedType(null);
    }, 1800);
  };

  const loadTextIntoEncoder = (text: string) => {
    setInputText(text);
    setMode("encode");
    triggerToast("Text loaded to input");
  };

  const loadTextIntoDecoder = (text: string) => {
    setInputText(text);
    setMode("decode");
    triggerToast("Text loaded to input");
  };

  const exportParamsAsJson = () => {
    const obj: Record<string, string> = {};
    parsedInfo.params.forEach((p) => {
      if (p.key) obj[p.key] = p.value;
    });
    const jsonStr = JSON.stringify(obj, null, 2);
    copyToClipboard(jsonStr, "json");
  };

  // URL Type Badge Helper
  const detectedTypeLabel = useMemo(() => {
    if (!inputText.trim()) return null;
    if (/^https?:\/\//i.test(inputText)) return "Full URL";
    if (/^www\./i.test(inputText)) return "Domain URL";
    if (inputText.includes("?") || (inputText.includes("=") && inputText.includes("&"))) return "Query Query String";
    return "Plain Text / Arbitrary Payload";
  }, [inputText]);

  return (
    <div
      className="relative\ min-h-screen\ w-full\ ts-page-bg\ flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-slate-200/80 selection:text-slate-900 overflow-y-auto"
      style={{
        background: "radial-gradient(circle at 0% 0%, #e2e8f0 0%, transparent 50%), radial-gradient(circle at 100% 100%, #f1f5f9 0%, transparent 50%), radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <div className="w-full max-w-xl flex flex-col items-center">
        
        {/* White Glassmorphic Card Container */}
        <main
          id="tool-container"
          className="relative w-full bg-white/40 backdrop-blur-md border border-white/20 shadow-2xl rounded-[2rem] p-6 md:p-8 flex flex-col gap-6"
        >
          {/* Header Area */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                URL Architect
              </h1>
              {detectedTypeLabel && (
                <span className="bg-slate-100 border border-slate-200/50 text-[9px] px-2 py-0.5 rounded-full text-slate-500 font-mono tracking-wider uppercase">
                  {detectedTypeLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Clean, instant URL encoding and parameter analysis.
            </p>
          </div>

          {/* Segmented controls for switching mode */}
          <div id="mode-segmented-control" className="flex bg-slate-200/50 p-1 rounded-xl w-fit self-center z-10 relative">
            <button
              onClick={() => {
                setMode("encode");
                triggerToast("Switched to Encode Mode");
              }}
              className={`px-6 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "encode"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => {
                setMode("decode");
                triggerToast("Switched to Decode Mode");
              }}
              className={`px-6 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === "decode"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Decode
            </button>
          </div>

          {/* Optional Preset Buttons Board */}
          <div id="preset-selector" className="flex flex-col gap-2 bg-white/30 p-3 rounded-2xl border border-white/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Aesthetic Templates
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Click to populate</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setInputText(preset.value);
                    triggerToast(`Loaded ${preset.name}`);
                  }}
                  className="flex flex-col text-left p-2 rounded-xl border border-white/50 bg-white/50 hover:bg-white hover:border-slate-300 transition-all duration-200 hover:shadow-xs"
                >
                  <span className="text-[11px] font-semibold text-slate-700 truncate w-full">{preset.name}</span>
                  <span className="text-[9px] text-slate-400 truncate w-full">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Text Entry Field Container */}
          <div id="text-entry-panel" className="flex flex-col gap-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Source Input
              </label>
              <div className="text-[11px] font-mono text-slate-400">
                {inputText.length} chars
              </div>
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your URL or string here..."
                className="w-full h-24 p-4 bg-white/60 border border-white/40 rounded-2xl focus:outline-none focus:border-slate-300 focus:bg-white text-slate-700 font-mono text-sm resize-none shadow-inner leading-relaxed transition-all"
              />

              {inputText && (
                <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setInputText("");
                      triggerToast("Input cleared");
                    }}
                    title="Clear text"
                    className="p-1 px-2 bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors border border-slate-200/50 text-[10px] font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reverse operation trigger button */}
          <div className="flex items-center justify-center -my-3 relative z-10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMode((m) => (m === "encode" ? "decode" : "encode"));
                triggerToast(mode === "encode" ? "Switched to Decode" : "Switched to Encode");
              }}
              title="Reverse Switch Operation"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/85 text-slate-600 text-[11px] font-medium border border-slate-200/40 shadow-xs transition-colors"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Reverse direction</span>
            </motion.button>
          </div>

          {/* Output Display Box */}
          <div id="output-block-panel" className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
              Output Result
            </label>

            {derivationError ? (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">URI Handling Failure</div>
                  <div className="text-slate-500 mt-0.5 font-mono text-[11px] leading-normal break-all">
                    {derivationError}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="w-full p-4 bg-slate-900/5 border border-slate-900/10 rounded-2xl font-mono text-sm text-slate-800 break-all select-all min-h-[50px] leading-relaxed">
                  {processedResult ? (
                    processedResult
                  ) : (
                    <span className="text-slate-400 italic">Parsed results instantly real-time synchronized...</span>
                  )}
                </div>

                {processedResult && (
                  <div className="absolute right-3.5 top-3 flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (mode === "encode") {
                          loadTextIntoDecoder(processedResult);
                        } else {
                          loadTextIntoEncoder(processedResult);
                        }
                      }}
                      title="Inverse result as new input text to swap conversions"
                      className="p-1 px-1.5 bg-white/90 hover:bg-slate-100 border border-slate-200/50 text-slate-600 hover:text-slate-800 text-[10px] font-medium rounded-md transition-colors shadow-xs"
                    >
                      Swap input
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Render parameters sub-panel directly, with clean adaptation */}
          <AnimatePresence initial={false}>
            {parsedInfo.hasParams && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div id="query-parameters-panel" className="flex flex-col gap-3">
                  
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Query Parameters
                    </label>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold">
                      {parsedInfo.params.length} DETECTED
                    </span>
                  </div>

                  {/* Param row controller toolbar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={paramSearch}
                        onChange={(e) => setParamSearch(e.target.value)}
                        placeholder="Filter keys or values..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 border border-white/40 bg-white/60 focus:bg-white rounded-xl outline-none focus:border-slate-300 transition-all font-sans placeholder:text-slate-400 shadow-xs"
                      />
                      {paramSearch && (
                        <button
                          onClick={() => setParamSearch("")}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSortParams}
                      title="Sort parameters alphabetically"
                      className="px-2.5 py-1.5 bg-white/70 hover:bg-white text-slate-500 hover:text-slate-700 text-xs rounded-xl border border-white/50 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Sort</span>
                    </button>

                    <button
                      onClick={exportParamsAsJson}
                      title="Export param matrix as JSON block"
                      className="px-2.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-50 text-indigo-600 text-xs font-medium rounded-xl border border-indigo-100 transition-all flex items-center gap-1 shadow-xs"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </button>

                    <button
                      onClick={handleParamAdd}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Elegant table styled precisely to the theme design code */}
                  <div className="bg-white/60 border border-white/44 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-slate-400 text-xs font-semibold">
                          <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">Key</th>
                          <th className="px-4 py-2 font-bold uppercase tracking-wider text-[10px]">Value</th>
                          <th className="px-3 py-2 text-center font-bold uppercase tracking-wider text-[10px]">Del</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 font-mono text-[13px]">
                        {filteredParams.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-slate-400 font-sans text-xs italic">
                              {paramSearch ? "No parameters match filter criteria." : "No active key-value params parsed."}
                            </td>
                          </tr>
                        ) : (
                          filteredParams.map((pair, idx) => (
                            <tr key={pair.id} className="hover:bg-slate-100/30 transition-colors">
                              {/* Key Column */}
                              <td className="px-3 py-1.5 border-b border-slate-100/50 bg-white/25 w-2/5">
                                <input
                                  type="text"
                                  value={pair.key}
                                  onChange={(e) => handleParamChange(pair.id, "key", e.target.value)}
                                  className="w-full bg-transparent border-0 outline-none rounded-md px-1.5 py-0.5 text-xs text-slate-850 font-mono transition-colors focus:bg-white/90 focus:ring-1 focus:ring-slate-300"
                                  placeholder="key"
                                />
                              </td>
                              {/* Value Column */}
                              <td className="px-3 py-1.5 border-b border-slate-100/50 w-1/2">
                                <input
                                  type="text"
                                  value={pair.value}
                                  onChange={(e) => handleParamChange(pair.id, "value", e.target.value)}
                                  className="w-full bg-transparent border-0 outline-none rounded-md px-1.5 py-0.5 text-xs text-slate-700 font-mono transition-colors focus:bg-white/90 focus:ring-1 focus:ring-slate-300"
                                  placeholder="value"
                                />
                              </td>
                              {/* Action Delete column */}
                              <td className="px-2 py-1.5 border-b border-slate-100/50 text-center">
                                <button
                                  onClick={() => handleParamDelete(pair.id)}
                                  title="Remove parameter key"
                                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-750 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Footer status bar info */}
          <div className="flex justify-between items-center px-1 pt-2 border-t border-white/20">
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                System Ready
              </span>
            </div>

            {processedResult && (
              <button
                onClick={() => copyToClipboard(processedResult, "output")}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {copiedType === "output" ? "Copied!" : "Copy Output"}
              </button>
            )}
          </div>

        </main>
        
        {/* Soft elegant tiny system label */}
        <footer className="mt-6 text-[10px] text-slate-400 font-mono tracking-widest text-center uppercase opacity-80">
          Powered by client-side Web inspection architecture
        </footer>
      </div>

      {/* Floating Informative Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-800 z-50 pointer-events-none"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-sans font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

