import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import {
  Upload, Download, Sparkles, X, RefreshCw, Plus, Trash2,
  ListChecks, AlertCircle, Image as ImageIcon,
} from 'lucide-react';

interface ChecklistItem {
  id: number;
  label: string;
  done: boolean;
}

const ACCENT_PRESETS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];
const DEFAULT_TITLE = 'Launch Checklist';
const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 1, label: 'Design approved', done: true },
  { id: 2, label: 'Tests passing', done: false },
  { id: 3, label: 'Deploy to production', done: false },
];

export default function App() {
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [logo, setLogo] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [newItem, setNewItem] = useState<string>('');
  const [accent, setAccent] = useState<string>(ACCENT_PRESETS[0]);
  const [fileName, setFileName] = useState<string>('checklist-card');
  const [scale, setScale] = useState<number>(2);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flash = useCallback((msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogo(ev.target?.result as string);
      setError(null);
      flash('Logo uploaded.');
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setItems([...items, { id: Date.now(), label, done: false }]);
    setNewItem('');
  };

  const removeItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleItem = (id: number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const exportPng = async () => {
    const node = document.getElementById('checklist-card');
    if (!node) { setError('Preview card not found.'); return; }
    setIsExporting(true); setError(null);
    try {
      const canvas = await html2canvas(node, { scale, backgroundColor: null, useCORS: true, logging: false });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = (fileName || 'checklist-card').replace(/[^a-z0-9_-]/gi, '_') + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      flash('PNG downloaded successfully.');
    } catch (err: any) { console.error(err); setError(err?.message || 'Export failed.'); }
    finally { setIsExporting(false); }
  };

  const handleReset = () => {
    setTitle('Launch Checklist');
    setLogo(null);
    setItems([
      { id: 1, label: 'Design approved', done: true },
      { id: 2, label: 'Tests passing', done: false },
      { id: 3, label: 'Deploy to production', done: false },
    ]);
    setAccent('#2563eb');
    setFileName('checklist-card');
    setScale(2);
    setError(null);
    flash('Restored default workspace.');
  };

  return (
    <div className="min-h-screen ts-page-bg flex items-center justify-center p-4 md:p-8 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      <div className="absolute top-6 left-6 hidden md:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono">CARD STUDIO ONLINE</span>
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-6 sm:p-10 flex flex-col gap-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-widest mb-1"><ListChecks className="w-3.5 h-3.5 text-blue-500" />Card Designer</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Checklist &amp; Logo Card</h1>
          <p className="text-sm sm:text-base font-light text-slate-500">Design branded checklist cards and export them as high-resolution PNG</p>
        </div>
        {error && (<div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}
        {success && (<div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"><Sparkles className="w-4 h-4 shrink-0" />{success}</div>)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Card Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="ts-input text-sm px-4 py-2.5 font-semibold" placeholder="Your card title" />
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Logo</label>
              {logo ? (<div className="flex items-center gap-2 flex-1 min-w-0"><img src={logo} alt="logo" className="w-10 h-10 rounded-lg object-cover border border-slate-200" /><button onClick={removeLogo} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition" title="Remove logo"><X className="w-3.5 h-3.5" /></button></div>) : (<button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"><Upload className="w-3.5 h-3.5" /> Upload</button>)}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Checklist Items</label>
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded accent-blue-600" />
                    <input type="text" value={item.label} onChange={(e) => setItems(items.map((i) => (i.id === item.id ? { ...i, label: e.target.value } : i)))} className={`ts-input text-xs px-3 py-1.5 flex-1 ${item.done ? 'line-through text-slate-400' : ''}`} />
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded-md text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder="Add new item..." className="ts-input text-xs px-3 py-2 flex-1" />
              <button onClick={addItem} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Accent</label>
              <div className="flex gap-1.5 flex-wrap">{ACCENT_PRESETS.map((col) => (<button key={col} onClick={() => setAccent(col)} className={`w-6 h-6 rounded-full border-2 transition ${accent === col ? 'border-slate-800 scale-110' : 'border-white'}`} style={{ background: col }} />))}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase">File name</label><input type="text" value={fileName} onChange={(e) => setFileName(e.target.value || 'checklist-card')} className="ts-input text-xs px-3 py-2" /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Quality: {scale.toFixed(1)}x</label><input type="range" min={1} max={3} step={0.1} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" /></div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-widest font-mono"><Sparkles className="w-3.5 h-3.5 text-slate-500" /> Live Preview</span>
            <div className="flex-1 rounded-2xl bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZGACDAwM/8G4AAzDOKAZYFwYBySADIAIAwAAoAsB06vYqgAAAABJRU5ErkJggg==')] bg-repeat border border-slate-200 flex items-center justify-center p-4">
              <div id="checklist-card" className="w-[340px] rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="px-6 py-5 flex items-center gap-3" style={{ background: accent }}>
                  {logo && <img src={logo} alt="logo" className="w-10 h-10 rounded-lg object-cover bg-white/20 p-0.5" />}
                  <h2 className="text-lg font-bold text-white truncate">{title || 'Untitled'}</h2>
                </div>
                <div className="px-6 py-4 space-y-2.5">
                  {items.length === 0 && <p className="text-xs text-slate-400 italic">No items yet.</p>}
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500' : 'border border-slate-300'}`}>
                        {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3 text-right"><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>ToolSy Card Studio</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Reset</button>
          <button onClick={exportPng} disabled={isExporting} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-2xl font-extrabold text-base shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-400">
            {isExporting ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>Rendering PNG...</span></> : <><Download className="w-5 h-5 text-indigo-300" /><span>Download as PNG</span></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
