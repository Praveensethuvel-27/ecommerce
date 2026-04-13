import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminOrders from './AdminOrders';

describe('AdminOrders smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin orders page', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
  });
});
