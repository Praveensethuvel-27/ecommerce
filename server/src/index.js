import express from 'express';
import { createApp } from './app.js';
import { createServer } from 'node:http';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Connect to MongoDB
  await connectDb();

  // Create Express app
  const app = createApp();
  const httpServer = createServer(app);

  // ── Socket.io setup ─────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  app.set('io', io);

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const userId = decoded.sub;
        if (userId) socket.join(`user:${userId}`);
      } catch {
        // Invalid token — socket works as anonymous
      }
    }
  });

  // ── React frontend serving ───────────────────────
  if (process.env.NODE_ENV === 'production') {
    // Production: serve React build from dist/
    const distPath = path.join(__dirname, '../../dist');
    console.log('Serving React from:', distPath);
    app.use(express.static(distPath));

    // SPA routing: all unknown routes return index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development: React runs on Vite dev server (http://localhost:5173)
    console.log('Development mode: React app runs on Vite dev server');
  }

  // ── Start server ───────────────────────────────
  const PORT = env.port || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
