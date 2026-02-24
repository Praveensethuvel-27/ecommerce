import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import Button from '../../components/common/Button';
import Breadcrumb from '../../components/layout/Breadcrumb';

function Cart() {
  const { cartItems, subtotal, shipping, total, updateQuantity, removeItem } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ to: '/', label: 'Home' }, { label: 'Cart' }]} />

      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 mx-auto text-[#8B7355]/50 mb-4" />
          <p className="text-[#8B7355] text-lg mb-4">Your cart is empty</p>
          <Link to="/shop">
            <Button variant="primary" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
              {cartItems.map((item) => (
                <CartItem
                  key={`${item.id}::${item.weight ?? ''}`}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>
          <div>
            <CartSummary subtotal={subtotal} shipping={shipping} total={total} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
