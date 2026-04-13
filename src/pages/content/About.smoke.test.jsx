import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';

describe('About smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders about page heading', async () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /our story/i })).toBeInTheDocument());
  });
});
