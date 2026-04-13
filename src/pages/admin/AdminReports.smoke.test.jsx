import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminReports from './AdminReports';

describe('AdminReports smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin reports page', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
  });
});
