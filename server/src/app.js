import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { uploadsRouter } from './routes/uploads.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { customersRouter } from './routes/customers.js';
import { driverRouter } from './routes/driver.js';
import { restockRouter } from './routes/restock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  const uploadsDir = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsDir));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/driver', driverRouter);
  app.use('/api/restock', restockRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const message = err?.message || 'Server error';
    return res.status(400).json({ error: message });
  });

  return app;
}