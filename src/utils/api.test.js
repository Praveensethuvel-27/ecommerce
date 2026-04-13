import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminUpdateProduct,
  blockCustomer,
  createDriver,
  createOrder,
  getBlockedCustomers,
  getCustomers,
  getMyOrders,
  getOrders,
  getOrderSummary,
  getProductBySlug,
  getProductSales,
  getProducts,
  listDrivers,
  login,
  register,
  rejectOrder,
  unblockCustomer,
  updateOrderStatus,
  assignDriver,
} from './api';

describe('api utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('getProducts fetches /api/products', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => [{ id: 'p1' }],
    });

    const data = await getProducts();
    expect(data).toEqual([{ id: 'p1' }]);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/products', {});
  });

  it('getProductBySlug URL-encodes slug', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'p1' }),
    });

    await getProductBySlug('a b');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/products/a%20b', {});
  });

  it('login and register post JSON bodies', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ user: { id: 'u1' } }),
    });

    await login('e@example.com', 'pw');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));

    await register('Name', 'e@example.com', '999', 'pw');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }));
  });

  it('getOrders sends auth header and query params', async () => {
    localStorage.setItem('grandmascare_token', 't1');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ orders: [] }),
    });

    await getOrders({ status: 'shipped', page: 2, limit: 10 });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/orders?page=2&limit=10&status=shipped', {
      headers: { Authorization: 'Bearer t1' },
    });
  });

  it('getOrders omits status when using default all filter', async () => {
    localStorage.setItem('grandmascare_token', 't1');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ orders: [] }),
    });

    await getOrders();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/orders?page=1&limit=50', {
      headers: { Authorization: 'Bearer t1' },
    });
  });

  it('authenticated endpoints include bearer token', async () => {
    localStorage.setItem('grandmascare_token', 't1');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => '',
    });

    const fd = new FormData();
    await adminCreateProduct(fd);
    await adminUpdateProduct('p1', fd);
    await adminDeleteProduct('p1');
    await createOrder({ items: [] });
    await getMyOrders();
    await getProductSales('p1');
    await getOrderSummary();
    await updateOrderStatus('ORD-1', 'shipped');
    await rejectOrder('ORD-1', 'no stock');
    await getCustomers();
    await getBlockedCustomers();
    await blockCustomer('c1', 'perm', 'fraud');
    await unblockCustomer('c1');
    await listDrivers();
    await assignDriver('ORD-1', 'd1');
    await createDriver({ name: 'D', phone: '1' });

    // At least one representative assertion
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders/my',
      expect.objectContaining({ headers: { Authorization: 'Bearer t1' } }),
    );
  });

  it('createOrder throws a useful error message from JSON payload', async () => {
    localStorage.setItem('grandmascare_token', 't1');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Bad request' }),
    });

    await expect(createOrder({ items: [] })).rejects.toThrow('Bad request');
  });

  it('uses text responses and generic status errors for non-json responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => 'text/plain' },
      text: async () => 'Service unavailable',
    });

    await expect(getProducts()).rejects.toThrow('Request failed: 503');
  });

  it('handles empty content-type responses and missing auth token fallback', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => '' },
      text: async () => 'plain text ok',
    });

    const data = await getCustomers();
    expect(data).toBe('plain text ok');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers', {
      headers: { Authorization: 'Bearer ' },
    });
  });

  it('uses generic error for json payloads without error field', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 418,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'teapot' }),
    });

    await expect(getOrderSummary()).rejects.toThrow('Request failed: 418');
  });
});

