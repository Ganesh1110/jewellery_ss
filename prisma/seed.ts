import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const CURRENCY = 'INR';

interface ProductSeed {
  handle: string;
  title: string;
  productType: string;
  vendor: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  collection: string;
  tags: string[];
  material: string;
  totalInventory?: number;
}

const products: ProductSeed[] = [
  { handle: 'solitaire-pendant', title: 'The Solitaire Pendant', productType: 'Necklaces', vendor: 'Style Statement by Shakthi Atelier', price: 18500, compareAtPrice: 22500, description: 'A timeless single-stone pendant crafted in 14k gold, designed to sit beautifully at the neckline.', collection: 'diamonds', tags: ['diamond', 'necklace', 'everyday'], material: '14k Gold', totalInventory: 12 },
  { handle: 'halo-engagement-ring', title: 'Halo Engagement Ring', productType: 'Rings', vendor: 'Style Statement by Shakthi Atelier', price: 67500, description: 'Our signature halo ring with a certified center diamond, wrapped in a delicate halo of pavé stones.', collection: 'bridal', tags: ['diamond', 'ring', 'bridal'], material: '18k Yellow Gold', totalInventory: 5 },
  { handle: 'gold-tennis-bracelet', title: 'Gold Tennis Bracelet', productType: 'Bracelets', vendor: 'Style Statement by Shakthi Atelier', price: 32400, compareAtPrice: 36000, description: 'A fluid line of uniformly matched stones in 14k gold, a modern essential for everyday stacking.', collection: 'gold', tags: ['gold', 'bracelet', 'classic'], material: '14k Gold' },
  { handle: 'emerald-drop-earrings', title: 'Emerald Drop Earrings', productType: 'Earrings', vendor: 'Style Statement by Shakthi Atelier', price: 28750, description: 'Certified emeralds suspended in hand-finished gold, glimmering with every turn.', collection: 'gemstones', tags: ['emerald', 'earrings', 'statement'], material: '22k Gold' },
  { handle: 'signet-ring', title: 'Mumbai Signet Ring', productType: 'Rings', vendor: 'Style Statement by Shakthi Atelier', price: 24000, description: 'An engraved signet ring in solid gold — a modern heirloom carrying your story.', collection: 'gold', tags: ['gold', 'ring', 'engraved'], material: '18k Yellow Gold' },
  { handle: 'pearl-strand', title: 'Akoya Pearl Strand', productType: 'Necklaces', vendor: 'Style Statement by Shakthi Atelier', price: 41200, description: 'Lustrous Akoya pearls hand-knotted on silk — an heirloom piece for generations.', collection: 'new-arrivals', tags: ['pearl', 'necklace', 'bridal'], material: 'Pearl & Gold', totalInventory: 8 },
  { handle: 'stackable-bangles', title: 'Stackable Gold Bangles', productType: 'Bracelets', vendor: 'Style Statement by Shakthi Atelier', price: 29800, compareAtPrice: 33500, description: 'A set of slim gold bangles made for stacking and mixing with your own pieces.', collection: 'gold', tags: ['gold', 'bangle', 'stackable'], material: '22k Gold' },
  { handle: 'ruby-studs', title: 'Ruby Stud Earrings', productType: 'Earrings', vendor: 'Style Statement by Shakthi Atelier', price: 15900, description: 'Certified Burmese rubies in classic four-prong gold settings — understated and rich.', collection: 'gemstones', tags: ['ruby', 'earrings', 'everyday'], material: '14k Gold' },
  { handle: 'moonstone-ring', title: 'Moonstone Cocktail Ring', productType: 'Rings', vendor: 'Style Statement by Shakthi Atelier', price: 21300, description: 'A luminous moonstone crowned in pavé, made for evenings that matter.', collection: 'new-arrivals', tags: ['moonstone', 'ring', 'statement'], material: '18k White Gold' },
  { handle: 'diamond-love-band', title: 'Diamond Love Band', productType: 'Rings', vendor: 'Style Statement by Shakthi Atelier', price: 38900, description: 'A band of continuous diamonds that catches the light from every angle.', collection: 'bridal', tags: ['diamond', 'ring', 'bridal'], material: '18k White Gold' },
  { handle: 'rose-quartz-pendant', title: 'Rose Quartz Pendant', productType: 'Necklaces', vendor: 'Style Statement by Shakthi Atelier', price: 12600, description: 'A soft rose quartz heart on a delicate chain — a token of tenderness.', collection: 'new-arrivals', tags: ['rose-quartz', 'necklace', 'everyday'], material: '14k Rose Gold' },
  { handle: 'sapphire-halo-pendant', title: 'Sapphire Halo Pendant', productType: 'Necklaces', vendor: 'Style Statement by Shakthi Atelier', price: 31600, description: 'A deep blue sapphire encircled by tiny diamonds in warm gold settings.', collection: 'gemstones', tags: ['sapphire', 'necklace', 'statement'], material: '18k Yellow Gold' },
];

const collections = [
  { handle: 'new-arrivals', title: 'New Arrivals', description: 'Fresh from the atelier — our latest designs.' },
  { handle: 'gold', title: 'Gold Collection', description: 'Warm gold pieces, handcrafted in our Mumbai atelier.' },
  { handle: 'diamonds', title: 'Diamonds', description: 'Ethically sourced, GIA-certified diamonds.' },
  { handle: 'gemstones', title: 'Gemstones', description: 'Certified colored gemstones with provenance.' },
  { handle: 'bridal', title: 'Bridal', description: 'Engagement rings and heirloom bridal sets.' },
];

const articles = [
  {
    handle: 'buying-diamonds',
    title: 'The Complete Guide to Buying Diamonds',
    excerpt: 'Cut, color, clarity and carat — demystifying the 4Cs so you can choose with confidence.',
    contentHtml: '<p>The journey to the perfect diamond starts long before you see it sparkle. Understanding the four Cs — cut, color, clarity and carat — gives you the language to evaluate any stone on its merits.</p><p><strong>Cut</strong> is the single most important factor. <strong>Color</strong> grades from D (colourless) to Z. <strong>Clarity</strong> describes internal inclusions. And <strong>carat</strong> is simply weight.</p><p>At Style Statement by Shakthi, every diamond is ethically sourced and certified by GIA or IGI.</p>',
    author: 'Ananya Iyer',
    publishedAt: '2024-05-18T00:00:00Z',
  },
  {
    handle: 'care-for-gold-jewelry',
    title: 'How to Care for Your Gold Jewelry',
    excerpt: 'Simple rituals to keep your gold pieces brilliant for a lifetime.',
    contentHtml: '<p>Gold is one of the most durable metals on earth, but it still deserves a little attention.</p><p>Avoid wearing jewelry while swimming or doing heavy chores. Store each piece separately to prevent scratches. To clean, soak in warm soapy water, brush gently with a soft toothbrush, and rinse well.</p><p>Bring your pieces to us once a year for a complimentary professional polish.</p>',
    author: 'Ananya Iyer',
    publishedAt: '2024-04-02T00:00:00Z',
  },
  {
    handle: 'story-behind-pearls',
    title: 'The Story Behind Our Akoya Pearls',
    excerpt: 'From oyster to heirloom — how a pearl is born and how we choose ours.',
    contentHtml: '<p>Each Akoya pearl begins as a tiny bead placed inside an oyster, which then coats it with layer after layer of lustrous nacre.</p><p>We select only pearls with a mirror-like surface and a warm pink overtone, then hand-knot each strand on silk. It is a craft that takes years to master — and the result is a piece that will pass through generations.</p>',
    author: 'Meera Nair',
    publishedAt: '2024-03-12T00:00:00Z',
  },
  {
    handle: 'layering-jewelry',
    title: 'The Art of Layering Jewelry',
    excerpt: 'A modern guide to mixing chains, lengths and textures like a pro.',
    contentHtml: '<p>Layering is the fastest way to make jewelry feel personal. The rule of thumb: mix at least two lengths, vary the textures, and let one statement piece lead.</p><p>Start with a short choker or pendant, add a mid-length chain, and finish with a long piece that grazes the chest. Combine gold tones with pearls or a single gemstone for contrast.</p>',
    author: 'Meera Nair',
    publishedAt: '2024-02-20T00:00:00Z',
  },
];

function image(seed: string, width = 1200, height = 1500) {
  return {
    id: `gid://db/MediaImage/${seed}`,
    url: `https://picsum.photos/seed/sss-${seed}/${width}/${height}`,
    altText: null,
    width,
    height,
  };
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sss.com';
  const passwordHash = await hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, name: 'Store Owner', passwordHash },
  });

  const settings: Array<{ key: string; value: string; label: string; hint: string }> = [
    { key: 'store_name', value: 'Style Statement by Shakthi', label: 'Store Name', hint: 'Shown in the storefront header and metadata' },
    { key: 'store_email', value: 'hello@sss.com', label: 'Store Email', hint: 'Used for order notifications and contact form' },
    { key: 'currency', value: 'INR (₹)', label: 'Currency', hint: 'Currency for pricing and inventory valuation' },
    { key: 'free_shipping_threshold', value: '₹15,000', label: 'Free Shipping Above', hint: 'Complimentary shipping above this cart value' },
    { key: 'return_window', value: '14 days', label: 'Return Window', hint: 'Return period shown on the PDP and checkout' },
    { key: 'low_stock_alerts', value: 'true', label: '', hint: '' },
    { key: 'new_order_alerts', value: 'true', label: '', hint: '' },
    { key: 'shop.name', value: 'Style Statement by Shakthi', label: '', hint: '' },
    { key: 'shop.description', value: 'Curated jewelry for the modern collector.', label: '', hint: '' },
    { key: 'shop.shortDescription', value: 'Founded in Mumbai, Style Statement by Shakthi began with a simple belief: jewelry should be more than adornment. It should be a reflection of your journey.', label: '', hint: '' },
    { key: 'shop.currencyCode', value: 'INR', label: '', hint: '' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  const collectionMap = new Map<string, number>();
  for (const c of collections) {
    const row = await prisma.collection.upsert({
      where: { handle: c.handle },
      update: { title: c.title, description: c.description },
      create: { handle: c.handle, title: c.title, description: c.description, image: image(`col-${c.handle}`, 1600, 1200), seo: { title: c.title, description: c.description } },
    });
    collectionMap.set(c.handle, row.id);
  }

  for (const spec of products) {
    const images = [image(spec.handle), image(`${spec.handle}-b`), image(`${spec.handle}-c`)];
    const product = await prisma.product.upsert({
      where: { handle: spec.handle },
      update: {
        title: spec.title,
        description: spec.description,
        descriptionHtml: `<p>${spec.description}</p>`,
        vendor: spec.vendor,
        productType: spec.productType,
        tags: spec.tags,
        price: spec.price,
        compareAtPrice: spec.compareAtPrice ?? null,
        currencyCode: CURRENCY,
        totalInventory: spec.totalInventory ?? 25,
        featuredImage: images[0],
        images,
        options: [{ id: `gid://db/ProductOption/${spec.handle}-material`, name: 'Material', values: [spec.material] }],
        seo: { title: spec.title, description: spec.description },
        publishedAt: new Date('2024-06-01T00:00:00Z'),
        sku: `SSS-${spec.handle.toUpperCase().replace(/-/g, '')}`,
      },
      create: {
        handle: spec.handle,
        title: spec.title,
        description: spec.description,
        descriptionHtml: `<p>${spec.description}</p>`,
        vendor: spec.vendor,
        productType: spec.productType,
        tags: spec.tags,
        price: spec.price,
        compareAtPrice: spec.compareAtPrice ?? null,
        currencyCode: CURRENCY,
        totalInventory: spec.totalInventory ?? 25,
        featuredImage: images[0],
        images,
        options: [{ id: `gid://db/ProductOption/${spec.handle}-material`, name: 'Material', values: [spec.material] }],
        seo: { title: spec.title, description: spec.description },
        publishedAt: new Date('2024-06-01T00:00:00Z'),
        sku: `SSS-${spec.handle.toUpperCase().replace(/-/g, '')}`,
      },
    });

    const collectionId = collectionMap.get(spec.collection);
    if (collectionId != null) {
      await prisma.collectionItem.upsert({
        where: { collectionId_productId: { collectionId, productId: product.id } },
        update: {},
        create: { collectionId, productId: product.id, position: product.id },
      });
    }
  }

  const blog = await prisma.blog.upsert({
    where: { handle: 'journal' },
    update: { title: 'Journal' },
    create: { handle: 'journal', title: 'Journal' },
  });
  for (const a of articles) {
    await prisma.article.upsert({
      where: { blogId_handle: { blogId: blog.id, handle: a.handle } },
      update: { title: a.title, excerpt: a.excerpt, contentHtml: a.contentHtml, author: a.author },
      create: {
        blogId: blog.id,
        handle: a.handle,
        title: a.title,
        excerpt: a.excerpt,
        contentHtml: a.contentHtml,
        image: image(`article-${a.handle}`, 1200, 800),
        author: a.author,
        publishedAt: new Date(a.publishedAt),
        seo: { title: a.title, description: a.excerpt },
      },
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());