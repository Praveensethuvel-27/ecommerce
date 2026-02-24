export function toProductDto(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(obj._id ?? obj.id),
    name: obj.name,
    slug: obj.slug,
    categoryId: obj.categoryId,
    price: obj.price,
    originalPrice: obj.originalPrice,
    description: obj.description,
    images: obj.images || [],
    stock: obj.stock ?? 0,
    featured: !!obj.featured,
    weightOptions: Array.isArray(obj.weightOptions) ? obj.weightOptions : [],
    ingredients: obj.ingredients || [],
    healthBenefits: obj.healthBenefits || [],
    usageInstructions: obj.usageInstructions || [],
    rating: obj.rating,
    reviewCount: obj.reviewCount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

