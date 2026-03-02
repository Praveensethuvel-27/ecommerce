import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import StatsCard from '../../components/admin/StatsCard';
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { getProducts, getOrders } from '../../utils/api';

function buildMonthlyData(orders) {
  const map = {};
  for (const o of orders) {
    const d = new Date(o.date || o.createdAt);
    const key = d.toLocaleString('en-US', { month: 'short' });
    if (!map[key]) map[key] = { month: key, sales: 0, orders: 0, _ts: d };
    map[key].sales += o.total || 0;
    map[key].orders += 1;
  }
  // Sort by month order
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Object.values(map).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prods, ords] = await Promise.all([getProducts(), getOrders()]);
        setProducts(Array.isArray(prods) ? prods : []);
        setOrders(Array.isArray(ords) ? ords : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Derived stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
  const avgRating = totalProducts > 0
    ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / totalProducts).toFixed(1)
    : '0.0';

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const monthlyData = buildMonthlyData(orders);
  const thisMonthSales = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].sales : 0;

  const topProducts = [...products]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name, sales: p.reviewCount || 0 }));

  const recentOrders = orders.slice(0, 5);

  const statusColor = (status) => {
    if (status === 'delivered') return 'bg-[#E8F0E8] text-[#2D5A27]';
    if (status === 'shipped') return 'bg-[#E8F0E8] text-[#4A7C59]';
    if (status === 'confirmed') return 'bg-blue-50 text-blue-700';
    return 'bg-[#FFF3E0] text-[#E65100]';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8B7355]">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Products" value={totalProducts} icon={Package} />
        <StatsCard title="Total Stock Units" value={totalStock} icon={DollarSign} />
        <StatsCard title="Total Orders" value={orders.length} icon={Users} />
        <StatsCard title="Total Revenue" value={formatPrice(totalRevenue)} icon={TrendingUp} />
      </div>

      {/* Quick Product Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Featured Products</p>
          <p className="text-2xl font-bold text-[#2D5A27]">{products.filter(p => p.featured).length}</p>
          <p className="text-xs text-[#8B7355] mt-1">of {totalProducts} total</p>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-[#2D5A27]">⭐ {avgRating}</p>
          <p className="text-xs text-[#8B7355] mt-1">across all products</p>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Low Stock Alert</p>
          <p className="text-2xl font-bold text-orange-500">{products.filter(p => p.stock < 40).length}</p>
          <p className="text-xs text-[#8B7355] mt-1">products below 40 units</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">
            Sales Trend {monthlyData.length === 0 && <span className="text-xs text-[#8B7355] font-normal">(No orders yet)</span>}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.length > 0 ? monthlyData : [{ month: '-', sales: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B735520" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Line type="monotone" dataKey="sales" stroke="#2D5A27" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Top Products (by Reviews)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B735520" />
                <XAxis type="number" stroke="#8B7355" />
                <YAxis dataKey="name" type="category" width={70} stroke="#8B7355" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#2D5A27" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Inventory Table */}
      <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10 mb-8">
        <h2 className="font-semibold text-[#6B4423] mb-4">Product Inventory</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Product</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Price</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Stock</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Rating</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-[#8B7355]">No products found</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                  <td className="p-4 font-medium text-[#2D5A27]">{product.name}</td>
                  <td className="p-4 text-[#6B4423]">
                    {product.weightOptions?.length > 0
                      ? formatPrice(product.weightOptions[0].price)
                      : formatPrice(product.price)}
                  </td>
                  <td className="p-4 text-[#6B4423]">
                    <span className={product.stock < 40 ? 'text-orange-500 font-semibold' : ''}>{product.stock}</span>
                  </td>
                  <td className="p-4 text-[#6B4423]">
                    {product.rating ? `⭐ ${product.rating}` : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.featured ? 'bg-[#E8F0E8] text-[#2D5A27]' : 'bg-[#FFF3E0] text-[#E65100]'
                    }`}>
                      {product.featured ? 'Featured' : 'Regular'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
        <h2 className="font-semibold text-[#6B4423] mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Order ID</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Customer</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Total</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-[#8B7355]">No orders yet</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id || order.orderId} className="border-b border-[#8B7355]/10 last:border-b-0">
                  <td className="p-4 font-medium text-[#2D5A27]">{order.orderId}</td>
                  <td className="p-4 text-[#6B4423]">{order.customer || order.customerEmail}</td>
                  <td className="p-4 text-[#2D5A27]">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;