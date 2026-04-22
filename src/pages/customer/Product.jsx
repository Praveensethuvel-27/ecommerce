import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Leaf, Shield, Bell, CheckCircle, Tag, Clock } from 'lucide-react';
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
import { getProductBySlug, getProducts, subscribeRestock } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';
import { useOffers, getOfferForProduct } from '../../context/OffersContext';

// ---------- Countdown Timer ----------
function useCountdown(endDate) {
  const calc = () => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!endDate) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return time;
}

function TimerBox({ value, label }) {
  return (
    <div className="bg-black/25 rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
      <span className="block text-base font-black leading-none tabular-nums text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-white/60 uppercase">{label}</span>
    </div>
  );
}

function OfferBanner({ offer }) {
  // Support both endDate and end_date field names from API
  const endDate = offer.endDate || offer.end_date || null;
  const time = useCountdown(endDate);

  // Hide only if endDate exists and has expired
  if (endDate && !time) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#2D5A27] text-white px-5 py-4 mb-6 flex items-center justify-between gap-3">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl font-black text-white/5 select-none pointer-events-none leading-none">
        {offer.discountPercent}%
      </div>
      <div className="z-10 flex-1 min-w-0">
        <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-1">
          <Tag className="w-3 h-3" />
          {offer.discountPercent}% OFF
        </div>
        <p className="font-bold text-sm leading-tight">{offer.title}</p>
        {offer.description && (
          <p className="text-xs text-white/65 mt-0.5 line-clamp-1">{offer.description}</p>
        )}
      </div>
      <div className="z-10 flex-shrink-0 flex flex-col items-end gap-1.5">
        {endDate && time && (
          <>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-[10px] text-white/50">Ends in</span>
            </div>
            <div className="flex gap-1">
              {time.d > 0 && <TimerBox value={time.d} label="days" />}
              <TimerBox value={time.h} label="hrs" />
              <TimerBox value={time.m} label="min" />
              <TimerBox value={time.s} label="sec" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Product() {
  const { productSlug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState('');
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { offers } = useOffers();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState('idle');
  const [notifyError, setNotifyError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError('');
      setProduct(null);
    });
    getProductBySlug(productSlug)
      .then((p) => { if (!active) return; setError(''); setProduct(p); })
      .catch((err) => { if (active) setError(err?.message || 'Failed to load product'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productSlug]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => { if (active) setAllProducts(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (product?.weightOptions?.length > 0) {
      setSelectedWeight(product.weightOptions[0].weight);
    } else {
      setSelectedWeight('');
    }
  }, [product?.id]);

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
  const relatedProducts = product
    ? allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)
    : [];

  // Offer matching — name + slug both used
  const offer = product ? getOfferForProduct(offers, product.name, productSlug) : null;

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

  const handleNotifyMe = async (e) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifyStatus('loading');
    setNotifyError('');
    try {
      await subscribeRestock(product.id, notifyEmail);
      setNotifyStatus('success');
      setNotifyEmail('');
    } catch (err) {
      setNotifyStatus('error');
      setNotifyError(err?.message || 'Failed to subscribe. Please try again.');
    }
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

          {/* ── OFFER BANNER ── */}
          {offer && <OfferBanner offer={offer} />}

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

          {product.stock <= 0 ? (
            <div className="mt-8">
              <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
                Out of Stock
              </div>
              <div className="bg-[#F5F0E8] border border-[#8B7355]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-[#2D5A27]" />
                  <h3 className="font-semibold text-[#6B4423]">Notify Me When Available</h3>
                </div>
                <p className="text-sm text-[#8B7355] mb-4">
                  Enter your email and we'll let you know as soon as this product is back in stock.
                </p>
                {notifyStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-[#2D5A27] bg-[#E8F0E8] rounded-xl px-4 py-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      You're subscribed! We'll email you when it's back in stock.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] focus:outline-none focus:border-[#2D5A27]"
                    />
                    <Button type="submit" variant="primary" disabled={notifyStatus === 'loading'}>
                      {notifyStatus === 'loading' ? 'Subscribing…' : 'Notify Me'}
                    </Button>
                  </form>
                )}
                {notifyStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600">{notifyError}</p>
                )}
              </div>
            </div>
          ) : (
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
                {t('common.addToCart')}
              </Button>
            </div>
          )}

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

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-[#6B4423] mb-6">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Product;