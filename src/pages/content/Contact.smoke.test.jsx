import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';

describe('Contact smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders contact page heading', async () => {
    render(<MemoryRouter><Contact /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument());
  });
});
