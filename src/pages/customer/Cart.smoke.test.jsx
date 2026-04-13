import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';

describe('Cart smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders cart page heading', async () => {
    render(<MemoryRouter><Cart /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument());
  });
});
