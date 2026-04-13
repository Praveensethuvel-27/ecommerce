import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../../components/product/ProductGrid';
import FilterSidebar from '../../components/product/FilterSidebar';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { useLanguage } from '../../context/LanguageContext';
import { categories } from '../../data/categories';
import { getProducts } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';

function Shop() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || '';
  const [sortBy, setSortBy] = useState('popularity');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getProducts()
      .then((data) => {
        if (!active) return;
        setError('');
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Failed to load products');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeProductsChanged(() => {
      getProducts()
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {});
    });
    return unsub;
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) result = result.filter((p) => p.categoryId === cat.id);
    }

    const min = priceRange.min === '' ? null : Number(priceRange.min);
    const max = priceRange.max === '' ? null : Number(priceRange.max);
    if (min !== null && Number.isFinite(min)) result = result.filter((p) => p.price >= min);
    if (max !== null && Number.isFinite(max)) result = result.filter((p) => p.price <= max);

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'popularity') result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    if (sortBy === 'newest') result.sort((a, b) => b.id.localeCompare(a.id));

    return result;
  }, [categorySlug, priceRange, sortBy, products]);

  const productsByCategory = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        products: filteredProducts.filter((p) => p.categoryId === cat.id),
      })),
    [filteredProducts],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ to: '/', label: t('common.home') }, { to: '/shop', label: t('common.shop') }]} />

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <FilterSidebar
            selectedCategory={categorySlug}
            onCategoryChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v) params.set('category', v);
              else params.delete('category');
              setSearchParams(params);
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#6B4423] mb-6">{t('common.allProducts')}</h1>
          {loading ? (
            <p className="text-center text-[#8B7355] py-12">Loading…</p>
          ) : error ? (
            <p className="text-center text-red-600 py-12">{error}</p>
          ) : categorySlug ? (
            filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} />
            ) : (
              <p className="text-center text-[#8B7355] py-12">{t('common.noProductsFound')}</p>
            )
          ) : (
            <div className="space-y-10">
              {productsByCategory.map(({ category, products: list }) => (
                <section key={category.id}>
                  <h2 className="text-xl font-semibold text-[#6B4423] mb-1">{category.name}</h2>
                  <p className="text-sm text-[#8B7355] mb-4">{category.description}</p>
                  {list.length > 0 ? (
                    <ProductGrid products={list} />
                  ) : (
                    <p className="text-[#8B7355] py-4">No products in this category.</p>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shop;
