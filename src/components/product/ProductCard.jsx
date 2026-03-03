import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../common/Badge';

function ProductCard({ product }) {
  const { t } = useLanguage();
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-[#FAFAF8] rounded-2xl overflow-hidden shadow-sm border border-[#8B7355]/10 hover:shadow-md hover:border-[#4A7C59]/30 transition-all"
    >
      <div className="aspect-square bg-[#E8F0E8] relative overflow-hidden">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B7355]/40 text-6xl font-serif">
            {product.name.charAt(0)}
          </div>
        )}
        {hasDiscount && (
          <Badge variant="primary" className="absolute top-2 left-2">
            {t('common.sale')}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#6B4423] group-hover:text-[#2D5A27] transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-[#2D5A27]">
            {product.weightOptions?.length > 1
              ? `From ${formatPrice(Math.min(...product.weightOptions.map((w) => w.price)))}`
              : product.weightOptions?.length === 1
                ? formatPrice(product.weightOptions[0].price)
                : formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-[#8B7355] line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.rating && (
          <p className="mt-1 text-sm text-[#8B7355]">
            {product.rating} ({product.reviewCount} reviews)
          </p>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;
