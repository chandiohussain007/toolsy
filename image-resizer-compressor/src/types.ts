export interface ImageMetadata {
  name: string;
  size: number; // in bytes
  type: string; // e.g., 'image/jpeg', 'image/png'
  width: number;
  height: number;
  aspectRatio: number;
  dataUrl: string;
}

export interface ResizeSettings {
  width: number;
  height: number;
  lockAspectRatio: boolean;
  quality: number; // 0.1 to 1.0 (or 10 to 100 for display)
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressedImageResult {
  dataUrl: string;
  size: number; // in bytes
  width: number;
  height: number;
}
