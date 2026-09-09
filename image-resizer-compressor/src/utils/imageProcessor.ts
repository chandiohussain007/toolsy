import { ResizeSettings, CompressedImageResult } from '../types';

/**
 * Loads an image from a Data URL
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

/**
 * Redraws and compresses an image based on settings using HTML5 Canvas client-side
 */
export function processImage(
  image: HTMLImageElement,
  settings: ResizeSettings
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context from canvas'));
      return;
    }

    // Enable high image smoothing quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // For transparent PNGs converted to JPEG, fill the canvas background with white
    if (settings.format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, settings.width, settings.height);
    }

    // Draw image with resizing
    ctx.drawImage(image, 0, 0, settings.width, settings.height);

    // Convert canvas to dynamic blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'));
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const resultDataUrl = reader.result as string;
          resolve({
            dataUrl: resultDataUrl,
            size: blob.size,
            width: settings.width,
            height: settings.height,
          });
        };
      },
      settings.format,
      settings.quality
    );
  });
}

/**
 * Helper to format bytes to readable units
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
