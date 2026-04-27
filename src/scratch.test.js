import { describe, expect, it, vi } from 'vitest';

describe('mock new', () => {
  it('works', () => {
    const mock = vi.fn().mockImplementation(function(options) {
      return {
        open: () => console.log('open called with', options)
      };
    });
    
    globalThis.Razorpay = mock;
    
    const rzp = new globalThis.Razorpay({ a: 1 });
    rzp.open();
  });
});
