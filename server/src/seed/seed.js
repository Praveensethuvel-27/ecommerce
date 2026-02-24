import { connectDb } from '../config/db.js';
import { ensureSeedAdmin } from './ensureAdmin.js';
import { Product } from '../models/Product.js';

async function main() {
  await connectDb();
  await ensureSeedAdmin();

  const force = process.argv.includes('--force');
  if (force) {
    await Product.deleteMany({});
  }

  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`Products already seeded (${count}). Use --force to reseed.`);
    return;
  }

  await Product.insertMany([
    {
      name: 'Nalangu Maavu',
      slug: 'nalangu-maavu',
      categoryId: '1',
      price: 299,
      originalPrice: 349,
      description: 'Traditional bath powder made from natural ingredients.',
      images: [],
      stock: 50,
      featured: true,
      ingredients: ['Rice flour', 'Chickpea flour', 'Turmeric'],
      healthBenefits: ['Natural skin nourishment', 'Promotes glowing skin'],
      usageInstructions: ['Mix with water to form a paste', 'Apply and rinse'],
      rating: 4.8,
      reviewCount: 124,
    },
    {
      name: 'Kasturi Manjal',
      slug: 'kasturi-manjal',
      categoryId: '1',
      price: 449,
      description: 'Premium wild turmeric powder.',
      images: [],
      stock: 30,
      featured: true,
      ingredients: ['100% Kasturi Manjal (wild turmeric)'],
      healthBenefits: ['Reduces inflammation', 'Brightens skin'],
      usageInstructions: ['Mix with honey', 'Apply as face pack', 'Rinse'],
      rating: 4.9,
      reviewCount: 89,
    },
    {
      name: 'Weight Loss Mix',
      slug: 'weight-loss-mix',
      categoryId: '4',
      price: 399,
      description: 'Blended mix of grains and spices to support weight management.',
      images: [],
      stock: 55,
      featured: true,
      ingredients: ['Millets', 'Fenugreek', 'Cumin'],
      healthBenefits: ['Supports metabolism', 'Keeps you full longer'],
      usageInstructions: ['Mix in hot water', 'Consume as meal replacement'],
      rating: 4.7,
      reviewCount: 112,
    },
  ]);

  console.log('Seeded products.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

