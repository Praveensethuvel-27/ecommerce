import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

// Mock contexts
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

vi.mock('../../context/OffersContext', () => ({
  useOffers: () => ({ offers: [] }),
  getOfferForProduct: () => null,
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    _id: '1',
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    images: ['test-image.jpg'],
    weightOptions: [{ weight: '500g', price: 100 }],
    rating: 4.5,
    reviewCount: 10
  };

  it('renders product details correctly', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/\(10 reviews\)/)).toBeInTheDocument();
  });

  it('renders a fallback initial when no image is provided', () => {
    const productWithoutImage = { ...mockProduct, images: [] };
    render(
      <MemoryRouter>
        <ProductCard product={productWithoutImage} />
      </MemoryRouter>
    );

    // Initial character of 'Test Product'
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('shows sale badge when original price is higher than price', () => {
    const discountedProduct = { ...mockProduct, originalPrice: 150 };
    render(
      <MemoryRouter>
        <ProductCard product={discountedProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText('common.sale')).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument(); // Strikethrough price
  });
});
