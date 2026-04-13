import '../pages.test.setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DriverLogin from './DriverLogin';

describe('DriverLogin smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => [], text: async () => '' }));
  });

  it('renders driver login heading', async () => {
    render(<MemoryRouter><DriverLogin /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/driver/i)).toBeInTheDocument());
  });
});
