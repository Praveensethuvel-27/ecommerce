import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { createOrder } from '../../utils/api';

const paymentMethods = [

  { id: 'upi', label: 'UPI', icon: Smartphone },

];

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [payment, setPayment] = useState('cod');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.id,
          weight: item.weight || undefined,
          quantity: item.quantity,
        })),
        address: form,
        paymentMethod: payment,
      };
      const result = await createOrder(orderData);
      clearCart();
      navigate('/account/orders', { state: { message: `Order placed! Order ID: ${result.orderId}` } });
    } catch (err) {
      alert(err?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-[#8B7355] mb-4">Please log in to place an order.</p>
        <Button variant="primary" onClick={() => navigate('/login', { state: { from: '/checkout' } })}>
          Log In
        </Button>
      </div>
    );
  }

  if (cartItems.length === 0 && !form.name) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-[#8B7355]">Your cart is empty.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/shop')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ to: '/', label: 'Home' }, { to: '/cart', label: 'Cart' }, { label: 'Checkout' }]} />

      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-semibold text-[#6B4423] mb-4">Delivery Address</h2>
            <div className="space-y-4 bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
              <Input
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Address Line 1"
                required
                value={form.address1}
                onChange={(e) => setForm({ ...form, address1: e.target.value })}
              />
              <Input
                label="Address Line 2"
                value={form.address2}
                onChange={(e) => setForm({ ...form, address2: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <Input
                  label="State"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                <Input
                  label="Pincode"
                  required
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
            </div>

            <h2 className="font-semibold text-[#6B4423] mt-8 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    payment === pm.id ? 'border-[#2D5A27] bg-[#E8F0E8]' : 'border-[#8B7355]/20 hover:border-[#8B7355]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={payment === pm.id}
                    onChange={() => setPayment(pm.id)}
                    className="sr-only"
                  />
                  <pm.icon className="w-5 h-5 text-[#2D5A27]" />
                  <span className="font-medium text-[#6B4423]">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10 sticky top-24">
              <h2 className="font-semibold text-[#6B4423] mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartItems.map((item) => {
                  const price = item.cartPrice ?? item.price;
                  return (
                    <div key={`${item.id}::${item.weight ?? ''}`} className="flex justify-between text-sm">
                      <span className="text-[#6B4423]">
                        {item.name}{item.weight ? ` (${item.weight})` : ''} x {item.quantity}
                      </span>
                      <span className="text-[#2D5A27] font-medium">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[#8B7355]/20 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#6B4423]">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B4423]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-[#2D5A27] mt-4 pt-4 border-t border-[#8B7355]/20">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button type="submit" variant="primary" className="w-full mt-6" size="lg" disabled={submitting}>
                {submitting ? 'Placing Order…' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Checkout;
