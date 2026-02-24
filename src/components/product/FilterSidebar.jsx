import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { categories } from '../../data/categories';

const getSortOptions = (t) => [
  { value: 'popularity', label: t('filter.sort.popularity') },
  { value: 'price-low', label: t('filter.sort.priceLow') },
  { value: 'price-high', label: t('filter.sort.priceHigh') },
  { value: 'newest', label: t('filter.sort.newest') },
];

function FilterSidebar({ 
  selectedCategory, 
  onCategoryChange, 
  sortBy, 
  onSortChange,
  priceRange,
  onPriceRangeChange 
}) {
  const { t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortOptions = getSortOptions(t);
  
  // Get translated category name
  const getCategoryName = (cat) => {
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
    <div className="space-y-6">
      <div className="lg:hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-white rounded-xl border border-[#8B7355]/20 text-[#6B4423]"
        >
          {t('filter.filtersAndSort')}
          <ChevronDown className={`w-5 h-5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`space-y-6 ${!filtersOpen ? 'hidden lg:block' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-[#6B4423] mb-2">{t('filter.category')}</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
          >
            <option value="">{t('filter.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {getCategoryName(cat)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4423] mb-2">{t('filter.sortBy')}</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B4423] mb-2">{t('filter.priceRange')}</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder={t('filter.min')}
              value={priceRange.min || ''}
              onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 rounded-lg border border-[#8B7355]/30 bg-white text-[#6B4423]"
            />
            <span className="text-[#8B7355]">-</span>
            <input
              type="number"
              placeholder={t('filter.max')}
              value={priceRange.max || ''}
              onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 rounded-lg border border-[#8B7355]/30 bg-white text-[#6B4423]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
