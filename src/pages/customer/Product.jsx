import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Leaf, Shield } from 'lucide-react';
import { categories } from '../../data/categories';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../utils/formatPrice';
import ImageGallery from '../../components/product/ImageGallery';
import QuantitySelector from '../../components/product/QuantitySelector';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { AccordionItem } from '../../components/common/Accordion';
import { getProductBySlug, getProducts } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';

function Product() {
  const { productSlug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState('');
  const { addItem } = useCart();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch current product
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setProduct(null);
    getProductBySlug(productSlug)
      .then((p) => { if (active) { setProduct(p); setError(''); } })
      .catch((err) => { if (active) setError(err?.message || 'Failed to load product'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productSlug]);

  // Fetch all products — re-fetch when productSlug changes so related is always fresh
  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => { if (active) setAllProducts(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { active = false; };
  }, [productSlug]);

  // Reset weight when product changes
  useEffect(() => {
    if (product?.weightOptions?.length > 0) {
      setSelectedWeight(product.weightOptions[0].weight);
    } else {
      setSelectedWeight('');
    }
    setAddedToCart(false);
    setQuantity(1);
  }, [product?.id]);

  // Realtime updates
  useEffect(() => {
    const unsub = subscribeProductsChanged((evt) => {
      if (evt?.type === 'updated' || evt?.type === 'deleted') {
        if (evt?.id && product?.id && evt.id !== product.id) return;
      }
      getProductBySlug(productSlug).then(setProduct).catch(() => {});
      getProducts().then((list) => setAllProducts(Array.isArray(list) ? list : [])).catch(() => {});
    });
    return unsub;
  }, [productSlug, product?.id]);

  const category = product ? categories.find((c) => c.id === product.categoryId) : null;

  // Related: same category, exclude current, max 4
  const relatedProducts = product
    ? allProducts
        .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
        .slice(0, 4)
    : [];

  // If less than 4 related in same category, fill with other categories
  const extraProducts =
    relatedProducts.length < 4 && product
      ? allProducts
          .filter((p) => p.categoryId !== product.categoryId && p.id !== product.id)
          .slice(0, 4 - relatedProducts.length)
      : [];

  const displayedRelated = [...relatedProducts, ...extraProducts];

  const getProductName = () => {
    const productKeyMap = {
      'nalangu-maavu': 'product.nalanguMaavu',
      'kasturi-manjal': 'product.kasturiManjal',
      'payatham-maavu': 'product.payathamMaavu',
      'kadalai-maavu': 'product.kadalaiMaavu',
      'kambu-maavu': 'product.kambuMaavu',
      'karuppu-kavuni-kanji-mix': 'product.karuppuKavuniKanji',
      'weight-loss-mix': 'product.weightLossMix',
      'weightlossmix-image': 'product.weightLossMix',
      'karuppu-ulundu-kali-mix': 'product.karuppuUlunduKali',
      'idli-podi': 'product.idliPodi',
      'milagai-thool': 'product.milagaiThool',
      'green-gram-flour-image': 'product.greenGramFlour',
      'kasturi-manjal-image': 'product.kasturiManjal',
    };
    const key = productKeyMap[productSlug];
    return key ? t(key) : product?.name || '';
  };

  const getCategoryName = (cat) => {
    const categoryKeyMap = {
      'maavus': 'category.maavus',
      'kanji-kali-mixes': 'category.kanjiKali',
      'podi-thool': 'category.podiThool',
      'special-blends': 'category.specialBlends',
    };
    const key = categoryKeyMap[cat?.slug];
    return key ? t(key) : cat?.name || '';
  };

  const getTranslatedBenefit = (benefit) => {
    const benefitKeyMap = {
      'Natural skin nourishment': 'benefit.naturalSkinNourishment',
      'Removes dead skin cells': 'benefit.removesDeadSkin',
      'Promotes glowing skin': 'benefit.promotesGlowingSkin',
      'Traditional cooling effect': 'benefit.traditionalCooling',
      'Reduces inflammation': 'benefit.reducesInflammation',
      'Brightens skin': 'benefit.brightensSkin',
      'Fights acne': 'benefit.fightsAcne',
      'Natural antiseptic': 'benefit.naturalAntiseptic',
      'Easy digestion': 'benefit.easyDigestion',
      'Rich in protein': 'benefit.richInProtein',
      'Low glycemic index': 'benefit.lowGlycemicIndex',
      'Cooling for body': 'benefit.coolingForBody',
      'High protein': 'benefit.highProtein',
      'Fiber-rich': 'benefit.fiberRich',
      'Supports weight management': 'benefit.supportsWeightManagement',
      'Nutrient-dense': 'benefit.nutrientDense',
      'High iron content': 'benefit.highIronContent',
      'Diabetes-friendly': 'benefit.diabetesFriendly',
      'Gluten-free': 'benefit.glutenFree',
      'Energy booster': 'benefit.energyBooster',
      'High antioxidants': 'benefit.highAntioxidants',
      'Supports digestion': 'benefit.supportsDigestion',
      'Energy boost': 'benefit.energyBoost',
      'Traditional cooling': 'benefit.traditionalCooling',
      'Supports metabolism': 'benefit.supportsMetabolism',
      'Keeps you full longer': 'benefit.keepsFullLonger',
      'High fiber': 'benefit.fiberRich',
      'Natural ingredients': 'benefit.naturalPreservative',
      'Energy dense': 'benefit.energyDense',
      'Post-partum nourishment': 'benefit.postPartumNourishment',
      'Bone health': 'benefit.boneHealth',
      'Adds flavor without oil': 'benefit.addsFlavorWithoutOil',
      'Protein boost': 'benefit.proteinBoost',
      'Digestive aid': 'benefit.digestiveAid',
      'Traditional taste': 'benefit.traditionalTaste',
      'Metabolism boost': 'benefit.metabolismBoost',
      'Vitamin C': 'benefit.vitaminC',
      'Adds flavor': 'benefit.addsFlavor',
      'Natural preservative': 'benefit.naturalPreservative',
    };
    const key = benefitKeyMap[benefit];
    return key ? t(key) : benefit;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-[#8B7355]">Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-[#8B7355]">{error || t('common.productNotFound')}</p>
        <Link to="/shop" className="text-[#2D5A27] underline mt-4 inline-block">{t('common.backToShop')}</Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { to: '/', label: t('common.home') },
    { to: '/shop', label: t('common.shop') },
    ...(category ? [{ to: `/shop/${category.slug}`, label: getCategoryName(category) }] : []),
    { label: getProductName() },
  ];

  const weightOptions = product?.weightOptions && product.weightOptions.length > 0
    ? product.weightOptions
    : null;
  const displayPrice = weightOptions && selectedWeight
    ? weightOptions.find((w) => w.weight === selectedWeight)?.price ?? product.price
    : product.price;

  const handleAddToCart = () => {
    addItem(product.id, quantity, weightOptions ? selectedWeight : '');
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <ImageGallery images={product.images} alt={product.name} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">{t('product.organic')}</Badge>
            <Badge variant="default">{t('product.traditional')}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#6B4423] mb-4">{getProductName()}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold text-[#2D5A27]">{formatPrice(displayPrice)}</span>
            {product.originalPrice && (
              <span className="text-lg text-[#8B7355] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <p className="text-[#8B7355] mb-6">{product.description}</p>

          <div className="mb-6">
            <h3 className="font-semibold text-[#6B4423] mb-2">{t('product.ingredients')}</h3>
            <ul className="list-disc list-inside text-[#8B7355] text-sm space-y-1">
              {product.ingredients.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#8B7355]/20 pt-6 space-y-4">
            <h3 className="font-semibold text-[#6B4423]">{t('product.healthBenefits')}</h3>
            <div className="space-y-2">
              {product.healthBenefits.map((benefit) => (
                <AccordionItem key={benefit} title={getTranslatedBenefit(benefit)} defaultOpen={false}>
                  <p className="text-sm text-[#8B7355]">{t('product.benefit.description')}</p>
                </AccordionItem>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-[#6B4423] mb-2">{t('product.usageInstructions')}</h3>
            <ol className="list-decimal list-inside text-[#8B7355] text-sm space-y-1">
              {product.usageInstructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {weightOptions && (
              <div>
                <label className="block text-sm font-medium text-[#6B4423] mb-1">Weight</label>
                <select
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                  required={weightOptions.length > 0}
                >
                  <option value="">Select weight</option>
                  {weightOptions.map((wo) => (
                    <option key={wo.weight} value={wo.weight}>{wo.weight}</option>
                  ))}
                </select>
              </div>
            )}
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={weightOptions && weightOptions.length > 0 && !selectedWeight}
            >
              {addedToCart ? '✓ Added!' : t('common.addToCart')}
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#8B7355]">
            <span className="flex items-center gap-1">
              <Leaf className="w-4 h-4 text-[#2D5A27]" />
              {t('product.organicCertified')}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-[#2D5A27]" />
              {t('product.naturalIngredients')}
            </span>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {displayedRelated.length > 0 && (
        <section className="border-t border-[#8B7355]/10 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#6B4423]">
              {relatedProducts.length > 0 ? t('product.relatedProducts') : 'You May Also Like'}
            </h2>
            <Link
              to={category ? `/shop/${category.slug}` : '/shop'}
              className="text-sm text-[#2D5A27] hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedRelated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Product;