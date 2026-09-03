import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Upload,
  AlertTriangle,
  FileText,
  X,
  Image as ImageIcon,
  ArrowLeftRight,
  Code,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  Eye,
  Trash2
} from "lucide-react";

// Types
type TabType = "encode" | "decode";
type EncodingFormat = "dataUrl" | "raw";

interface FileState {
  name: string;
  size: number;
  type: string;
  rawBase64: string;
  dataUrl: string;
  isImage: boolean;
}

// Byte utility
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// UTF-8 Clean Base64 encoder
function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) =>
      String.fromCharCode(byte)
    ).join("");
    return btoa(binString);
  } catch (err) {
    return "";
  }
}

// UTF-8 Clean Base64 decoder
function base64ToUtf8(str: string): string {
  try {
    const cleaned = str.trim().replace(/\s/g, "");
    const binString = atob(cleaned);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    throw new Error("Invalid Base64 format");
  }
}

// Auto detection of Base64 format
interface Base64Analysis {
  isDataUrl: boolean;
  mimeType: string;
  cleanBase64: string;
  isImage: boolean;
  isAudio: boolean;
  isVideo: boolean;
}

function analyzeBase64(str: string): Base64Analysis {
  const input = str.trim();
  const dataUrlRegex = /^data:([^;]+);base64,(.*)$/s;
  const match = input.match(dataUrlRegex);

  if (match) {
    const mimeType = match[1];
    const cleanBase64 = match[2].replace(/\s/g, "");
    return {
      isDataUrl: true,
      mimeType,
      cleanBase64,
      isImage: mimeType.startsWith("image/"),
      isAudio: mimeType.startsWith("audio/"),
      isVideo: mimeType.startsWith("video/"),
    };
  }

  // Not explicit Data URL, attempt MIME detection from standard heuristics or guess
  return {
    isDataUrl: false,
    mimeType: "text/plain",
    cleanBase64: input.replace(/\s/g, ""),
    isImage: false,
    isAudio: false,
    isVideo: false,
  };
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>("encode");

  // State: Encode Tab
  const [plainInput, setPlainInput] = useState<string>("");
  const [base64Format, setBase64Format] = useState<EncodingFormat>("raw");
  const [fileDetails, setFileDetails] = useState<FileState | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State: Decode Tab
  const [base64Input, setBase64Input] = useState<string>("");

  // Copy success indicator state (tracks dynamic keys like 'encode-text', 'file', 'decode-text')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Trigger copying
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    });
  };

  // Plain text encoded value
  const encodedText = plainInput ? utf8ToBase64(plainInput) : "";

  // Analysis / Decoded value for Base64 To Plain Text converter
  const analysis = analyzeBase64(base64Input);
  let decodedText = "";
  let decodeError = "";
  let containsIllegalChars = false;
  let illegalCharMessage = "";

  // Perform legal validation check for the Base64 String
  const cleanedInput = base64Input.replace(/\s/g, "");
  if (cleanedInput) {
    // Standard Base64 regex validation + padding validation
    const illegalChars = cleanedInput.match(/[^A-Za-z0-9+/=]/g);
    if (illegalChars) {
      containsIllegalChars = true;
      const uniqueIllegal = Array.from(new Set(illegalChars));
      illegalCharMessage = `Found illegal characters for Base64 sequence: ${uniqueIllegal.map(c => `'${c}'`).join(", ")}`;
    }

    try {
      // If structured with a data URL MIME prefix, decode the sanitized text block
      const textToDecode = analysis.isDataUrl ? analysis.cleanBase64 : cleanedInput;
      decodedText = base64ToUtf8(textToDecode);
    } catch (err: any) {
      decodeError = "Base64 string is incomplete or has incorrect padding structure";
    }
  }

  // Handle Drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Convert files helper
  const processUploadedFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const rawBase64 = result.split(",")[1] || "";
        setFileDetails({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          rawBase64,
          dataUrl: result,
          isImage: file.type.startsWith("image/"),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Drop Event
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Click file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate Text stats
  const plainTextBytes = new TextEncoder().encode(plainInput).length;
  const encodedTextBytes = new TextEncoder().encode(encodedText).length;
  const encodePercentChange = plainTextBytes > 0 
    ? Math.round(((encodedTextBytes - plainTextBytes) / plainTextBytes) * 100) 
    : 0;

  return (
    <div className="min-h-screen\ ts-page-bg font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dynamic macOS-style blurred decorative nodes */}
      <div 
        id="bg-glow-1" 
        className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-rose-300/30 rounded-full blur-[100px] pointer-events-none animate-pulse-glow-1"
      />
      <div 
        id="bg-glow-2" 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300/30 rounded-full blur-[120px] pointer-events-none animate-pulse-glow-2"
      />
      <div 
        id="bg-glow-3" 
        className="absolute top-[30%] left-[30%] w-[350px] h-[350px] bg-sky-300/20 rounded-full blur-[90px] pointer-events-none"
      />

      {/* Main Core Container */}
      <main 
        id="base64-container" 
        className="bg-white/40 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl max-w-2xl w-full p-6 md:p-8 flex flex-col relative z-10"
      >
        {/* Header Block */}
        <header id="app-header" className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Base64 Studio</h1>
              <p className="text-xs font-mono font-medium tracking-wide text-slate-500 uppercase">Encoder &amp; Decoder</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-sm mt-1">
            Convert text and structural assets into base64 format safely, with live character diagnostics and media rendering.
          </p>
        </header>

        {/* Apple-style Slider Tabs */}
        <div id="tabs-navigation" className="bg-slate-200/50 p-1 rounded-2xl flex relative mb-6">
          <button
            onClick={() => setActiveTab("encode")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200 rounded-xl relative z-10 flex items-center justify-center gap-2 ${
              activeTab === "encode" ? "text-slate-950" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "encode" && (
              <motion.div
                layoutId="active-tab-underlay"
                className="absolute inset-0 bg-white shadow-sm border border-slate-100/50 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Lock className="h-4 w-4" />
            Encode Text &amp; Files
          </button>
          <button
            onClick={() => setActiveTab("decode")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors duration-200 rounded-xl relative z-10 flex items-center justify-center gap-2 ${
              activeTab === "decode" ? "text-slate-950" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "decode" && (
              <motion.div
                layoutId="active-tab-underlay"
                className="absolute inset-0 bg-white shadow-sm border border-slate-100/50 rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Unlock className="h-4 w-4" />
            Decode Base64 Data
          </button>
        </div>

        {/* Content Wrapper */}
        <div id="active-panel-content" className="min-h-[380px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === "encode" ? (
              <motion.section
                key="encode-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col justify-between h-full"
              >
                
                {/* 1. TEXT ENCODER SECTION */}
                <div id="text-encoder" className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 font-sans">
                    <span className="flex items-center gap-1">
                      <Code className="h-3.5 w-3.5" />
                      TEXT SOURCE
                    </span>
                    <span className="font-mono">
                      {plainTextBytes > 0 ? `${plainInput.length} Chars | ${plainTextBytes} Bytes` : "Empty input"}
                    </span>
                  </div>
                  <textarea
                    id="encode-plain-textarea"
                    value={plainInput}
                    onChange={(e) => setPlainInput(e.target.value)}
                    placeholder="Type or paste plain text content to encode..."
                    className="w-full h-24 p-3.5 text-sm text-slate-800 bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition placeholder-slate-400 font-sans resize-none shadow-inner"
                  />

                  {/* Text Encode Output Block */}
                  {encodedText ? (
                    <div id="encode-text-output" className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 tracking-wider">BASE64 OUTPUT</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            +{encodePercentChange}% Overhead Included
                          </span>
                          <button
                            onClick={() => handleCopy(encodedText, "encode-text")}
                            className="text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                          >
                            {copiedStates["encode-text"] ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <pre className="w-full max-h-24 overflow-y-auto p-3 text-xs bg-slate-900/5 border border-slate-250 rounded-xl font-mono text-slate-800 break-all select-all scrollbar-thin whitespace-pre-wrap">
                          {encodedText}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-sans">Convert Text instantly by typing above.</p>
                    </div>
                  )}
                </div>

                {/* VISUAL SEPARATOR */}
                <div id="studio-divider" className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-dashed border-slate-300"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">OR DRAG ASSET</span>
                  <div className="flex-grow border-t border-dashed border-slate-300"></div>
                </div>

                {/* 2. FILE ENCODER SECTION */}
                <div id="file-encoder" className="space-y-3">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    FILE TO BASE64
                  </span>

                  {!fileDetails ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragActive
                          ? "border-slate-800 bg-slate-900/5 shadow-sm"
                          : "border-slate-300 bg-white/40 hover:bg-white/60 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.json,.txt,.doc,.docx"
                      />
                      <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mb-2.5 shadow-sm">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Drag &amp; drop small asset file here</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, SVG, JPG, JSON or documents (Max 5MB)</p>
                    </div>
                  ) : (
                    <div className="bg-white/80 border border-slate-150 rounded-2xl p-4 space-y-3 shadow-inner">
                      
                      {/* Asset Stats & Previews */}
                      <div className="flex items-center justify-between bg-slate-50/75 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {fileDetails.isImage ? (
                            <div className="h-11 w-11 rounded-lg border border-slate-200 overflow-hidden bg-white/90 flex-shrink-0 flex items-center justify-center p-0.5">
                              <img
                                src={fileDetails.dataUrl}
                                alt={fileDetails.name}
                                className="h-full w-full object-contain rounded-md"
                              />
                            </div>
                          ) : (
                            <div className="h-11 w-11 bg-slate-900/5 text-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-150">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate" title={fileDetails.name}>
                              {fileDetails.name}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">
                              {fileDetails.type} â€¢ {formatBytes(fileDetails.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={removeFile}
                          className="h-8 w-8 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition active:scale-95"
                          title="Clear Asset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Format Toggles */}
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="font-semibold text-slate-500">ENCODING FORMAT</span>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                          <button
                            type="button"
                            onClick={() => setBase64Format("dataUrl")}
                            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                              base64Format === "dataUrl"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Data URL String
                          </button>
                          <button
                            type="button"
                            onClick={() => setBase64Format("raw")}
                            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all ${
                              base64Format === "raw"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Raw Base64
                          </button>
                        </div>
                      </div>

                      {/* Decoded/Encoded Result View */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold tracking-wide text-slate-400">
                            {base64Format === "dataUrl" ? "DATA URL PREVIEW" : "RAW BASE64 VALUE"}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(
                                base64Format === "dataUrl" ? fileDetails.dataUrl : fileDetails.rawBase64,
                                "file-encode"
                              )
                            }
                            className="text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                          >
                            {copiedStates["file-encode"] ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="w-full h-18 overflow-y-auto p-2.5 text-[11px] bg-slate-900/5 border border-slate-200 rounded-xl font-mono text-slate-800 break-all select-all scrollbar-thin">
                          {base64Format === "dataUrl" ? fileDetails.dataUrl : fileDetails.rawBase64}
                        </pre>
                      </div>

                    </div>
                  )}

                </div>

              </motion.section>
            ) : (
              <motion.section
                key="decode-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* DECODE SYSTEM */}
                <div id="text-decoder" className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 font-sans">
                    <span className="flex items-center gap-1">
                      <Code className="h-3.5 w-3.5" />
                      BASE64 DATA OR DATA URL
                    </span>
                    <span className="font-mono">
                      {base64Input ? `${base64Input.length} characters` : "Waiting for input"}
                    </span>
                  </div>

                  {/* Input Base64 field */}
                  <textarea
                    id="decode-base64-textarea"
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Paste your Base64 string or 'data:image/...;base64,...' string here to decode..."
                    className="w-full h-24 p-2.5 text-xs text-slate-800 bg-white/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition placeholder-slate-400 font-mono resize-none shadow-inner"
                  />

                  {/* LIVE VALIDATION PANEL */}
                  {cleanedInput && (containsIllegalChars || decodeError) ? (
                    <div id="validation-panel" className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2.5 text-rose-700">
                      <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold font-sans">Decoding Diagnostic Alert</h4>
                        <p className="text-[11px] font-mono mt-0.5 text-rose-600">
                          {containsIllegalChars ? illegalCharMessage : "The string is formatted incorrectly for standard Base64 parsing. Check for proper character set patterns or trailing characters."}
                        </p>
                      </div>
                    </div>
                  ) : cleanedInput && (
                    <div id="validation-valid" className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2 px-3 flex items-center justify-between text-emerald-800 text-xs">
                      <span className="flex items-center gap-1 bg-white/30 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-700">
                        âœ“ SECURE FORMAT DETECTED
                      </span>
                      {analysis.isDataUrl && (
                        <span className="font-mono text-[10px] uppercase text-emerald-600 bg-emerald-100 px-1 rounded">
                          MIME: {analysis.mimeType}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Decoded Output view */}
                  {cleanedInput && (
                    <div className="space-y-3.5 pt-1">
                      
                      {/* Interactive Visual/Image media rendering preview if Data URL is detected */}
                      {analysis.isDataUrl && (analysis.isImage || analysis.isAudio || analysis.isVideo) && (
                        <div id="media-preview-box" className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5 text-indigo-500" />
                              Media Asset Preview
                            </span>
                            <span className="font-mono">{analysis.mimeType}</span>
                          </div>

                          <div className="flex justify-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm max-h-52 overflow-hidden items-center">
                            {analysis.isImage && (
                              <img
                                src={base64Input}
                                alt="Decoded Base64 visual preview"
                                className="max-h-44 max-w-full object-contain rounded-md"
                              />
                            )}

                            {analysis.isAudio && (
                              <audio controls className="w-full py-2">
                                <source src={base64Input} type={analysis.mimeType} />
                                Your browser does not support the audio player.
                              </audio>
                            )}

                            {analysis.isVideo && (
                              <video controls className="max-h-44 max-w-full rounded">
                                <source src={base64Input} type={analysis.mimeType} />
                                Your browser does not support the video playback.
                              </video>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Plain Decoded Text view */}
                      {decodedText ? (
                        <div id="decode-text-output" className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 tracking-wider">DECODED TEXT</span>
                            <button
                              onClick={() => handleCopy(decodedText, "decode-text")}
                              className="text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                            >
                              {copiedStates["decode-text"] ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-sans">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy Text</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="w-full max-h-36 overflow-y-auto p-3 text-xs bg-slate-900/5 border border-slate-200 rounded-xl font-mono text-slate-800 break-all select-all scrollbar-thin whitespace-pre-wrap">
                            {decodedText}
                          </pre>
                        </div>
                      ) : (
                        !decodeError && (
                          <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs text-slate-400 font-sans">This string can't be translated to human readable UTF-8 text properly (likely a binary data file).</p>
                          </div>
                        )
                      )}

                    </div>
                  )}

                  {!cleanedInput && (
                    <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-sans">Decoded text yields automatically once pasting input above.</p>
                    </div>
                  )}

                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Tactile interaction footer and tips */}
        <footer id="app-footer" className="mt-8 border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Secure Client-side Translation</span>
          </div>
          <span className="font-mono text-[10px]">No packets are sent to server</span>
        </footer>

      </main>

    </div>
  );
}

