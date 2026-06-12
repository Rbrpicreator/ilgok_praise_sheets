import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { put, list, del } from "@vercel/blob";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for analyzing sheet music
  app.post("/api/analyze-sheet", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      // the string is in format "data:image/png;base64,..." or "data:application/pdf;base64,..."
      // extract just the data and mime
      const match = imageBase64.match(/^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid file format (must be data URI base64)" });
      }
      
      const mimeType = match[1];
      const data = match[2];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data
              }
            },
            {
              text: "Analyze this sheet music (which may be an image or a PDF document). Extract the exact title (악보 제목) and the main key/chord (코드) from the sheet music. The key/chord must be strictly one of these valid musical keys: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B. Provide your best guess if it's not explicitly labeled. For the title, extract just the actual title of the song (e.g. '은혜', '마커스워십 - 그 이름'), dropping 'Sheet Music' or 'Key of'."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The title of the song"
              },
              chord: {
                type: Type.STRING,
                description: "The key or chord of the song, e.g. C, G, D. Only valid keys."
              }
            },
            required: ["title", "chord"]
          }
        }
      });

      const textOutput = response.text || "{}";
      const result = JSON.parse(textOutput);
      
      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  const MOCK_SHEETS: any[] = [];

  // GET /api/sheets -> Get all sheets from Vercel Blob
  app.get("/api/sheets", async (req, res) => {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token || token === "YOUR_Vercel_BLOB_TOKEN") {
        console.log("BLOB_READ_WRITE_TOKEN is not configured. Using in-memory storage.");
        return res.json(MOCK_SHEETS);
      }

      try {
        const { blobs } = await list({ prefix: 'sheets/' });
        const sheets = blobs.map(blob => {
          const parts = blob.pathname.replace('sheets/', '').split('_');
          const id = blob.pathname;
          const title = decodeURIComponent(parts[1] || 'Unknown').replace(/\.[^/.]+$/, "");
          const chord = decodeURIComponent(parts[2]?.split('.')[0] || 'C');
          
          return {
            id,
            title,
            chord,
            imageUrl: blob.url,
            createdAt: blob.uploadedAt.getTime()
          };
        });
        // Sort descending by created at
        sheets.sort((a, b) => b.createdAt - a.createdAt);
        
        res.json(sheets);
      } catch (blobError: any) {
        console.warn("Vercel Blob error (falling back to memory):", blobError.message);
        res.json(MOCK_SHEETS);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/upload-sheets
  app.post("/api/upload-sheets", async (req, res) => {
    try {
      const { sheets } = req.body;
      const results = [];
      
      for (const sheet of sheets) {
        const { title, chord, base64 } = sheet;
        const match = base64.match(/^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (!match) continue;
        
        const timestamp = Date.now();
        const safeTitle = encodeURIComponent(title.replace(/_/g, ' '));
        const safeChord = encodeURIComponent(chord.replace(/_/g, ' '));
        const mimeType = match[1];
        const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1];
        const filename = `sheets/${timestamp}_${safeTitle}_${safeChord}.${ext}`;

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token || token === "YOUR_Vercel_BLOB_TOKEN") {
          const mockBlob = {
            id: filename,
            title,
            chord,
            imageUrl: base64, // Fallback stores the base64 URL directly
            createdAt: timestamp
          };
          MOCK_SHEETS.unshift(mockBlob);
          results.push(mockBlob);
          continue;
        }
        
        const data = match[2];
        const buffer = Buffer.from(data, 'base64');

        try {
          const blob = await put(filename, buffer, {
            access: 'public',
          });
          
          results.push({
            id: blob.pathname,
            title,
            chord,
            imageUrl: blob.url,
            createdAt: timestamp
          });
        } catch (blobError: any) {
          console.warn("Vercel Blob error (falling back to memory):", blobError.message);
          const mockBlob = {
            id: filename,
            title,
            chord,
            imageUrl: base64, // Fallback stores the base64 URL directly
            createdAt: timestamp
          };
          MOCK_SHEETS.unshift(mockBlob);
          results.push(mockBlob);
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/sheets
  app.delete("/api/sheets", async (req, res) => {
    try {
      const { pathname } = req.body;
      if (!pathname) return res.status(400).json({ error: "Missing pathname" });
      
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token || token === "YOUR_Vercel_BLOB_TOKEN") {
        const index = MOCK_SHEETS.findIndex(s => s.id === pathname);
        if (index > -1) MOCK_SHEETS.splice(index, 1);
        return res.json({ success: true });
      }

      try {
        await del(pathname);
        res.json({ success: true });
      } catch (blobError: any) {
        console.warn("Vercel Blob error (falling back to memory):", blobError.message);
        const index = MOCK_SHEETS.findIndex(s => s.id === pathname);
        if (index > -1) MOCK_SHEETS.splice(index, 1);
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
