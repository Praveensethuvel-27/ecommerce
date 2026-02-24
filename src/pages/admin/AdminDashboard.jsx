import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import StatsCard from '../../components/admin/StatsCard';
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

const salesData = [
  { month: 'Jan', sales: 12000 },
  { month: 'Feb', sales: 15000 },
  { month: 'Mar', sales: 18000 },
  { month: 'Apr', sales: 14000 },
  { month: 'May', sales: 20000 },
  { month: 'Jun', sales: 22000 },
];

const topProducts = [
  { name: 'Nalangu Maavu', sales: 89 },
  { name: 'Idli Podi', sales: 76 },
  { name: 'Kasturi Manjal', sales: 65 },
  { name: 'Weight Loss Mix', sales: 54 },
  { name: 'Kambu Maavu', sales: 48 },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'Lakshmi R.', total: 899, status: 'Delivered' },
  { id: 'ORD-002', customer: 'Priya M.', total: 649, status: 'Shipped' },
  { id: 'ORD-003', customer: 'Ravi K.', total: 449, status: 'Pending' },
];

function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Orders" value="156" icon={Package} />
        <StatsCard title="Revenue" value={formatPrice(125000)} icon={DollarSign} />
        <StatsCard title="Customers" value="89" icon={Users} />
        <StatsCard title="Sales (This Month)" value={formatPrice(22000)} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Sales Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B7355/20" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2D5A27" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Top Products</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B7355/20" />
                <XAxis type="number" stroke="#8B7355" />
                <YAxis dataKey="name" type="category" width={70} stroke="#8B7355" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#2D5A27" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                  <td className="p-4 font-medium text-[#2D5A27]">{order.id}</td>
                  <td className="p-4 text-[#6B4423]">{order.customer}</td>
                  <td className="p-4 text-[#2D5A27]">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-[#E8F0E8] text-[#2D5A27]' :
                      order.status === 'Shipped' ? 'bg-[#E8F0E8] text-[#4A7C59]' :
                      'bg-[#FFF3E0] text-[#E65100]'
                    }`}>
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
