/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { 
  Edit3, 
  Columns, 
  Eye, 
  Download, 
  Printer, 
  Check, 
  Copy, 
  Trash2, 
  BookOpen, 
  Sparkles,
  Type,
  FileText,
  Clock,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileCode,
  Plus,
  Trash,
  ChevronDown,
  ChevronUp,
  Settings2,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types representing a structural block editor system
type BlockType = "h1" | "h2" | "h3" | "p" | "quote" | "list" | "image";
type FontFamily = "Sans" | "Serif" | "Mono";
type FontWeight = "300" | "400" | "500" | "600" | "700" | "905";
type Alignment = "left" | "center" | "right" | "justify";

interface DocBlock {
  id: string;
  type: BlockType;
  text: string;
  family: FontFamily;
  size: number; // Font size in pts/pixels
  weight: FontWeight;
  color: string; // key of COLOR_PALETTE
  align: Alignment;
  imageUrl?: string;
  imageName?: string;
  aspectRatio?: number;
}

// Curated lux brand color coordinates (Tailwind class bindings + RGB vector values for PDF)
const COLOR_PALETTE: Record<string, { tw: string; rgb: [number, number, number]; name: string; hex: string }> = {
  "slate-900": { tw: "text-slate-900", hex: "#0f172a", rgb: [15, 23, 42], name: "Charcoal" },
  "stone-600": { tw: "text-stone-650", hex: "#57534e", rgb: [87, 83, 78], name: "Warm Slate" },
  "indigo-600": { tw: "text-indigo-600", hex: "#4f46e5", rgb: [79, 70, 229], name: "Indigo" },
  "emerald-700": { tw: "text-emerald-700", hex: "#047857", rgb: [4, 120, 87], name: "Emerald" },
  "rose-800": { tw: "text-rose-805", hex: "#9f1239", rgb: [159, 18, 57], name: "Burgundy" },
  "amber-700": { tw: "text-amber-705", hex: "#b45309", rgb: [180, 83, 9], name: "Clay" },
  "blue-700": { tw: "text-blue-700", hex: "#1d4ed8", rgb: [29, 78, 216], name: "Cobalt" },
  "purple-800": { tw: "text-purple-800", hex: "#6b21a8", rgb: [107, 33, 168], name: "Plum" }
};

const DEFAULT_BLUEPRINT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="500" height="200">
  <rect width="100%" height="100%" fill="%23faf9f6" stroke="%23ebd9c8" stroke-width="1.5"/>
  <grid>
    <path d="M 0 50 L 500 50 M 0 100 L 500 100 M 0 150 L 500 150 v" fill="none" stroke="%23ebd9c8" stroke-width="0.5" stroke-dasharray="2,2"/>
  </grid>
  <circle cx="250" cy="100" r="45" fill="none" stroke="%234f46e5" stroke-width="1" stroke-dasharray="5,3"/>
  <rect x="210" y="75" width="80" height="50" rx="4" fill="none" stroke="%23047857" stroke-width="1.2"/>
  <text x="250" y="103" font-family="monospace" font-size="8.5" fill="%236b7280" text-anchor="middle" letter-spacing="1">VECTOR EMBED SCHEMATIC</text>
  <line x1="80" y1="100" x2="420" y2="100" stroke="%239f1239" stroke-width="0.5"/>
</svg>`;

// Preset Initial Templates representing Google Doc content
const DRAFT_PRESETS: Record<string, DocBlock[]> = {
  specification: [
    { id: "1", type: "h1", text: "Product Design Proposal", family: "Sans", size: 30, weight: "700", color: "indigo-600", align: "left" },
    { id: "2", type: "h2", text: "Alabaster Slate Series-V Specs", family: "Sans", size: 18, weight: "600", color: "slate-900", align: "left" },
    { id: "3", type: "hr", text: "---", family: "Sans", size: 12, weight: "400", color: "stone-600", align: "left" } as any,
    { id: "4", type: "p", text: "We present the formal design layouts and spatial specifications for the next-generation tactile slate. The interface focuses on high-fidelity, high-contrast, beautiful print layouts mimicking professional publisher paper grids.", family: "Serif", size: 14, weight: "400", color: "stone-600", align: "left" },
    { id: "5", type: "image", text: "Vector Schematic", family: "Sans", size: 12, weight: "400", color: "slate-900", align: "center", imageUrl: DEFAULT_BLUEPRINT_SVG, aspectRatio: 2.5 },
    { id: "6", type: "h3", text: "Core Typography Spacing Requirements", family: "Sans", size: 13, weight: "600", color: "slate-900", align: "left" },
    { id: "7", type: "list", text: "Proportional micro-letterspacing mapping across different screen media.", family: "Serif", size: 13.5, weight: "400", color: "stone-600", align: "left" },
    { id: "8", type: "list", text: "Adaptive margin configuration matching classic A4 and US Letter sizes perfectly.", family: "Serif", size: 13.5, weight: "400", color: "stone-600", align: "left" },
    { id: "9", type: "quote", text: "A beautifully typeset publication acts not merely as a carrier of words, but as an intentional architectural space tailored for deep study.", family: "Serif", size: 14, weight: "400", color: "rose-800", align: "left" }
  ],
  resume: [
    { id: "1", type: "h1", text: "Clara Hawthorne", family: "Sans", size: 28, weight: "700", color: "slate-900", align: "center" },
    { id: "2", type: "h3", text: "SENIOR SYSTEM TYPOGRAPHER & PRODUCT DESIGNER", family: "Mono", size: 12, weight: "600", color: "indigo-600", align: "center" },
    { id: "3", type: "hr", text: "---", family: "Sans", size: 12, weight: "400", color: "stone-600", align: "left" } as any,
    { id: "4", type: "p", text: "Executive layout engineer and typography expert with 8+ years designing high-fidelity documentation vectors and publishing structures. Passionate about minimalist structural layouts and human-centric editing software tools.", family: "Serif", size: 13, weight: "400", color: "stone-600", align: "justify" },
    { id: "5", type: "h2", text: "Professional Experience", family: "Sans", size: 16, weight: "600", color: "slate-900", align: "left" },
    { id: "6", type: "list", text: "Senior UX Designer | Alabaster Publishing Corp (2022 â€” Present)", family: "Serif", size: 13, weight: "400", color: "stone-600", align: "left" },
    { id: "7", type: "list", text: "Directed vector output compiler integration, speeding up client side render times by 42%.", family: "Serif", size: 12.5, weight: "300", color: "stone-600", align: "left" },
    { id: "8", type: "list", text: "Lead Interaction Scribe | Gutenberg Digit Co (2019 â€” 2022)", family: "Serif", size: 13, weight: "400", color: "stone-600", align: "left" },
    { id: "9", type: "list", text: "Constructed dynamic document blocks framework, driving user engagement up by 15%.", family: "Serif", size: 12.5, weight: "300", color: "stone-600", align: "left" }
  ],
  minimal: [
    { id: "1", type: "h1", text: "In Search of Quiet Spaces", family: "Serif", size: 32, weight: "600", color: "rose-800", align: "center" },
    { id: "2", type: "p", text: "There is an aesthetic simplicity that can only be captured when we rid our interfaces of clutter. Every extra log, network status dot, and redundant panel acts as a tax on our finite cognitive resources.", family: "Serif", size: 15, weight: "400", color: "slate-900", align: "left" },
    { id: "3", type: "quote", text: "Write deliberately. Style instantly. Export beautifully.", family: "Sans", size: 15, weight: "500", color: "indigo-600", align: "center" }
  ]
};

export default function App() {
  // Primary Document state storing our sequential blocks list
  const [blocks, setBlocks] = useState<DocBlock[]>(DRAFT_PRESETS.specification);
  const [activeBlockId, setActiveBlockId] = useState<string>("1");
  const [layoutMode, setLayoutMode] = useState<"Source" | "Split" | "Typeset">("Split");
  const [isCopied, setIsCopied] = useState(false);
  const [notification, setNotification] = useState("");

  // Global Page setups
  const [pagePadding, setPagePadding] = useState<"Compact" | "Balanced" | "Generous">("Balanced");
  const [lineSpacing, setLineSpacing] = useState<"Tight" | "Balanced" | "Spacious">("Balanced");
  const [showHeader, setShowHeader] = useState(true);
  const [headerLabelText, setHeaderLabelText] = useState("ALABASTER TECHNICAL PUBLISHING");
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [customFileName, setCustomFileName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Active Focused Block Object
  const activeBlock = useMemo(() => {
    return blocks.find(b => b.id === activeBlockId) || null;
  }, [blocks, activeBlockId]);

  // Adjust display modes for responsive mobile sizes nicely on mount
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024 && layoutMode === "Split") {
        setLayoutMode("Source");
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [layoutMode]);

  // Document Analytics
  const stats = useMemo(() => {
    let wordCount = 0;
    let charCount = 0;
    blocks.forEach(b => {
      if (b.type !== "image") {
        wordCount += b.text.trim() === "" ? 0 : b.text.trim().split(/\s+/).length;
        charCount += b.text.length;
      }
    });
    const estPages = Math.max(1, Math.ceil(charCount / 1800));
    return {
      wordCount,
      charCount,
      lines: blocks.length,
      readTime: Math.max(1, Math.ceil(wordCount / 180)),
      pages: estPages
    };
  }, [blocks]);

  // Derived output filename
  const derivedFileName = useMemo(() => {
    if (customFileName.trim()) return customFileName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const h1First = blocks.find(b => b.type === "h1");
    if (h1First && h1First.text.trim()) {
      return h1First.text.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 32);
    }
    return "alabaster_document";
  }, [blocks, customFileName]);

  // Helper template selectors
  const handleLoadTemplate = (key: keyof typeof DRAFT_PRESETS) => {
    const selected = DRAFT_PRESETS[key];
    setBlocks(selected);
    if (selected.length > 0) {
      setActiveBlockId(selected[0].id);
    }
  };

  // Direct Text Change Handler per Focused block
  const handleBlockTextChange = (id: string, text: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text } : b));
  };

  // Append new clean paragraph block sequentially (Notion-style Enter key experience!)
  const handleInsertBlockBelow = (currentId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === currentId);
    const newId = `block-${Date.now()}`;
    const newBlock: DocBlock = {
      id: newId,
      type: "p",
      text: "",
      family: "Serif",
      size: 14,
      weight: "400",
      color: "stone-600",
      align: "left"
    };

    const copy = [...blocks];
    copy.splice(currentIndex + 1, 0, newBlock);
    setBlocks(copy);
    setActiveBlockId(newId);
  };

  // Delete current block with safety limits
  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      // Keep at least one empty block
      setBlocks([{
        id: "1",
        type: "p",
        text: "",
        family: "Serif",
        size: 14,
        weight: "400",
        color: "stone-600",
        align: "left"
      }]);
      setActiveBlockId("1");
      return;
    }

    const currentIndex = blocks.findIndex(b => b.id === id);
    const nextActiveIndex = currentIndex === 0 ? 1 : currentIndex - 1;
    setActiveBlockId(blocks[nextActiveIndex].id);
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  // Reorder Blocks
  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const reordered = [...blocks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setBlocks(reordered);
  };

  // Active toolbar modifications mapping directly into the active block
  const updateActiveBlockStyle = (fields: Partial<DocBlock>) => {
    if (!activeBlock) return;
    setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, ...fields } : b));
  };

  // Special block type changes (Heading size resets automatically for UX convenience)
  const handleBlockTypeChange = (type: BlockType) => {
    if (!activeBlock) return;
    
    let defaultSize = 14;
    let defaultWeight: FontWeight = "400";
    let defaultColor = "stone-600";
    let defaultAlign: Alignment = "left";

    if (type === "h1") {
      defaultSize = 30;
      defaultWeight = "700";
      defaultColor = "indigo-600";
    } else if (type === "h2") {
      defaultSize = 22;
      defaultWeight = "600";
      defaultColor = "slate-900";
    } else if (type === "h3") {
      defaultSize = 15;
      defaultWeight = "600";
      defaultColor = "slate-900";
    } else if (type === "quote") {
      defaultSize = 14;
      defaultWeight = "400";
      defaultColor = "rose-800";
    } else if (type === "list") {
      defaultSize = 13.5;
      defaultWeight = "400";
      defaultColor = "stone-600";
    }

    updateActiveBlockStyle({
      type,
      size: defaultSize,
      weight: defaultWeight,
      color: defaultColor,
      align: defaultAlign
    });
  };

  // Image upload selector triggering Base64 Conversion
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeBlock) {
      setNotification("Please select/focus a text block to insert an image.");
      setTimeout(() => setNotification(""), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const imgObj = new Image();
      imgObj.onload = () => {
        updateActiveBlockStyle({
          type: "image",
          text: file.name.split(".")[0],
          imageUrl: base64,
          aspectRatio: imgObj.width / imgObj.height || 1.8
        });
        setNotification(`Successfully embedded image: ${file.name}`);
        setTimeout(() => setNotification(""), 3500);
      };
      imgObj.src = base64;
    };
    reader.readAsDataURL(file);
  };

  // Copy plain code markdown representation of core structural blocks
  const handleCopyMarkdown = () => {
    let md = "";
    blocks.forEach(b => {
      if (b.type === "h1") md += `# ${b.text}\n\n`;
      else if (b.type === "h2") md += `## ${b.text}\n\n`;
      else if (b.type === "h3") md += `### ${b.text}\n\n`;
      else if (b.type === "quote") md += `> ${b.text}\n\n`;
      else if (b.type === "list") md += `- ${b.text}\n`;
      else if (b.type === "image") md += `![${b.text}](${b.imageUrl?.substring(0, 40)}...)\n\n`;
      else md += `${b.text}\n\n`;
    });
    navigator.clipboard.writeText(md.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // High-Fidelity Client-Side Vector PDF Compiler via jsPDF
  const exportPDFSuite = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const paddingMap = { Compact: 14, Balanced: 22, Generous: 32 };
    const padVal = paddingMap[pagePadding];
    const availWidth = 210 - (2 * padVal);

    const familyMap = { Sans: "Helvetica", Serif: "Times", Mono: "Courier" };
    const lineHeights = { Tight: 1.25, Balanced: 1.5, Spacious: 1.8 };
    const spCoeff = lineHeights[lineSpacing];

    let yPos = padVal + 6;
    let pageNum = 1;

    const drawHeader = () => {
      if (showHeader) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(150, 150, 150);
        const label = (headerLabelText || derivedFileName).toUpperCase();
        doc.text(label, padVal, padVal - 5);
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.12);
        doc.line(padVal, padVal - 3.5, 210 - padVal, padVal - 3.5);
      }
    };

    const drawFooter = () => {
      if (showPageNumbers) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${pageNum}`, 105, 297 - 10, { align: "center" });
      }
    };

    const verifyRequiredSpace = (neededHeight: number) => {
      if (yPos + neededHeight > 297 - padVal) {
        drawFooter();
        doc.addPage();
        pageNum++;
        yPos = padVal + 5;
        drawHeader();
      }
    };

    const getXValue = (align: Alignment) => {
      if (align === "center") return 105;
      if (align === "right") return 210 - padVal;
      return padVal;
    };

    const getPDFAlignOptions = (align: Alignment) => {
      if (align === "center") return { align: "center" as const };
      if (align === "right") return { align: "right" as const };
      return {};
    };

    drawHeader();

    blocks.forEach((block) => {
      if (block.type === "image") {
        if (block.imageUrl) {
          const width = availWidth;
          const height = Math.min(65, width / (block.aspectRatio || 1.8));

          verifyRequiredSpace(height + 6);
          try {
            doc.addImage(block.imageUrl, "JPEG", padVal, yPos + 2, width, height, undefined, "FAST");
            yPos += height + 8;
          } catch (e) {
            // Draw placeholder box if format fails to compress
            doc.setFillColor(245, 245, 240);
            doc.rect(padVal, yPos + 2, width, 14, "F");
            doc.setFont("Courier", "normal");
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text(`[Image Attachment File: ${block.text || "Media"}]`, padVal + 4, yPos + 10);
            yPos += 20;
          }
        }
        return;
      }

      // Convert structural pt sizes to equivalent mm spacing values safely
      const font = familyMap[block.family];
      const weight = parseInt(block.weight) >= 600 ? "bold" : "normal";
      const sizePt = block.size * 0.9; // Scale scale ratio to balance layout perfectly
      const col = COLOR_PALETTE[block.color]?.rgb || [15, 23, 42];

      doc.setFont(font, weight);
      doc.setFontSize(sizePt);
      doc.setTextColor(col[0], col[1], col[2]);

      const isSpecialBlock = block.type === "quote" || block.type === "list";
      const blockWidth = isSpecialBlock ? availWidth - 10 : availWidth;

      const linesText = doc.splitTextToSize(block.text || " ", blockWidth);
      const leadingMm = sizePt * spCoeff * 0.3528;
      const blockHeight = linesText.length * leadingMm;

      verifyRequiredSpace(blockHeight + 5);

      if (block.type === "quote") {
        const ribbonCol = COLOR_PALETTE[stylesLookupForPDFQuotes()]?.rgb || [79, 70, 229];
        doc.setDrawColor(ribbonCol[0], ribbonCol[1], ribbonCol[2]);
        doc.setLineWidth(0.8);
        doc.line(padVal + 1.5, yPos + 1.5, padVal + 1.5, yPos + blockHeight + 1.5);

        for (let j = 0; j < linesText.length; j++) {
          doc.text(linesText[j], padVal + 7, yPos + 1.5 + ((j + 1) * leadingMm) - (leadingMm * 0.25));
        }
        yPos += blockHeight + 5;

      } else if (block.type === "list") {
        const listIndent = 7;
        const bulletColor = COLOR_PALETTE[stylesLookupForPDFQuotes()]?.rgb || [79, 70, 229];

        for (let j = 0; j < linesText.length; j++) {
          if (j === 0) {
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(bulletColor[0], bulletColor[1], bulletColor[2]);
            doc.text("â€¢", padVal + 2, yPos + leadingMm - 0.2);
            doc.setFont(font, weight);
            doc.setTextColor(col[0], col[1], col[2]);
          }
          doc.text(linesText[j], padVal + listIndent, yPos + ((j + 1) * leadingMm) - 0.2);
        }
        yPos += blockHeight + 3.5;

      } else {
        const xPos = getXValue(block.align);
        const options = getPDFAlignOptions(block.align);

        for (let j = 0; j < linesText.length; j++) {
          doc.text(linesText[j], xPos, yPos + ((j + 1) * leadingMm) - 0.2, options);
        }
        
        yPos += blockHeight + 4; // Spacing after block paragraph
      }
    });

    drawFooter();
    doc.save(`${derivedFileName}.pdf`);
  };

  const stylesLookupForPDFQuotes = () => {
    return activeBlock?.color || "indigo-600";
  };

  // Pre-compiled mapping utilities for tailwind typography classes
  const fontClassMap = {
    Sans: "font-sans",
    Serif: "font-serif",
    Mono: "font-mono"
  };

  const weightClassMap = {
    "300": "font-light",
    "400": "font-normal",
    "500": "font-medium",
    "600": "font-semibold",
    "700": "font-bold",
    "905": "font-black"
  };

  const alignmentClassMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify"
  };

  const paddingClassMap = {
    Compact: "p-4 sm:p-7",
    Balanced: "p-7 sm:p-12",
    Generous: "p-10 sm:p-18"
  };

  const lineSpacingClassMap = {
    Tight: "space-y-3.5",
    Balanced: "space-y-5.5",
    Spacious: "space-y-8"
  };

  return (
    <div id="converter-root" className="min-h-screen ts-page-bg relative flex flex-col items-center justify-between font-sans text-stone-800 bg-[#fbfbfa] selection:bg-indigo-500/15 selection:text-indigo-950 overflow-x-hidden md:py-8 py-2">
      
      {/* Absolute Ambient Fluid Liquid Color Accents (No print) */}
      <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none no-print bg-[#fafaf8]">
        <div className="absolute top-[-10%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-indigo-150/20 blur-[130px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-rose-100/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[450px] h-[450px] rounded-full bg-amber-50/20 blur-[110px]" />
      </div>

      {/* Floating Status Notification Alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-50 bg-stone-900 border border-stone-800 text-white rounded-xl px-4 py-2.5 text-xs font-mono shadow-xl flex items-center gap-2 max-w-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="hidden">Hidden Input placeholder</span>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header section (No print) */}
      <header className="w-full max-w-3xl px-6 mb-5 text-center no-print">
        <motion.div 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-1"
        >
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
            AL
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400 font-mono">Alabaster Slate Studio</span>
        </motion.div>

        <h1 className="text-2.5xl font-bold tracking-tight text-stone-950">
          Interactive TXT & Block PDF Scribe
        </h1>
        <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
          Write structural blocks, select text formats, change colors/weights on the fly, and download beautiful vector publications.
        </p>
      </header>

      {/* Primary Workspace Arena */}
      <main className="w-full h-full flex flex-col items-center justify-center px-2 sm:px-6 relative flex-grow max-w-[1240px]">
        
        {/* Printable Viewport Target (Used solely by @media print standard queries) */}
        <div 
          className="hidden print-only print-sheet text-left" 
          style={{ "--print-padding": pagePadding === "Compact" ? "12mm" : pagePadding === "Balanced" ? "24mm" : "34mm" } as React.CSSProperties}
        >
          {showHeader && (
            <div className="w-full flex items-center justify-between pb-1.5 mb-6 border-b border-stone-250 text-stone-450 font-sans text-[10px] uppercase tracking-widest font-semibold">
              <span>{headerLabelText || derivedFileName}</span>
              <span>EST. PRESS</span>
            </div>
          )}

          <div className={`font-serif text-stone-850 font-normal ${lineSpacingClassMap[lineSpacing]}`}>
            {blocks.map((block, i) => {
              if (block.type === "image") {
                return block.imageUrl ? <img key={i} src={block.imageUrl} className="w-full object-contain my-4" alt="embedded illustration" /> : null;
              }
              return (
                <div 
                  key={i} 
                  className={`
                    ${fontClassMap[block.family]} 
                    ${weightClassMap[block.weight]} 
                    ${alignmentClassMap[block.align]} 
                    ${COLOR_PALETTE[block.color]?.tw}
                  `}
                  style={{ fontSize: `${block.size * 0.85}px`, lineHeight: "1.45" }}
                >
                  {block.type === "quote" && <span className="inline-block border-l-2 border-indigo-600 pl-4 py-0.5 italic text-stone-605">{block.text}</span>}
                  {block.type === "list" && <span className="inline-block pl-2"><strong className="mr-1">â€¢</strong>{block.text}</span>}
                  {block.type !== "quote" && block.type !== "list" && <span>{block.text}</span>}
                </div>
              );
            })}
          </div>

          {showPageNumbers && (
            <div className="w-full text-center text-stone-400 pt-7 mt-12 border-t border-stone-200">
              <span className="font-sans text-[10px] tracking-widest uppercase">Page 1</span>
            </div>
          )}
        </div>

        {/* Dynamic Global Menu Presets Bar */}
        <div className="w-full max-w-2xl bg-[#ffffffb2] backdrop-blur-md rounded-2xl border border-stone-200/50 shadow-xs px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-2.5 no-print z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1.5 mr-1">
              <BookOpen className="w-3.5 h-3.5" />
              Blueprints:
            </span>
            {(["specification", "resume", "minimal"] as const).map((key) => (
              <button 
                key={key}
                onClick={() => handleLoadTemplate(key)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg text-stone-700 bg-stone-50 hover:bg-stone-200 hover:text-stone-900 transition-all cursor-pointer border border-stone-200/40"
              >
                {key === "specification" ? "Design Spec" : key === "resume" ? "Structured CV" : "Minimal Prose"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-600 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-stone-200/50"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied" : "Copy Markdown"}</span>
            </button>

            <button
              onClick={() => {
                setBlocks([{ id: "1", type: "p", text: "Start writing here...", family: "Serif", size: 14, weight: "400", color: "slate-900", align: "left" }]);
                setActiveBlockId("1");
              }}
              className="px-2.5 py-1 text-stone-400 hover:text-rose-650 bg-stone-50 hover:bg-rose-50 border border-stone-200/45 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Reset layout slate"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Global Formatting Toolbar Block (Google Docs Style, right in primary view) */}
        <div className="w-full max-w-[1200px] bg-white rounded-2xl border border-stone-200/80 shadow-md p-3.5 mb-4 flex flex-wrap items-center gap-3 no-print z-20">
          
          {/* Format / Type selector dropdown */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Block Type</span>
            <select
              value={activeBlock?.type || "p"}
              onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
              className="h-9 px-2 bg-stone-50 hover:bg-stone-100/60 border border-stone-200 rounded-lg text-xs font-semibold text-stone-850 outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer text-left min-w-[110px]"
            >
              <option value="p">Â¶ Paragraph</option>
              <option value="h1">Heading 1 (H1)</option>
              <option value="h2">Heading 2 (H2)</option>
              <option value="h3">Heading 3 (H3)</option>
              <option value="quote">â Blockquote</option>
              <option value="list">List Item (â€¢)</option>
              <option value="image">ðŸ–¼ Image Block</option>
            </select>
          </div>

          <div className="h-8 w-px bg-stone-200 self-end mb-0.5" />

          {/* Font Family selector dropdown */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Font family</span>
            <select
              value={activeBlock?.family || "Serif"}
              onChange={(e) => updateActiveBlockStyle({ family: e.target.value as FontFamily })}
              className="h-9 px-2 bg-stone-50 hover:bg-stone-100/60 border border-stone-200 rounded-lg text-xs font-semibold text-stone-850 outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[95px]"
            >
              <option value="Sans">Inter Sans</option>
              <option value="Serif">Lora Serif</option>
              <option value="Mono">JetBrains Code</option>
            </select>
          </div>

          {/* Sizing micro-adjuster controls */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Size pt</span>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg h-9 px-1.5">
              <button
                onClick={() => updateActiveBlockStyle({ size: Math.max(8, (activeBlock?.size || 14) - 1) })}
                className="w-6 h-6 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-xs select-none cursor-pointer"
                title="Decrease font size"
              >
                -
              </button>
              <span className="text-xs font-bold px-1.5 min-w-[22px] text-center font-mono">{activeBlock?.size || 14}</span>
              <button
                onClick={() => updateActiveBlockStyle({ size: Math.min(72, (activeBlock?.size || 14) + 1) })}
                className="w-6 h-6 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-xs select-none cursor-pointer"
                title="Increase font size"
              >
                +
              </button>
            </div>
          </div>

          {/* Weight selector dropdown */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Weight scale</span>
            <select
              value={activeBlock?.weight || "400"}
              onChange={(e) => updateActiveBlockStyle({ weight: e.target.value as FontWeight })}
              className="h-9 px-2 bg-stone-50 hover:bg-stone-100/60 border border-stone-200 rounded-lg text-xs font-semibold text-stone-850 outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer min-w-[100px]"
            >
              <option value="300">Light 300</option>
              <option value="400">Regular 400</option>
              <option value="500">Medium 500</option>
              <option value="600">Semibold 600</option>
              <option value="700">Bold 700</option>
              <option value="905">Heavy 900</option>
            </select>
          </div>

          <div className="h-8 w-px bg-stone-200 self-end mb-0.5" />

          {/* Alignments segments */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Alignment</span>
            <div className="flex items-center gap-0.5 bg-stone-50 border border-stone-200 p-0.5 rounded-lg h-9">
              {(["left", "center", "right", "justify"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : align === "right" ? AlignRight : AlignJustify;
                const isSelected = activeBlock?.align === align;
                return (
                  <button
                    key={align}
                    onClick={() => updateActiveBlockStyle({ align })}
                    className={`w-7.5 h-7.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? "bg-stone-900 text-white shadow-xs" : "text-stone-400 hover:text-stone-800"
                    }`}
                    title={`Align ${align}`}
                  >
                    <Icon className="w-3.7 h-3.7" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-stone-200 self-end mb-0.5" />

          {/* Color Sphere selection layout */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Text color specs</span>
            <div className="flex items-center gap-1.5 h-9 bg-stone-50 border border-stone-200 px-2.5 rounded-lg">
              {Object.keys(COLOR_PALETTE).map((key) => {
                const item = COLOR_PALETTE[key];
                const isSelected = activeBlock?.color === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateActiveBlockStyle({ color: key })}
                    title={item.name}
                    style={{ backgroundColor: item.hex }}
                    className={`w-5 h-5 rounded-full hover:scale-110 cursor-pointer transition-all flex items-center justify-center relative ${
                      isSelected ? "ring-2 ring-indigo-500 ring-offset-1 scale-105" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {isSelected && <span className="text-[8px] font-bold text-white">âœ“</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-stone-200 self-end mb-0.5" />

          {/* Picture Insert & Custom Media additions button */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1 pl-1">Layout elements</span>
            <button
              onClick={triggerImageUpload}
              className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-750 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Replace targeted block with embedded picture base64 inline"
            >
              <Upload className="w-3.7 h-3.7" />
              <span>Insert Image</span>
            </button>
          </div>

          {/* Highlighted core block indicators */}
          <div className="ml-auto flex items-center gap-2 self-end">
            <div className="px-2.5 py-1 rounded bg-amber-50 text-[10px] font-mono font-bold text-amber-700 border border-amber-200/55 animate-pulse">
              Focused Block ID: {activeBlockId}
            </div>
          </div>

        </div>

        {/* Dynamic Interactive Splits Layout Container */}
        <motion.div
          layout="position"
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full transition-all duration-500 ease-out no-print ${
            layoutMode === "Split" ? "max-w-[1240px]" : "max-w-2.5xl"
          }`}
        >
          {/* Main White Editorial Glassmorphic Container frame */}
          <div className="glass-panel relative rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col bg-white/45">
            
            {/* Nav Title Segment */}
            <div className="w-full px-5 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between bg-white/60 gap-4">
              
              {/* PDF Output Filename Config */}
              <div className="flex items-center gap-1.5 max-w-full sm:max-w-[220px]">
                <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="untitled_scribes"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-stone-200 focus:border-indigo-500 text-stone-850 text-xs font-semibold outline-hidden py-0.5 truncate w-full"
                  title="PDF output filename"
                />
              </div>

              {/* Centered Switch Tab views */}
              <div className="bg-stone-100 p-1 rounded-xl flex items-center scale-95 mx-auto sm:mx-0">
                <button
                  onClick={() => setLayoutMode("Source")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    layoutMode === "Source" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editor Slate
                </button>

                <button
                  onClick={() => setLayoutMode("Split")}
                  className={`hidden lg:flex px-3.5 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer ${
                    layoutMode === "Split" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Split Sheet
                </button>

                <button
                  onClick={() => setLayoutMode("Typeset")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    layoutMode === "Typeset" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Press Preview
                </button>
              </div>

              {/* Printing Output action triggers */}
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.8 bg-white border border-stone-250 hover:bg-stone-55 text-stone-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Draw physical printer page dialogue"
                >
                  <Printer className="w-3.7 h-3.7 text-stone-500" />
                  <span>Print Fallback</span>
                </button>

                <button
                  onClick={exportPDFSuite}
                  className="px-4.5 py-1.8 bg-stone-900 hover:bg-stone-950 text-white rounded-xl text-xs font-bold shadow-md shadow-stone-900/15 hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Compile PDF
                </button>
              </div>

            </div>

            {/* Main workspace section splits */}
            <div className="flex-grow flex flex-col lg:flex-row relative min-h-[580px]">
              
              {/* PAGE 1: Text Block sequence drafting compartment */}
              {(layoutMode === "Source" || layoutMode === "Split") && (
                <div className={`flex flex-col flex-1 border-r border-stone-200 bg-white/70 ${
                  layoutMode === "Source" ? "w-full" : "w-1/2"
                }`}>
                  
                  {/* Top segment indicator */}
                  <div className="px-4.5 py-2.5 bg-stone-50/50 border-b border-stone-150 flex items-center justify-between text-xs font-mono text-stone-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <FileCode className="w-4 h-4 text-indigo-500" />
                      Content Scribe Arena
                    </span>
                    <span className="text-[10px]">
                      {stats.charCount} characters total
                    </span>
                  </div>

                  {/* Scrollable Block Series - Clicking any block triggers rich selection state */}
                  <div className="p-5 space-y-4 overflow-y-auto max-h-[580px] scrollbar-thin">
                    <AnimatePresence initial={false}>
                      {blocks.map((block, index) => {
                        const isFocused = activeBlockId === block.id;
                        
                        return (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            onClick={() => setActiveBlockId(block.id)}
                            className={`p-3.5 border rounded-xl transition-all relative group cursor-text ${
                              isFocused 
                                ? "bg-white border-indigo-200/90 shadow-sm ring-1 ring-indigo-500/10" 
                                : "bg-stone-50/50 hover:bg-white border-stone-200/50 hover:border-stone-300"
                            }`}
                          >
                            {/* Floating individual Block Reordering and addition controls */}
                            <div className="absolute right-3 top-3.5 hidden group-hover:flex items-center gap-1 bg-white border border-stone-200 p-0.5 rounded-lg shadow-xs z-10">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveBlock(index, "up"); }}
                                disabled={index === 0}
                                className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                                title="Move Block Up"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveBlock(index, "down"); }}
                                disabled={index === blocks.length - 1}
                                className="p-1 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                                title="Move Block Down"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              
                              <div className="w-px h-3 bg-stone-200" />
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); handleInsertBlockBelow(block.id); }}
                                className="p-1 text-indigo-500 hover:text-indigo-900 rounded hover:bg-indigo-50 cursor-pointer"
                                title="Append block below"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                className="p-1 text-rose-500 hover:text-rose-900 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Block Type Tag label */}
                            <span className="absolute left-3 top-2 text-[8px] font-mono font-bold uppercase text-stone-400 select-none">
                              {block.type === "quote" ? "blockquote" : block.type === "list" ? "bullet point" : block.type}
                            </span>

                            {/* Input fields based on block content */}
                            <div className="pt-2.5">
                              {block.type === "image" ? (
                                <div className="flex flex-col items-center gap-2.5 py-4">
                                  {block.imageUrl ? (
                                    <div className="w-full relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100/30">
                                      <img 
                                        src={block.imageUrl} 
                                        className="max-h-[140px] w-full object-contain mx-auto" 
                                        alt={block.text} 
                                      />
                                      <div className="absolute inset-x-0 bottom-0 bg-stone-900/60 p-2 text-center">
                                        <span className="text-[10px] text-white font-mono">{block.text || "image_upload.png"}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-24 border border-dashed border-stone-200 rounded-lg flex flex-col justify-center items-center text-stone-400">
                                      <ImageIcon className="w-7 h-7 mb-1" />
                                      <span className="text-xs">No media loaded</span>
                                    </div>
                                  )}
                                  <div className="w-full">
                                    <span className="block text-[9px] font-mono text-stone-400 mb-1 pl-1">Caption / Alternate Text</span>
                                    <input
                                      type="text"
                                      value={block.text}
                                      onChange={(e) => handleBlockTextChange(block.id, e.target.value)}
                                      placeholder="Insert alt description tag..."
                                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <textarea
                                  value={block.text}
                                  onChange={(e) => handleBlockTextChange(block.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleInsertBlockBelow(block.id);
                                    }
                                    if (e.key === "Backspace" && block.text === "") {
                                      e.preventDefault();
                                      handleDeleteBlock(block.id);
                                    }
                                  }}
                                  placeholder={
                                    block.type === "h1" ? "Heading Title Here..." :
                                    block.type === "h2" ? "Subsection Title Here..." :
                                    block.type === "h3" ? "Minor Title Here..." :
                                    block.type === "quote" ? "Cite a premium quote quotation..." :
                                    block.type === "list" ? "Describe list feature outcome..." :
                                    "Plain formatting block paragraph content here..."
                                  }
                                  className={`
                                    w-full bg-transparent resize-none focus:outline-hidden placeholder:text-stone-300 leading-normal outline-none text-stone-850 select-text
                                    ${fontClassMap[block.family]}
                                    ${weightClassMap[block.weight]}
                                    ${alignmentClassMap[block.align]}
                                    ${COLOR_PALETTE[block.color]?.tw}
                                  `}
                                  style={{ fontSize: `${block.size * 0.9}px` }}
                                  rows={Math.max(1, Math.ceil(block.text.length / 55))}
                                />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Appending new paragraph bottom button */}
                    <button
                      onClick={() => {
                        const newId = `block-${Date.now()}`;
                        setBlocks([...blocks, { id: newId, type: "p", text: "", family: "Serif", size: 14, weight: "400", color: "stone-600", align: "left" }]);
                        setActiveBlockId(newId);
                      }}
                      className="w-full py-3.5 border border-dashed border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/10 rounded-2xl text-stone-450 hover:text-indigo-650 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Append New Block</span>
                    </button>
                  </div>

                </div>
              )}

              {/* PAGE 2: Live HTML Digital-Typeset paper rendering layout */}
              {(layoutMode === "Typeset" || layoutMode === "Split") && (
                <div className={`flex flex-col flex-grow bg-stone-100/50 relative ${
                  layoutMode === "Typeset" ? "w-full" : "w-1/2"
                }`}>
                  
                  {/* Preview Toolbar headers (with custom margin page controls) */}
                  <div className="px-4.5 py-2.5 bg-stone-100/30 border-b border-stone-200 flex flex-wrap items-center justify-between text-xs font-mono text-stone-400 gap-3">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      A4 Publication Layout Preview
                    </span>

                    {/* Margin Setup */}
                    <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg">
                      {(["Compact", "Balanced", "Generous"] as typeof pagePadding[]).map((pad) => (
                        <button
                          key={pad}
                          onClick={() => setPagePadding(pad)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            pagePadding === pad ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-850"
                          }`}
                        >
                          {pad} Margin
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg lg:flex hidden">
                      {(["Tight", "Balanced", "Spacious"] as typeof lineSpacing[]).map((sp) => (
                        <button
                          key={sp}
                          onClick={() => setLineSpacing(sp)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            lineSpacing === sp ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-850"
                          }`}
                        >
                          {sp === "Tight" ? "1.25x" : sp === "Balanced" ? "1.50x" : "1.80x"}
                        </button>
                      ))}
                    </div>

                    <span className="text-[10px] text-stone-550 font-bold ml-auto lg:block hidden">
                      ESTIMATE: {stats.pages} {stats.pages === 1 ? "PAGE" : "PAGES"}
                    </span>
                  </div>

                  {/* Simulated Core Paper Sheet Grid layout wrapper */}
                  <div className="flex-grow p-5 flex justify-center items-start overflow-y-auto max-h-[580px] scrollbar-thin">
                    <div className="w-full max-w-full bg-white rounded-xl shadow-lg border border-stone-200/70 text-left relative transition-all duration-300">
                      
                      {/* Margin padding binding container */}
                      <div className={`${paddingClassMap[pagePadding]}`}>
                        
                        {/* High-Fidelity header decorations */}
                        {showHeader && (
                          <div className="w-full flex items-center justify-between pb-2 mb-6 border-b border-stone-200 text-stone-400 no-print">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-sans">
                              {headerLabelText}
                            </span>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#7c7c7c]">
                              A4 DRAFT
                            </span>
                          </div>
                        )}

                        {/* Interactive dynamic block compiler output */}
                        <div className={`${lineSpacingClassMap[lineSpacing]}`}>
                          {blocks.map((block, i) => {
                            if (block.type === "image") {
                              return block.imageUrl ? (
                                <div key={block.id} className="w-full my-4 rounded-lg overflow-hidden border border-stone-100 bg-stone-50/50">
                                  <img 
                                    src={block.imageUrl} 
                                    className="max-h-[220px] w-full object-contain mx-auto" 
                                    alt={block.text || "Visual attachment"} 
                                  />
                                  {block.text && (
                                    <div className="p-2 py-1.5 text-center bg-stone-50 text-[10.5px] italic text-stone-500 font-serif border-t border-stone-100">
                                      Fig. {i + 1} â€” {block.text}
                                    </div>
                                  )}
                                </div>
                              ) : null;
                            }

                            return (
                              <div
                                key={block.id}
                                className={`
                                  ${fontClassMap[block.family]}
                                  ${weightClassMap[block.weight]}
                                  ${alignmentClassMap[block.align]}
                                  ${COLOR_PALETTE[block.color]?.tw}
                                  transition-all leading-normal
                                `}
                                style={{ fontSize: `${block.size * 0.85}px` }}
                              >
                                {block.type === "quote" && (
                                  <blockquote className="pl-4.5 my-3 border-l-2 border-indigo-600 italic text-stone-605">
                                    {block.text || "Write blockquote citation..."}
                                  </blockquote>
                                )}

                                {block.type === "list" && (
                                  <div className="pl-5 relative before:content-['â€¢'] before:absolute before:left-1 before:font-bold before:opacity-80">
                                    {block.text || "Bullet factor item list description..."}
                                  </div>
                                )}

                                {block.type !== "quote" && block.type !== "list" && (
                                  <span>{block.text || " "}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination footer layout */}
                        {showPageNumbers && (
                          <div className="w-full flex items-center justify-center pt-8 mt-12 border-t border-stone-150 text-stone-300 text-center">
                            <span className="text-[10px] tracking-widest text-stone-400 font-sans uppercase">Page 1</span>
                          </div>
                        )}

                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Layout Footer Details indicators */}
            <div className="px-5 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between bg-white/60 text-stone-500 text-[11px] font-mono gap-3 no-print">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  Active Blocks: <strong className="text-stone-850 font-bold">{blocks.length}</strong>
                </span>
                <span>
                  Words: <strong className="text-stone-850 font-bold">{stats.wordCount}</strong>
                </span>
                <span>
                  Words / Minute reads: <strong className="text-indigo-605 font-bold">{stats.readTime} m</strong>
                </span>
              </div>

              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg px-2.5 py-1 text-[10px] text-stone-500 font-bold">
                <Clock className="w-3.5 h-3.5 text-stone-400 mr-1" />
                Live Synchronization Active
              </div>
            </div>

          </div>
        </motion.div>

        {/* Global Layout Setup properties menu (Collapsible nicely at the bottom) */}
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-205 shadow-md p-4 mt-4 no-print text-left">
          <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider font-sans">A4 Page / Vector Document Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold mb-1 pl-1">Page Headers Label</label>
                <input
                  type="text"
                  value={headerLabelText}
                  onChange={(e) => setHeaderLabelText(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-9 px-3 rounded-lg text-stone-800 text-xs font-semibold outline-none"
                  placeholder="Insert custom header label brand..."
                />
              </div>

              <div className="flex items-center gap-4 pt-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Draw Page Headers
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={(e) => setShowPageNumbers(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Draw Page Numbers
                </label>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-150 flex flex-col justify-center">
              <span className="block text-[9px] font-bold font-mono text-stone-400 uppercase tracking-widest mb-1 pl-1">PRO-TIP: Notion Interactions</span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                Type content directly in any slide container block. Press <strong className="text-stone-900 font-bold">Enter</strong> to append a brand new block underneath automatically. Press <strong className="text-stone-900 font-bold">Backspace</strong> on empty fields to instantly remove them.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Brand Footer */}
      <footer className="w-full max-w-2xl px-6 mt-8 py-2 border-t border-stone-200/50 text-center no-print">
        <p className="text-[11px] text-stone-400 font-mono">
          Formulated in Alabaster Workspace. No telemetry logs. Standard CJS Standalone outputs compiled successfully.
        </p>
      </footer>

    </div>
  );
}


