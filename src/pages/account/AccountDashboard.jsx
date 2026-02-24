import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getMyOrders } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AccountDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getMyOrders()
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-6">My Account</h1>
      <p className="text-[#8B7355] mb-8">Welcome back, {user?.email}!</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F0E8] flex items-center justify-center">
            <Package className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2D5A27]">{orders.length}</p>
            <p className="text-sm text-[#8B7355]">Total Orders</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F0E8] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-[#2D5A27]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2D5A27]">{pendingCount}</p>
            <p className="text-sm text-[#8B7355]">Pending</p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-[#6B4423] mb-4">Recent Orders</h2>
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <p className="text-[#8B7355] py-4">No orders yet. <Link to="/shop" className="text-[#2D5A27] underline">Continue Shopping</Link></p>
          ) : recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-[#8B7355]/20 last:border-b-0"
            >
              <div>
                <p className="font-medium text-[#6B4423]">{order.orderId}</p>
                <p className="text-sm text-[#8B7355]">{formatDate(order.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#2D5A27]">{formatPrice(order.total)}</p>
                <p className="text-sm text-[#8B7355]">{order.status}</p>
              </div>
              <Link to="/account/orders">
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </div>
          ))}
        </div>
        {recentOrders.length > 0 && (
          <Link to="/account/orders" className="block mt-4">
            <Button variant="outline" size="sm">View All Orders</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}

export default AccountDashboard;
