import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Shield, Tag, Clock } from 'lucide-react';
import ProductGrid from '../../components/product/ProductGrid';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import TypingText from '../../components/common/TypingText';
import Carousel from '../../components/common/Carousel';
import { useLanguage } from '../../context/LanguageContext';
import { categories } from '../../data/categories';
import { getProducts, getActiveOffers } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';

const getHealthBenefits = (t) => [
  { title: t('home.benefit.skincare.title'), desc: t('home.benefit.skincare.desc'), icon: Leaf },
  { title: t('home.benefit.weight.title'), desc: t('home.benefit.weight.desc'), icon: Leaf },
  { title: t('home.benefit.recipes.title'), desc: t('home.benefit.recipes.desc'), icon: Leaf },
];

const testimonials = [
  { quote: 'Authentic taste and quality. GrandMa\'s Care brings back childhood memories.', name: 'Lakshmi R.', location: 'Chennai' },
  { quote: 'The Nalangu Maavu is exactly what my grandmother used to make. Pure and natural!', name: 'Priya M.', location: 'Coimbatore' },
];

const getTrustBadges = (t) => [
  { label: t('home.trust.organic'), icon: Leaf },
  { label: t('home.trust.traditional'), icon: Shield },
  { label: t('home.trust.natural'), icon: Leaf },
];

// ---------- Countdown Timer ----------
function useCountdown(endDate) {
  const calc = () => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return time;
}

function TimerBox({ value, label }) {
  return (
    <div className="bg-black/30 rounded-xl px-3 py-2 text-center min-w-[52px]">
      <span className="block text-2xl font-black leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-white/60 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ---------- Single Offer Banner Card ----------
function OfferBannerCard({ offer }) {
  const time = useCountdown(offer.endDate);
  if (time.expired) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#2D5A27] text-white px-6 py-5 flex items-center justify-between gap-4">
      {/* Background decoration */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] font-black text-white/5 select-none pointer-events-none leading-none">
        {offer.discountPercent}%
      </div>

      {/* Left content */}
      <div className="z-10 flex-1 min-w-0">
        <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-2">
          <Tag className="w-3 h-3" />
          {offer.discountPercent}% OFF
        </div>
        <h3 className="text-lg md:text-xl font-bold leading-tight truncate">{offer.title}</h3>
        {offer.productName && (
          <p className="text-sm text-white/75 mt-0.5 truncate">{offer.productName}</p>
        )}
        {offer.description && (
          <p className="text-xs text-white/60 mt-1 line-clamp-1">{offer.description}</p>
        )}
      </div>

      {/* Right: timer + CTA */}
      <div className="z-10 flex flex-col items-end gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white/60" />
          <span className="text-xs text-white/60">Ends in</span>
        </div>
        <div className="flex gap-1.5">
          {time.d > 0 && <TimerBox value={time.d} label="days" />}
          <TimerBox value={time.h} label="hrs" />
          <TimerBox value={time.m} label="min" />
          <TimerBox value={time.s} label="sec" />
        </div>
        <Link to="/shop">
          <button className="mt-1 px-4 py-1.5 bg-white text-[#2D5A27] text-xs font-bold rounded-lg hover:bg-[#F5F0E8] transition-colors">
            Shop Now
          </button>
        </Link>
      </div>
    </div>
  );
}

// ---------- Offers Section ----------
function OffersSection({ offers }) {
  if (!offers || offers.length === 0) return null;

  // Filter website offers only
  const websiteOffers = offers.filter((o) => (o.showOn || []).includes('website'));
  if (websiteOffers.length === 0) return null;

  return (
    <section className="py-8 px-4 bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-[#2D5A27]" />
          <h2 className="text-lg font-bold text-[#6B4423]">Special Offers</h2>
        </div>
        {websiteOffers.length === 1 ? (
          <OfferBannerCard offer={websiteOffers[0]} />
        ) : (
          <Carousel
            items={websiteOffers}
            interval={5000}
            renderItem={(offer) => (
              <div className="px-1">
                <OfferBannerCard offer={offer} />
              </div>
            )}
          />
        )}
      </div>
    </section>
  );
}

// ---------- Main Home ----------
function Home() {
  const { t, language } = useLanguage();
  const healthBenefits = getHealthBenefits(t);
  const trustBadges = getTrustBadges(t);

  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => { if (active) setProducts(Array.isArray(list) ? list : []); })
      .catch(() => {});
    getActiveOffers()
      .then((list) => { if (active) setOffers(Array.isArray(list) ? list : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const unsub = subscribeProductsChanged(() => {
      getProducts()
        .then((list) => setProducts(Array.isArray(list) ? list : []))
        .catch(() => {});
    });
    return unsub;
  }, []);

  const featuredProducts = products.slice(0, 6);

  const heroImages = featuredProducts.map((p) => ({
    src: (p.images && p.images[0]) || '/placeholder-product.jpg',
    name: p.name,
  }));

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#2D5A27] text-white py-20 lg:py-28 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto lg:mx-0 mb-3">
              {t('home.hero.subtitle')}
            </p>
            <p className="text-lg md:text-xl text-[#F5F0E8]/90 max-w-2xl mx-auto lg:mx-0 mb-8">
              {t('home.hero.description')}{' '}
              <TypingText
                phrases={language === 'ta' ? [
                  'குளிப்பு தூள் (நலங்கு மாவு)',
                  'பாரம்பரிய கஞ்சி கலவைகள்',
                  'குளிர் அழுத்தப்பட்ட மசாலா கலவைகள்',
                  'தினசரி சமையலுக்கான தினை மாவுகள்',
                ] : [
                  'bath powders (Nalangu Maavu)',
                  'traditional kanji mixes',
                  'cold-pressed spice blends',
                  'millet flours for daily cooking',
                ]}
                className="font-semibold"
              />
            </p>
            <div className="flex justify-center lg:justify-start mt-4">
              <Link to="/shop">
                <button className="px-8 py-4 bg-white text-[#2D5A27] hover:bg-[#FAFAF8] font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                  {t('common.shopNow')}
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <Carousel
              items={heroImages}
              interval={4000}
              renderItem={(item) => (
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-xl border border-[#F5F0E8]/20 bg-[#E8F0E8]">
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white px-4 py-3 text-sm">
                      {item.name}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* ── OFFERS BANNER (website only) ── */}
      <OffersSection offers={offers} />

      {/* Featured Products */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#E8F0E8] to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#6B4423] mb-8 text-center">
            {t('home.featuredProducts')}
          </h2>
          <ProductGrid products={featuredProducts} />
          <div className="text-center mt-10">
            <Link to="/shop">
              <Button variant="outline" size="lg">{t('common.viewAll')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 px-4 bg-[#2D5A27]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {t('home.shopByCategory')}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 justify-center flex-wrap">
            {categories.map((cat) => {
              const getCategoryName = () => {
                const categoryKeyMap = {
                  'maavus': 'category.maavus',
                  'kanji-kali-mixes': 'category.kanjiKali',
                  'podi-thool': 'category.podiThool',
                  'special-blends': 'category.specialBlends',
                };
                const key = categoryKeyMap[cat.slug];
                return key ? t(key) : cat.name;
              };
              return (
                <Link
                  key={cat.id}
                  to={`/shop/${cat.slug}`}
                  className="flex-shrink-0 px-6 py-4 bg-white rounded-2xl shadow-lg border-2 border-white/20 hover:border-white/40 hover:shadow-xl hover:scale-105 transition-all text-center min-w-[140px]"
                >
                  <span className="font-medium text-[#2D5A27]">{getCategoryName()}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Health Benefits */}
      <section className="py-16 px-4 bg-gradient-to-b from-white via-[#E8F0E8] to-[#E8F0E8]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#6B4423] mb-8 text-center">
            {t('home.healthBenefits')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="text-center bg-white border-2 border-[#E8F0E8] hover:border-[#2D5A27]/30 hover:shadow-lg transition-all">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2D5A27] to-[#4A7C59] flex items-center justify-center text-white shadow-md">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-[#6B4423] mb-2 text-lg">{benefit.title}</h3>
                  <p className="text-sm text-[#8B7355]">{benefit.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-[#E8F0E8]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#6B4423] mb-8 text-center">
            {t('home.testimonials')}
          </h2>
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="text-center bg-white rounded-2xl p-6 border border-[#8B7355]/20 shadow-sm">
                <p className="text-[#6B4423] italic mb-4 text-lg">"{testimonial.quote}"</p>
                <p className="font-medium text-[#2D5A27] text-base">{testimonial.name}</p>
                <p className="text-sm text-[#8B7355]">{testimonial.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Shipping */}
      <section className="py-12 px-4 bg-[#2D5A27] text-white text-center">
        <p className="text-xl font-medium">
          {t('home.freeShipping')}
        </p>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4 bg-[#E8F0E8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-md border-2 border-[#2D5A27]/20 hover:border-[#2D5A27]/40 hover:shadow-lg transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#2D5A27] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-[#2D5A27]">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;