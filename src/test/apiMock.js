import { vi } from 'vitest';

/** Shared API mock factory for page tests */
export function createApiMock() {
  return {
    getProducts: vi.fn(async () => []),
    getProductBySlug: vi.fn(async () => {
      throw new Error('Failed to load product');
    }),
    getOrders: vi.fn(async () => ({
      orders: [],
      pagination: { total: 0, page: 1, pages: 1 },
    })),
    getOrderSummary: vi.fn(async () => ({
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    })),
    getMyOrders: vi.fn(async () => []),
    getCustomers: vi.fn(async () => []),
    getBlockedCustomers: vi.fn(async () => []),
    getProductSales: vi.fn(async () => ({
      totalQuantitySold: 0,
      totalRevenue: 0,
      byWeight: [],
      orderCount: 0,
    })),
    createOrder: vi.fn(async () => ({ id: '1', orderId: 'ORD-1' })),
    updateOrderStatus: vi.fn(async () => ({})),
    rejectOrder: vi.fn(async () => ({})),
    listDrivers: vi.fn(async () => []),
    assignDriver: vi.fn(async () => ({})),
    blockCustomer: vi.fn(async () => ({})),
    unblockCustomer: vi.fn(async () => ({})),
    adminCreateProduct: vi.fn(async () => ({})),
    adminUpdateProduct: vi.fn(async () => ({})),
    adminDeleteProduct: vi.fn(async () => ({})),
    trackOrder: vi.fn(async () => ({
      orderId: 'ORD-X',
      status: 'confirmed',
      items: [],
    })),
    login: vi.fn(),
    register: vi.fn(),
  };
}
