import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountAddresses from './AccountAddresses';

describe('AccountAddresses smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders account addresses heading', async () => {
    render(
      <MemoryRouter initialEntries={['/account/addresses']}>
        <Routes>
          <Route path="/account" element={<AccountLayout />}>
            <Route path="addresses" element={<AccountAddresses />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /^addresses$/i })).toBeInTheDocument());
  });
});
