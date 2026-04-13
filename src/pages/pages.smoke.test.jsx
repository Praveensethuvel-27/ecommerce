import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../utils/api', async () => {
  const { createApiMock } = await import('../test/apiMock.js');
  return createApiMock();
});

vi.mock('../utils/realtime', () => ({
  subscribeProductsChanged: vi.fn(() => () => {}),
  subscribeOrdersNew: vi.fn(() => () => {}),
  subscribeOrdersUpdated: vi.fn(() => () => {}),
  subscribeOrderConfirmed: vi.fn(() => () => {}),
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (k) => k, language: 'en' }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'admin', email: 'admin@test.com', name: 'Test User', phone: '000' },
    token: 'test-token',
    login: vi.fn(async () => ({ user: { role: 'customer' } })),
    logout: vi.fn(),
    register: vi.fn(),
    adminLogin: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../context/CartContext', () => {
  const mockCartItem = {
    id: 'p1',
    slug: 'test-product',
    name: 'Test Product',
    price: 100,
    quantity: 1,
    weight: '',
    images: ['/placeholder-product.jpg'],
  };
  return {
    useCart: () => ({
      cartItems: [mockCartItem],
      items: [mockCartItem],
      subtotal: 100,
      shipping: 0,
      total: 100,
      clearCart: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
    }),
    CartProvider: ({ children }) => children,
  };
});

// Avoid real socket + localStorage side effects in admin layout smoke tests
vi.mock('../context/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    toasts: [],
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearAll: vi.fn(),
    dismissToast: vi.fn(),
    addNotification: vi.fn(),
  }),
}));

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
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

vi.mock('../components/product/ProductGrid', () => ({ default: () => <div>ProductGrid</div> }));
vi.mock('../components/common/Carousel', () => ({ default: () => <div>Carousel</div> }));
vi.mock('../components/common/TypingText', () => ({ default: () => <span>TypingText</span> }));
vi.mock('../components/product/ImageGallery', () => ({ default: () => <div>ImageGallery</div> }));
vi.mock('../components/product/QuantitySelector', () => ({ default: () => <div>QuantitySelector</div> }));
vi.mock('../components/product/ProductCard', () => ({ default: () => <div>ProductCard</div> }));
vi.mock('../components/layout/Breadcrumb', () => ({ default: () => <div>Breadcrumb</div> }));
vi.mock('../components/common/Accordion', () => ({
  Accordion: ({ items }) => (
    <div>{items?.map((i) => <div key={i.title}>{i.title}</div>)}</div>
  ),
  AccordionItem: () => <div>AccordionItem</div>,
}));

import About from './content/About';
import Contact from './content/Contact';
import FAQ from './content/FAQ';
import OrderTracking from './content/OrderTracking';

import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminCustomers from './admin/AdminCustomers';
import AdminBlockedUsers from './admin/AdminBlockedUsers';
import AdminCategories from './admin/AdminCategories';
import AdminReports from './admin/AdminReports';
import AdminSettings from './admin/AdminSettings';
import AdminLogin from './admin/AdminLogin';
import AdminNotifications from './admin/AdminNotifications';
import AdminDrivers from './admin/AdminDrivers';

import DriverLogin from './driver/DriverLogin';

import Home from './customer/Home';
import Shop from './customer/Shop';
import Category from './customer/Category';
import Product from './customer/Product';
import Cart from './customer/Cart';
import Checkout from './customer/Checkout';
import Login from './customer/Login';
import Register from './customer/Register';

import AccountLayout from './account/AccountLayout';
import AccountDashboard from './account/AccountDashboard';
import AccountOrders from './account/AccountOrders';
import AccountProfile from './account/AccountProfile';
import AccountAddresses from './account/AccountAddresses';
import AccountTracking from './account/AccountTracking';

function renderInRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe('Pages smoke tests', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
      text: async () => '',
    }));
  });

  it('Customer pages render', async () => {
    renderInRouter(<Home />);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    cleanup();

    renderInRouter(<Shop />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'common.allProducts' })).toBeInTheDocument()
    );
    cleanup();

    renderInRouter(
      <Routes>
        <Route path="/shop/:categorySlug" element={<Category />} />
      </Routes>,
      { route: '/shop/maavus' }
    );
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Skin Care' })).toBeInTheDocument());
    cleanup();

    renderInRouter(
      <Routes>
        <Route path="/product/:productSlug" element={<Product />} />
      </Routes>,
      { route: '/product/test' }
    );
    await waitFor(() =>
      expect(screen.getByText(/productNotFound|Failed to load product/i)).toBeInTheDocument()
    );
    cleanup();

    renderInRouter(<Cart />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /shopping cart/i })).toBeInTheDocument()
    );
    cleanup();

    renderInRouter(<Checkout />);
    await waitFor(() => expect(screen.getByText(/checkout/i)).toBeInTheDocument());
    cleanup();

    renderInRouter(<Login />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument());
    cleanup();

    renderInRouter(<Register />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /^register$/i })).toBeInTheDocument());
    cleanup();
  });

  it('Account pages render', async () => {
    renderInRouter(
      <Routes>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboard />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="tracking" element={<AccountTracking />} />
        </Route>
      </Routes>,
      { route: '/account' }
    );
    await waitFor(() => expect(screen.getByRole('heading', { name: /my account/i })).toBeInTheDocument());
    cleanup();
  });

  it('Content pages render', async () => {
    renderInRouter(<About />);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /our story/i })).toBeInTheDocument());
    cleanup();

    renderInRouter(<Contact />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument());
    cleanup();

    renderInRouter(<FAQ />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument()
    );
    cleanup();

    renderInRouter(<OrderTracking />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /track your order/i })).toBeInTheDocument()
    );
    cleanup();
  });

  it('Admin pages render', async () => {
    renderInRouter(<AdminLogin />);
    await waitFor(() => expect(screen.getByText(/admin/i)).toBeInTheDocument());
    cleanup();

    renderInRouter(
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="customers/blocked" element={<AdminBlockedUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Routes>,
      { route: '/admin' }
    );
    const main = await screen.findByRole('main');
    await waitFor(() => {
      expect(within(main).getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
    cleanup();
  });

  it('Driver login page renders', async () => {
    renderInRouter(<DriverLogin />);
    await waitFor(() => expect(screen.getByText(/driver/i)).toBeInTheDocument());
    cleanup();
  });
});
