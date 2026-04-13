import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Shop from './Shop';

describe('Shop smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders shop page heading', async () => {
    render(<MemoryRouter><Shop /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
  });
});
