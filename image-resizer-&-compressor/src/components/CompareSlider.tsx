import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CompareSliderProps {
  originalUrl: string;
  compressedUrl: string;
  aspectRatio: number;
}

export default function CompareSlider({
  originalUrl,
  compressedUrl,
  aspectRatio,
}: CompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full overflow-hidden rounded-2xl border border-slate-100/80 cursor-ew-resize select-none bg-slate-900 shadow-inner"
        style={{
          aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto',
          maxHeight: '340px',
        }}
      >
        {/* Background - Original image */}
        <img
          src={originalUrl}
          alt="Original"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none select-none bg-slate-900"
        />
        <div className="absolute top-3 left-3 px-2 py-1 bg-slate-950/70 backdrop-blur-md rounded-md text-[10px] font-semibold tracking-wider text-white uppercase select-none pointer-events-none shadow-sm border border-white/5">
          Original
        </div>

        {/* Foreground - Compressed image clipped by clipPath */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          <img
            src={compressedUrl}
            alt="Compressed"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain pointer-events-none bg-slate-900"
          />
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-600/85 backdrop-blur-md rounded-md text-[10px] font-semibold tracking-wider text-white uppercase select-none pointer-events-none shadow-sm border border-indigo-500/10">
          Result
        </div>

        {/* Drag line divider */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.3)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Draggable Circle Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-slate-200/80 flex items-center justify-center pointer-events-none transition-transform duration-200 group-hover:scale-110">
            <div className="flex items-center gap-0.5 text-slate-700">
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 font-medium">
        Drag slider left &amp; right to compare quality side-by-side
      </p>
    </div>
  );
}
