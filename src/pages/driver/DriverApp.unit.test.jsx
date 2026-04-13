import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { extractOrderIdFromQr, StatusDialog } from './DriverApp';

describe('DriverApp helpers', () => {
  it('extractOrderIdFromQr handles raw ids and URLs', () => {
    expect(extractOrderIdFromQr('ORD-123')).toBe('ORD-123');
    expect(extractOrderIdFromQr('  ORD-XYZ  ')).toBe('ORD-XYZ');
    expect(extractOrderIdFromQr('/track-order?orderId=ORD-777')).toBe('ORD-777');
    expect(extractOrderIdFromQr('https://example.com/track-order?orderId=ORD-888')).toBe('ORD-888');
    expect(extractOrderIdFromQr('https://example.com/track-order/ORD-999')).toBe('ORD-999');
  });

  it('StatusDialog only enables allowed transitions', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <StatusDialog
        orderId="ORD-1"
        currentStatus="confirmed"
        loading={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    const ship = screen.getByRole('button', { name: /mark as shipped/i });
    const deliver = screen.getByRole('button', { name: /mark as delivered/i });
    expect(ship).not.toBeDisabled();
    expect(deliver).toBeDisabled();

    fireEvent.click(ship);
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }));
    expect(onConfirm).toHaveBeenCalledWith('shipped');
  });
});

