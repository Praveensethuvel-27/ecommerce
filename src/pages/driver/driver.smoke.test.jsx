import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../utils/api', async () => {
  const { createApiMock } = await import('../../test/apiMock.js');
  return createApiMock();
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'driver', name: 'Driver', phone: '999' },
    token: 'driver-token',
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

import DriverApp from './DriverApp';

describe('DriverApp smoke', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' },
      text: async () => '',
    }));
  });

  it('renders scan UI', async () => {
    render(
      <MemoryRouter>
        <DriverApp />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /scan order qr code/i })).toBeInTheDocument()
    );
    cleanup();
  });
});
