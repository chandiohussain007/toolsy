import React from 'react';
import { Settings, FileText, Move, Sliders, FileType } from 'lucide-react';
import { PDFSettings, PageSize, PageOrientation, MarginSize } from '../types';

interface SettingsPanelProps {
  settings: PDFSettings;
  onChange: (settings: PDFSettings) => void;
  disabled: boolean;
}

export default function SettingsPanel({ settings, onChange, disabled }: SettingsPanelProps) {
  const updateSetting = <K extends keyof PDFSettings>(key: K, value: PDFSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const pageSizes: { label: string; value: PageSize; desc: string }[] = [
    { label: 'A4 Paper', value: 'a4', desc: 'Standard A4 (595×841 pt)' },
    { label: 'Letter', value: 'letter', desc: 'Standard Letter (612×792 pt)' },
    { label: 'Fit Image', value: 'fit', desc: 'Page matches actual photo size' },
  ];

  const orientations: { label: string; value: PageOrientation }[] = [
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
    { label: 'Auto Rotate', value: 'auto' },
  ];

  const margins: { label: string; value: MarginSize; desc: string }[] = [
    { label: 'No Margin', value: 'none', desc: '0pt' },
    { label: 'Compact', value: 'small', desc: '15pt' },
    { label: 'Spacious', value: 'large', desc: '30pt' },
  ];

  return (
    <div
      id="pdf-settings-panel"
      className={`rounded-2xl border border-slate-200/60 bg-white/40 p-6 space-y-5 transition-all duration-300 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-indigo-500 animate-spin-slow" />
          <h2 className="text-sm font-bold text-slate-700 tracking-tight">PDF Document Control</h2>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Output Settings</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Document Filename */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <FileType className="w-3.5 h-3.5 text-indigo-500" /> Output Filename
          </label>
          <div className="relative">
            <input
              id="pdf-filename-input"
              type="text"
              value={settings.filename}
              onChange={(e) => updateSetting('filename', e.target.value)}
              placeholder="my-converted-document"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              .pdf
            </span>
          </div>
        </div>

        {/* Page Size Segment */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" /> Page Layout
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {pageSizes.map((size) => (
              <button
                id={`btn-page-size-${size.value}`}
                key={size.value}
                type="button"
                onClick={() => updateSetting('pageSize', size.value)}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  settings.pageSize === size.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                {size.value === 'fit' ? 'Fit Image' : size.value.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-medium text-slate-400 italic px-1">
            {pageSizes.find((s) => s.value === settings.pageSize)?.desc}
          </p>
        </div>

        {/* Orientation Segment */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-indigo-500" /> Page Orientation
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {orientations.map((orientation) => {
              const tabDisabled = settings.pageSize === 'fit';
              return (
                <button
                  id={`btn-orientation-${orientation.value}`}
                  key={orientation.value}
                  type="button"
                  disabled={tabDisabled}
                  onClick={() => updateSetting('orientation', orientation.value)}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    tabDisabled
                      ? 'opacity-30 cursor-not-allowed text-slate-400'
                      : settings.orientation === orientation.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  {orientation.label}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] font-medium text-slate-400 italic px-1">
            {settings.pageSize === 'fit'
              ? 'Automatically matches photo aspect'
              : 'Choose viewport mode'}
          </p>
        </div>

        {/* Layout margins */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Page Margins
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            {margins.map((m) => (
              <button
                id={`btn-margin-${m.value}`}
                key={m.value}
                type="button"
                onClick={() => updateSetting('margin', m.value)}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  settings.margin === m.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-medium text-slate-400 italic px-1">
            Padding: {margins.find((m) => m.value === settings.margin)?.desc} around content
          </p>
        </div>

        {/* Dynamic Image Compression Quality */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Compression Quality
            </label>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {Math.round(settings.compression * 100)}%
            </span>
          </div>
          <div className="flex items-center space-x-4 pt-1">
            <input
              id="pdf-compression-slider"
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={settings.compression}
              onChange={(e) => updateSetting('compression', parseFloat(e.target.value))}
              className="flex-1 accent-indigo-600 bg-slate-200 h-1 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <p className="text-[9px] font-medium text-slate-400 leading-normal">
            Lower quality yields smaller file sizes. 80-90% is best for clear documents.
          </p>
        </div>
      </div>
    </div>
  );
}
