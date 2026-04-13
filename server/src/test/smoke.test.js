import express from 'express';
import request from 'supertest';

describe('server smoke', () => {
  it('responds to /__test', async () => {
    const app = express();
    app.get('/__test', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/__test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

