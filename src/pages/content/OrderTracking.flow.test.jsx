import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OrderTracking from './OrderTracking';

describe('OrderTracking flow', () => {
  it('shows status steps after tracking', () => {
    render(<OrderTracking />);

    fireEvent.change(screen.getByPlaceholderText(/enter order id/i), { target: { value: 'ORD-001' } });
    fireEvent.click(screen.getByRole('button', { name: /track/i }));

    expect(screen.getByRole('heading', { name: /order status/i })).toBeInTheDocument();

    // currentStep is set to 3 ("Out for Delivery") when searched
    const step = screen.getByText('Out for Delivery');
    expect(step).toHaveClass('text-[#2D5A27]');
  });
});

