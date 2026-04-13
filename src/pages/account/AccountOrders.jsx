import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { getMyOrders } from '../../utils/api';

const statusVariant = {
  delivered: 'default',
  shipped: 'accent',
  pending: 'outline',
  confirmed: 'primary',
  rejected: 'outline',
};

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Orders that can still be tracked (not rejected)
const TRACKABLE = ['pending', 'confirmed', 'shipped', 'delivered'];

function AccountOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch((err) => setError(err?.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleTrack = (orderId) => {
    navigate('/track-order', { state: { orderId } });
  };

  const message = location.state?.message;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Order History</h1>
        <p className="text-[#8B7355]">Loading orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Order History</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Order History</h1>
        <Card className="text-center py-16">
          <ShoppingBag className="w-16 h-16 mx-auto text-[#8B7355]/50 mb-4" />
          <p className="text-[#8B7355] text-lg mb-4">You haven&apos;t placed any orders yet.</p>
          <Link to="/shop">
            <Button variant="primary" size="lg">Continue Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Order History</h1>

      {message && (
        <p className="text-[#2D5A27] font-medium mb-4 bg-[#E8F0E8] px-4 py-2 rounded-xl">{message}</p>
      )}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8B7355]/20 bg-[#E8F0E8]/50">
                <th className="text-left p-4 font-medium text-[#6B4423]">Order ID</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Date</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Items</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Total</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Status</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Track</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#8B7355]/10 last:border-b-0 hover:bg-[#FAFAF8] transition-colors">
                  <td className="p-4 font-medium text-[#2D5A27] text-sm">{order.orderId}</td>
                  <td className="p-4 text-[#8B7355] text-sm whitespace-nowrap">{formatDate(order.date)}</td>
                  <td className="p-4 text-[#6B4423] text-sm max-w-[180px] truncate">{order.items}</td>
                  <td className="p-4 font-medium text-[#2D5A27] whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <Badge variant={statusVariant[order.status] || 'default'}>
                      {capitalize(order.status)}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {TRACKABLE.includes(order.status) ? (
                      <button
                        onClick={() => handleTrack(order.orderId)}
                        className="flex items-center gap-1 text-sm font-medium text-[#2D5A27] hover:text-[#1a3d18] hover:underline transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Track
                      </button>
                    ) : (
                      <span className="text-xs text-[#8B7355]/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AccountOrders;