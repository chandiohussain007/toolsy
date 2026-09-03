import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  
  // Accept large payloads for image base64 transfers
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // Initialize the server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Route: Multi-modal Conversational Chat
  app.post('/api/chat', async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const { prompt, systemInstruction, temperature, topP, imageBase64, imageMime, history } = req.body;
      
      let contents: any[] = [];

      // Append chat history if present
      if (history && Array.isArray(history)) {
        contents = history.map(item => ({
          role: item.role,
          parts: [{ text: item.text }]
        }));
      }

      // Add the current prompt and image logic
      const currentParts: any[] = [];
      if (imageBase64) {
        currentParts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMime || 'image/jpeg'
          }
        });
      }
      currentParts.push({ text: prompt });

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: temperature !== undefined ? parseFloat(temperature) : undefined,
          topP: topP !== undefined ? parseFloat(topP) : undefined,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate visual chat response.' });
    }
  });

  // API Route: AI Generative Art
  app.post('/api/image-gen', async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const { prompt, aspectRatio } = req.body;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          }
        }
      });

      let imageBase64 = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!imageBase64) {
        return res.status(422).json({ error: 'No image parts were returned by the generative model.' });
      }

      res.json({ imageUrl: `data:image/png;base64,${imageBase64}` });
    } catch (error: any) {
      console.error('Error in /api/image-gen:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate design mockup.' });
    }
  });

  // API Route: Text to Speech synthesis
  app.post('/api/text-to-speech', async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const { text, voiceName } = req.body;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(422).json({ error: 'The speech engine failed to synthesize audio.' });
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error('Error in /api/text-to-speech:', error);
      res.status(500).json({ error: error?.message || 'Dynamic voice synthesis failed.' });
    }
  });

  // Client Assets Routing and Dev server integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve static frontend files in production
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gemini Creative Studio Server] Active on port ${PORT}`);
  });
}

startServer();
