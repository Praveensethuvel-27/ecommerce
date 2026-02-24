import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductGrid from '../../components/product/ProductGrid';
import FilterSidebar from '../../components/product/FilterSidebar';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { categories } from '../../data/categories';
import { getProducts } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';

function Category() {
  const { categorySlug } = useParams();
  const [sortBy, setSortBy] = useState('popularity');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = categories.find((c) => c.slug === categorySlug);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (!active) return;
        setError('');
        setProducts(Array.isArray(list) ? list : []);
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
        .then((list) => setProducts(Array.isArray(list) ? list : []))
        .catch(() => {});
    });
    return unsub;
  }, []);

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    let result = products.filter((p) => p.categoryId === category.id);
    const min = priceRange.min === '' ? null : Number(priceRange.min);
    const max = priceRange.max === '' ? null : Number(priceRange.max);
    if (min !== null && Number.isFinite(min)) result = result.filter((p) => p.price >= min);
    if (max !== null && Number.isFinite(max)) result = result.filter((p) => p.price <= max);
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'popularity') result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    if (sortBy === 'newest') result.sort((a, b) => b.id.localeCompare(a.id));
    return result;
  }, [category, priceRange, sortBy, products]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-[#8B7355]">Category not found.</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { label: category.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <FilterSidebar
            selectedCategory={categorySlug}
            onCategoryChange={() => {}}
            sortBy={sortBy}
            onSortChange={setSortBy}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[#6B4423] mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-[#8B7355] mb-6">{category.description}</p>
          )}
          {loading ? (
            <p className="text-center text-[#8B7355] py-12">Loading…</p>
          ) : error ? (
            <p className="text-center text-red-600 py-12">{error}</p>
          ) : filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <p className="text-center text-[#8B7355] py-12">No products in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Category;
