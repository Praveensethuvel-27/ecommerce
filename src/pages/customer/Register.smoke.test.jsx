import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

describe('Register smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders register page heading', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument());
  });
});
