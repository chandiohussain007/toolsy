<h1 align="center">⚡ ToolSy</h1>
<p align="center">
  <strong>A collection of 19 premium, free, client-side web utility tools — all in one monorepo.</strong>
</p>
<p align="center">
  <a href="https://github.com/chandiohussain007/toolsy">
    <img src="https://img.shields.io/github/stars/chandiohussain007/toolsy?style=social" alt="Stars" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Built%20With-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel" />
</p>

---

## 🗂 What's Inside

Every tool is a standalone **Vite + React + TypeScript** app, styled with **Tailwind CSS v4** and the **Tactile Soft UI 2.0** design system. They all run 100% client-side — no backend, no data collection.

| Tool | Description |
|------|-------------|
| [🖼️ Background Remover](./background-remover) | Remove image backgrounds with auto-chroma & manual brushes |
| [🔠 Base64 Encoder/Decoder](./base64-encoder-decoder) | Encode & decode text and files to/from Base64 |
| [🔤 Case Converter](./case-converter) | Transform text between 10+ cases instantly |
| [⭕ Circular Photo Cropper](./circular-photo-cropper) | Crop images into transparent circular PNGs |
| [🎨 Color Picker from Image](./color-picker-from-image) | Extract exact pixel colors from any image |
| [📄 Diff Checker](./diff-checker) | Compare two texts with line/word/char highlighting |
| [🔢 HTML Entity Encoder & Decoder](./html-entity-encoder-&-decoder) | Encode & decode HTML entities |
| [📐 Image Resizer & Compressor](./image-resizer-&-compressor) | Resize, compress, and export images |
| [🗂️ Images to PDF Converter](./images-to-pdf-converter) | Combine multiple images into a single PDF |
| [📋 JSON Formatter & Validator](./json-formatter-&-validator) | Format, validate, and explore JSON interactively |
| [🔑 JWT Debugger](./jwt-debugger) | Decode and inspect JSON Web Tokens |
| [📤 PDF Page Extractor](./pdf-page-extractor) | Extract specific pages from PDF files |
| [💧 PDF Watermarker](./pdf-watermarker) | Add custom text watermarks to PDFs |
| [📱 QR Code Generator & Scanner](./qr-code-generator-&-scanner) | Generate & scan QR codes |
| [🔷 SVG to PNG Converter](./SVG-PNG\)) | Convert SVG vectors to high-res PNG raster |
| [📝 TXT to PDF Converter](./txt-to-pdf-converter) | Convert plain text to beautifully typeset PDFs |
| [📏 Unit Converter](./unit-converter) | Convert between length, weight, temp, and more |
| [🔗 URL Encoder/Decoder](./url-encoder-decoder) | Encode, decode, and parse URL strings |
| [✍️ Word & Character Counter](./word-&-character-counter) | Count words, chars, readability, and more |

---

## 🎨 Design System

All tools share the **Tactile Soft UI 2.0** design language:
- Soft neomorphic shadows for a physical, tactile feel
- Haptic-click micro-animations on interactive elements
- Glassmorphism cards with `backdrop-blur`
- Smooth gradient backgrounds
- Built with **Tailwind CSS v4**

---

## 🚀 Running Any Tool Locally

```bash
# Clone the repo
git clone https://github.com/chandiohussain007/toolsy.git
cd toolsy

# Enter any tool folder
cd background-remover

# Install and run
npm install
npm run dev
```

---

## ☁️ Deploying Individual Tools to Vercel

Each tool folder is a self-contained Vite app with a `vercel.json` for SPA routing. To deploy any tool:

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import this repository
3. Set **Root Directory** to the tool folder (e.g. `background-remover`)
4. Vercel auto-detects Vite — click **Deploy**

---

## 🏠 Hub Launcher Dashboard

The [`hub-launcher`](./hub-launcher) folder contains a central dashboard linking to all deployed tools. Deploy it the same way — set Root Directory to `hub-launcher`.

---

## 📄 License

MIT © [ToolSy](https://github.com/chandiohussain007/toolsy) — Free to use, fork, and build upon.
