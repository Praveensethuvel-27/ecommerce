import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin';

describe('AdminLogin smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders admin login heading', async () => {
    render(<MemoryRouter><AdminLogin /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /admin login/i })).toBeInTheDocument());
  });
});
