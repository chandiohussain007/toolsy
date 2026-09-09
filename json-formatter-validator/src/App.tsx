/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Wand2, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  FileJson, 
  AlertTriangle, 
  X, 
  ListCollapse,
  Code,
  List,
  RefreshCw,
  FolderOpen,
  Maximize2,
  Minimize2,
  Settings,
  HelpCircle,
  FileCode
} from 'lucide-react';

// ==========================================
// PRESET CONFIGURATIONS FOR USER SELECTION
// ==========================================
interface Preset {
  name: string;
  description: string;
  code: string;
}

const PRESETS: Preset[] = [
  {
    name: "API Response (Success)",
    description: "Standard model of nested JSON payload representing user sessions, statistics, and access roles.",
    code: `{
  "status": "success",
  "data": {
    "user": {
      "id": 10429,
      "username": "codercraft",
      "email": "coder@ai.studio",
      "verified": true,
      "roles": ["developer", "member"]
    },
    "metrics": {
      "contributions": 1420,
      "streak_days": 42,
      "accuracy": 98.4
    },
    "metadata": {
      "last_login_ip": "192.168.1.1",
      "client": "Google Chrome v126",
      "active_session": null
    }
  }
}`
  },
  {
    name: "Nested Workspace Data",
    description: "Multi-layered structured list of ongoing projects, teams, milestones and budgets.",
    code: `{
  "workspace_id": "ws_9918231",
  "name": "Creative Suite Studio",
  "active": true,
  "projects": [
    {
      "id": "proj_01",
      "title": "Cloud Migration",
      "budget": 45000.50,
      "tags": ["cloud", "infra", "postgres"],
      "milestones": {
        "planning": "Completed",
        "beta": "In Progress",
        "delivery": "Scheduled"
      }
    },
    {
      "id": "proj_02",
      "title": "Aesthetic Dashboard UI",
      "budget": 12000.00,
      "tags": ["frontend", "tailwind", "react"],
      "milestones": {
        "planning": "Completed",
        "beta": "Completed",
        "delivery": "Completed"
      }
    }
  ],
  "team_count": 8
}`
  },
  {
    name: "Minified Messy JSON",
    description: "A compact single-line serialized block with zero formatting to test formatting functions.",
    code: `{"type":"FeatureCollection","name":"cupertinio_parks","features":[{"type":"Feature","properties":{"id":102,"name":"Memorial Park","size_acres":9.2,"facilities":["tennis","library","playground"]},"geometry":{"type":"Point","coordinates":[-122.032,37.332]}},{"type":"Feature","properties":{"id":105,"name":"Jollyman Park","size_acres":12.5,"facilities":["soccer","bbq","trail"]},"geometry":{"type":"Point","coordinates":[-122.045,37.318]}}]}`
  },
  {
    name: "Mangled (Invalid) Code",
    description: "Raw JS object containing single quotes, Python terms (True/None), missing parentheses, and trailing commas.",
    code: `{
  unquoted_key: 'single quoted string value',
  "python_constants": {
    "is_enabled": True,
    "current_status": None,
    "fallback_option": False,
  },
  "trailing_comma_list": [
    "item_one",
    "item_two",
  ]
}`
  }
];

// ==========================================
// UTILITY FUNCTIONS FOR POSITION & REpairS
// ==========================================

// Translate JS string parsing position index to Row and Column matching line lines the editor
function getLineAndCharOfPosition(str: string, position: number) {
  const preceding = str.substring(0, position);
  const lines = preceding.split('\n');
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length + 1;
  return { line: lineNum, column: colNum };
}

// Extract Row + Col parameters from modern browser/V8 JSON exception formats
function parseJSONDiagnostic(badJson: string, error: Error) {
  const msg = error.message;
  let line = 1;
  let column = 1;
  let position = -1;

  // 1. Try to search for V8 error parameter formats (position X)
  let posMatch = msg.match(/position (\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
  } else {
    posMatch = msg.match(/character (\d+)/i);
    if (posMatch) {
      position = parseInt(posMatch[1], 10);
    }
  }

  // 2. Try to search for line/column specifications
  const lineMatch = msg.match(/line (\d+)/i);
  const colMatch = msg.match(/column (\d+)/i);

  if (lineMatch) {
    line = parseInt(lineMatch[1], 10);
    if (colMatch) {
      column = parseInt(colMatch[1], 10);
    }
  } else if (position !== -1) {
    const info = getLineAndCharOfPosition(badJson, position);
    line = info.line;
    column = info.column;
  }

  // Generate responsive summary text which fits sleek popups
  let cleanMsg = msg;
  if (cleanMsg.includes('JSON.parse:')) {
    cleanMsg = cleanMsg.replace('JSON.parse:', '').trim();
  }

  return { line, column, msg: cleanMsg };
}

// Auto Repair engine providing quick troubleshooting capabilities for lazy developers
function smartRepairJSON(input: string): { fixed: string; logs: string[] } {
  const logs: string[] = [];
  let temp = input.trim();
  
  if (!temp) {
    return { fixed: "", logs: ["Input container is empty."] };
  }

  // Step A: Strip single line / block comments that cause typical crashes
  const commentRegex = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;
  if (commentRegex.test(temp)) {
    temp = temp.replace(commentRegex, '$1');
    logs.push("Removed comment blocks and inline annotations");
  }

  // Step B: Convert single quotes around properties/JSON structures into double quotes
  const singleQuotedKeyRegex = /([{,]\s*)'([a-zA-Z0-9_.\-\s]+)'\s*:/g;
  if (singleQuotedKeyRegex.test(temp)) {
    temp = temp.replace(singleQuotedKeyRegex, '$1"$2":');
    logs.push("Fixed single-quoted property keys to double quotes");
  }

  // Step C: Wrap naked object property selectors in double quotes
  const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_\-]*)\s*:/g;
  if (unquotedKeyRegex.test(temp)) {
    temp = temp.replace(unquotedKeyRegex, '$1"$2":');
    logs.push("Wrapped unquoted object keys in double quotes");
  }

  // Step D: Replace single quoted string values with double quotes correctly representing valid strings
  const singleQuotedValueRegex = /:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (singleQuotedValueRegex.test(temp)) {
    temp = temp.replace(singleQuotedValueRegex, ': "$1"');
    logs.push("Formatted single-quoted text nodes as double-quoted strings");
  }

  // Step E: Align Python definitions to standards rules
  if (/\bTrue\b/.test(temp)) {
    temp = temp.replace(/\bTrue\b/g, 'true');
    logs.push("Translated Python 'True' identifiers to 'true'");
  }
  if (/\bFalse\b/.test(temp)) {
    temp = temp.replace(/\bFalse\b/g, 'false');
    logs.push("Translated Python 'False' identifiers to 'false'");
  }
  if (/\bNone\b/.test(temp)) {
    temp = temp.replace(/\bNone\b/g, 'null');
    logs.push("Translated Python 'None' elements to standard null markers");
  }
  if (/\bundefined\b/.test(temp)) {
    temp = temp.replace(/\bundefined\b/g, 'null');
    logs.push("Mapped javascript 'undefined' constants to standard JSON 'null'");
  }

  // Step F: Erase trailing separators which violate strict formats
  const trailingCommaRegex = /,\s*(\})/g;
  if (trailingCommaRegex.test(temp)) {
    temp = temp.replace(trailingCommaRegex, '$1');
    logs.push("Trimmed invalid trailing comma separators in objects");
  }

  const trailingCommaArrayRegex = /,\s*(\])/g;
  if (trailingCommaArrayRegex.test(temp)) {
    temp = temp.replace(trailingCommaArrayRegex, '$1');
    logs.push("Trimmed invalid trailing comma separators inside arrays");
  }

  // Step G: Wrap floating lists in object parentheses if they lack them
  if (temp.startsWith('"') && temp.includes(':') && !temp.startsWith('{')) {
    temp = "{\n" + temp + "\n}";
    logs.push("Nested orphan options configuration directly in global curly braces");
  }

  return { fixed: temp, logs };
}

// ==========================================
// CUSTOM LINE-BY-LINE SYNTAX HIGHLIGHTER
// ==========================================
interface Token {
  text: string;
  type: 'whitespace' | 'key' | 'string' | 'number' | 'boolean' | 'null' | 'structural' | 'plain';
}

function tokenizeJSONLine(lineText: string): Token[] {
  const tokens: Token[] = [];
  // Token matching regex that identifies valid keys, strings, numbers, values, structural dividers
  const tokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"\s*:|"(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],]|\s+)/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = tokenRegex.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: lineText.substring(lastIndex, match.index), type: 'plain' });
    }
    
    const text = match[0];
    let type: Token['type'] = 'plain';
    
    if (text.trim() === '') {
      type = 'whitespace';
    } else if (text.endsWith(':')) {
      type = 'key';
    } else if (text.startsWith('"')) {
      type = 'string';
    } else if (text === 'true' || text === 'false') {
      type = 'boolean';
    } else if (text === 'null') {
      type = 'null';
    } else if (!isNaN(Number(text))) {
      type = 'number';
    } else if (/^[{}[\],]$/.test(text)) {
      type = 'structural';
    }
    
    tokens.push({ text, type });
    lastIndex = tokenRegex.lastIndex;
  }
  
  if (lastIndex < lineText.length) {
    tokens.push({ text: lineText.substring(lastIndex), type: 'plain' });
  }
  
  return tokens;
}

// Highlighting component returning formatted nested row blocks for custom scrolling output
function HighlightedCode({ code, errorLine }: { code: string; errorLine?: number }) {
  const lineTokens = useMemo(() => {
    return code.split('\n').map((lineText, idx) => ({
      index: idx + 1,
      tokens: tokenizeJSONLine(lineText)
    }));
  }, [code]);
  
  return (
    <pre className="text-xs font-mono select-text font-medium leading-6 m-0 outline-none">
      {lineTokens.map((line) => {
        const isErrorLine = errorLine === line.index;
        return (
          <div 
            key={line.index} 
            className={`flex transition-colors duration-150 relative ${
              isErrorLine 
                ? 'bg-rose-50/70 border-l border-red-500' 
                : 'hover:bg-slate-50/50'
            }`}
          >
            {/* Gutter Numbering Column */}
            <span className="w-10 text-right pr-3 select-none text-slate-400 font-mono text-[10px] leading-6 border-r border-slate-100/80 mr-3">
              {line.index}
            </span>
            
            {/* Syntax Highlighting Row blocks */}
            <span className="flex-1 whitespace-pre leading-6">
              {line.tokens.map((token, tIdx) => {
                let colorClass = 'text-slate-800';
                
                if (token.type === 'key') {
                  colorClass = 'text-indigo-600 font-semibold';
                } else if (token.type === 'string') {
                  colorClass = 'text-emerald-600';
                } else if (token.type === 'number') {
                  colorClass = 'text-sky-600 font-medium';
                } else if (token.type === 'boolean') {
                  colorClass = 'text-amber-600 font-semibold';
                } else if (token.type === 'null') {
                  colorClass = 'text-rose-500 font-bold italic';
                } else if (token.type === 'structural') {
                  colorClass = 'text-slate-400 font-bold';
                }
                
                return (
                  <span key={tIdx} className={colorClass}>
                    {token.text}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </pre>
  );
}

// ==========================================
// RECURSIVE INTERACTIVE JSON TREE COMPONENT
// ==========================================
interface JSONTreeNodeProps {
  data: any;
  label?: string | number;
  depth: number;
  path: string;
  forceExpandToken: number;
  searchQuery: string;
}

const JSONTreeNode: React.FC<JSONTreeNodeProps> = ({
  data,
  label = '',
  depth,
  path,
  forceExpandToken,
  searchQuery
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Synced listener responding to parent layout triggers
  useEffect(() => {
    if (forceExpandToken === 1) {
      setIsExpanded(true);
    } else if (forceExpandToken === -1) {
      setIsExpanded(false);
    }
  }, [forceExpandToken]);

  const valueType = typeof data;
  const isNull = data === null;
  const isArray = Array.isArray(data);
  const isObject = valueType === 'object' && !isNull && !isArray;

  // Render collapsible nested entities
  const hasChildren = isArray || isObject;
  const childrenKeys = useMemo(() => {
    if (isObject) return Object.keys(data);
    if (isArray) return data.map((_: any, i: number) => i);
    return [];
  }, [data, isObject, isArray]);

  // Determine whether this node, its label or inner children values contain search query
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    
    // Check if key/label name itself matches
    if (String(label).toLowerCase().includes(query)) return true;

    // Check if primitive node values match
    if (!hasChildren) {
      return String(data).toLowerCase().includes(query);
    }

    return false;
  }, [data, label, searchQuery, hasChildren]);

  // Handle value display mapping for leaf properties
  const renderLeafValue = () => {
    if (isNull) return <span className="text-rose-500 font-bold italic text-xs">null</span>;
    if (valueType === 'boolean') {
      return <span className="text-amber-600 font-bold text-xs">{data ? 'true' : 'false'}</span>;
    }
    if (valueType === 'number') {
      return <span className="text-sky-600 font-medium text-xs font-mono">{data}</span>;
    }
    
    // Escape or enclose string node sequences
    const textValue = String(data);
    const isTruncated = textValue.length > 80;
    const displayText = isTruncated ? `"${textValue.substring(0, 80)}..."` : `"${textValue}"`;
    
    return (
      <span 
        className="text-emerald-600 text-xs font-mono break-all group-hover:underline cursor-pointer"
        title={isTruncated ? "Click to view full contents" : undefined}
        onClick={() => {
          if (isTruncated) {
            alert(textValue);
          }
        }}
      >
        {displayText}
      </span>
    );
  };

  const itemBadgeCount = hasChildren
    ? (isArray ? `${data ? data.length : 0} items` : `${Object.keys(data || {}).length} keys`)
    : '';

  return (
    <div className="pl-3.5 select-none relative" id={`node-${path || 'root'}`}>
      {/* Background line markers indicating nested relationships */}
      {depth > 0 && (
        <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-slate-100 hover:bg-indigo-200 transition-colors pointer-events-none" />
      )}

      {hasChildren ? (
        <div className="flex flex-col py-0.5">
          {/* Node Trigger Section */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center text-xs space-x-1 cursor-pointer hover:bg-slate-50 rounded px-1.5 py-1 text-slate-700 select-none group w-fit transition-colors ${
              matchesSearch ? 'ring-2 ring-amber-400 bg-amber-50' : ''
            }`}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            ) : (
              <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            )}

            {label !== '' && (
              <strong className="text-indigo-700 font-semibold font-mono pr-1">
                {label}:
              </strong>
            )}

            <span className="text-[10px] text-slate-400 tracking-wider font-semibold">
              {isArray ? '[' : '{'}
            </span>

            <span className="bg-slate-100 group-hover:bg-slate-200/80 text-[10px] text-slate-500 px-1 py-0.2 rounded font-mono font-medium scale-95 transition-all">
              {itemBadgeCount}
            </span>

            {!isExpanded && (
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold">
                {isArray ? ']' : '}'}
              </span>
            )}
          </div>

          {/* Children List */}
          {isExpanded && (
            <div className="flex flex-col">
              {childrenKeys.map((key) => {
                const childPath = path ? `${path}.${key}` : String(key);
                return (
                  <JSONTreeNode
                    key={key}
                    data={data[key]}
                    label={key}
                    depth={depth + 1}
                    path={childPath}
                    forceExpandToken={forceExpandToken}
                    searchQuery={searchQuery}
                  />
                );
              })}

              {/* End structural parenthesis elements */}
              <div className="pl-4 py-0.5 pointer-events-none text-slate-400 font-semibold font-mono text-[10px] select-none">
                {isArray ? ']' : '}'}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Leaf values list rendering models */
        <div 
          className={`flex items-baseline text-xs py-0.5 space-x-1 hover:bg-slate-50/70 rounded px-1.5 transition-all ${
            matchesSearch ? 'ring-2 ring-amber-400 bg-amber-50' : ''
          }`}
        >
          {label !== '' && (
            <span className="text-indigo-600 font-semibold font-mono pr-0.5 select-text">
              {label}:
            </span>
          )}

          <div className="inline-block select-text">
            {renderLeafValue()}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CORE APPLICATION CONTAINER & MODULES
// ==========================================
export default function App() {
  // Input tracking
  const [rawInput, setRawInput] = useState<string>(PRESETS[0].code);
  const [indentSize, setIndentSize] = useState<string | number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Output options toggling
  const [activeTab, setActiveTab] = useState<'formatted' | 'tree'>('formatted');
  const [forceExpandToken, setForceExpandToken] = useState<number>(0);
  
  // Parsed states mapping
  const [parsedObject, setParsedObject] = useState<any>(null);
  const [formattedText, setFormattedText] = useState<string>('');
  
  // Real-time diagnostics state
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [diagInfo, setDiagInfo] = useState<{ line: number; column: number; msg: string } | null>(null);

  // Sync scroll references
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Auto notification state
  const [toast, setToast] = useState<{ show: boolean; text: string; mode: 'success' | 'warn' | 'info' }>({
    show: false,
    text: '',
    mode: 'success'
  });

  // Smart fix actions tracking logs
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const [showRepairLogs, setShowRepairLogs] = useState<boolean>(false);

  // Auto trigger validator when input code changes
  useEffect(() => {
    const value = rawInput;
    if (!value.trim()) {
      setValidationStatus('idle');
      setDiagInfo(null);
      setParsedObject(null);
      setFormattedText('');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setParsedObject(parsed);
      setValidationStatus('valid');
      setDiagInfo(null);
      
      // Calculate spacing and construct output
      const spacing = indentSize === 'tab' ? '\t' : Number(indentSize);
      const str = JSON.stringify(parsed, null, spacing);
      setFormattedText(str);
    } catch (err: any) {
      setValidationStatus('invalid');
      const info = parseJSONDiagnostic(value, err);
      setDiagInfo(info);
      // Keep old parsed object if useful, or set null
      setParsedObject(null);
      setFormattedText('');
    }
  }, [rawInput, indentSize]);

  // Handle syncing of scroll events
  const handleEditorScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Helper checking lines counts for input
  const totalLines = useMemo(() => {
    return Math.max(rawInput.split('\n').length, 1);
  }, [rawInput]);

  // Clipboard copies
  const handleCopyCodes = async () => {
    const textToCopy = activeTab === 'formatted' && formattedText ? formattedText : rawInput;
    try {
      await navigator.clipboard.writeText(textToCopy);
      triggerToast("Copied to clipboard successfully!", 'success');
    } catch (e) {
      triggerToast("Failed to copy code.", 'warn');
    }
  };

  // Quick notifier
  const triggerToast = (text: string, mode: 'success' | 'warn' | 'info') => {
    setToast({ show: true, text, mode });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  // Prettify triggering explicitly (even if live formatting works, re-align indentation spacing directly)
  const handlePrettify = () => {
    try {
      const obj = JSON.parse(rawInput);
      const spacing = indentSize === 'tab' ? '\t' : Number(indentSize);
      const output = JSON.stringify(obj, null, spacing);
      setRawInput(output);
      triggerToast("Beautified successfully", 'success');
    } catch (err: any) {
      triggerToast("Fix syntax errors before formatting!", 'warn');
    }
  };

  // Minify triggering
  const handleMinify = () => {
    try {
      const obj = JSON.parse(rawInput);
      const output = JSON.stringify(obj);
      setRawInput(output);
      triggerToast("Minified output", 'success');
    } catch (err) {
      triggerToast("Fix syntax errors before minifying!", 'warn');
    }
  };

  // Smart repair execution
  const executeSmartRepair = () => {
    const { fixed, logs } = smartRepairJSON(rawInput);
    if (logs.length === 0) {
      triggerToast("Format looks healthy already!", 'info');
      return;
    }
    setRawInput(fixed);
    setRepairLogs(logs);
    setShowRepairLogs(true);
    triggerToast(`Applied ${logs.length} fixes automatically!`, 'success');
  };

  // Clear inputs helper
  const clearEditor = () => {
    setRawInput('');
    setRepairLogs([]);
    setShowRepairLogs(false);
    triggerToast("Editor content cleared", "info");
  };

  return (
    <div className="relative min-h-screen w-full ts-page-bg font-sans flex flex-col items-center justify-center p-4 md:p-8 select-none antialiased overflow-x-hidden">
      
      {/* Soft aesthetic background accent circles */}
      <div className="absolute top-10 left-10 md:left-24 w-80 h-80 rounded-full bg-indigo-200 blur-3xl opacity-40 mix-blend-multiply filter pointer-events-none" />
      <div className="absolute bottom-10 right-10 md:right-24 w-96 h-96 rounded-full bg-rose-200 blur-3xl opacity-30 mix-blend-multiply filter pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-indigo-100 blur-3xl opacity-35 filter pointer-events-none" />

      {/* Main glassmorphic container layout */}
      <div 
        id="main-formatter-container"
        className="relative w-full max-w-5xl bg-white/50 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[720px]"
      >
        
        {/* UPPER MAIN COMPONENT BAR (APP HEADER) */}
        <header className="px-6 py-4 border-b border-indigo-100/30 bg-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-200 flex items-center justify-center">
              <FileJson size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-md md:text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                JSON Formatter <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest leading-none">v2.1</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Premium aesthetic syntax analyzer, minifier & recursive schemas tree visualizer
              </p>
            </div>
          </div>

          {/* QUICK SENDER TEST CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider md:mr-1">Interactive Templates:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                id={`preset-btn-${idx}`}
                onClick={() => {
                  setRawInput(p.code);
                  setRepairLogs([]);
                  setShowRepairLogs(false);
                  triggerToast(`Loaded ${p.name}`, 'info');
                }}
                className="text-[10px] font-semibold text-slate-600 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-sm active:scale-95 transition-all cursor-pointer"
                title={p.description}
              >
                {p.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </header>

        {/* TWO-PANEL WORKSPACE COMPONENT WRAPPER */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white/10 select-none">
          
          {/* LEFT-SIDE / TOP COMPONENT PANEL: INPUT EDITOR */}
          <section className="lg:col-span-6 p-4 md:p-5 flex flex-col border-r border-slate-100/80 min-h-[380px] lg:min-h-0 select-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileCode size={16} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Raw Input Source</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                {/* Visual Status Light */}
                {validationStatus === 'valid' ? (
                  <span className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-95 transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
                    <span>Valid JSON</span>
                  </span>
                ) : validationStatus === 'invalid' ? (
                  <span className="flex items-center space-x-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-95 transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mt-0.5" />
                    <span>Invalid Syntax</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-95">
                    <span>Empty Source</span>
                  </span>
                )}
              </div>
            </div>

            {/* SYNCHRONOUS CODE EDITOR */}
            <div className="flex-1 flex relative bg-slate-900/5 backdrop-blur-sm rounded-2xl overflow-hidden min-h-[280px] border border-slate-250/60 shadow-inner group">
              
              {/* Numeric Column Line numbers */}
              <div 
                ref={gutterRef}
                className="w-9 select-none py-3 text-right bg-slate-100/40 border-r border-slate-200/50 text-slate-400 font-mono text-[10px] overflow-hidden leading-6 pr-1.5"
              >
                {Array.from({ length: totalLines }).map((_, i) => {
                  const isCurrentErrorLine = diagInfo && diagInfo.line === i + 1;
                  return (
                    <div 
                      key={i} 
                      className={`h-6 flex items-center justify-end font-mono ${
                        isCurrentErrorLine 
                          ? 'bg-rose-500/10 text-rose-600 font-bold border-r-[3px] border-rose-500' 
                          : 'transition-colors hover:text-slate-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* Native Source Textarea */}
              <textarea
                ref={textareaRef}
                id="raw-json-editor"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                onScroll={handleEditorScroll}
                className="flex-1 py-3 px-3.5 outline-none resize-none font-mono text-xs leading-6 bg-transparent text-slate-800 placeholder-slate-400 overflow-y-auto selection:bg-indigo-100 select-text"
                placeholder={`{\n  "paste_messy_json_here": true,\n  "it_will_validate": "instantly"\n}`}
                spellCheck={false}
              />

              {/* Instant Clear helper */}
              {rawInput && (
                <button
                  onClick={clearEditor}
                  id="clear-input-btn"
                  title="Clear source"
                  className="absolute right-3.5 top-3 p-1.5 rounded-lg text-slate-400 bg-white shadow-sm hover:text-rose-500 border border-slate-100 active:scale-95 transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-200"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* INPUT PANEL REPAIR CONTROL TOOLBAR */}
            <div className="mt-3.5 flex flex-col sm:flex-row gap-2 select-none">
              <button
                id="smart-repair-btn"
                onClick={executeSmartRepair}
                className="flex-1 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 cursor-pointer"
                title="Converts single quotes, unquoted keys, python states and fixes missing boundaries"
              >
                <Wand2 size={14} className="stroke-[2.2]" />
                <span>Smart Repair Tools</span>
              </button>

              <button
                id="paste-clipboard-btn"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setRawInput(text);
                      triggerToast("Pasted successfully from clipboard", 'info');
                    } else {
                      triggerToast("Clipboard appears empty", 'warn');
                    }
                  } catch (e) {
                    triggerToast("Permissions missing to inspect clipboard. Use Cmd+V.", 'warn');
                  }
                }}
                className="py-2 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1 hover:border-slate-300 cursor-pointer active:scale-95"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Paste from Clipboard</span>
              </button>
            </div>

            {/* REAL-TIME PRECISE ERROR BANNER */}
            <AnimatePresence mode="wait">
              {validationStatus === 'invalid' && diagInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  id="error-alert-banner"
                  className="mt-4 p-3.5 bg-rose-50/75 backdrop-blur-md rounded-2xl border border-rose-100/60 text-rose-800 flex items-start space-x-2.5 shadow-sm"
                >
                  <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5 stroke-[2.2]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-950">Diagnostic Error Found</p>
                    <p className="text-[11px] font-medium text-rose-700/90 mt-0.5 font-mono select-text break-words">
                      {diagInfo.msg}
                    </p>
                    <div className="mt-1.5 flex items-center space-x-2">
                      <span className="text-[9px] bg-rose-200/55 text-rose-800 font-bold px-1.5 py-0.5 rounded font-mono">
                        Line {diagInfo.line}
                      </span>
                      <span className="text-[9px] bg-rose-250/55 text-rose-800 font-bold px-1.5 py-0.5 rounded font-mono">
                        Column {diagInfo.column}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REPAIR RECAP LOGS ACCORDION */}
            <AnimatePresence>
              {showRepairLogs && repairLogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3.5 overflow-hidden"
                >
                  <div className="bg-emerald-50/60 border border-emerald-100/50 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Autofix Changelog ({repairLogs.length})
                      </span>
                      <button 
                        onClick={() => setShowRepairLogs(false)} 
                        className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100/50 p-0.5 rounded transition-all cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <ul className="space-y-1 font-sans text-[10px] font-medium text-emerald-700/90 list-disc list-inside">
                      {repairLogs.map((log, lIdx) => (
                        <li key={lIdx} className="leading-relaxed list-none flex items-center gap-1.5">
                          <span className="text-emerald-500">âœ“</span> {log}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* RIGHT-SIDE / BOTTOM COMPONENT PANEL: SYNTAX HIGHLIGHTING & INTERACTIVE TREE VIEW */}
          <section className="lg:col-span-6 p-4 md:p-5 flex flex-col min-h-[420px] lg:min-h-0 select-none">
            
            {/* VIEW AND OPTION HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
              
              {/* Output Tab Selection selectors */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center space-x-0.5 w-fit">
                <button
                  id="tab-syntax-btn"
                  onClick={() => setActiveTab('formatted')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'formatted' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Code size={13} />
                  <span>Syntax Text</span>
                </button>
                <button
                  id="tab-tree-btn"
                  onClick={() => {
                    setActiveTab('tree');
                    // Ensure is valid state
                    if (validationStatus !== 'valid') {
                      triggerToast("Fix syntax errors to explore Schema Tree", "warn");
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'tree' 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={13} />
                  <span>Schema Tree</span>
                </button>
              </div>

              {/* INDENT SELECTOR SPACING PARAMETERS */}
              {activeTab === 'formatted' && (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spacing:</span>
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center space-x-0.5">
                    {[2, 4, 'tab'].map((size) => (
                      <button
                        key={size}
                        id={`spacing-size-btn-${size}`}
                        onClick={() => {
                          setIndentSize(size);
                          triggerToast(`Switched back to ${size} space formatting`, 'info');
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                          indentSize === size 
                            ? 'bg-white text-indigo-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {size === 'tab' ? 'Tab' : size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TREE CONTROL OPTIONS */}
              {activeTab === 'tree' && parsedObject && (
                <div className="flex items-center space-x-1">
                  <button
                    id="tree-expand-all"
                    onClick={() => {
                      setForceExpandToken(1);
                      // Reset to clear overriding behavior
                      setTimeout(() => setForceExpandToken(0), 100);
                      triggerToast("Expanded all nodes", 'info');
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/40 bg-white shadow-sm flex items-center justify-center cursor-pointer"
                    title="Expand all nodes"
                  >
                    <FolderOpen size={13} />
                  </button>
                  <button
                    id="tree-collapse-all"
                    onClick={() => {
                      setForceExpandToken(-1);
                      setTimeout(() => setForceExpandToken(0), 100);
                      triggerToast("Collapsed all nodes", 'info');
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/40 bg-white shadow-sm flex items-center justify-center cursor-pointer"
                    title="Collapse all nodes"
                  >
                    <ListCollapse size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* MAIN VIEWER BLOCK PORTAL */}
            <div className="flex-1 flex flex-col relative bg-slate-50 rounded-2xl border border-slate-200 shadow-inner overflow-hidden min-h-[300px]">
              
              {/* Tab Case A: SYNTAX TEXT */}
              {activeTab === 'formatted' && (
                <div className="flex-1 overflow-auto p-4 select-text selection:bg-indigo-100">
                  {formattedText ? (
                    <HighlightedCode code={formattedText} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center select-none">
                      <FileJson size={32} className="opacity-30 stroke-[1.5] mb-2 text-indigo-500" />
                      <p className="text-xs font-bold text-slate-500">No output generated</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Please provide valid raw JSON schema or resolve warnings listed on the input editor panel.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Case B: SCHEMA INTERACTIVE TREE */}
              {activeTab === 'tree' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Search filter banner tool */}
                  {parsedObject && (
                    <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200 flex items-center space-x-2 shrink-0 select-none">
                      <Search size={13} className="text-slate-400" />
                      <input
                        id="tree-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search keys or values in schema tree..."
                        className="flex-1 bg-transparent text-[11px] outline-none text-slate-700 placeholder-slate-400 font-medium"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Schema Tree main field */}
                  <div className="flex-1 overflow-auto p-4 select-none">
                    {parsedObject ? (
                      <div className="font-mono">
                        <JSONTreeNode
                          data={parsedObject}
                          depth={0}
                          path=""
                          forceExpandToken={forceExpandToken}
                          searchQuery={searchQuery}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center select-none">
                        <ListCollapse size={32} className="opacity-30 stroke-[1.5] mb-2 text-indigo-500" />
                        <p className="text-xs font-bold text-slate-500">Schema tree unavailable</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          The schema explorer is only active when input validates with pure, clean compliance status parameters.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FLOATING ACTION TOOLBAR OVER VIEWER BLOCK */}
              {formattedText && activeTab === 'formatted' && (
                <div className="absolute bottom-4 right-4 flex items-center space-x-2 select-none">
                  
                  <button
                    id="prettify-action-btn"
                    onClick={handlePrettify}
                    className="h-8 px-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 hover:border-indigo-200 font-bold text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
                    title="Beautify structured alignment parameters"
                  >
                    <Sparkles size={11} className="stroke-[2]" />
                    <span>Prettify</span>
                  </button>

                  <button
                    id="minify-action-btn"
                    onClick={handleMinify}
                    className="h-8 px-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 hover:border-indigo-200 font-bold text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
                    title="Compress payload by trimming all non-essential formatting whitespace"
                  >
                    <FolderOpen size={11} />
                    <span>Minify</span>
                  </button>
                </div>
              )}
            </div>

            {/* MAIN COPY AND EXPORT BUTTON */}
            <div className="mt-3.5 flex items-center space-x-2 select-none">
              <button
                id="copy-code-major-btn"
                disabled={activeTab === 'formatted' ? !formattedText : !rawInput}
                onClick={handleCopyCodes}
                className={`w-full py-2 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95 cursor-pointer ${
                  (activeTab === 'formatted' ? formattedText : rawInput)
                    ? 'bg-indigo-650 text-white hover:bg-indigo-700 shadow-indigo-100 hover:shadow-indigo-200'
                    : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                <Copy size={14} className="stroke-[2.2]" />
                <span>
                  {activeTab === 'formatted' ? 'Copy Highlighted Output' : 'Copy Raw Input'}
                </span>
              </button>
            </div>
          </section>
        </main>

        {/* MODERN AESTHETIC FOOTER BAR */}
        <footer className="px-6 py-3.5 border-t border-slate-100/50 bg-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium select-none">
          <div className="flex items-center space-x-1">
            <span>Powered by Client-side state engines</span>
            <span className="text-slate-300">â€¢</span>
            <span>Zero Server dependencies</span>
          </div>
          <div className="mt-1.5 sm:mt-0 flex items-center space-x-3.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Offline Ready</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>UTF-8 standard compliant</span>
          </div>
        </footer>

        {/* INTUATIVE FRAMER MOTION FLOATING TOASTS */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              id="framer-motion-toast"
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2.5 max-w-sm backdrop-blur-xl ${
                toast.mode === 'success' 
                  ? 'bg-indigo-950/95 text-white border-indigo-850/60' 
                  : toast.mode === 'warn'
                  ? 'bg-rose-950/95 text-rose-50 border-rose-850/60'
                  : 'bg-slate-900/95 text-white border-slate-800'
              }`}
            >
              <div className="p-1 rounded-lg bg-white/10 flex items-center justify-center">
                {toast.mode === 'success' ? (
                  <Check size={14} className="text-indigo-400 stroke-[2.5]" />
                ) : toast.mode === 'warn' ? (
                  <AlertTriangle size={14} className="text-rose-400 stroke-[2.5]" />
                ) : (
                  <Sparkles size={14} className="text-amber-400 stroke-[2.5]" />
                )}
              </div>
              <p className="text-xs font-bold leading-none">{toast.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}


