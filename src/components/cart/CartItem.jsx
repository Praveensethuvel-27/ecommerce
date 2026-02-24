import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import QuantitySelector from '../product/QuantitySelector';

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const price = item.cartPrice ?? item.price;
  const weightLabel = item.weight ? ` (${item.weight})` : '';

  return (
    <div className="flex flex-col sm:flex-row gap-4 py-6 border-b border-[#8B7355]/20 last:border-b-0">
      <Link
        to={`/product/${item.slug}`}
        className="flex-shrink-0 w-full sm:w-24 h-24 rounded-xl bg-[#E8F0E8] overflow-hidden flex items-center justify-center"
      >
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#8B7355]/40 text-3xl font-serif">{item.name.charAt(0)}</span>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.slug}`} className="font-medium text-[#6B4423] hover:text-[#2D5A27]">
          {item.name}{weightLabel}
        </Link>
        <p className="text-sm text-[#8B7355] mt-1">{formatPrice(price)} each</p>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <QuantitySelector
          value={item.quantity}
          onChange={(qty) => onUpdateQuantity(item.id, qty, item.weight)}
        />
        <span className="font-semibold text-[#2D5A27] w-20 text-right">
          {formatPrice(price * item.quantity)}
        </span>
        <button
          onClick={() => onRemove(item.id, item.weight)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default CartItem;
