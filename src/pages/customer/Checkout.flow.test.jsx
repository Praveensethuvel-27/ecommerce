import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const useAuthMock = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const useCartMock = vi.fn();
vi.mock('../../context/CartContext', () => ({
  useCart: () => useCartMock(),
}));

const createOrderMock = vi.fn();
vi.mock('../../utils/api', () => ({
  createOrder: (...args) => createOrderMock(...args),
}));

function getInputForLabel(labelText) {
  const label = screen.getByText(labelText);
  const wrapper = label.closest('div');
  const input = wrapper?.querySelector('input');
  if (!input) throw new Error(`Could not find input for label: ${labelText}`);
  return input;
}

describe('Checkout flow', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    createOrderMock.mockReset();
  });

  it('prompts login when unauthenticated', () => {
    useAuthMock.mockReturnValue({ user: null });
    useCartMock.mockReturnValue({
      cartItems: [{ id: 'p1', name: 'Item', quantity: 1, price: 10 }],
      subtotal: 10,
      shipping: 0,
      total: 10,
      clearCart: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { from: '/checkout' } });
  });

  it('submits an order, clears cart, and navigates to orders', async () => {
    const clearCart = vi.fn();
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
    useCartMock.mockReturnValue({
      cartItems: [{ id: 'p1', name: 'Item', quantity: 2, price: 10 }],
      subtotal: 20,
      shipping: 0,
      total: 20,
      clearCart,
    });
    createOrderMock.mockResolvedValue({ orderId: 'ORD-123' });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    fireEvent.change(getInputForLabel('Full Name'), { target: { value: 'Ada' } });
    fireEvent.change(getInputForLabel('Phone'), { target: { value: '9999999999' } });
    fireEvent.change(getInputForLabel('Address Line 1'), { target: { value: '123 Street' } });
    fireEvent.change(getInputForLabel('City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputForLabel('State'), { target: { value: 'MH' } });
    fireEvent.change(getInputForLabel('Pincode'), { target: { value: '411001' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    expect(createOrderMock).toHaveBeenCalledWith({
      items: [{ productId: 'p1', weight: undefined, quantity: 2 }],
      address: expect.objectContaining({
        name: 'Ada',
        phone: '9999999999',
        address1: '123 Street',
        city: 'Pune',
        state: 'MH',
        pincode: '411001',
      }),
      paymentMethod: 'cod',
    });

    await waitFor(() => expect(clearCart).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/account/orders', {
        state: { message: 'Order placed! Order ID: ORD-123' },
      }),
    );
  });

  it('shows empty cart state and routes to shop', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
    useCartMock.mockReturnValue({
      cartItems: [],
      subtotal: 0,
      shipping: 0,
      total: 0,
      clearCart: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue shopping/i }));
    expect(navigateMock).toHaveBeenCalledWith('/shop');
  });

  it('alerts when createOrder fails', async () => {
    const clearCart = vi.fn();
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
    useCartMock.mockReturnValue({
      cartItems: [{ id: 'p1', name: 'Item', quantity: 1, price: 10 }],
      subtotal: 10,
      shipping: 0,
      total: 10,
      clearCart,
    });
    createOrderMock.mockRejectedValue(new Error('Nope'));
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    fireEvent.change(getInputForLabel('Full Name'), { target: { value: 'Ada' } });
    fireEvent.change(getInputForLabel('Phone'), { target: { value: '9999999999' } });
    fireEvent.change(getInputForLabel('Address Line 1'), { target: { value: '123 Street' } });
    fireEvent.change(getInputForLabel('City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputForLabel('State'), { target: { value: 'MH' } });
    fireEvent.change(getInputForLabel('Pincode'), { target: { value: '411001' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Nope'));
    expect(clearCart).not.toHaveBeenCalled();
  });

  it('alerts with fallback message when error has no message', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
    useCartMock.mockReturnValue({
      cartItems: [{ id: 'p1', name: 'Item', quantity: 1, price: 10 }],
      subtotal: 10,
      shipping: 0,
      total: 10,
      clearCart: vi.fn(),
    });
    createOrderMock.mockRejectedValue({});
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    fireEvent.change(getInputForLabel('Full Name'), { target: { value: 'Ada' } });
    fireEvent.change(getInputForLabel('Phone'), { target: { value: '9999999999' } });
    fireEvent.change(getInputForLabel('Address Line 1'), { target: { value: '123 Street' } });
    fireEvent.change(getInputForLabel('City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputForLabel('State'), { target: { value: 'MH' } });
    fireEvent.change(getInputForLabel('Pincode'), { target: { value: '411001' } });

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Failed to place order'));
  });

  it('supports optional address line 2, weighted items, and payment selection', async () => {
    const clearCart = vi.fn();
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'customer' } });
    useCartMock.mockReturnValue({
      cartItems: [{ id: 'p1', name: 'Item', quantity: 1, price: 10, weight: '500g' }],
      subtotal: 10,
      shipping: 25,
      total: 35,
      clearCart,
    });
    createOrderMock.mockResolvedValue({ orderId: 'ORD-456' });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>,
    );

    fireEvent.change(getInputForLabel('Full Name'), { target: { value: 'Ada' } });
    fireEvent.change(getInputForLabel('Phone'), { target: { value: '9999999999' } });
    fireEvent.change(getInputForLabel('Address Line 1'), { target: { value: '123 Street' } });
    fireEvent.change(getInputForLabel('Address Line 2'), { target: { value: 'Near Park' } });
    fireEvent.change(getInputForLabel('City'), { target: { value: 'Pune' } });
    fireEvent.change(getInputForLabel('State'), { target: { value: 'MH' } });
    fireEvent.change(getInputForLabel('Pincode'), { target: { value: '411001' } });
    fireEvent.click(screen.getByRole('radio', { name: /upi/i }));

    expect(screen.getByText('₹25')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() =>
      expect(createOrderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ productId: 'p1', weight: '500g', quantity: 1 }],
          address: expect.objectContaining({ address2: 'Near Park' }),
          paymentMethod: 'upi',
        }),
      ),
    );
  });
});

