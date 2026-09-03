import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Brush, 
  RotateCcw, 
  Upload, 
  Download, 
  Eye, 
  Paintbrush, 
  Check, 
  X, 
  SlidersHorizontal, 
  Sliders, 
  Layers, 
  Pipette, 
  HelpCircle,
  Undo,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset sample images to test the background remover instantly
interface SampleImage {
  id: string;
  name: string;
  url: string;
  type: 'product' | 'portrait' | 'object';
  description: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'product',
    name: 'Red Running Shoe',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    type: 'product',
    description: 'Clean red studio shot, perfect for auto-chroma'
  },
  {
    id: 'portrait',
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    type: 'portrait',
    description: 'Vibrant backdrop portrait, great for feathering'
  },
  {
    id: 'object',
    name: 'Monstera Plant',
    url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=800',
    type: 'object',
    description: 'Green plant on background, ideal for eye-dropper'
  }
];

// Presets for gorgeous background replacements
interface BackgroundPreset {
  id: string;
  name: string;
  value: string; // solid hex or gradient css
  type: 'solid' | 'gradient';
}

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'white', name: 'Studio White', value: '#FFFFFF', type: 'solid' },
  { id: 'dark', name: 'Anthracite Dark', value: '#1A1A1A', type: 'solid' },
  { id: 'pink-rose', name: 'Sunset Rose', value: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', type: 'gradient' },
  { id: 'cosmic', name: 'Cosmic Sky', value: 'linear-gradient(135deg, #30CFD0 0%, #330867 100%)', type: 'gradient' },
  { id: 'mint', name: 'Fresh Mint', value: 'linear-gradient(135deg, #81FBB8 0%, #28C76F 100%)', type: 'gradient' },
  { id: 'violet', name: 'Neon Violet', value: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', type: 'gradient' },
  { id: 'gold', name: 'Warm Amber', value: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', type: 'gradient' }
];

function generateSyntheticImage(type: 'product' | 'portrait' | 'object'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'product') {
    // Backdrop: Vivid solid yellow backdrop (Hex #FFC635)
    ctx.fillStyle = '#FFC635';
    ctx.fillRect(0, 0, 600, 600);

    // Draw some subtle studio background lighting glow
    const radial = ctx.createRadialGradient(300, 300, 50, 300, 300, 300);
    radial.addColorStop(0, '#FFE895');
    radial.addColorStop(1, '#FFC635');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 600, 600);

    // Draw a premium looking bottle with shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(300, 480, 80, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottle body (Rounded rect)
    ctx.fillStyle = '#1D3557'; // Premium Dark Royal Blue
    ctx.beginPath();
    ctx.roundRect(220, 200, 160, 260, [15, 15, 25, 25]);
    ctx.fill();

    // Bottle glass reflection highlight
    const glassGrad = ctx.createLinearGradient(220, 0, 380, 0);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    glassGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.3)');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.roundRect(220, 200, 160, 260, [15, 15, 25, 25]);
    ctx.fill();

    // Gold Luxury Cap
    const capGrad = ctx.createLinearGradient(250, 0, 350, 0);
    capGrad.addColorStop(0, '#8A6623');
    capGrad.addColorStop(0.3, '#FFDF73');
    capGrad.addColorStop(0.5, '#FFFDD0');
    capGrad.addColorStop(0.7, '#FFDF73');
    capGrad.addColorStop(1, '#8A6623');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.roundRect(250, 130, 100, 70, [8, 8, 2, 2]);
    ctx.fill();

    // Gold stripes on cap
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    for (let x = 260; x <= 340; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 135);
      ctx.lineTo(x, 195);
      ctx.stroke();
    }

    // Label on the bottle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(240, 270, 120, 120, 4);
    ctx.fill();

    // Title label text
    ctx.fillStyle = '#1D3557';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nirvana', 300, 310);
    ctx.font = 'normal 10px sans-serif';
    ctx.fillStyle = '#457B9D';
    ctx.fillText('SERUM ELIXIR', 300, 335);

    // Natural Organic icon decoration (Gold Leaf)
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(300, 365, 10, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'portrait') {
    // Backdrop: solid pink background (Hex #F43F5E)
    ctx.fillStyle = '#F43F5E'; 
    ctx.fillRect(0, 0, 600, 600);

    // Light halo behind portrait
    const radial = ctx.createRadialGradient(300, 300, 30, 300, 300, 250);
    radial.addColorStop(0, '#FDA4AF');
    radial.addColorStop(1, '#F43F5E');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 600, 600);

    // Soft Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(300, 520, 120, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso / shoulders
    ctx.fillStyle = '#1D4ED8'; // Sharp royal blue sweater
    ctx.beginPath();
    ctx.moveTo(180, 600);
    ctx.quadraticCurveTo(200, 460, 300, 460);
    ctx.quadraticCurveTo(400, 460, 420, 600);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#FDBA74'; // Soft skin tone
    ctx.beginPath();
    ctx.rect(275, 390, 50, 80);
    ctx.fill();
    // Neck shadow under chin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.rect(275, 390, 50, 20);
    ctx.fill();

    // Head
    ctx.fillStyle = '#FED7AA'; // Skin tone
    ctx.beginPath();
    ctx.arc(300, 290, 110, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(260, 280, 12, 0, Math.PI * 2);
    ctx.arc(340, 280, 12, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(257, 277, 4, 0, Math.PI * 2);
    ctx.arc(337, 277, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cheek blush
    ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.beginPath();
    ctx.arc(245, 320, 20, 0, Math.PI * 2);
    ctx.arc(355, 320, 20, 0, Math.PI * 2);
    ctx.fill();

    // Cool stylish hair (Retro orange)
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(300, 210, 115, Math.PI, 0); // Top dome hair cap
    ctx.fill();
    
    // Hair bangs sideburns
    ctx.beginPath();
    ctx.moveTo(185, 210);
    ctx.quadraticCurveTo(210, 290, 210, 310);
    ctx.lineTo(230, 210);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(415, 210);
    ctx.quadraticCurveTo(390, 290, 390, 310);
    ctx.lineTo(370, 210);
    ctx.closePath();
    ctx.fill();

    // Cute Smile
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(300, 340, 20, 0, Math.PI);
    ctx.stroke();

    // Cool transparent round glasses
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(260, 280, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(340, 280, 28, 0, Math.PI * 2);
    ctx.stroke();
    // Bridge of glasses
    ctx.beginPath();
    ctx.moveTo(288, 280);
    ctx.lineTo(312, 280);
    ctx.stroke();

  } else {
    // Backdrop: Vivid solid emerald (Hex #10B981)
    ctx.fillStyle = '#10B981'; 
    ctx.fillRect(0, 0, 600, 600);

    // Backlight halo
    const radial = ctx.createRadialGradient(300, 300, 50, 300, 300, 280);
    radial.addColorStop(0, '#6EE7B7');
    radial.addColorStop(1, '#10B981');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 600, 600);

    // Leaves / Object Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(300, 490, 110, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flower pot bottom
    ctx.fillStyle = '#78350F'; // Teracotta orange
    ctx.beginPath();
    ctx.moveTo(240, 480);
    ctx.lineTo(360, 480);
    ctx.lineTo(340, 380);
    ctx.lineTo(260, 380);
    ctx.closePath();
    ctx.fill();

    // Rim of flower pot
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.roundRect(240, 365, 120, 20, 4);
    ctx.fill();

    // Monstera Plant Stem curves
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    // Stem 1
    ctx.beginPath();
    ctx.moveTo(300, 380);
    ctx.quadraticCurveTo(270, 280, 220, 240);
    ctx.stroke();

    // Stem 2
    ctx.beginPath();
    ctx.moveTo(300, 380);
    ctx.quadraticCurveTo(330, 250, 380, 220);
    ctx.stroke();

    // Monstera leaves drawing (Leaf 1)
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.ellipse(200, 220, 50, 70, -Math.PI/6, 0, Math.PI*2);
    ctx.fill();
    // Leaf cutouts (classic Monstera look)
    ctx.fillStyle = '#10B981'; // Backdrop match to cut it out
    for (let offset = -40; offset <= 40; offset += 30) {
       ctx.beginPath();
       ctx.ellipse(200 + offset, 220 + offset*0.5, 8, 30, Math.PI/4, 0, Math.PI*2);
       ctx.fill();
    }

    // Leaf 2
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(400, 200, 60, 80, Math.PI/5, 0, Math.PI*2);
    ctx.fill();
    // Leaf 2 cutouts
    ctx.fillStyle = '#10B981'; // Backdrop match
    for (let offset = -40; offset <= 40; offset += 30) {
       ctx.beginPath();
       ctx.ellipse(400 + offset*1.2, 200 - offset*0.3, 10, 35, -Math.PI/4, 0, Math.PI*2);
       ctx.fill();
    }
  }

  return canvas.toDataURL('image/png');
}

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'editing'>('idle');
  const [originalSrc, setOriginalSrc] = useState<string>('');
  const [processedSrc, setProcessedSrc] = useState<string>('');
  const [fileName, setFileName] = useState<string>('image_transparent');
  const [activeTab, setActiveTab] = useState<'workspace' | 'compare'>('workspace');
  
  // Chromakey options
  const [tolerance, setTolerance] = useState<number>(35);
  const [feather, setFeather] = useState<number>(12);
  const [keyColor, setKeyColor] = useState<{ r: number, g: number, b: number }>({ r: 255, g: 255, b: 255 });
  const [autoDetectedColor, setAutoDetectedColor] = useState<string | null>(null);

  // Brush controls
  const [brushMode, setBrushMode] = useState<'none' | 'erase' | 'restore'>('none');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Interactive picker state
  const [isEyeDropperActive, setIsEyeDropperActive] = useState<boolean>(false);
  const [hoveredColor, setHoveredColor] = useState<{ r: number, g: number, b: number, hex: string } | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  // Custom preview backgrounds
  const [customBgType, setCustomBgType] = useState<'transparent' | 'solid' | 'gradient'>('transparent');
  const [currentBg, setCurrentBg] = useState<BackgroundPreset>(BACKGROUND_PRESETS[0]);
  const [customSolidHex, setCustomSolidHex] = useState<string>('#3B82F6');

  // Slider Compare split position
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const isDraggingSlider = useRef<boolean>(false);

  // Canvas Refs
  const workspaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Original image state for rendering
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [workspaceSize, setWorkspaceSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const lastMousePos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // Reset all states back to starting
  const resetWorkspace = () => {
    setStatus('idle');
    setOriginalSrc('');
    setProcessedSrc('');
    setFileName('image_transparent');
    setTolerance(35);
    setFeather(12);
    setKeyColor({ r: 255, g: 255, b: 255 });
    setAutoDetectedColor(null);
    setBrushMode('none');
    setIsEyeDropperActive(false);
    setCustomBgType('transparent');
    setSliderPosition(50);
    originalImageRef.current = null;
    setWorkspaceSize({ width: 0, height: 0 });
  };

  // Convert RGB back to hex helper
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHexVal = (val: number) => {
      const hex = val.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`.toUpperCase();
  };

  // Parses hexadecimal to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  // Corner pixel sampling to detect default background color
  const autoDetectBackgroundColor = (img: HTMLImageElement, origCanvas: HTMLCanvasElement) => {
    const ctx = origCanvas.getContext('2d');
    if (!ctx) return;

    const w = origCanvas.width;
    const h = origCanvas.height;
    
    // Sample a small inset from the 4 corners to avoid border crop artifacts
    const spots = [
      { x: Math.min(10, w - 1), y: Math.min(10, h - 1) },
      { x: Math.max(0, w - 11), y: Math.min(10, h - 1) },
      { x: Math.min(10, w - 1), y: Math.max(0, h - 11) },
      { x: Math.max(0, w - 11), y: Math.max(0, h - 11) }
    ];

    const colors = spots.map(spot => {
      const pixel = ctx.getImageData(spot.x, spot.y, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2] };
    });

    // Check consistency of corner colors to see if it is a solid background
    const avgColor = colors.reduce((acc, c) => ({
      r: acc.r + c.r / 4,
      g: acc.g + c.g / 4,
      b: acc.b + c.b / 4
    }), { r: 0, g: 0, b: 0 });

    const variance = colors.reduce((acc, c) => {
      const d = Math.sqrt(
        Math.pow(c.r - avgColor.r, 2) + 
        Math.pow(c.g - avgColor.g, 2) + 
        Math.pow(c.b - avgColor.b, 2)
      );
      return acc + d / 4;
    }, 0);

    // Round colors
    const finalColor = {
      r: Math.round(avgColor.r),
      g: Math.round(avgColor.g),
      b: Math.round(avgColor.b)
    };

    setKeyColor(finalColor);
    const hexRep = rgbToHex(finalColor.r, finalColor.g, finalColor.b);
    setAutoDetectedColor(hexRep);
  };

  // Set up canvases with the selected image
  const handleImageLoad = (img: HTMLImageElement) => {
    // Standard limit of maximum workspace size to ensure smooth real-time rendering loop
    const maxDimension = 650;
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    setWorkspaceSize({ width, height });

    // Initialize original offscreen canvas
    const origCanvas = document.createElement('canvas');
    origCanvas.width = width;
    origCanvas.height = height;
    const origCtx = origCanvas.getContext('2d');
    if (origCtx) {
      origCtx.drawImage(img, 0, 0, width, height);
    }
    originalCanvasRef.current = origCanvas;

    // Initialize manual brush alpha mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      // 128 is "bypass filter", means automatic chroma distance control applies.
      // 0 means forced erase / transparent.
      // 255 means forced restore / solid opaque.
      maskCtx.fillStyle = 'rgb(128, 128, 128)';
      maskCtx.fillRect(0, 0, width, height);
    }
    maskCanvasRef.current = maskCanvas;

    // Auto detect colors
    autoDetectBackgroundColor(img, origCanvas);

    setStatus('editing');
  };

  // Handles source files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name.split('.')[0] + '_removebg');
      setStatus('loading');

      const url = URL.createObjectURL(file);
      setOriginalSrc(url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        originalImageRef.current = img;
        handleImageLoad(img);
      };
      img.src = url;
    }
  };

  // Handle Drag-and-Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name.split('.')[0] + '_removebg');
      setStatus('loading');

      const url = URL.createObjectURL(file);
      setOriginalSrc(url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        originalImageRef.current = img;
        handleImageLoad(img);
      };
      img.src = url;
    }
  };

  // Load a quick sample image preset
  const handleLoadSample = (sample: SampleImage) => {
    setFileName(sample.id + '_removebg');
    setStatus('loading');
    
    // Generate an offline, high-fidelity local Base64 canvas asset
    // to bypass CORS security constraints on browser canvases entirely!
    const localDataUrl = generateSyntheticImage(sample.type);
    setOriginalSrc(localDataUrl);

    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      handleImageLoad(img);
    };
    img.src = localDataUrl;
  };

  // The core pixel filter algorithm (runs real-time on canvas context)
  const processImage = () => {
    const mainCanvas = workspaceCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!mainCanvas || !origCanvas || !maskCanvas) return;

    const ctx = mainCanvas.getContext('2d');
    const origCtx = origCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !origCtx || !maskCtx) return;

    const { width, height } = workspaceSize;
    if (width === 0 || height === 0) return;

    // Set dimensions
    mainCanvas.width = width;
    mainCanvas.height = height;

    const origImgData = origCtx.getImageData(0, 0, width, height);
    const maskImgData = maskCtx.getImageData(0, 0, width, height);
    const resultImgData = ctx.createImageData(width, height);

    const origPixels = origImgData.data;
    const maskPixels = maskImgData.data;
    const resultPixels = resultImgData.data;

    const keyR = keyColor.r;
    const keyG = keyColor.g;
    const keyB = keyColor.b;

    const totalLen = width * height * 4;

    for (let i = 0; i < totalLen; i += 4) {
      const r = origPixels[i];
      const g = origPixels[i + 1];
      const b = origPixels[i + 2];
      const origA = origPixels[i + 3];

      // Perception-weighted Euclidean color-distance algorithm
      const rDiff = r - keyR;
      const gDiff = g - keyG;
      const bDiff = b - keyB;
      const distance = Math.sqrt(rDiff * rDiff * 0.299 + gDiff * gDiff * 0.587 + bDiff * bDiff * 0.114);

      // Auto-Alpha calculation based on Tolerance and Feather metrics
      let autoAlpha = 255;
      if (feather <= 0) {
        autoAlpha = distance < tolerance ? 0 : origA;
      } else {
        if (distance < tolerance) {
          autoAlpha = 0;
        } else if (distance >= tolerance + feather) {
          autoAlpha = origA;
        } else {
          // Linear interpolation with smoothstep ease
          const ratio = (distance - tolerance) / feather;
          const smoothRatio = ratio * ratio * (3 - 2 * ratio);
          autoAlpha = Math.round(smoothRatio * origA);
        }
      }

      // Read custom brush modifier in mask R channel (0 = erase, 128 = auto, 255 = restore)
      const maskR = maskPixels[i];
      let finalA = origA;

      if (maskR === 128) {
        finalA = autoAlpha;
      } else if (maskR < 128) {
        // Blends from fully erased (0) to automatically key-out alpha (autoAlpha)
        const ratio = maskR / 128.0;
        finalA = Math.round(autoAlpha * ratio);
      } else {
        // Blends from auto key-out alpha (autoAlpha) to absolute original alpha (origA)
        const ratio = (maskR - 128) / 127.0;
        finalA = Math.round(autoAlpha + (origA - autoAlpha) * ratio);
      }

      resultPixels[i] = r;
      resultPixels[i + 1] = g;
      resultPixels[i + 2] = b;
      resultPixels[i + 3] = finalA;
    }

    ctx.putImageData(resultImgData, 0, 0);
  };

  // Re-run composition filtering on option changes
  useEffect(() => {
    if (status === 'editing') {
      processImage();
      // Keep compare src updated when modifying sliders in workspace view
      const canvas = workspaceCanvasRef.current;
      if (canvas) {
        setProcessedSrc(canvas.toDataURL('image/png'));
      }
    }
  }, [tolerance, feather, keyColor, workspaceSize, status]);

  // Clean-up user drawing states
  const stopDrawing = () => {
    setIsDrawing(false);
    // Update snapshot for compare slider once user saves changes
    const canvas = workspaceCanvasRef.current;
    if (canvas) {
      setProcessedSrc(canvas.toDataURL('image/png'));
    }
  };

  // Convert client-coords to Canvas coordinates and paint on brush mask
  const paintMask = (clientX: number, clientY: number, drawingStart = false) => {
    const canvas = workspaceCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || brushMode === 'none') return;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    // Brush styling (with visual shadow blurred edges for a beautiful seamless blend)
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    
    // Choose modifier mask color
    // 0 = Erase completely, 255 = Restore original
    const maskVal = brushMode === 'erase' ? 0 : 255;
    maskCtx.strokeStyle = `rgb(${maskVal}, ${maskVal}, ${maskVal})`;

    maskCtx.beginPath();
    if (drawingStart) {
      maskCtx.moveTo(canvasX, canvasY);
      maskCtx.lineTo(canvasX, canvasY);
    } else {
      maskCtx.moveTo(lastMousePos.current.x, lastMousePos.current.y);
      maskCtx.lineTo(canvasX, canvasY);
    }
    maskCtx.stroke();

    // Preserve cursor position
    lastMousePos.current = { x: canvasX, y: canvasY };

    // Process result
    processImage();
  };

  // Handle pointer coordinate extraction and custom eye-dropper inspect panel
  const handleCanvasPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = workspaceCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!canvas || !origCanvas) return;

    const rect = canvas.getBoundingClientRect();
    // Record visual mouse positions for magnifier layer tracking, relative to client bounds
    setMagnifierPos({ x: e.clientX, y: e.clientY });

    const scaleX = origCanvas.width / rect.width;
    const scaleY = origCanvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < origCanvas.width && y >= 0 && y < origCanvas.height) {
      const origCtx = origCanvas.getContext('2d');
      if (origCtx) {
        const pixel = origCtx.getImageData(x, y, 1, 1).data;
        const col = { r: pixel[0], g: pixel[1], b: pixel[2], hex: rgbToHex(pixel[0], pixel[1], pixel[2]) };
        setHoveredColor(col);
      }
    }

    if (isDrawing && brushMode !== 'none') {
      paintMask(e.clientX, e.clientY);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEyeDropperActive && hoveredColor) {
      // Pick target color
      setKeyColor({ r: hoveredColor.r, g: hoveredColor.g, b: hoveredColor.b });
      setIsEyeDropperActive(false);
      return;
    }

    if (brushMode !== 'none') {
      setIsDrawing(true);
      paintMask(e.clientX, e.clientY, true);
    }
  };

  // Support responsive touches on canvas
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (brushMode === 'none') return;
    e.preventDefault();
    const touch = e.touches[0];
    setIsDrawing(true);
    paintMask(touch.clientX, touch.clientY, true);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || brushMode === 'none') return;
    e.preventDefault();
    const touch = e.touches[0];
    paintMask(touch.clientX, touch.clientY);
  };

  const resetBrushMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.fillStyle = 'rgb(128, 128, 128)';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      processImage();
      
      const canvas = workspaceCanvasRef.current;
      if (canvas) {
        setProcessedSrc(canvas.toDataURL('image/png'));
      }
    }
  };

  // Custom Slider Compare events
  const handleSliderMove = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, pos)));
  };

  const handleSliderPointerDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSlider.current = true;
    window.addEventListener('mousemove', handleGlobalSliderMove);
    window.addEventListener('mouseup', handleGlobalSliderUp);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    isDraggingSlider.current = true;
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
  };

  const handleGlobalSliderMove = (e: MouseEvent) => {
    if (!isDraggingSlider.current) return;
    handleSliderMove(e.clientX);
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!isDraggingSlider.current) return;
    e.preventDefault();
    handleSliderMove(e.touches[0].clientX);
  };

  const handleGlobalSliderUp = () => {
    isDraggingSlider.current = false;
    window.removeEventListener('mousemove', handleGlobalSliderMove);
    window.removeEventListener('mouseup', handleGlobalSliderUp);
  };

  const handleGlobalTouchEnd = () => {
    isDraggingSlider.current = false;
    window.removeEventListener('touchmove', handleGlobalTouchMove);
    window.removeEventListener('touchend', handleGlobalTouchEnd);
  };

  // High-Quality image export builder.
  // Blends the high-res original canvas and matching-scaled mask canvas for perfect edge print quality
  const handleDownload = (compositeBg: boolean = false) => {
    const originalImage = originalImageRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!originalImage || !maskCanvas) return;

    // Build offscreen original full resolution canvas
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = originalImage.naturalWidth;
    downloadCanvas.height = originalImage.naturalHeight;
    const dCtx = downloadCanvas.getContext('2d');

    // Create high-res mask canvas
    const highResMaskCanvas = document.createElement('canvas');
    highResMaskCanvas.width = originalImage.naturalWidth;
    highResMaskCanvas.height = originalImage.naturalHeight;
    const hrMaskCtx = highResMaskCanvas.getContext('2d');

    if (!dCtx || !hrMaskCtx) return;

    // Draw original full size image
    dCtx.drawImage(originalImage, 0, 0);

    // Stretches / draws the soft manual brush coordinates mask nicely on the high resolution vector
    hrMaskCtx.imageSmoothingEnabled = true;
    hrMaskCtx.drawImage(maskCanvas, 0, 0, originalImage.naturalWidth, originalImage.naturalHeight);

    const origData = dCtx.getImageData(0, 0, downloadCanvas.width, downloadCanvas.height);
    const mData = hrMaskCtx.getImageData(0, 0, highResMaskCanvas.width, highResMaskCanvas.height);
    const outData = dCtx.createImageData(downloadCanvas.width, downloadCanvas.height);

    const origP = origData.data;
    const maskP = mData.data;
    const outP = outData.data;

    const keyR = keyColor.r;
    const keyG = keyColor.g;
    const keyB = keyColor.b;

    const len = downloadCanvas.width * downloadCanvas.height * 4;

    for (let i = 0; i < len; i += 4) {
      const r = origP[i];
      const g = origP[i + 1];
      const b = origP[i + 2];
      const origA = origP[i + 3];

      const rDiff = r - keyR;
      const gDiff = g - keyG;
      const bDiff = b - keyB;
      const distance = Math.sqrt(rDiff * rDiff * 0.299 + gDiff * gDiff * 0.587 + bDiff * bDiff * 0.114);

      let autoAlpha = 255;
      if (feather <= 0) {
        autoAlpha = distance < tolerance ? 0 : origA;
      } else {
        if (distance < tolerance) {
          autoAlpha = 0;
        } else if (distance >= tolerance + feather) {
          autoAlpha = origA;
        } else {
          const ratio = (distance - tolerance) / feather;
          const smoothRatio = ratio * ratio * (3 - 2 * ratio);
          autoAlpha = Math.round(smoothRatio * origA);
        }
      }

      const maskR = maskP[i];
      let finalA = origA;

      if (maskR === 128) {
        finalA = autoAlpha;
      } else if (maskR < 128) {
        const ratio = maskR / 128.0;
        finalA = Math.round(autoAlpha * ratio);
      } else {
        const ratio = (maskR - 128) / 127.0;
        finalA = Math.round(autoAlpha + (origA - autoAlpha) * ratio);
      }

      outP[i] = r;
      outP[i + 1] = g;
      outP[i + 2] = b;
      outP[i + 3] = finalA;
    }

    dCtx.putImageData(outData, 0, 0);

    // If downloading a composited Design canvas (social, product placeholder backgrounds)
    if (compositeBg && customBgType !== 'transparent') {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = downloadCanvas.width;
      exportCanvas.height = downloadCanvas.height;
      const expCtx = exportCanvas.getContext('2d');
      if (expCtx) {
        if (customBgType === 'solid') {
          expCtx.fillStyle = customBgType === 'solid' ? (currentBg.type === 'solid' ? currentBg.value : customSolidHex) : '#FFFFFF';
          expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        } else if (customBgType === 'gradient') {
          // Parse key points of background custom presets
          const gradient = expCtx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
          if (currentBg.id === 'pink-rose') {
            gradient.addColorStop(0, '#FF9A9E');
            gradient.addColorStop(1, '#FECFEF');
          } else if (currentBg.id === 'cosmic') {
            gradient.addColorStop(0, '#30CFD0');
            gradient.addColorStop(1, '#330867');
          } else if (currentBg.id === 'mint') {
            gradient.addColorStop(0, '#81FBB8');
            gradient.addColorStop(1, '#28C76F');
          } else if (currentBg.id === 'violet') {
            gradient.addColorStop(0, '#96fbc4');
            gradient.addColorStop(1, '#f9f586');
          } else if (currentBg.id === 'gold') {
            gradient.addColorStop(0, '#FAD961');
            gradient.addColorStop(1, '#F76B1C');
          } else {
            gradient.addColorStop(0, '#e5e7eb');
            gradient.addColorStop(1, '#9ca3af');
          }
          expCtx.fillStyle = gradient;
          expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        // Draw transparent cutout on top of background
        expCtx.drawImage(downloadCanvas, 0, 0);

        // Download as high-quality JPG/PNG
        const link = document.createElement('a');
        link.download = `${fileName}_design.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      }
    } else {
      // Direct high quality transparent alpha cutout download
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
    }
  };

  // Convert key color RGB to standard HEX format (for input control matching)
  const keyColorHex = rgbToHex(keyColor.r, keyColor.g, keyColor.b);

  const handleHexColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgb(e.target.value);
    setKeyColor(rgb);
  };

  // Helper calculation to visualize floating circle cursor size in screen pixels
  const getScreenBrushSize = () => {
    const canvas = workspaceCanvasRef.current;
    if (!canvas) return brushSize;
    const rect = canvas.getBoundingClientRect();
    return Math.round((brushSize * rect.width) / canvas.width);
  };

  const getCustomBgStyle = () => {
    if (customBgType === 'transparent') {
      return {};
    }
    if (customBgType === 'solid') {
      const isCustomHex = !BACKGROUND_PRESETS.some(p => p.type === 'solid' && p.value === currentBg.value);
      return { backgroundColor: isCustomHex ? customSolidHex : (currentBg.type === 'solid' ? currentBg.value : '#fff') };
    }
    if (customBgType === 'gradient') {
      return { backgroundImage: currentBg.value };
    }
    return {};
  };

  return (
    <div id="app-root" className="min-h-screen ts-page-bg flex flex-col justify-between py-10 px-4 sm:px-6 font-sans text-slate-800 selection:bg-brand-100 selection:text-brand-700 antialiased relative overflow-x-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none -z-10 animate-pulse duration-10000" />
      <div className="absolute bottom-10 right-4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 pointer-events-none -z-10" />

      {/* Main Header */}
      <header className="max-w-3xl mx-auto w-full text-center mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-full shadow-xs mb-3"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-tight text-slate-600">Client-Side Studio</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight mb-2"
        >
          Background Remover
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base font-light"
        >
          Remove backdrops instantly using automated corner-sample filtering, pixel-point adjustments, and intelligent feather borders.
        </motion.p>
      </header>

      {/* App Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl bg-white/40 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Main Dropper Zone */}
              <div
                id="dropzone"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/10'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/10'); }}
                onDrop={handleDrop}
                className="group relative border-2 border-dashed border-slate-200/80 hover:border-blue-400/80 bg-white/50 hover:bg-white/90 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 shadow-xs flex flex-col items-center justify-center min-h-[300px]"
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs mb-4 text-slate-400 group-hover:scale-110 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all duration-300 relative">
                    <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Sparkles className="w-4 h-4 text-amber-400 absolute top-2.5 right-2.5 animate-pulse" />
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-slate-800 mb-1">
                    Upload your picture
                  </h3>
                  
                  <p className="text-slate-400 text-xs sm:text-sm font-light max-w-xs mb-3">
                    Drag and drop your file here, or click to browse files
                  </p>
                  
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 font-mono text-[10px] uppercase tracking-wider rounded-md font-medium">
                    PNG, JPG, BMP, WEBP
                  </span>
                </label>
              </div>

              {/* Sample Images Section */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-[1px] bg-slate-200 flex-1" />
                  <span className="text-[11px] uppercase font-mono tracking-widest text-slate-400 font-semibold px-2">
                    Quick test backdrop presets
                  </span>
                  <div className="h-[1px] bg-slate-200 flex-1" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleLoadSample(sample)}
                      className="group flex flex-col items-center text-left bg-white/60 hover:bg-white border border-slate-100 hover:border-blue-200 rounded-xl p-2 transition-all duration-300 shadow-xs active:scale-[0.98]"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                        <img 
                          src={sample.url} 
                          alt={sample.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-all duration-300" />
                      </div>
                      
                      <span className="text-[11px] font-medium text-slate-700 leading-tight truncate w-full text-center">
                        {sample.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin mb-4" />
              <h3 className="font-display font-medium text-lg text-slate-800 mb-1">
                Analyzing photo corners...
              </h3>
              <p className="text-slate-400 text-sm font-light">
                Auto-detecting background colors and textures
              </p>
            </motion.div>
          )}

          {status === 'editing' && (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full bg-white/40 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative"
            >
              
              {/* WORKSPACE LEFT: Advanced Options & Fine Tuning Controllers */}
              <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
                
                {/* Header Back Button */}
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <button
                    onClick={resetWorkspace}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 bg-white/60 hover:bg-white border border-slate-100 rounded-lg shadow-2xs transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Start Over
                  </button>
                  
                  <span className="text-xs font-mono text-slate-400 font-light truncate max-w-[180px]">
                    {fileName}
                  </span>
                </div>

                {/* Tab Switcher: Workspace Studio vs. Split Compare */}
                <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/20">
                  <button
                    onClick={() => { setActiveTab('workspace'); setBrushMode('none'); }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                      activeTab === 'workspace' 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" /> Adjustment
                  </button>
                  <button
                    onClick={() => { setActiveTab('compare'); setBrushMode('none'); }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                      activeTab === 'compare' 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Before & After
                  </button>
                </div>

                {/* Sub Tab Panel - ADJUSTMENT Tab */}
                <AnimatePresence mode="wait">
                  {activeTab === 'workspace' && (
                    <motion.div
                      key="adj"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Section 1: Color Sampling & Chromakey Selection */}
                      <div className="bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500">
                            Backdrop Target Color
                          </label>
                          {autoDetectedColor && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-mono px-2 py-0.5 rounded-full font-medium">
                              Auto-Sample: {autoDetectedColor}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Picked Visual Solid Indicator */}
                          <div 
                            className="w-10 h-10 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center relative cursor-pointer"
                            style={{ backgroundColor: keyColorHex }}
                          >
                            <input 
                              type="color" 
                              value={keyColorHex} 
                              onChange={handleHexColorPick}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="w-4 h-4 bg-white/70 backdrop-blur-md rounded-full shadow-2xs pointer-events-none flex items-center justify-center">
                              <Paintbrush className="w-2.5 h-2.5 text-slate-600" />
                            </div>
                          </div>

                          {/* Eye Dropper / Color picker details */}
                          <div className="flex-1 flex flex-col justify-center min-w-0">
                            <span className="text-xs font-mono font-medium text-slate-800">
                              {keyColorHex}
                            </span>
                            <span className="text-[10px] text-slate-400 font-light truncate">
                              RGB({keyColor.r}, {keyColor.g}, {keyColor.b})
                            </span>
                          </div>

                          {/* Interactive Canvas Eye-Dropper */}
                          <button
                            onClick={() => setIsEyeDropperActive(!isEyeDropperActive)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
                              isEyeDropperActive 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            <Pipette className="w-3.5 h-3.5" />
                            {isEyeDropperActive ? 'Picking...' : 'Eye Dropper'}
                          </button>
                        </div>

                        {/* Interactive Eye-dropper Instructions */}
                        {isEyeDropperActive && (
                          <div className="text-[11px] bg-blue-50/50 border border-blue-100/50 text-blue-700/80 p-2 rounded-xl flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                            <span>Select anywhere on the canvas image side to lock that pixel as your background color.</span>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Fine Tuning Chroma Range Sliders */}
                      <div className="bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs flex flex-col gap-4">
                        <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                          Threshold Thresholding Range
                        </label>

                        {/* Tolerance Slider */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600">Color Tolerance</span>
                            <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">{tolerance}</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="150" 
                            value={tolerance} 
                            onChange={(e) => setTolerance(parseInt(e.target.value))}
                            className="w-full accent-blue-600 cursor-ew-resize py-1"
                          />
                          <p className="text-[10px] text-slate-400 font-light">
                            High tolerances cut colors further away from your key backdrop.
                          </p>
                        </div>

                        {/* Feathering Slider */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600">Edge Feathering</span>
                            <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">{feather}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={feather} 
                            onChange={(e) => setFeather(parseInt(e.target.value))}
                            className="w-full accent-blue-600 cursor-ew-resize py-1"
                          />
                          <p className="text-[10px] text-slate-400 font-light">
                            Smoothens jagged edges for organic blending (transparent gradients).
                          </p>
                        </div>
                      </div>

                      {/* Section 3: Fine Eraser Tool brushes */}
                      <div className="bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500">
                            Manual Clean Brushes
                          </label>
                          <button
                            onClick={resetBrushMask}
                            className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors font-medium border border-slate-100 px-1.5 py-0.5 rounded-md hover:bg-slate-50"
                          >
                            <Undo className="w-2.5 h-2.5" /> Clear Edits
                          </button>
                        </div>

                        {/* Brush Selectors */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setBrushMode('none')}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 font-medium transition-all ${
                              brushMode === 'none' 
                                ? 'bg-slate-800 border-slate-800 text-white' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            <span>No Brush</span>
                          </button>

                          <button
                            onClick={() => setBrushMode('erase')}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 font-medium transition-all ${
                              brushMode === 'erase' 
                                ? 'bg-red-50 border-red-200 text-red-600 shadow-2xs shadow-red-50/50' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                            }`}
                          >
                            <Brush className="w-4 h-4" />
                            <span>Erase</span>
                          </button>

                          <button
                            onClick={() => setBrushMode('restore')}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs gap-1 font-medium transition-all ${
                              brushMode === 'restore' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-2xs shadow-emerald-50/50' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                            }`}
                          >
                            <Paintbrush className="w-4 h-4" />
                            <span>Restore</span>
                          </button>
                        </div>

                        {/* Brushed instructions or tool options */}
                        {brushMode !== 'none' ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex flex-col gap-2 mt-1 pt-2 border-t border-slate-100"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600">Brush Radius size</span>
                              <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">{brushSize}px</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="100" 
                              value={brushSize} 
                              onChange={(e) => setBrushSize(parseInt(e.target.value))}
                              className="w-full accent-blue-600 cursor-ew-resize py-1"
                            />
                            <p className="text-[10px] text-slate-400 leading-normal font-light">
                              {brushMode === 'erase' 
                                ? "ðŸ’¡ Hint: Drag over leftovers or shadows on the image canvas side to manually scrub them transparent."
                                : "ðŸ’¡ Hint: Drag over subjects that were over-erased by tolerance ranges to draw them back in detail."
                              }
                            </p>
                          </motion.div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-light block leading-normal pt-1 border-t border-slate-100">
                            Activate an active brush overlay to selectively wipe residues out or restore missing elements details.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Sub Tab Panel - COMPARE Tab */}
                  {activeTab === 'compare' && (
                    <motion.div
                      key="cmp"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-4 bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs"
                    >
                      <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500 pb-1 border-b border-slate-100 block">
                        Comparison Slider Interface
                      </label>
                      
                      <p className="text-xs text-slate-500 leading-relaxed font-light">
                        Drag the central white divider control directly over the target preview workspace on your right. Review the cutout precision side-by-side with your original backdrop.
                      </p>

                      <div className="flex flex-col gap-2 pt-3 border-t border-indigo-50/50">
                        <span className="text-[11px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
                          Slider Controls
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSliderPosition(25)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex-1"
                          >
                            25% Split
                          </button>
                          <button
                            onClick={() => setSliderPosition(50)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex-1"
                          >
                            Set Middle
                          </button>
                          <button
                            onClick={() => setSliderPosition(75)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex-1"
                          >
                            75% Split
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section 4: Replacing Backgrounds on Live Canvas */}
                <div className="bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500 flex items-center justify-between pb-1 border-b border-slate-100">
                    <span>Compose Background Preset</span>
                    <Layers className="w-3.5 h-3.5" />
                  </label>

                  {/* Backdrop choices Toggles */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-50/80 p-0.5 rounded-lg border border-slate-100">
                    <button
                      onClick={() => setCustomBgType('transparent')}
                      className={`py-1.5 text-[11px] font-medium rounded-md transition-all ${
                        customBgType === 'transparent' 
                          ? 'bg-white text-slate-800 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Transparent
                    </button>
                    <button
                      onClick={() => { setCustomBgType('solid'); }}
                      className={`py-1.5 text-[11px] font-medium rounded-md transition-all ${
                        customBgType === 'solid' 
                          ? 'bg-white text-slate-800 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      onClick={() => { setCustomBgType('gradient'); }}
                      className={`py-1.5 text-[11px] font-medium rounded-md transition-all ${
                        customBgType === 'gradient' 
                          ? 'bg-white text-slate-800 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Gradient Cards
                    </button>
                  </div>

                  {/* Options of Solid colors */}
                  {customBgType === 'solid' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-2 pt-1"
                    >
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {BACKGROUND_PRESETS.filter(p => p.type === 'solid').map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => { setCurrentBg(bg); }}
                            className={`w-6 h-6 rounded-full border shadow-2xs relative ${
                              currentBg.id === bg.id && currentBg.value === bg.value
                                ? 'ring-2 ring-blue-500 ring-offset-1 border-none' 
                                : 'border-slate-300'
                            }`}
                            style={{ backgroundColor: bg.value }}
                            title={bg.name}
                          >
                            {currentBg.id === bg.id && currentBg.value === bg.value && (
                              <Check className="w-3.5 h-3.5 mx-auto text-slate-600 drop-shadow-xs" />
                            )}
                          </button>
                        ))}
                        
                        {/* Custom SOLID Hex Input */}
                        <div className="relative inline-flex items-center ml-1 shrink-0">
                          <input 
                            type="color" 
                            value={customSolidHex}
                            onChange={(e) => { 
                              setCustomSolidHex(e.target.value); 
                              setCurrentBg({ id: 'custom', name: 'Custom Hex', value: e.target.value, type: 'solid' });
                            }}
                            className="w-6 h-6 rounded-full border border-slate-300 cursor-pointer overflow-hidden opacity-0 absolute"
                          />
                          <div 
                            className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs flex items-center justify-center cursor-pointer hover:border-slate-400"
                            style={{ backgroundColor: customSolidHex }}
                          >
                            <span className="text-[9px] font-bold text-slate-600 leading-none">C</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Options of Gradient colors */}
                  {customBgType === 'gradient' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-1.5 pt-1"
                    >
                      {BACKGROUND_PRESETS.filter(p => p.type === 'gradient').map(bg => (
                        <button
                          key={bg.id}
                          onClick={() => { setCurrentBg(bg); }}
                          className={`w-8 h-8 rounded-lg border shadow-3xs relative shrink-0 ${
                            currentBg.id === bg.id 
                              ? 'ring-2 ring-blue-500 ring-offset-1 border-none' 
                              : 'border-slate-200'
                          }`}
                          style={{ backgroundImage: bg.value }}
                          title={bg.name}
                        >
                          {currentBg.id === bg.id && (
                            <Check className="w-4 h-4 mx-auto text-white filter drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Clean Exporters (Dual Mode Cutout vs. Solid Background) */}
                <div className="bg-white/80 border border-slate-200/30 rounded-2xl p-4 shadow-2xs flex flex-col gap-2 mt-auto">
                  <span className="text-[10px] font-semibold uppercase font-mono tracking-wider text-slate-400">
                    Export Output Options
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Exporter A: Standard cutout png */}
                    <button
                      onClick={() => handleDownload(false)}
                      className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Cutout (PNG)
                    </button>

                    {/* Exporter B: Composited style png */}
                    {customBgType !== 'transparent' && (
                      <button
                        onClick={() => handleDownload(true)}
                        className="flex-1 py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Card Design (PNG)
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* WORKSPACE RIGHT: Interactive Preview Stage & Custom Compare Splitter Elements */}
              <div className="lg:col-span-7 flex flex-col justify-center items-center order-1 lg:order-2">
                <div 
                  ref={containerRef}
                  className="w-full relative shadow-lg rounded-2xl overflow-hidden border border-slate-100 bg-checkerboard flex items-center justify-center"
                  style={{
                    maxWidth: workspaceSize.width > 0 ? `${workspaceSize.width}px` : '100%',
                    aspectRatio: workspaceSize.width && workspaceSize.height 
                      ? `${workspaceSize.width} / ${workspaceSize.height}` 
                      : 'auto'
                  }}
                >
                  
                  {/* Backdrop Preview Replacement Overlay */}
                  {customBgType !== 'transparent' && (
                    <div 
                      className="absolute inset-0 transition-all duration-300 pointer-events-none z-0"
                      style={getCustomBgStyle()}
                    />
                  )}

                  {/* TAB 1: WORKSPACE STUDIO CANVAS */}
                  <div className={`w-full h-full relative z-10 flex items-center justify-center ${activeTab === 'workspace' ? 'block' : 'hidden'}`}>
                    
                    {/* Main workspace display canvas */}
                    <canvas
                      ref={workspaceCanvasRef}
                      onMouseMove={handleCanvasPointerMove}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={handleCanvasTouchStart}
                      onTouchMove={handleCanvasTouchMove}
                      onTouchEnd={stopDrawing}
                      style={{
                        cursor: isEyeDropperActive 
                          ? 'crosshair' 
                          : brushMode !== 'none' 
                            ? 'none' // Hide native cursor in brush mode to show custom size ring
                            : 'default'
                      }}
                      className="w-full h-full object-contain select-none"
                    />

                    {/* Floating Brush Ring Cursor Indicator */}
                    {brushMode !== 'none' && !isEyeDropperActive && (
                      <div 
                        className="fixed rounded-full border shadow-xs pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${magnifierPos.x}px`,
                          top: `${magnifierPos.y}px`,
                          width: `${getScreenBrushSize()}px`,
                          height: `${getScreenBrushSize()}px`,
                          borderColor: brushMode === 'erase' ? '#ef4444' : '#10b981',
                          backgroundColor: brushMode === 'erase' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          boxShadow: '0 0 0 1px white'
                        }}
                      />
                    )}

                    {/* Floating Pixel-Inspector Eye-Dropper Mag glass magnifier */}
                    {isEyeDropperActive && hoveredColor && (
                      <div 
                        className="fixed shadow-2xl border-4 border-slate-700/60 rounded-full flex items-center justify-center pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-checkerboard overflow-hidden"
                        style={{
                          left: `${magnifierPos.x}px`,
                          top: `${magnifierPos.y}px`,
                        }}
                      >
                        {/* Enlarged color preview dot */}
                        <div 
                          className="w-6 h-6 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: hoveredColor.hex }}
                        />
                        {/* Target pixel scope lines */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-white/40" />
                          <div className="h-full w-[1px] bg-white/40" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TAB 2: BEFORE/AFTER COMPARISON DRAG COMPONENT */}
                  <div className={`w-full h-full relative select-none overflow-hidden z-10 ${activeTab === 'compare' ? 'block' : 'hidden'}`}>
                    
                    {/* Original Undercut (Before) */}
                    {originalSrc && (
                      <img 
                        src={originalSrc} 
                        alt="Original Backdrop" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Cutout Mask overlay (After) */}
                    {processedSrc && (
                      <div 
                        className="absolute inset-y-0 left-0 h-full overflow-hidden border-r border-white/60 shadow-xl"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            width: workspaceSize.width > 0 ? `${workspaceSize.width}px` : '100%',
                            aspectRatio: workspaceSize.width && workspaceSize.height 
                              ? `${workspaceSize.width} / ${workspaceSize.height}` 
                              : 'auto'
                          }}
                        >
                          {/* Apply custom background replacement to background comparisons if active */}
                          {customBgType !== 'transparent' && (
                            <div 
                              className="absolute inset-0 transition-all duration-300 pointer-events-none"
                              style={getCustomBgStyle()}
                            />
                          )}
                          <img 
                            src={processedSrc} 
                            alt="Cutout Background transparent" 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Sliders Divider line */}
                    <div 
                      className="absolute inset-y-0 z-30 w-1 bg-white cursor-ew-resize flex items-center justify-center group"
                      style={{ left: `${sliderPosition}%` }}
                      onMouseDown={handleSliderPointerDown}
                      onTouchStart={handleSliderTouchStart}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white shadow-lg flex items-center justify-center border border-slate-700/50 group-hover:scale-110 active:scale-95 transition-transform duration-200">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Small helpful view indicators */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/60 backdrop-blur-md rounded-md text-[9px] text-white font-mono uppercase font-semibold z-20 pointer-events-none tracking-widest leading-none border border-slate-800/10 shadow-xs">
                      Cutout
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/60 backdrop-blur-md rounded-md text-[9px] text-white font-mono uppercase font-semibold z-20 pointer-events-none tracking-widest leading-none border border-slate-800/10 shadow-xs">
                      Original
                    </div>
                  </div>

                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Main Footer credit */}
      <footer className="mt-8 text-center bg-transparent border-none">
        <p className="text-[11px] text-slate-400 font-light tracking-wide">
          Crafted locally using lightweight offscreen pixel loops and canvas memory optimization.
        </p>
      </footer>

    </div>
  );
}


