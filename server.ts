import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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

      // the string is in format "data:image/png;base64,..."
      // extract just the data and mime
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid image format" });
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
              text: "Analyze this sheet music image and extract the title (악보 제목) and the main key/chord (코드). The key/chord should be one of these: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B. If you can't figure it out, just do your best guess. For title, do not include things like 'Sheet Music' or 'Key of', just the actual title of the song. Try to drop sub-titles."
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
