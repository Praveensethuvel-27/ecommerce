import React from 'react';
import { vi } from 'vitest';

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
    user: { role: 'driver', email: 'driver@test.com', name: 'Driver User', phone: '99999' },
    token: 'test-token',
    login: vi.fn(async () => ({ user: { role: 'customer' } })),
    logout: vi.fn(),
    register: vi.fn(),
    adminLogin: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    cartItems: [
      {
        id: 'p1',
        slug: 'test-product',
        name: 'Test Product',
        price: 100,
        quantity: 1,
        weight: '',
        images: ['/placeholder-product.jpg'],
      },
    ],
    items: [],
    subtotal: 100,
    shipping: 0,
    total: 100,
    clearCart: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
  }),
  CartProvider: ({ children }) => children,
}));

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

vi.mock('../components/product/ProductGrid', () => ({ default: () => <div>ProductGrid</div> }));
vi.mock('../components/common/Carousel', () => ({ default: () => <div>Carousel</div> }));
vi.mock('../components/common/TypingText', () => ({ default: () => <span>TypingText</span> }));
vi.mock('../components/product/ImageGallery', () => ({ default: () => <div>ImageGallery</div> }));
vi.mock('../components/product/QuantitySelector', () => ({ default: () => <div>QuantitySelector</div> }));
vi.mock('../components/product/ProductCard', () => ({ default: () => <div>ProductCard</div> }));
vi.mock('../components/layout/Breadcrumb', () => ({ default: () => <div>Breadcrumb</div> }));
vi.mock('../components/common/Accordion', () => ({
  Accordion: ({ items }) => <div>{items?.map((i) => <div key={i.title}>{i.title}</div>)}</div>,
  AccordionItem: () => <div>AccordionItem</div>,
}));
