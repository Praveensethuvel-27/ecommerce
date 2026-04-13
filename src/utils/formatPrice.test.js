import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
  it('formats INR', () => {
    const s = formatPrice(1234.5);
    expect(s).toMatch(/₹/);
    expect(s).toMatch(/1[,.]?235/);
  });
});
