import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountLayout from './AccountLayout';
import AccountProfile from './AccountProfile';

describe('AccountProfile smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders account profile heading', async () => {
    render(
      <MemoryRouter initialEntries={['/account/profile']}>
        <Routes>
          <Route path="/account" element={<AccountLayout />}>
            <Route path="profile" element={<AccountProfile />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument());
  });
});
