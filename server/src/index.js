import express from 'express';
import { createApp } from './app.js';
import { createServer } from 'node:http';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';
import path from 'path';

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

  // ── Serve React frontend ────────────────────────
  // Your dist folder is at the project root: grandmascare/dist
  const distPath = path.resolve('../../dist'); // server/src -> ../../dist
  app.use(express.static(distPath));

  // SPA routing: any unknown route returns index.html
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
