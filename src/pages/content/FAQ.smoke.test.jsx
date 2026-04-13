import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FAQ from './FAQ';

describe('FAQ smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders FAQ page heading', async () => {
    render(<MemoryRouter><FAQ /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument());
  });
});
