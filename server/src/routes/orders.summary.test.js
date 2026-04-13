import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../utils/jwt.js', () => ({
  verifyAccessToken: vi.fn(() => ({ sub: 'admin1' })),
}));

vi.mock('../models/User.js', () => ({
  User: {
    findById: vi.fn(() => ({
      lean: vi.fn().mockResolvedValue({
        _id: 'admin1',
        email: 'admin@test.com',
        role: 'admin',
      }),
    })),
  },
}));

const aggregate = vi.fn();
vi.mock('../models/Order.js', () => ({
  Order: { aggregate },
}));

describe('GET /api/orders/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aggregate.mockResolvedValue([
      {
        totalOrders: 5,
        pendingOrders: 2,
        totalRevenue: 1500.5,
      },
    ]);
  });

  it('returns aggregated stats for admin', async () => {
    const { ordersRouter } = await import('./orders.js');
    const app = express();
    app.use(express.json());
    app.use('/api/orders', ordersRouter);

    const res = await request(app)
      .get('/api/orders/summary')
      .set('Authorization', 'Bearer fake');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalOrders: 5,
      pendingOrders: 2,
      totalRevenue: 1500.5,
    });
    expect(aggregate).toHaveBeenCalled();
  });
});
