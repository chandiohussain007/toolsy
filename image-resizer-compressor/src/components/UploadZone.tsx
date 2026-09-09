import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (dataUrl: string, name: string, size: number, type: string) => void;
}

export default function UploadZone({ onImageSelected }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Unsupported file type. Please upload an image (PNG, JPEG, WEBP).');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageSelected(result, file.name, file.size, file.type);
      }
    };
    reader.onerror = () => {
      setError('Error reading file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <motion.div
        id="drag-drop-zone"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        className={`relative w-full aspect-video md:aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
            : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
        }`}
      >
        {/* Ambient glow backgrounds */}
        <div className="absolute inset-0 bg-radial-gradient from-indigo-50/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          id="file-input"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Upload Icon */}
          <motion.div
            animate={isDragActive ? { y: -8, scale: 1.05 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-sm transition-colors duration-300 ${
              isDragActive ? 'bg-indigo-600 text-white' : 'bg-slate-100/80 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-650'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </motion.div>

          <h3 className="text-base font-semibold text-slate-800 mb-1 leading-snug">
            Drag &amp; drop your image here
          </h3>
          <p className="text-xs text-slate-400 mb-4 font-normal">
            Supports JPEG, PNG or WEBP up to 50MB
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-medium shadow-sm transition-colors duration-200"
          >
            Choose a File
          </motion.div>
        </div>

        {/* Dynamic border highlight on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
      </motion.div>

      {/* Error display */}
      {error && (
        <motion.div
          id="upload-error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs text-red-600"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Upload Failed</span>
            {error}
          </div>
        </motion.div>
      )}

      {/* Quick demonstration items for empty state */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-[1px] flex-1 bg-slate-100" />
          <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Or choose sample image</span>
          <div className="h-[1px] flex-1 bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onImageSelected('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop', 'sample-artwork.jpg', 645120, 'image/jpeg')}
            className="flex items-center gap-2.5 p-2.5 text-left border border-slate-100 hover:border-slate-200 bg-white/50 rounded-xl transition-all duration-200 group/sample hover:shadow-xs cursor-pointer text-xs"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop"
                alt="Sample Art"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover/sample:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-700 truncate group-hover/sample:text-indigo-650">Sample Abstract Art</p>
              <p className="text-[10px] text-slate-400">JPEG · 630 KB</p>
            </div>
          </button>

          <button
            onClick={() => onImageSelected('https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop', 'sample-technology.jpg', 1258291, 'image/jpeg')}
            className="flex items-center gap-2.5 p-2.5 text-left border border-slate-100 hover:border-slate-200 bg-white/50 rounded-xl transition-all duration-200 group/sample hover:shadow-xs cursor-pointer text-xs"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=120&auto=format&fit=crop"
                alt="Sample Tech"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover/sample:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-700 truncate group-hover/sample:text-indigo-650">Sample Vibrant Mesh</p>
              <p className="text-[10px] text-slate-400">JPEG · 1.2 MB</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
