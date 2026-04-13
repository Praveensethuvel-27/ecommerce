import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Product from './Product';

describe('Product smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders product page fallback content', async () => {
    render(
      <MemoryRouter initialEntries={['/product/test']}>
        <Routes>
          <Route path="/product/:productSlug" element={<Product />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/productNotFound|Failed to load product/i)).toBeInTheDocument());
  });
});
