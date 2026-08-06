import type {
  Product,
  ProductVariant,
  Collection,
  Menu,
  Shop,
  Article,
  Image,
} from '@/types/shopify';

/**
 * Demo / mock data.
 *
 * Used when the Shopify Storefront API is not configured (missing env vars) or
 * when `NEXT_PUBLIC_USE_MOCK_DATA=true`. This keeps the site fully runnable in
 * demo mode without requiring a live store.
 */

const CURRENCY = 'INR';

function money(amount: number, currencyCode: string = CURRENCY) {
  return { amount, currencyCode };
}

function makeImage(seed: string, width = 1200, height = 1500): Image {
  return {
    id: `gid://shopify/MediaImage/${seed}`,
    url: `https://picsum.photos/seed/sss-${seed}/${width}/${height}`,
    altText: null,
    width,
    height,
  };
}

interface ProductSpec {
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
  available?: boolean;
  totalInventory?: number;
  sale?: boolean;
}

function buildVariant(spec: ProductSpec): ProductVariant {
  const price = spec.price;
  const compareAtPrice =
    spec.sale && spec.compareAtPrice && spec.compareAtPrice > price
      ? spec.compareAtPrice
      : null;

  return {
    id: `gid://shopify/ProductVariant/${spec.handle}-${Math.round(price)}`,
    title: 'Default Title',
    availableForSale: spec.available !== false,
    quantityAvailable: spec.totalInventory ?? 25,
    selectedOptions: [{ name: 'Material', value: spec.material }],
    price: money(price),
    compareAtPrice: compareAtPrice ? money(compareAtPrice) : null,
    image: makeImage(`${spec.handle}-variant`, 900, 1125),
    sku: `SSS-${spec.handle.toUpperCase().replace(/-/g, '')}`,
  };
}

function buildProduct(spec: ProductSpec): Product {
  const price = spec.price;
  const compareAtPrice =
    spec.sale && spec.compareAtPrice && spec.compareAtPrice > price
      ? spec.compareAtPrice
      : null;
  const image = makeImage(spec.handle);
  const images = [image, makeImage(`${spec.handle}-b`), makeImage(`${spec.handle}-c`)];

  return {
    id: `gid://shopify/Product/${spec.handle}`,
    handle: spec.handle,
    title: spec.title,
    description: spec.description,
    descriptionHtml: `<p>${spec.description}</p>`,
    vendor: spec.vendor,
    productType: spec.productType,
    tags: spec.tags,
    availableForSale: spec.available !== false,
    totalInventory: spec.totalInventory ?? 25,
    images: {
      edges: images.map((node) => ({ node })),
      pageInfo: { hasNextPage: false },
    },
    featuredImage: image,
    options: [
      {
        id: `gid://shopify/ProductOption/${spec.handle}-material`,
        name: 'Material',
        values: [spec.material],
      },
    ],
    variants: {
      edges: [{ node: buildVariant(spec) }],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
    priceRange: {
      minVariantPrice: money(price),
      maxVariantPrice: money(price),
    },
    compareAtPriceRange: compareAtPrice
      ? { minVariantPrice: money(compareAtPrice), maxVariantPrice: money(compareAtPrice) }
      : null,
    seo: { title: spec.title, description: spec.description },
    updatedAt: '2024-06-01T00:00:00Z',
    publishedAt: '2024-06-01T00:00:00Z',
  };
}

export const mockCurrencyCode = CURRENCY;

export const mockProductSpecs: ProductSpec[] = [
  {
    handle: 'solitaire-pendant',
    title: 'The Solitaire Pendant',
    productType: 'Necklaces',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 18500,
    compareAtPrice: 22500,
    description:
      'A timeless single-stone pendant crafted in 14k gold, designed to sit beautifully at the neckline.',
    collection: 'diamonds',
    tags: ['diamond', 'necklace', 'everyday'],
    material: '14k Gold',
    sale: true,
    totalInventory: 12,
  },
  {
    handle: 'halo-engagement-ring',
    title: 'Halo Engagement Ring',
    productType: 'Rings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 67500,
    description:
      'Our signature halo ring with a certified center diamond, wrapped in a delicate halo of pavé stones.',
    collection: 'bridal',
    tags: ['diamond', 'ring', 'bridal'],
    material: '18k Yellow Gold',
    totalInventory: 5,
  },
  {
    handle: 'gold-tennis-bracelet',
    title: 'Gold Tennis Bracelet',
    productType: 'Bracelets',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 32400,
    compareAtPrice: 36000,
    description:
      'A fluid line of uniformly matched stones in 14k gold, a modern essential for everyday stacking.',
    collection: 'gold',
    tags: ['gold', 'bracelet', 'classic'],
    material: '14k Gold',
    sale: true,
  },
  {
    handle: 'emerald-drop-earrings',
    title: 'Emerald Drop Earrings',
    productType: 'Earrings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 28750,
    description:
      'Certified emeralds suspended in hand-finished gold, glimmering with every turn.',
    collection: 'gemstones',
    tags: ['emerald', 'earrings', 'statement'],
    material: '22k Gold',
  },
  {
    handle: 'signet-ring',
    title: 'Mumbai Signet Ring',
    productType: 'Rings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 24000,
    description:
      'An engraved signet ring in solid gold — a modern heirloom carrying your story.',
    collection: 'gold',
    tags: ['gold', 'ring', 'engraved'],
    material: '18k Yellow Gold',
  },
  {
    handle: 'pearl-strand',
    title: 'Akoya Pearl Strand',
    productType: 'Necklaces',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 41200,
    description:
      'Lustrous Akoya pearls hand-knotted on silk — an heirloom piece for generations.',
    collection: 'new-arrivals',
    tags: ['pearl', 'necklace', 'bridal'],
    material: 'Pearl & Gold',
    totalInventory: 8,
  },
  {
    handle: 'stackable-bangles',
    title: 'Stackable Gold Bangles',
    productType: 'Bracelets',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 29800,
    compareAtPrice: 33500,
    description:
      'A set of slim gold bangles made for stacking and mixing with your own pieces.',
    collection: 'gold',
    tags: ['gold', 'bangle', 'stackable'],
    material: '22k Gold',
    sale: true,
  },
  {
    handle: 'ruby-studs',
    title: 'Ruby Stud Earrings',
    productType: 'Earrings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 15900,
    description:
      'Certified Burmese rubies in classic four-prong gold settings — understated and rich.',
    collection: 'gemstones',
    tags: ['ruby', 'earrings', 'everyday'],
    material: '14k Gold',
  },
  {
    handle: 'moonstone-ring',
    title: 'Moonstone Cocktail Ring',
    productType: 'Rings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 21300,
    description:
      'A luminous moonstone crowned in pavé, made for evenings that matter.',
    collection: 'new-arrivals',
    tags: ['moonstone', 'ring', 'statement'],
    material: '18k White Gold',
  },
  {
    handle: 'diamond-love-band',
    title: 'Diamond Love Band',
    productType: 'Rings',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 38900,
    description:
      'A band of continuous diamonds that catches the light from every angle.',
    collection: 'bridal',
    tags: ['diamond', 'ring', 'bridal'],
    material: '18k White Gold',
  },
  {
    handle: 'rose-quartz-pendant',
    title: 'Rose Quartz Pendant',
    productType: 'Necklaces',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 12600,
    description:
      'A soft rose quartz heart on a delicate chain — a token of tenderness.',
    collection: 'new-arrivals',
    tags: ['rose-quartz', 'necklace', 'everyday'],
    material: '14k Rose Gold',
  },
  {
    handle: 'sapphire-halo-pendant',
    title: 'Sapphire Halo Pendant',
    productType: 'Necklaces',
    vendor: 'Style Statement by Shakthi Atelier',
    price: 31600,
    description:
      'A deep blue sapphire encircled by tiny diamonds in warm gold settings.',
    collection: 'gemstones',
    tags: ['sapphire', 'necklace', 'statement'],
    material: '18k Yellow Gold',
  },
];

export const mockProducts: Product[] = mockProductSpecs.map(buildProduct);

function emptyCollection(id: string, handle: string, title: string, description: string, seed: string): Collection {
  return {
    id,
    handle,
    title,
    description,
    descriptionHtml: '',
    image: makeImage(seed),
    seo: { title, description },
    updatedAt: '2024-06-01T00:00:00Z',
    products: {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
  };
}

export const mockCollections: Collection[] = [
  {
    ...emptyCollection('gid://shopify/Collection/all', 'all', 'All Jewelry', 'Every piece in our collection.', 'col-all'),
    image: null,
  },
  emptyCollection('gid://shopify/Collection/new-arrivals', 'new-arrivals', 'New Arrivals', 'Fresh from the atelier — our latest designs.', 'col-new'),
  emptyCollection('gid://shopify/Collection/bestsellers', 'bestsellers', 'Bestsellers', 'The pieces our collectors love most.', 'col-best'),
  emptyCollection('gid://shopify/Collection/gold', 'gold', 'Gold Collection', 'Warm gold pieces, handcrafted in our Mumbai atelier.', 'col-gold'),
  emptyCollection('gid://shopify/Collection/diamonds', 'diamonds', 'Diamonds', 'Ethically sourced, GIA-certified diamonds.', 'col-diamond'),
  emptyCollection('gid://shopify/Collection/gemstones', 'gemstones', 'Gemstones', 'Certified colored gemstones with provenance.', 'col-gem'),
  emptyCollection('gid://shopify/Collection/bridal', 'bridal', 'Bridal', 'Engagement rings and heirloom bridal sets.', 'col-bridal'),
];

function productsInCollection(handle: string): Product[] {
  if (handle === 'all') return [...mockProducts];
  if (handle === 'bestsellers') return mockProducts.filter((p) => p.compareAtPriceRange);
  return mockProducts.filter(
    (p) => mockProductSpecs.find((s) => s.handle === p.handle)?.collection === handle
  );
}

export function mockCollection(handle: string): Collection | null {
  const base = mockCollections.find((c) => c.handle === handle);
  if (!base) return null;
  const products = productsInCollection(handle);
  return {
    ...base,
    products: {
      edges: products.map((node) => ({ node, cursor: node.handle })),
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
  };
}

export function mockProduct(handle: string): Product | null {
  return mockProducts.find((p) => p.handle === handle) || null;
}

export function mockRecommendations(productId: string): Product[] {
  return mockProducts.filter((p) => p.id !== productId).slice(0, 4);
}

export function mockSearchProducts(query?: string): Product[] {
  if (!query) return mockProducts;
  const q = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.productType.toLowerCase().includes(q) ||
      p.vendor.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export const mockMenus: Menu[] = [
  {
    id: 'gid://shopify/Menu/main-menu',
    handle: 'main-menu',
    title: 'Main Menu',
    items: [
      {
        id: 'gid://shopify/MenuItem/shop',
        title: 'Shop',
        url: '/collections',
        resourceType: 'COLLECTION',
        items: mockCollections
          .filter((c) => c.handle !== 'all')
          .slice(0, 5)
          .map((c) => ({
            id: `gid://shopify/MenuItem/${c.handle}`,
            title: c.title,
            url: `/collections/${c.handle}`,
            resourceType: 'COLLECTION' as const,
          })),
      },
      {
        id: 'gid://shopify/MenuItem/explore',
        title: 'Explore',
        url: '/journal',
        resourceType: 'LINK',
        items: [
          { id: 'gid://shopify/MenuItem/journal', title: 'Journal', url: '/journal' },
          { id: 'gid://shopify/MenuItem/about', title: 'Our Story', url: '/about' },
          { id: 'gid://shopify/MenuItem/contact', title: 'Contact', url: '/contact' },
        ].map((i) => ({ ...i, resourceType: 'LINK' as const })),
      },
    ],
  },
];

export const mockShop: Shop = {
  name: 'Style Statement by Shakthi',
  description: 'Curated jewelry for the modern collector.',
  brand: {
    logo: null,
    coverImage: makeImage('brand-story', 1200, 1500),
    shortDescription:
      'Founded in Mumbai, Style Statement by Shakthi began with a simple belief: jewelry should be more than adornment. It should be a reflection of your journey.',
  },
  primaryDomain: { url: 'http://localhost:3000', host: 'localhost:3000' },
  currencyCode: 'INR',
  countriesInShipping: ['IN', 'US', 'GB', 'AE', 'SG'],
  paymentSettings: {
    acceptedPaymentMethods: ['visa', 'master', 'american_express', 'paypal', 'unionpay'],
  },
  policies: {
    privacyPolicy: {
      id: 'gid://shopify/Policy/privacy',
      title: 'Privacy Policy',
      body: '',
      url: '/privacy-policy',
    },
    refundPolicy: {
      id: 'gid://shopify/Policy/refund',
      title: 'Refund Policy',
      body: '',
      url: '/refund-policy',
    },
    termsOfService: {
      id: 'gid://shopify/Policy/terms',
      title: 'Terms of Service',
      body: '',
      url: '/terms-of-service',
    },
    shippingPolicy: {
      id: 'gid://shopify/Policy/shipping',
      title: 'Shipping Policy',
      body: '',
      url: '/shipping-policy',
    },
  },
};

function makeArticle(
  handle: string,
  title: string,
  excerpt: string,
  contentHtml: string,
  seed: string,
  author: string,
  publishedAt: string
): Article {
  return {
    id: `gid://shopify/Article/${handle}`,
    handle,
    title,
    excerpt,
    contentHtml,
    image: makeImage(seed, 1200, 800),
    author: { name: author, bio: null, image: null },
    publishedAt,
    blog: { id: 'gid://shopify/Blog/journal', handle: 'journal', title: 'Journal' },
    seo: { title, description: excerpt },
  };
}

export const mockArticles: Article[] = [
  makeArticle(
    'buying-diamonds',
    'The Complete Guide to Buying Diamonds',
    'Cut, color, clarity and carat — demystifying the 4Cs so you can choose with confidence.',
    `<p>The journey to the perfect diamond starts long before you see it sparkle. Understanding the four Cs — cut, color, clarity and carat — gives you the language to evaluate any stone on its merits.</p><p><strong>Cut</strong> is the single most important factor. A well-cut diamond reflects light from facet to facet, creating brilliance that a poorly proportioned stone simply cannot match. <strong>Color</strong> grades from D (colourless) to Z. <strong>Clarity</strong> describes internal inclusions — most are invisible to the naked eye. And <strong>carat</strong> is simply weight.</p><p>At Style Statement by Shakthi, every diamond is ethically sourced and certified by GIA or IGI, so you can shop with total confidence.</p>`,
    'diamond-guide',
    'Ananya Iyer',
    '2024-05-18T00:00:00Z'
  ),
  makeArticle(
    'care-for-gold-jewelry',
    'How to Care for Your Gold Jewelry',
    'Simple rituals to keep your gold pieces brilliant for a lifetime.',
    `<p>Gold is one of the most durable metals on earth, but it still deserves a little attention. Here's how to keep your pieces looking their best.</p><p>Avoid wearing jewelry while swimming or doing heavy chores — chlorine can dull the surface. Store each piece separately to prevent scratches, ideally in a soft pouch. To clean, soak in warm soapy water for a few minutes, brush gently with a soft toothbrush, and rinse well.</p><p>Bring your pieces to us once a year for a complimentary professional polish.</p>`,
    'gold-care',
    'Ananya Iyer',
    '2024-04-02T00:00:00Z'
  ),
  makeArticle(
    'story-behind-pearls',
    'The Story Behind Our Akoya Pearls',
    'From oyster to heirloom — how a pearl is born and how we choose ours.',
    `<p>Each Akoya pearl begins as a tiny bead placed inside an oyster, which then coats it with layer after layer of lustrous nacre. A single high-grade pearl can take up to two years to grow.</p><p>We select only pearls with a mirror-like surface and a warm pink overtone, then hand-knot each strand on silk so the pearls never rub against one another. It is a craft that takes years to master — and the result is a piece that will pass through generations.</p>`,
    'pearl-story',
    'Meera Nair',
    '2024-03-12T00:00:00Z'
  ),
  makeArticle(
    'layering-jewelry',
    'The Art of Layering Jewelry',
    'A modern guide to mixing chains, lengths and textures like a pro.',
    `<p>Layering is the fastest way to make jewelry feel personal. The rule of thumb: mix at least two lengths, vary the textures, and let one statement piece lead.</p><p>Start with a short choker or pendant, add a mid-length chain, and finish with a long piece that grazes the chest. Combine gold tones with pearls or a single gemstone for contrast. And remember — restraint is the secret to effortless layering.</p>`,
    'layering-guide',
    'Meera Nair',
    '2024-02-20T00:00:00Z'
  ),
];

export function mockArticlesForBlog(blogHandle: string): { edges: Array<{ node: Article; cursor: string }> } {
  return {
    edges: mockArticles
      .filter((a) => a.blog.handle === blogHandle)
      .map((node) => ({ node, cursor: node.handle })),
  };
}

export function mockArticle(blogHandle: string, articleHandle: string): Article | null {
  return mockArticles.find(
    (a) => a.handle === articleHandle && a.blog.handle === blogHandle
  ) || null;
}

export function mockBlogs(): Array<{ id: string; handle: string; title: string }> {
  const blogs: Record<string, { id: string; handle: string; title: string }> = {};
  mockArticles.forEach((a) => {
    blogs[a.blog.handle] = { id: a.blog.id, handle: a.blog.handle, title: a.blog.title };
  });
  return Object.values(blogs);
}

/* ------------------------------ Mock Cart ------------------------------ */

import type { Cart, CartLine } from '@/types/shopify';

const MOCK_CART_KEY = 'sss_mock_cart';

export function createMockCart(): Cart {
  return {
    id: `gid://shopify/Cart/mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    checkoutUrl: '/checkout',
    totalQuantity: 0,
    lines: { edges: [] },
    cost: {
      subtotalAmount: money(0),
      totalAmount: money(0),
      totalTaxAmount: null,
      totalDutyAmount: null,
    },
    discountCodes: [],
    buyerIdentity: { countryCode: null, email: null, phone: null },
    attributes: [],
    note: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function toCartLine(
  merchandiseId: string,
  quantity: number,
  attributes?: Array<{ key: string; value: string }>
): CartLine | null {
  const product = mockProducts.find((p) =>
    p.variants.edges.some(({ node }) => node.id === merchandiseId)
  );
  const variant = product?.variants.edges.find(({ node }) => node.id === merchandiseId)?.node;
  if (!product || !variant) return null;

  const unitPrice = variant.price.amount;

  return {
    id: `gid://shopify/CartLine/mock-${Math.random().toString(36).slice(2, 10)}`,
    quantity,
    merchandise: variant,
    cost: {
      totalAmount: money(unitPrice * quantity),
      amountPerQuantity: money(unitPrice),
    },
    attributes: attributes || [],
    discounts: [],
  };
}

function recomputeCart(cart: Cart): Cart {
  const lines = cart.lines.edges.map(({ node }) => node);
  const subtotal = lines.reduce((sum, line) => sum + line.cost.totalAmount.amount, 0);
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    ...cart,
    totalQuantity,
    lines: { edges: lines.map((node) => ({ node })) },
    cost: {
      subtotalAmount: money(subtotal),
      totalAmount: money(subtotal),
      totalTaxAmount: null,
      totalDutyAmount: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function mockFetchCart(cartId: string): Cart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MOCK_CART_KEY);
    if (!raw) return null;
    const cart = JSON.parse(raw) as Cart;
    return cart.id === cartId ? cart : null;
  } catch {
    return null;
  }
}

export function mockCreateCart(): Cart {
  const cart = createMockCart();
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
  }
  return cart;
}

export function mockAddToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Cart {
  let cart = mockFetchCart(cartId) || createMockCart();

  const existing = [...cart.lines.edges.map(({ node }) => node)];
  for (const line of lines) {
    const existingLine = existing.find(
      (l) =>
        l.merchandise.id === line.merchandiseId &&
        JSON.stringify(l.attributes) === JSON.stringify(line.attributes || [])
    );
    const newLine = toCartLine(line.merchandiseId, line.quantity, line.attributes);
    if (!newLine) continue;
    if (existingLine) {
      existingLine.quantity += line.quantity;
      existingLine.cost.totalAmount = money(existingLine.merchandise.price.amount * existingLine.quantity);
    } else {
      existing.push(newLine);
    }
  }

  cart = recomputeCart({ ...cart, lines: { edges: existing.map((node) => ({ node })) } });
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
  }
  return cart;
}

export function mockUpdateCartLine(
  cartId: string,
  lines: Array<{ id: string; merchandiseId: string; quantity: number }>
): Cart {
  let cart = mockFetchCart(cartId) || createMockCart();
  const updated = cart.lines.edges.map(({ node }) => node);
  for (const update of lines) {
    const line = updated.find((l) => l.id === update.id);
    if (line) {
      line.quantity = Math.max(0, update.quantity);
      line.cost.totalAmount = money(line.merchandise.price.amount * line.quantity);
    }
  }
  const kept = updated.filter((l) => l.quantity > 0);
  cart = recomputeCart({ ...cart, lines: { edges: kept.map((node) => ({ node })) } });
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
  }
  return cart;
}

export function mockRemoveFromCart(cartId: string, lineIds: string[]): Cart {
  let cart = mockFetchCart(cartId) || createMockCart();
  const kept = cart.lines.edges
    .map(({ node }) => node)
    .filter((l) => !lineIds.includes(l.id));
  cart = recomputeCart({ ...cart, lines: { edges: kept.map((node) => ({ node })) } });
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
  }
  return cart;
}

export function mockUpdateCartNote(cartId: string, note: string): Cart {
  let cart = mockFetchCart(cartId) || createMockCart();
  cart = recomputeCart({ ...cart, note });
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_CART_KEY, JSON.stringify(cart));
  }
  return cart;
}
