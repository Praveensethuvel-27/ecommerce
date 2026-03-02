import express from 'express';
import { createApp } from './app.js';
import { createServer } from 'node:http';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeedAdmin } from './seed/ensureAdmin.js';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import path from 'path';

async function main() {
  await connectDb();
  //await ensureSeedAdmin();

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
        // Invalid token — anonymous socket
      }
    }
  });

  // ── Serve React frontend ────────────────────────
  const distPath = path.resolve('../dist');
  app.use(express.static(distPath));

  // For SPA routing (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // ── Start server ───────────────────────────────
  const PORT = process.env.PORT || env.port || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
