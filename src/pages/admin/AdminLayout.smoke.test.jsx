import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';

describe('AdminLayout smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin layout shell', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
  });
});
