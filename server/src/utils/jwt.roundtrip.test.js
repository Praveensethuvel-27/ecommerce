import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

describe('jwt', () => {
  it('sign and verify payload', () => {
    const secret = 'unit-test-secret';
    const token = jwt.sign({ sub: 'user1', role: 'driver' }, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.sub).toBe('user1');
    expect(decoded.role).toBe('driver');
  });
});
