import { ArrowLeft, ArrowRight, Trash2, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageFile } from '../types';

interface ImageGridProps {
  images: ImageFile[];
  onMove: (id: string, direction: 'left' | 'right') => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function ImageGrid({ images, onMove, onRemove, onClearAll }: ImageGridProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* List Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700 tracking-tight flex items-center gap-2">
            Uploaded Images
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
              {images.length}
            </span>
          </h2>
        </div>

        <button
          id="btn-clear-all"
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 transition-all rounded-lg px-2.5 py-1"
        >
          Clear All
        </button>
      </div>

      {/* Grid wrapper with Framer Motion layout animations */}
      <div className="relative min-h-[160px] max-h-[360px] overflow-y-auto rounded-2xl bg-white/50 border border-slate-200/60 p-4 shadow-inner">
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <AnimatePresence initial={false}>
            {images.map((img, index) => {
              const isFirst = index === 0;
              const isLast = index === images.length - 1;

              return (
                <motion.div
                  id={`image-card-${img.id}`}
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 shadow-sm border border-white hover:shadow-md transition-all duration-300"
                >
                  {/* Thumbnail Image */}
                  <img
                    referrerPolicy="no-referrer"
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Dark subtle vignette for readable typography */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                  {/* Top Header Overlay: Page Badge and Delete Trigger */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                    <span className="bg-white/80 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                      {index + 1}
                    </span>

                    <button
                      id={`btn-remove-image-${img.id}`}
                      type="button"
                      onClick={() => onRemove(img.id)}
                      className="p-1 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md border border-white/20 transform active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-200"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reordering overlays: Move arrows */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-2">
                      <button
                        id={`btn-move-left-${img.id}`}
                        type="button"
                        disabled={isFirst}
                        onClick={() => onMove(img.id, 'left')}
                        className={`p-2 rounded bg-white/20 backdrop-blur-md text-white hover:bg-white/40 active:scale-90 transition-all ${
                          isFirst ? 'opacity-30 cursor-not-allowed hover:bg-white/20' : ''
                        }`}
                        title="Move backward"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-move-right-${img.id}`}
                        type="button"
                        disabled={isLast}
                        onClick={() => onMove(img.id, 'right')}
                        className={`p-2 rounded bg-white/20 backdrop-blur-md text-white hover:bg-white/40 active:scale-90 transition-all ${
                          isLast ? 'opacity-30 cursor-not-allowed hover:bg-white/20' : ''
                        }`}
                        title="Move forward"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Text Specs */}
                  <div className="absolute bottom-1.5 inset-x-1.5 text-center pointer-events-none z-10">
                    <p className="text-[10px] font-medium text-white truncate px-0.5 leading-tight">
                      {img.name}
                    </p>
                    <p className="text-[8px] font-mono font-medium text-slate-300 leading-none mt-0.5">
                      {img.width}×{img.height} • {formatFileSize(img.size)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
