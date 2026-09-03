import { jsPDF } from 'jspdf';
import { ImageFile, PDFSettings } from '../types';

/**
 * Loads an image from a blob/object URL asynchronously and returns its element
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image structure'));
    img.src = url;
  });
};

/**
 * Renders an image to an offscreen canvas with white canvas backing (for PNG transparency)
 * and exports to JPEG base64 with adjustable quality compression.
 */
export const compressAndFormatImage = (
  img: HTMLImageElement,
  quality: number
): string => {
  const canvas = document.createElement('canvas');
  // Handle high resolution but cap maximum dimension if excessively large to prevent browser crash
  const MAX_DIM = 4096;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  // Draw white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw scaled image
  ctx.drawImage(img, 0, 0, width, height);

  // Output compressed JPEG
  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Main worker that generates a PDF entirely in-memory client-side
 * and saves it automatically.
 */
export const generatePDFAndSave = async (
  images: ImageFile[],
  settings: PDFSettings,
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (images.length === 0) {
    throw new Error('Please upload at least one image file');
  }

  // A4 point constants: 595.28 pt x 841.89 pt
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  // Letter point constants: 612 pt x 792 pt
  const LETTER_WIDTH = 612.0;
  const LETTER_HEIGHT = 792.0;

  let doc: jsPDF | null = null;

  for (let i = 0; i < images.length; i++) {
    const imgFile = images[i];
    if (onProgress) {
      // Scale from 0 to 95% during generation, saving is the final 5%
      onProgress(Math.round((i / images.length) * 95));
    }

    // Load HTMLImageElement
    const imgEl = await loadImage(imgFile.url);

    // Apply canvas compression
    const base64Data = compressAndFormatImage(imgEl, settings.compression);

    const origW = imgEl.naturalWidth || imgEl.width || 800;
    const origH = imgEl.naturalHeight || imgEl.height || 600;

    // Define page size and orientation parameters
    let pageWidth = A4_WIDTH;
    let pageHeight = A4_HEIGHT;

    if (settings.pageSize === 'letter') {
      pageWidth = LETTER_WIDTH;
      pageHeight = LETTER_HEIGHT;
    } else if (settings.pageSize === 'fit') {
      // In 'fit' mode, page is custom tailored to the image dimensions directly (in pts)
      pageWidth = origW * 0.75; // scale to printable point size standard
      pageHeight = origH * 0.75;
    }

    // Determine Orientation
    let isLandscape = false;
    if (settings.pageSize !== 'fit') {
      if (settings.orientation === 'landscape') {
        isLandscape = true;
      } else if (settings.orientation === 'auto') {
        isLandscape = origW > origH;
      }
    } else {
      // Fit mode naturally follows orientation of original image
      isLandscape = origW > origH;
    }

    // Apply orientation swap if page size is fixed-standard
    if (isLandscape && settings.pageSize !== 'fit') {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    // Margins logic (pt)
    let margin = 0;
    if (settings.margin === 'small') {
      margin = 15;
    } else if (settings.margin === 'large') {
      margin = 30;
    }

    // Compute render dimensions to keep aspect ratio
    const usableW = pageWidth - margin * 2;
    const usableH = pageHeight - margin * 2;

    const imgRatio = origW / origH;
    const pageRatio = usableW / usableH;

    let renderW = usableW;
    let renderH = usableH;

    if (imgRatio > pageRatio) {
      // Image is wider than page ratio -> constrained by width
      renderW = usableW;
      renderH = usableW / imgRatio;
    } else {
      // Image is taller than page ratio -> constrained by height
      renderH = usableH;
      renderW = usableH * imgRatio;
    }

    // Centered alignment inside the printable boundaries
    const renderX = margin + (usableW - renderW) / 2;
    const renderY = margin + (usableH - renderH) / 2;

    // Build/Append Page
    if (!doc) {
      // Initialize First Page
      doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: settings.pageSize === 'fit' ? [pageWidth, pageHeight] : settings.pageSize,
      });
    } else {
      // Add subsequent pages with correct format configuration
      doc.addPage(
        settings.pageSize === 'fit' ? [pageWidth, pageHeight] : settings.pageSize,
        isLandscape ? 'landscape' : 'portrait'
      );
    }

    // Add Image to current PDF page
    doc.addImage(
      base64Data,
      'JPEG',
      renderX,
      renderY,
      renderW,
      renderH,
      `img_${imgFile.id}`,
      'FAST'
    );
  }

  if (onProgress) {
    onProgress(98);
  }

  if (doc) {
    let rawFilename = settings.filename.trim();
    if (!rawFilename) {
      rawFilename = 'converted_images';
    }
    if (!rawFilename.toLowerCase().endsWith('.pdf')) {
      rawFilename += '.pdf';
    }
    doc.save(rawFilename);
  }

  if (onProgress) {
    onProgress(100);
  }
};
