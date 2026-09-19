import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. Multi-turn Gemini Chat Endpoint
// Supports: gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { 
      messages, 
      model = 'gemini-3.5-flash', 
      systemInstruction = 'You are an analytical AI copilot for Discovery OS v1.0, specializing in cross-sector knowledge discovery and 12-sector topology synthesis.' 
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Invalid messages array provided.' });
      return;
    }

    const ai = getAI();

    // Map conversation history
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      text: response.text || '',
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini model.',
    });
  }
});

// 2. Google Maps Grounding Endpoint
// Uses: gemini-3.5-flash with { googleMaps: {} } tool
app.post('/api/maps-grounding', async (req: Request, res: Response) => {
  try {
    const { prompt, lat, lng } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt string is required.' });
      return;
    }

    const ai = getAI();

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(lat),
            longitude: Number(lng),
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    
    // Extract Maps place links and review snippets
    const places: Array<{ title: string; uri: string; snippets: string[] }> = [];

    for (const chunk of groundingChunks as any[]) {
      if (chunk.maps) {
        places.push({
          title: chunk.maps.title || 'Google Maps Location',
          uri: chunk.maps.uri || '',
          snippets: chunk.maps.placeAnswerSources?.reviewSnippets?.map((s: any) => s.text) || [],
        });
      }
    }

    res.json({
      text: response.text || '',
      places,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Maps Grounding API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to query Google Maps grounding with Gemini.',
    });
  }
});

// 3. Live API WebSocket server (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live API] Client connected to WebSocket');
  let session: any = null;

  try {
    const ai = getAI();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are the Discovery OS live voice navigator. Converse naturally with the user in real-time, assisting them in cross-domain exploration of the 12 discovery sectors, topological relationships, and spatial findings. Be concise and insightful.',
      },
      callbacks: {
        onmessage: (message: any) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }

          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
          if (textPart?.text) {
            clientWs.send(JSON.stringify({ type: 'text', text: textPart.text }));
          }
        },
        onclose: () => {
          console.log('[Live API] Gemini session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('[Live API] Gemini session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err?.message || String(err) }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'ready', message: 'Connected to gemini-3.8-live session.' }));

    clientWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.text) {
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (err) {
        console.error('[Live API] Error processing client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API] Client disconnected');
      if (session) {
        try {
          session.close();
        } catch {
          // ignore
        }
      }
    });
  } catch (err: any) {
    console.error('[Live API] Session initialization failed:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ 
        type: 'error', 
        error: err?.message || 'Failed to initialize gemini-3.8-live session. Please check your GEMINI_API_KEY.' 
      }));
    }
  }
});

// Vite & Static Asset Handling
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Discovery OS server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
