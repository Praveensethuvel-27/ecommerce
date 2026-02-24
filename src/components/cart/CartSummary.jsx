import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../common/Button';

function CartSummary({ subtotal, shipping, total }) {
  return (
    <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
      <h3 className="font-semibold text-[#6B4423] mb-4">Order Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[#6B4423]">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#6B4423]">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[#8B7355]/20 flex justify-between font-semibold text-[#2D5A27]">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
      {shipping > 0 && (
        <p className="mt-2 text-xs text-[#4A7C59]">
          Free shipping on orders above Rs. 999
        </p>
      )}
      <Link to="/checkout" className="block mt-6">
        <Button variant="primary" className="w-full" size="lg">
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
}

export default CartSummary;
