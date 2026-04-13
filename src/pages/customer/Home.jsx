import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Truck, Shield } from 'lucide-react';
import ProductGrid from '../../components/product/ProductGrid';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import TypingText from '../../components/common/TypingText';
import Carousel from '../../components/common/Carousel';
import { useLanguage } from '../../context/LanguageContext';
import { categories } from '../../data/categories';
import { getProducts } from '../../utils/api';
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

function Home() {
  const { t, language } = useLanguage();
  const healthBenefits = getHealthBenefits(t);
  const trustBadges = getTrustBadges(t);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (active) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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

      <section className="py-12 px-4 bg-[#2D5A27] text-white text-center">
        <p className="text-xl font-medium">
          {t('home.freeShipping')}
        </p>
      </section>

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
