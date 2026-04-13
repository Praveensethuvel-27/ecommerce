import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: ({ formatter }) => <div>{formatter ? formatter(123) : null}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
}));

const getProductsMock = vi.fn();
const getOrdersMock = vi.fn();
const getOrderSummaryMock = vi.fn();

vi.mock('../../utils/api', () => ({
  getProducts: (...args) => getProductsMock(...args),
  getOrders: (...args) => getOrdersMock(...args),
  getOrderSummary: (...args) => getOrderSummaryMock(...args),
}));

describe('AdminDashboard flow', () => {
  beforeEach(() => {
    getProductsMock.mockReset();
    getOrdersMock.mockReset();
    getOrderSummaryMock.mockReset();
  });

  it('loads data and toggles revenue range', async () => {
    const now = new Date();
    getProductsMock.mockResolvedValue([
      { id: 'p1', name: 'Honey', price: 100, stock: 10, rating: 4.5, reviewCount: 12, featured: true },
      { id: 'p2', name: 'Ghee', price: 250, stock: 50, rating: 4.0, reviewCount: 3, featured: false },
    ]);

    getOrdersMock.mockResolvedValue({
      orders: [
        { id: 'o1', orderId: 'ORD-1', createdAt: now.toISOString(), total: 100, status: 'confirmed' },
        { id: 'o2', orderId: 'ORD-2', createdAt: '2000-01-01T10:00:00.000Z', total: 250, status: 'shipped' },
      ],
      pagination: { total: 2, page: 1, limit: 200, pages: 1 },
    });

    getOrderSummaryMock.mockResolvedValue({ totalOrders: 2, totalRevenue: 350, pendingOrders: 1 });

    render(<AdminDashboard />);

    // Loading state first
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();

    // Resolve effects
    await screen.findByRole('heading', { name: /dashboard/i });

    // Starts at "All Time"
    expect(screen.getByText('All Time')).toBeInTheDocument();
    expect(screen.getByText('₹350')).toBeInTheDocument();

    // Switch to "Today" => should use only ORD-1 total (100)
    fireEvent.click(screen.getByRole('button', { name: /today/i }));
    expect(screen.getByText('Today')).toBeInTheDocument();
    const revenueTitle = screen.getByText(/^Revenue$/);
    const revenueCard = revenueTitle.closest('div');
    expect(revenueCard).toBeTruthy();
    expect(revenueCard.querySelector('p.text-2xl')).toHaveTextContent('₹100');
  });

  it('renders recent orders with status styles and filters month revenue', async () => {
    const now = new Date();
    getProductsMock.mockResolvedValue([{ id: 'p1', name: 'Honey', price: 100, stock: 10, rating: 4.5, reviewCount: 12, featured: true }]);

    getOrdersMock.mockResolvedValue({
      orders: [
        { id: 'o1', orderId: 'ORD-1', createdAt: now.toISOString(), total: 10, status: 'delivered', customer: 'a@a.com' },
        { id: 'o2', orderId: 'ORD-2', createdAt: now.toISOString(), total: 20, status: 'shipped', customer: 'b@b.com' },
        { id: 'o3', orderId: 'ORD-3', createdAt: now.toISOString(), total: 30, status: 'confirmed', customer: 'c@c.com' },
        { id: 'o4', orderId: 'ORD-4', createdAt: 'not-a-date', total: 40, status: 'pending', customer: 'd@d.com' },
      ],
      pagination: { total: 4, page: 1, limit: 200, pages: 1 },
    });

    getOrderSummaryMock.mockResolvedValue({ totalOrders: 4, totalRevenue: 100, pendingOrders: 2 });

    render(<AdminDashboard />);
    await screen.findByRole('heading', { name: /dashboard/i });

    // Recent orders table entries should render
    expect(screen.getByText('ORD-1')).toBeInTheDocument();
    expect(screen.getByText('delivered')).toBeInTheDocument();
    expect(screen.getByText('shipped')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();

    // Month filter uses order dates and ignores invalid dates; with only valid orders today => revenue should be 60
    fireEvent.click(screen.getByRole('button', { name: /this month/i }));
    const revenueTitle = screen.getByText(/^Revenue$/);
    const revenueCard = revenueTitle.closest('div');
    expect(revenueCard.querySelector('p.text-2xl')).toHaveTextContent('₹60');
  });

  it('shows fallback and error states', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getProductsMock.mockRejectedValue(new Error('Dashboard failed'));
    getOrdersMock.mockResolvedValue([]);
    getOrderSummaryMock.mockResolvedValue({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });

    render(<AdminDashboard />);
    await screen.findByText('Dashboard failed');

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no orders yet/i)).toHaveLength(2);
    expect(screen.getByText(/\(No orders yet\)/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ 0.0/i)).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('uses array order fallback and product weight option price', async () => {
    getProductsMock.mockResolvedValue([
      {
        id: 'p1',
        name: 'Honey',
        price: 999,
        weightOptions: [{ weight: '500g', price: 120 }],
        stock: 20,
        featured: false,
      },
    ]);
    getOrdersMock.mockResolvedValue([
      { id: 'o1', orderId: 'ORD-1', customerEmail: 'x@example.com', total: 75, status: 'pending', date: '2026-04-10T00:00:00.000Z' },
    ]);
    getOrderSummaryMock.mockResolvedValue({});

    render(<AdminDashboard />);
    await screen.findByRole('heading', { name: /dashboard/i });

    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('x@example.com')).toBeInTheDocument();
    expect(screen.getByText('₹120')).toBeInTheDocument();
    expect(screen.getAllByText('₹75')).toHaveLength(2);
  });
});

