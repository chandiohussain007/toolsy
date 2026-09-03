import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { ImageFile } from '../types';

interface DropZoneProps {
  onImagesAdded: (images: ImageFile[]) => void;
  isLoading: boolean;
}

export default function DropZone({ onImagesAdded, isLoading }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList) => {
    if (isLoading) return;
    const addedFiles: ImageFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Accept typical web images
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        continue;
      }

      const url = URL.createObjectURL(file);

      // Perform a clean async dimensions query
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        };
        img.onerror = () => {
          resolve({ width: 0, height: 0 });
        };
        img.src = url;
      });

      addedFiles.push({
        id: Math.random().toString(36).substring(2, 11) + '-' + Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    if (addedFiles.length > 0) {
      onImagesAdded(addedFiles);
    }
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      // Reset input value to allow re-uploading same image if deleted
      e.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      id="drag-and-drop-zone"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={triggerFileInput}
      className={`relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ease-out ${
        isDragActive
          ? 'border-indigo-400 bg-indigo-100/50 scale-[1.01] shadow-lg shadow-indigo-150'
          : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300 hover:bg-indigo-50/40'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        id="image-file-input"
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Decorative Brand Blur Backdrops inside Dropzone */}
      <div className="absolute -inset-10 bg-indigo-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center space-y-3">
        {/* Animated Icon Circle */}
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shadow-indigo-100/80 text-indigo-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-700 tracking-tight leading-none group-hover:text-indigo-600 transition-colors duration-300">
            Click or drag images to upload
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Supports JPG, JPEG, PNG, WEBP (Max 20MB)
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center justify-center pt-1">
          <span className="text-[9px] font-bold tracking-wider uppercase rounded-md px-2 py-0.5 bg-indigo-50 border border-indigo-100/55 text-indigo-600">
            PNG
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase rounded-md px-2 py-0.5 bg-indigo-50 border border-indigo-100/55 text-indigo-600">
            JPEG
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase rounded-md px-2 py-0.5 bg-indigo-50 border border-indigo-100/55 text-indigo-600">
            WEBP
          </span>
        </div>
      </div>
    </div>
  );
}
