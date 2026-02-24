import { createApp } from './app.js';
import { createServer } from 'node:http';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeedAdmin } from './seed/ensureAdmin.js';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from './utils/jwt.js';

async function main() {
  await connectDb();
  await ensureSeedAdmin();
  const app = createApp();
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  app.set('io', io);

  // ── Socket.io: let each logged-in customer join their own room ─────────────
  // The client sends its JWT token as a socket auth handshake.
  // We decode it and place the socket in room `user:<userId>`.
  // This way the server can target notifications to specific users.
  io.on('connection', (socket) => {
    // Client sends: socket.auth = { token: '...' }  (set before socket.connect())
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const userId = decoded.sub;
        if (userId) {
          socket.join(`user:${userId}`);
        }
      } catch {
        // Invalid token — socket works as anonymous (admin events still broadcast)
      }
    }
  });

  httpServer.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});