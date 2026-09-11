import { useState } from 'react';
import { ExternalLink, Search, Sparkles, Box, Cpu } from 'lucide-react';

const tools = [
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'A premium, client-side utility tool to remove backgrounds from images with professional auto-chroma and manual brushes.',
    tags: ['Image', 'AI', 'Canvas'],
    url: 'https://removebg-swart-eight.vercel.app'
  },
  {
    id: 'base64-encoder-decoder',
    name: 'Base64 Encoder Decoder',
    description: 'An elegant, Apple-inspired utility to encode and decode text & files into Base64 format.',
    tags: ['Text', 'Encoding', 'Developer Tools'],
    url: 'https://encodeb64.vercel.app'
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'A premium, minimalist client-side text case converter featuring text transformation presets.',
    tags: ['Text', 'Formatting'],
    url: 'https://covert-case-three.vercel.app'
  },
  {
    id: 'checklist-logo-card',
    name: 'Checklist & Logo Card',
    description: 'Design branded checklist cards with a custom logo and accent color, then export as high-resolution PNGs.',
    tags: ['Design', 'Checklist'],
    url: 'https://chlogocard.vercel.app'
  },
  {
    id: 'circular-photo-cropper',
    name: 'Circular Photo Cropper',
    description: 'An elegant utility tool to upload, zoom, pan, and crop images into transparent circular PNGs.',
    tags: ['Image', 'Cropping'],
    url: 'https://circlecut.vercel.app'
  },
  {
    id: 'color-picker-from-image',
    name: 'Color Picker from Image',
    description: 'Upload images, zoom in with a magnifying loupe, and extract exact pixel colors as HEX and RGB codes.',
    tags: ['Image', 'Color', 'Design'],
    url: 'https://what-color-murex.vercel.app'
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    description: 'A clean, beautiful premium text comparison and diff checker tool.',
    tags: ['Text', 'Comparison', 'Developer Tools'],
    url: 'https://check-diff-eight.vercel.app'
  },
  {
    id: 'html-entity-encoder-decoder',
    name: 'HTML Entity Encoder & Decoder',
    description: 'An elegant, real-time glassmorphic HTML custom entity encoder and decoder.',
    tags: ['Text', 'Web', 'Developer Tools'],
    url: 'https://html-ed.vercel.app'
  },
  {
    id: 'html2pdf',
    name: 'HTML to PDF Converter',
    description: 'Write HTML and CSS with a live preview, then export the rendered page as a high-quality PDF document.',
    tags: ['PDF', 'HTML', 'Converter'],
    url: 'https://html2pdf-tan.vercel.app'
  },
  {
    id: 'image-resizer-compressor',
    name: 'Image Resizer & Compressor',
    description: 'A clean, premium Apple-style image resizer and compressor utility featuring drag-and-drop and quality controls.',
    tags: ['Image', 'Compression'],
    url: 'https://resize-img-eight.vercel.app'
  },
  {
    id: 'images-to-pdf-converter',
    name: 'Images to PDF Converter',
    description: 'Convert multiple JPG, JPEG, and PNG images into a single, high-quality PDF document completely client-side.',
    tags: ['PDF', 'Converter'],
    url: 'https://img2pdf-woad.vercel.app'
  },
  {
    id: 'json-formatter-validator',
    name: 'JSON Formatter & Validator',
    description: 'A premium aesthetic JSON formatter, validator, and interactive tree visualizer with real-time error tracking.',
    tags: ['JSON', 'Validator', 'Developer Tools'],
    url: 'https://formatte-json.vercel.app'
  },
  {
    id: 'jwt-debugger',
    name: 'JWT Debugger',
    description: 'A highly secure, client-side JWT debugger and parser with real-time color-coded breakdown.',
    tags: ['Security', 'JWT', 'Developer Tools'],
    url: 'https://debug-jwt.vercel.app'
  },
  {
    id: 'pdf-page-extractor',
    name: 'PDF Page Extractor',
    description: 'A luxury, minimalist client-side tool to extract specific pages and ranges from PDF files smoothly.',
    tags: ['PDF', 'Utility'],
    url: 'https://extract-pdf-omega.vercel.app'
  },
  {
    id: 'pdf-watermarker',
    name: 'PDF Watermarker',
    description: 'An elegant client-side PDF watermarking tool featuring customizable text, opacity, and rotation controls.',
    tags: ['PDF', 'Security'],
    url: 'https://watermark-pdf.vercel.app'
  },
  {
    id: 'qr-code-generator-scanner',
    name: 'QR Code Generator & Scanner',
    description: 'A dual-purpose utility to generate custom QR codes from text/URLs and scan them using standard camera streams.',
    tags: ['QR', 'Generator', 'Utility'],
    url: 'https://qr-gen-phi-one.vercel.app'
  },
  {
    id: 'SVG-PNG',
    name: 'SVG to PNG Converter',
    description: 'Convert scalable vector paths into lossless raster graphics using a high DPI rasterizer.',
    tags: ['Image', 'Converter', 'SVG'],
    url: 'https://pngsvg.vercel.app'
  },
  {
    id: 'txt-to-pdf-converter',
    name: 'TXT to PDF Converter',
    description: 'A premium, minimalist text-to-pdf editor with live typesetting preview and high-fidelity PDF printing.',
    tags: ['Text', 'PDF', 'Converter'],
    url: 'https://txt2pdf-sigma.vercel.app'
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'A premium, lightning-fast glassmorphic Unit Converter featuring seamless dual-column dynamic calculations.',
    tags: ['Utility', 'Calculator'],
    url: 'https://uconvert-seven.vercel.app'
  },
  {
    id: 'url-encoder-decoder',
    name: 'URL Encoder Decoder',
    description: 'A clean, glassmorphic tool to instantly encode, decode, and parse URL query parameters.',
    tags: ['URL', 'Developer Tools'],
    url: 'https://encod-url.vercel.app'
  },
  {
    id: 'word-character-counter',
    name: 'Word & Character Counter',
    description: 'An elegant, interactive real-time Word and Character Counter tool featuring reading/speaking estimates.',
    tags: ['Text', 'Counter'],
    url: 'https://word-count-nine-wine.vercel.app'
  }
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen ts-page-bg font-sans selection:bg-indigo-500/20 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Header */}
      <header className="pt-16 pb-12 px-6 sm:px-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 shadow-sm border border-white/60 mb-6 ts-btn haptic-click">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">ToolSy Workspace</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">
          Master Launcher <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-400">Hub</span>
        </h1>
        <p className="text-slate-500 max-w-2xl text-lg sm:text-xl font-medium leading-relaxed drop-shadow-sm">
          Access all 21 micro-services featuring the premium Tactile Soft UI 2.0 design system.
        </p>
      </header>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-xl border-none rounded-2xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-all"
            placeholder="Search tools by name, description, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tools Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTools.map((tool) => (
            <a 
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="h-full bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 sm:p-8 flex flex-col transition-all duration-300 transform group-hover:-translate-y-2 group-hover:bg-white/60 relative overflow-hidden haptic-click">
                
                {/* Decorative background blob */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                    <Box className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100/50 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white text-slate-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow relative z-10">
                  {tool.description}
                </p>
                
                <div className="flex flex-wrap gap-2 relative z-10 mt-auto">
                  {tool.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 rounded-full bg-white/50 border border-slate-200/60 text-[11px] font-bold text-slate-600 tracking-wider uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No tools found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search term.</p>
          </div>
        )}
      </main>

    </div>
  );
}

