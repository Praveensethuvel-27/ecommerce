import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountDashboard from './AccountDashboard';

describe('AccountDashboard smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders account dashboard heading', async () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountDashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /my account/i })).toBeInTheDocument());
  });
});
