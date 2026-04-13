import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Category from './Category';

describe('Category smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders category page heading', async () => {
    render(
      <MemoryRouter initialEntries={['/shop/maavus']}>
        <Routes>
          <Route path="/shop/:categorySlug" element={<Category />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
  });
});
