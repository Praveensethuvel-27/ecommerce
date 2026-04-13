import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Circle, Clock, Package, Truck, Home, XCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { formatPrice } from '../../utils/formatPrice';

const STEPS = [
  { key: 'pending',   label: 'Order Placed',   icon: Package,  desc: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed',       icon: CheckCircle, desc: 'Order confirmed by store' },
  { key: 'shipped',   label: 'Shipped',         icon: Truck,    desc: 'On the way to you' },
  { key: 'delivered', label: 'Delivered',       icon: Home,     desc: 'Successfully delivered' },
];

const STATUS_INDEX = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

const API_BASE = import.meta.env.VITE_API_BASE || '';

function OrderTracking() {
  const location = useLocation();
  const [inputId, setInputId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(`${API_BASE}/api/orders/track/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      setOrder(data);
      setInputId(id.trim());
    } catch (err) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if navigated from checkout
  useEffect(() => {
    const { orderId } = location.state || {};
    if (orderId) {
      setInputId(orderId);
      fetchOrder(orderId);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrder(inputId);
  };

  const currentStep = order ? (STATUS_INDEX[order.status] ?? 0) : -1;
  const isRejected = order?.status === 'rejected';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#6B4423] mb-2 text-center">Track Your Order</h1>
      <p className="text-[#8B7355] text-center mb-8">Enter your Order ID to see the latest status</p>

      {/* Search bar */}
      <Card className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="e.g. ORD-1713000000000-abc123"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
          <Button type="submit" variant="primary" className="sm:shrink-0" disabled={loading}>
            {loading ? 'Searching…' : 'Track'}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {order && (
        <>
          {/* Order info header */}
          <Card className="mb-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <p className="text-xs text-[#8B7355] uppercase tracking-wide mb-1">Order ID</p>
                <p className="font-bold text-[#6B4423] text-lg">{order.orderId}</p>
                <p className="text-sm text-[#8B7355] mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8B7355] uppercase tracking-wide mb-1">Total</p>
                <p className="font-bold text-[#2D5A27] text-lg">{formatPrice(order.total)}</p>
                <p className="text-xs text-[#8B7355] mt-1 capitalize">{order.paymentMethod}</p>
              </div>
            </div>

            {/* Delivery address */}
            {order.address?.name && (
              <div className="mt-4 pt-4 border-t border-[#8B7355]/10">
                <p className="text-xs text-[#8B7355] uppercase tracking-wide mb-1">Delivering to</p>
                <p className="text-sm text-[#6B4423] font-medium">{order.address.name}</p>
                <p className="text-sm text-[#8B7355]">
                  {order.address.city}{order.address.state ? `, ${order.address.state}` : ''} {order.address.pincode}
                </p>
              </div>
            )}
          </Card>

          {/* Rejected state */}
          {isRejected ? (
            <Card className="mb-6 border-red-200 bg-red-50">
              <div className="flex gap-3 items-start">
                <XCircle className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">Order Rejected</p>
                  {order.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {order.rejectionReason}</p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            /* Tracking stepper */
            <Card className="mb-6">
              <p className="text-xs text-[#8B7355] uppercase tracking-wide mb-6">Order Progress</p>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#E8F0E8]" />
                <div
                  className="absolute left-5 top-5 w-0.5 bg-[#2D5A27] transition-all duration-500"
                  style={{ height: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />

                <div className="space-y-6 relative">
                  {STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-start gap-4 pl-0">
                        {/* Circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                          done ? 'bg-[#2D5A27] border-[#2D5A27]' :
                          active ? 'bg-white border-[#2D5A27]' :
                          'bg-white border-[#D4C5B0]'
                        }`}>
                          {done ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : active ? (
                            <Icon className="w-5 h-5 text-[#2D5A27]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#D4C5B0]" />
                          )}
                        </div>
                        {/* Label */}
                        <div className="pt-1.5">
                          <p className={`font-semibold text-sm ${
                            done || active ? 'text-[#2D5A27]' : 'text-[#8B7355]'
                          }`}>
                            {step.label}
                            {active && (
                              <span className="ml-2 text-xs bg-[#E8F0E8] text-[#2D5A27] px-2 py-0.5 rounded-full font-normal">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#8B7355] mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Items */}
          <Card>
            <p className="text-xs text-[#8B7355] uppercase tracking-wide mb-4">Items Ordered</p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-[#6B4423]">
                    {item.name}{item.weight ? ` (${item.weight})` : ''} × {item.quantity}
                  </span>
                  <span className="text-[#2D5A27] font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!order && !loading && !error && (
        <div className="text-center py-12 text-[#8B7355]">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Enter your Order ID above to track your package</p>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;