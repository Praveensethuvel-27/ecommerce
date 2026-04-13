import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from './context/LanguageContext';
import App from './App';

vi.mock('./utils/api', async () => {
  const { createApiMock } = await import('./test/apiMock.js');
  return createApiMock();
});

vi.mock('./utils/realtime', () => ({
  subscribeProductsChanged: vi.fn(() => () => {}),
  subscribeOrdersNew: vi.fn(() => () => {}),
  subscribeOrdersUpdated: vi.fn(() => () => {}),
  subscribeOrderConfirmed: vi.fn(() => () => {}),
}));

vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }),
}));

vi.mock('recharts', () => {
  const passthrough = ({ children }) => <div>{children}</div>;
  return {
    ResponsiveContainer: passthrough,
    LineChart: passthrough,
    BarChart: passthrough,
    CartesianGrid: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    Line: () => <div />,
    Bar: () => <div />,
  };
});

vi.mock('./components/product/ProductGrid', () => ({ default: () => <div>ProductGrid</div> }));
vi.mock('./components/common/Carousel', () => ({ default: () => <div>Carousel</div> }));
vi.mock('./components/common/TypingText', () => ({ default: () => <span>TypingText</span> }));

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => '',
    }));
    localStorage.clear();
  });

  it('renders home route', async () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>
    );
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
  });
});
