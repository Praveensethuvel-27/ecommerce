import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders home page heading', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
  });
});
