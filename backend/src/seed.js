
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/product.model.js';

const TOTAL_PRODUCTS = 200_000;
const BATCH_SIZE = 10_000;

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Sports & Outdoors',
  'Toys & Games',
  'Health & Beauty',
  'Automotive',
  'Garden & Tools',
  'Food & Grocery',
  'Pet Supplies',
  'Office Products',
  'Music & Instruments',
  'Jewelry & Watches',
  'Baby Products',
];

const ADJECTIVES = [
  'Premium', 'Ultra', 'Classic', 'Professional', 'Essential',
  'Advanced', 'Compact', 'Deluxe', 'Portable', 'Smart',
  'Eco-Friendly', 'Heavy-Duty', 'Lightweight', 'Vintage', 'Modern',
  'Ergonomic', 'Wireless', 'Digital', 'Organic', 'Industrial',
];

const NOUNS = [
  'Widget', 'Gadget', 'Device', 'Kit', 'Set',
  'Pack', 'Bundle', 'Station', 'Hub', 'System',
  'Tool', 'Gear', 'Unit', 'Module', 'Component',
  'Accessory', 'Adapter', 'Sensor', 'Controller', 'Monitor',
];


function randInt(max) {
  return (Math.random() * max) | 0;
}

function randPrice() {
  return Math.round((0.99 + Math.random() * 999) * 100) / 100;
}

function randDate(days) {
  const now = Date.now();
  return new Date(now - randInt(days * 24 * 60 * 60 * 1000));
}

function generateProduct(index) {
  const adj = ADJECTIVES[randInt(ADJECTIVES.length)];
  const noun = NOUNS[randInt(NOUNS.length)];
  const category = CATEGORIES[randInt(CATEGORIES.length)];
  const createdAt = randDate(90);

  return {
    name: `${adj} ${noun} ${index + 1}`,
    category,
    price: randPrice(),
    created_at: createdAt,
    
    updated_at: createdAt,
  };
}



async function seed() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('MONGO_URL is not set. Check your .env file.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(mongoUrl);
  console.log('Connected.\n');

  const existing = await Product.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`Dropping ${existing} existing products…`);
    await Product.collection.drop();
    console.log('Dropped.\n');
  }

  console.log(`Generating ${TOTAL_PRODUCTS.toLocaleString()} products…`);
  const allProducts = Array.from({ length: TOTAL_PRODUCTS }, (_, i) =>
    generateProduct(i)
  );
  console.log('Generation complete.\n');

  console.log(
    `Inserting in batches of ${BATCH_SIZE.toLocaleString()}…`
  );
  const startTime = Date.now();

  for (let offset = 0; offset < TOTAL_PRODUCTS; offset += BATCH_SIZE) {
    const batch = allProducts.slice(offset, offset + BATCH_SIZE);
    await Product.insertMany(batch, { ordered: false });

    const progress = Math.min(offset + BATCH_SIZE, TOTAL_PRODUCTS);
    const pct = ((progress / TOTAL_PRODUCTS) * 100).toFixed(0);
    console.log(`  ${progress.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()} (${pct}%)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone. Inserted ${TOTAL_PRODUCTS.toLocaleString()} products in ${elapsed}s.`);

  console.log('Ensuring indexes…');
  await Product.ensureIndexes();
  console.log('Indexes ready.');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
