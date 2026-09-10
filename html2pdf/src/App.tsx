import { useState, useRef, useEffect } from 'react';
import {
  Code,
  ExternalLink,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion } from 'motion/react';
import './tactile-soft-ui.css';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Receipt</title>
    <style>
      body { font-family: sans-serif; margin: 0; }
      .card { padding: 32px 24px; max-width: 420px; margin: 0 auto; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
      .total { font-size: 20px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>ToolSy Coffee Co.</h1>
      <div class="row"><span>Espresso</span><span>$3.25</span></div>
      <div class="row"><span>Almond Croissant</span><span>$4.50</span></div>
      <div class="row"><span>Cappuccino</span><span>$3.75</span></div>
      <div class="row total"><span>Total</span><span>$11.50</span></div>
      <p style="font-size:12px;color:#888;margin-top:16px;">Thank you for your order!</p>
    </div>
  </body>
</html>`;

const TEMPLATE_PRESETS = [
  {
    name: 'Receipt',
    html: `<div style="padding:32px 24px;border:1px solid #ddd;border-radius:12px;max-width:420px"><h2 style="margin:0 0 16px;font-size:22px">ToolSy Receipt</h2><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee"><span>Item name</span><span>$10.00</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee"><span>Item name</span><span>$10.00</span></div><div style="display:flex;justify-content:space-between;padding:16px 0;font-size:20px;font-weight:700"><span>Total</span><span>$20.00</span></div></div>`,
  },
  {
    name: 'Invoice',
    html: `<div style="padding:40px 32px;border:1px solid #ddd;border-radius:12px;max-width:480px"><h2 style="margin:0 0 4px;font-size:24px">INVOICE</h2><p style="margin:0 0 24px;color:#666">Bill To: Your Company LLC</p><table style="width:100%;border-collapse:collapse"><tr style="border-bottom:1px solid #eee"><th align="left">Service</th><th align="right">Amount</th></tr><tr style="border-bottom:1px solid #eee"><td>Consulting</td><td align="right">$500.00</td></tr><tr style="border-bottom:1px solid #eee"><td>Design</td><td align="right">$300.00</td></tr><tr style="font-size:20px;font-weight:700"><td colspan="2" align="right">$800.00</td></tr></table></div>`,
  },
  {
    name: 'Label',
    html: `<div style="padding:20px;border:1px dashed #999;border-radius:10px;text-align:center"><div style="font-size:28px;font-weight:700">SHIPMENT</div><div style="margin:8px 0;font-size:14px">Fragile · Handle with care</div><div style="font-family:monospace;font-size:20px;letter-spacing:2px">TRACK-1Z-999-AA1023</div></div>`,
  },
];

/** Render HTML+CSS in a hidden iframe and rasterise to a PNG data-URL. */
function captureToIframe(html: string, css: string, scale: number): Promise<string> {
  const frame = document.createElement('iframe');
  frame.style.cssText =
    'position:fixed;right:-9999px;top:-9999px;width:400px;height:600px;border:none;';
  frame.sandbox = 'allow-same-origin';
  return new Promise((resolve, reject) => {
    frame.onload = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) throw new Error('No frame document.');
        doc.open();
        doc.write(
          `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="margin:0;padding:0;box-sizing:border-box">${html}</body></html>`,
        );
        doc.close();
        html2canvas(frame.contentDocument.body, { logging: false, useCORS: true, scale })
          .then((canvas) => {
            const data = canvas.toDataURL('image/png');
            frame.remove();
            resolve(data);
          })
          .catch((e) => {
            frame.remove();
            reject(e);
          });
      } catch (e) {
        frame.remove();
        reject(e);
      }
    };
    frame.onerror = () => reject(new Error('Failed to load render frame.'));
    document.body.appendChild(frame);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to rasterize HTML.'));
    img.src = src;
  });
}

export default function App() {
  const [htmlInput, setHtmlInput] = useState(DEFAULT_HTML);
  const [cssInput, setCssInput] = useState('');
  const [fileName, setFileName] = useState('document');
  const [scale, setScale] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    renderToIframe();
  }, [htmlInput, cssInput]);

  function renderToIframe() {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) {
        setError('Could not access preview frame.');
        return;
      }
      const full = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${cssInput}</style></head><body style="margin:0;padding:12px;box-sizing:border-box">${htmlInput}</body></html>`;
      doc.open();
      doc.write(full);
      doc.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to render preview.');
    }
  }

  async function handleDownload() {
    if (!htmlInput.trim()) {
      setError('Nothing to export.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      // Render the HTML/CSS in a hidden iframe, then capture with html2canvas.
      const dataUrl = await captureToIframe(htmlInput, cssInput, scale);
      const img = await loadImage(dataUrl);
      const w = img.width;
      const h = img.height;
      const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'pt', format: [w, h] });
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save(`${fileName}.pdf`);
      setSuccess('PDF downloaded successfully.');
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
            setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen ts-page-bg flex items-center justify-center p-4 md:p-8 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-6 sm:p-10 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> HTML to PDF
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Export HTML to PDF
          </h1>
          <p className="text-sm sm:text-base font-light text-slate-500">
            Edit HTML & CSS, preview live, and download a print-ready PDF.
          </p>
        </div>

        {/* Toasts */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
                {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 text-sm">
            <Sparkles className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Editor + live preview grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> HTML
              </label>
              <div className="flex gap-1.5">
                {TEMPLATE_PRESETS.map((tp) => (
                  <button
                    key={tp.name}
                    onClick={() => {
                      setHtmlInput(tp.html);
                      setCssInput('');
                      setFileName(tp.name.toLowerCase());
                      setSuccess(`Loaded ${tp.name} template.`);
                      setTimeout(() => setSuccess(null), 1500);
                    }}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-600 transition"
                  >
                    {tp.name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              className="ts-input flex-1 font-mono text-xs p-3 resize-y min-h-[160px]"
              spellCheck={false}
            />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Code className="w-3.5 h-3.5" /> CSS (optional)
            </label>
            <textarea
              value={cssInput}
              onChange={(e) => setCssInput(e.target.value)}
              placeholder="body { font-family: Georgia; } ..."
              className="ts-input font-mono text-xs p-3 resize-y min-h-[90px]"
              spellCheck={false}
            />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">File name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value || 'document')}
                  className="ts-input text-xs px-3 py-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Quality: {scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-widest font-mono">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Live Preview
            </span>
            <div className="flex-1 min-h-[180px] rounded-2xl bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZGACDAwM/8G4AAzDOKAZYFwYBySADIAIAwAAoAsB06vYqgAAAABJRU5ErkJggg==')] bg-repeat border border-slate-200 flex items-center justify-center p-3 relative group overflow-auto">
              <iframe
                ref={iframeRef}
                title="html-preview"
                className="w-full h-full border-0 bg-white rounded-xl shadow-sm"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
        {/* Export button */}
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-2xl font-extrabold text-lg shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-slate-400"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Compiling PDF…</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 text-indigo-300" />
              <span>Download as PDF</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

