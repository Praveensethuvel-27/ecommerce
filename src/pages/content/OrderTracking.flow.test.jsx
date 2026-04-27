import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderTracking from './OrderTracking';

import { MemoryRouter } from 'react-router-dom';

describe('OrderTracking flow', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        orderId: 'ORD-001',
        status: 'shipped',
        createdAt: new Date().toISOString(),
        total: 1000,
        paymentMethod: 'card',
        items: []
      })
    }));
  });

  it('shows status steps after tracking', async () => {
    render(
      <MemoryRouter>
        <OrderTracking />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. ORD-/i), { target: { value: 'ORD-001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    await waitFor(() => {
      expect(screen.getByText('Order Progress')).toBeInTheDocument();
    });

    const step = screen.getByText('Shipped');
    expect(step).toHaveClass('text-[#2D5A27]');
  });
});

