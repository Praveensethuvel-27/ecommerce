import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

describe('Login smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders login page heading', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument());
  });
});
