import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../utils/jwt.js', () => ({
  verifyAccessToken: vi.fn(() => ({ sub: 'driver1', role: 'driver' })),
}));

vi.mock('../models/Driver.js', () => ({
  Driver: {
    findById: vi.fn(() => ({
      lean: vi.fn().mockResolvedValue({
        _id: 'driver1',
        active: true,
        name: 'D1',
        phone: '999',
      }),
    })),
  },
}));

const findOne = vi.fn();
vi.mock('../models/Order.js', () => ({
  Order: { findOne },
}));

describe('PATCH /api/driver/status/:orderId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks confirmed order as shipped', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    findOne.mockResolvedValue({
      status: 'confirmed',
      orderId: 'ORD-X',
      userId: 'u1',
      customerEmail: 'c@test.com',
      total: 100,
      address: { name: 'N', phone: '1', address1: 'a', city: 'c', pincode: '625020' },
      save,
    });

    const { driverRouter } = await import('./driver.js');
    const app = express();
    app.set('io', null);
    app.use(express.json());
    app.use('/api/driver', driverRouter);

    const res = await request(app)
      .patch('/api/driver/status/ORD-X')
      .set('Authorization', 'Bearer t')
      .send({ status: 'shipped' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe('shipped');
    expect(save).toHaveBeenCalled();
  });

  it('marks shipped order as delivered', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    findOne.mockResolvedValue({
      status: 'shipped',
      orderId: 'ORD-X',
      userId: 'u1',
      customerEmail: 'c@test.com',
      total: 100,
      address: {},
      save,
    });

    const { driverRouter } = await import('./driver.js');
    const app = express();
    app.set('io', null);
    app.use(express.json());
    app.use('/api/driver', driverRouter);

    const res = await request(app)
      .patch('/api/driver/status/ORD-X')
      .set('Authorization', 'Bearer t')
      .send({ status: 'delivered' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });
});
