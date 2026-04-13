import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDrivers from './AdminDrivers';

describe('AdminDrivers smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin drivers page', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/drivers']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="drivers" element={<AdminDrivers />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
  });
});
