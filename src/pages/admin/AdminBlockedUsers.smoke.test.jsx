import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminBlockedUsers from './AdminBlockedUsers';

describe('AdminBlockedUsers smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin blocked users page', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/customers/blocked']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="customers/blocked" element={<AdminBlockedUsers />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
  });
});
