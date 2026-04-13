import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountOrders from './AccountOrders';

describe('AccountOrders smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders account orders heading', async () => {
    render(
      <MemoryRouter initialEntries={['/account/orders']}>
        <Routes>
          <Route path="/account" element={<AccountLayout />}>
            <Route path="orders" element={<AccountOrders />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /order history/i })).toBeInTheDocument());
  });
});
