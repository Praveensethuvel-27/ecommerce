import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountTracking from './AccountTracking';

describe('AccountTracking smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders account tracking heading', async () => {
    render(
      <MemoryRouter initialEntries={['/account/tracking']}>
        <Routes>
          <Route path="/account" element={<AccountLayout />}>
            <Route path="tracking" element={<AccountTracking />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /delivery tracking/i })).toBeInTheDocument());
  });
});
