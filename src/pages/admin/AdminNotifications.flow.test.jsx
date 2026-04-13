import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminNotifications from './AdminNotifications';

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: '1',
        type: 'new_order',
        message: 'Order A',
        read: false,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'low_stock',
        message: 'Low stock B',
        read: true,
        timestamp: new Date().toISOString(),
        stock: 2,
      },
    ],
    unreadCount: 1,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

describe('AdminNotifications filters', () => {
  it('filters to unread only', () => {
    render(<AdminNotifications />);
    fireEvent.click(screen.getByRole('button', { name: /unread/i }));
    expect(screen.getByText('Order A')).toBeInTheDocument();
    expect(screen.queryByText('Low stock B')).not.toBeInTheDocument();
  });
});
