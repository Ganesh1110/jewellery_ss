# MySQL Database + API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Turn the store from mock/localStorage-backed demo data into a fully dynamic, database-driven store backed by MySQL and served through Next.js API routes.

**Architecture:** Prisma ORM reads/writes a local MySQL database. Existing server-side data-layer function names/types in `src/lib/shopify.ts` are preserved but reimplemented over Prisma, so server pages keep working unchanged. Client operations (cart, checkout, admin CRUD) go through REST API routes. Admin auth is database-backed using a session token in an `httpOnly` cookie.

**Tech Stack:** Next.js 14 (App Router), Prisma 5 + MySQL 8, bcryptjs, Tailwind (unchanged), TypeScript.

## Global Constraints

- MySQL database named `sss_ecommerce` (created in DBeaver by the user).
- `DATABASE_URL` env var is the single source of truth for the connection; local now, hosted later.
- Keep the types in `src/types/shopify.ts` unchanged — components depend on them.
- Keep exported function names in `src/lib/shopify.ts` for server consumers: `fetchProducts`, `fetchProduct`, `fetchProductRecommendations`, `fetchCollections`, `fetchCollection`, `fetchMenu`, `fetchMenus`, `fetchShop`, `fetchBlogs`, `fetchArticles`, `fetchArticle`.
- Prisma client singleton must live in `src/lib/prisma.ts`. **Never import Prisma from a client component** — `src/lib/shopify.ts` stays server-only; client cart code moves to `src/lib/cart-api.ts`.
- Money stored as `Decimal(12,2)`, converted to `number` in mappers (the `MoneyV2.amount` type).
- Currency default `INR`.
- Session cookie name: `sss_admin_session`.
- Default seeded admin login: email `admin@sss.com`, password `admin123`.
- No mock-data or localStorage data paths may remain after the final task.

---

## File Structure

**Create:**
- `prisma/schema.prisma` — full MySQL schema
- `prisma/seed.ts` — idempotent seed (admin user, settings, collections, products, blog, articles)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/db-mappers.ts` — DB row <-> `@/types/shopify` mappers + `gidToId`
- `src/types/admin.ts` — admin-facing input/response types
- `src/lib/auth.ts` — server-only session/auth helpers
- `src/lib/cart-api.ts` — client-safe cart fetch wrappers
- `src/app/api/auth/login/route.ts`, `.../logout/route.ts`, `.../me/route.ts`
- `src/app/api/cart/route.ts`, `src/app/api/cart/items/route.ts`, `src/app/api/cart/note/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/admin/products/route.ts`, `src/app/api/admin/products/[id]/route.ts`
- `src/app/api/admin/inventory/[handle]/route.ts`
- `src/app/api/admin/settings/route.ts`
- `src/app/api/admin/orders/route.ts`, `src/app/api/admin/orders/[id]/route.ts`
- `src/app/admin/AdminShell.tsx` — client admin chrome (nav/footer/auth guard)

**Modify:**
- `package.json` — deps, `db:seed` scripts, `prisma.seed` config
- `.env.local`, `.env.example` — `DATABASE_URL`, admin env vars
- `src/lib/shopify.ts` — rewrite server functions over Prisma; drop Shopify GraphQL + mock imports
- `src/context/CartContext.tsx` — import cart functions from `@/lib/cart-api`
- `src/app/admin/layout.tsx` — server session check + render `AdminShell`
- `src/app/admin/login/page.tsx` — POST `/api/auth/login`
- `src/app/admin/inventory/page.tsx` — use admin API
- `src/app/admin/products/new/page.tsx` — use `POST /api/admin/products`
- `src/app/admin/orders/page.tsx` — use admin orders API
- `src/app/admin/settings/page.tsx` — use admin settings API
- `src/components/cart/CheckoutCapture.tsx` — POST `/api/checkout`

**Delete:**
- `src/lib/mock-data.ts`
- `src/lib/custom-products.ts`

---

### Task 1: Prisma scaffold, schema, client, migration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Modify: `package.json`
- Modify: `.env.local`, `.env.example`

**Interfaces:**
- Produces: `prisma` client singleton (imported by later tasks), MySQL tables, `DATABASE_URL` env.

- [x] **Step 1: Install dependencies**

Run:
```bash
npm install @prisma/client bcryptjs
npm install -D prisma tsx @types/bcryptjs
```

- [x] **Step 2: Add env vars**

`.env.local` — append:
```
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/sss_ecommerce"
ADMIN_EMAIL="admin@sss.com"
ADMIN_PASSWORD="admin123"
```
`.env.example` — append the same three keys with placeholder values.

- [x] **Step 3: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Session {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Setting {
  key       String   @id
  value     String
  label     String   @default("")
  hint      String   @default("")
  updatedAt DateTime @updatedAt
}

model Collection {
  id              Int              @id @default(autoincrement())
  handle          String           @unique
  title           String
  description     String           @default("")
  descriptionHtml String           @default("")
  image           Json?
  seo             Json?
  updatedAt       DateTime         @updatedAt
  createdAt       DateTime         @default(now())
  items           CollectionItem[]
}

model CollectionItem {
  id           Int        @id @default(autoincrement())
  collectionId Int
  productId    Int
  position     Int        @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([collectionId, productId])
}

model Product {
  id               Int             @id @default(autoincrement())
  handle           String          @unique
  title            String
  description      String          @default("")
  descriptionHtml  String          @default("")
  vendor           String          @default("Style Statement by Shakthi Atelier")
  productType      String          @default("Jewelry")
  tags             Json            @default("[]")
  availableForSale Boolean         @default(true)
  totalInventory   Int             @default(0)
  price            Decimal         @db.Decimal(12, 2)
  compareAtPrice   Decimal?        @db.Decimal(12, 2)
  currencyCode     String          @default("INR")
  sku              String?
  featuredImage    Json?
  images           Json            @default("[]")
  options          Json            @default("[]")
  seo              Json?
  publishedAt      DateTime?
  updatedAt        DateTime        @updatedAt
  createdAt        DateTime        @default(now())
  collections      CollectionItem[]
  cartItems        CartItem[]
  orderItems       OrderItem[]
}

model Order {
  id            Int         @id @default(autoincrement())
  orderNumber   String      @unique
  status        String      @default("Processing")
  customerName  String      @default("Walk-in Checkout")
  customerEmail String      @default("")
  customerPhone String?
  address       Json?
  subtotal      Decimal     @db.Decimal(12, 2)
  shipping      Decimal     @db.Decimal(12, 2) @default(0)
  total         Decimal     @db.Decimal(12, 2)
  currencyCode  String      @default("INR")
  paymentMethod String      @default("COD")
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  items         OrderItem[]
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  orderId   Int
  productId Int
  title     String
  handle    String
  price     Decimal @db.Decimal(12, 2)
  quantity  Int
  image     Json?
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
}

model Cart {
  id        Int        @id @default(autoincrement())
  token     String     @unique
  note      String?
  updatedAt DateTime   @updatedAt
  createdAt DateTime   @default(now())
  items     CartItem[]
}

model CartItem {
  id        Int     @id @default(autoincrement())
  cartId    Int
  productId Int
  quantity  Int
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
}

model Blog {
  id       Int       @id @default(autoincrement())
  handle   String    @unique
  title    String
  articles Article[]
}

model Article {
  id          Int      @id @default(autoincrement())
  handle      String   @unique
  blogId      Int
  title       String
  excerpt     String   @default("")
  contentHtml String   @default("")
  image       Json?
  author      String   @default("")
  publishedAt DateTime
  seo         Json?
  blog        Blog     @relation(fields: [blogId], references: [id], onDelete: Cascade)

  @@unique([blogId, handle])
}
```

- [x] **Step 4: Create `src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [x] **Step 5: Add npm scripts to `package.json`**

```json
"db:migrate": "prisma migrate dev",
"db:seed": "prisma db seed",
"db:studio": "prisma studio",
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```
(The `"prisma"` key is a top-level key in `package.json`, added after `scripts`.)

- [x] **Step 6: Generate client and run initial migration**

Run:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Expected: migration applied, `@prisma/client` generated without error. The database `sss_ecommerce` must already exist (user creates it in DBeaver with `CREATE DATABASE sss_ecommerce CHARACTER SET utf8mb4;`).

- [x] **Step 7: Verify**

Run: `npm run type-check`
Expected: no errors.

- [x] **Step 8: Commit**

```bash
git add prisma src/lib/prisma.ts package.json package-lock.json .env.example .env.local
git commit -m "feat: add Prisma MySQL schema and client"
```

---

### Task 2: Seed script

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Produces: seeded DB rows consumed by Task 3+; runnable via `npm run db:seed`; idempotent (upserts).
- Consumes: `prisma` client from Task 1.

- [x] **Step 1: Write `prisma/seed.ts`**

```ts
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
```

- [x] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: `Seed complete`; in DBeaver you can see rows in `User`, `Setting`, `Collection`, `Product`, `Blog`, `Article`.

- [x] **Step 3: Verify idempotency**

Run: `npm run db:seed` again
Expected: no duplicate errors; row counts unchanged.

- [x] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add database seed script"
```

---

### Task 3: DB mappers and server data layer

**Files:**
- Create: `src/lib/db-mappers.ts`
- Create: `src/types/admin.ts`
- Modify: `src/lib/shopify.ts` (full rewrite)

**Interfaces:**
- Produces:
  - `toImage(json): Image | null`
  - `productRecordToProduct(row: Product): Product`
  - `cartRecordToCart(cart, items: Array<CartItem & { product: Product }>): Cart`
  - `collectionRecordToCollection(row: Collection, products: Product[]): Collection`
  - `articleRecordToArticle(row: Article): Article`
  - `gidToId(gid: string): number | null`
  - `parseAfter(after?: string): number`
  - `buildShop(settings: Setting[]): Shop`
  - `buildMenus(collections: Collection[]): Menu[]`
- Consumes: `prisma` client (Task 1), types from `@/types/shopify` (unchanged).

- [x] **Step 1: Create `src/types/admin.ts`**

```ts
export interface CustomProductInput {
  title: string;
  handle?: string;
  description: string;
  productType: string;
  vendor: string;
  price: number;
  compareAtPrice?: number;
  collectionHandle: string;
  tags: string[];
  images: string[];
  totalInventory?: number;
  options?: Array<{ name: string; values: string[] }>;
}

export interface InventoryUpdate {
  totalInventory?: number;
  price?: number;
  compareAtPrice?: number;
  availableForSale?: boolean;
}

export interface StoreConfigRow {
  key: string;
  label: string;
  value: string;
  hint: string;
}

export interface StoreAlerts {
  lowStock: boolean;
  newOrder: boolean;
}

export interface StoredOrderItem {
  title: string;
  image: string;
  quantity: number;
}

export interface StoredOrder {
  id: number;
  orderNumber: string;
  name: string;
  email: string;
  createdAt: string;
  total: number;
  currencyCode: string;
  lineItems: StoredOrderItem[];
  status: string;
}
```

- [x] **Step 2: Create `src/lib/db-mappers.ts`**

```ts
import type { Prisma, Product as DbProduct, Collection as DbCollection, Cart as DbCart, CartItem as DbCartItem, Article as DbArticle, Setting } from '@prisma/client';
import type { Image, Product, ProductVariant, Cart, CartLine, Collection, Article, Shop, Menu, MenuItem } from '@/types/shopify';

export const GID_PREFIX = 'gid://db';

export function gidToId(gid: string): number | null {
  const n = Number(gid.split('/').pop());
  return Number.isNaN(n) ? null : n;
}

export function parseAfter(after?: string): number {
  if (!after) return 0;
  const n = Number(after);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export function toImage(json: Prisma.JsonValue | null): Image | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  if (typeof o.url !== 'string') return null;
  return {
    id: typeof o.id === 'string' ? o.id : '',
    url: o.url,
    altText: typeof o.altText === 'string' ? o.altText : null,
    width: typeof o.width === 'number' ? o.width : 1200,
    height: typeof o.height === 'number' ? o.height : 1500,
  };
}

function variantForProduct(p: DbProduct): ProductVariant {
  const price = Number(p.price);
  const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
  return {
    id: `${GID_PREFIX}/ProductVariant/${p.id}`,
    title: 'Default Title',
    availableForSale: p.availableForSale,
    quantityAvailable: p.totalInventory,
    selectedOptions: [{ name: 'Default', value: 'Default Title' }],
    price: { amount: price, currencyCode: p.currencyCode },
    compareAtPrice: compare != null ? { amount: compare, currencyCode: p.currencyCode } : null,
    image: toImage(p.featuredImage),
    sku: p.sku,
  };
}

export function productRecordToProduct(p: DbProduct): Product {
  const price = Number(p.price);
  const compare = p.compareAtPrice != null ? Number(p.compareAtPrice) : null;
  const images = (Array.isArray(p.images) ? p.images : []) as Array<Record<string, unknown>>;
  const imageNodes = images.map((n) => toImage(n)).filter((n): n is Image => n !== null);
  const tags = (Array.isArray(p.tags) ? p.tags : []) as string[];
  const options = (Array.isArray(p.options) ? p.options : []) as Array<{ id?: string; name: string; values: string[] }>;
  const seo = (p.seo && typeof p.seo === 'object' ? p.seo : {}) as Record<string, unknown>;

  return {
    id: `${GID_PREFIX}/Product/${p.id}`,
    handle: p.handle,
    title: p.title,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    vendor: p.vendor,
    productType: p.productType,
    tags,
    availableForSale: p.availableForSale,
    totalInventory: p.totalInventory,
    images: { edges: imageNodes.map((node) => ({ node })), pageInfo: { hasNextPage: false } },
    featuredImage: toImage(p.featuredImage),
    options: options.map((o, i) => ({ id: o.id || `${GID_PREFIX}/ProductOption/${p.id}-${i}`, name: o.name, values: o.values })),
    variants: { edges: [{ node: variantForProduct(p) }], pageInfo: { hasNextPage: false, hasPreviousPage: false } },
    priceRange: { minVariantPrice: { amount: price, currencyCode: p.currencyCode }, maxVariantPrice: { amount: price, currencyCode: p.currencyCode } },
    compareAtPriceRange: compare != null ? { minVariantPrice: { amount: compare, currencyCode: p.currencyCode }, maxVariantPrice: { amount: compare, currencyCode: p.currencyCode } } : null,
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  };
}

export function collectionRecordToCollection(c: DbCollection, products: Product[]): Collection {
  const seo = (c.seo && typeof c.seo === 'object' ? c.seo : {}) as Record<string, unknown>;
  return {
    id: `${GID_PREFIX}/Collection/${c.id}`,
    handle: c.handle,
    title: c.title,
    description: c.description,
    descriptionHtml: c.descriptionHtml,
    image: toImage(c.image),
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
    updatedAt: c.updatedAt.toISOString(),
    products: {
      edges: products.map((node) => ({ node, cursor: node.id })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    },
  };
}

export function cartRecordToCart(cart: DbCart, items: Array<DbCartItem & { product: DbProduct }>): Cart {
  const edges = items
    .filter((item) => item.quantity > 0)
    .map((item): { node: CartLine } => {
      const p = item.product;
      const price = Number(p.price);
      const variant = variantForProduct(p);
      return {
        node: {
          id: `${GID_PREFIX}/CartLine/${item.id}`,
          quantity: item.quantity,
          merchandise: variant,
          cost: { totalAmount: { amount: price * item.quantity, currencyCode: p.currencyCode }, amountPerQuantity: { amount: price, currencyCode: p.currencyCode } },
          attributes: [],
          discounts: [],
        },
      };
    });
  const subtotal = edges.reduce((sum, e) => sum + e.node.cost.totalAmount.amount, 0);
  const currency = edges[0]?.node.merchandise.price.currencyCode || 'INR';
  const totalQuantity = edges.reduce((sum, e) => sum + e.node.quantity, 0);
  return {
    id: `${GID_PREFIX}/Cart/${cart.id}`,
    checkoutUrl: '/checkout',
    totalQuantity,
    lines: { edges },
    cost: { subtotalAmount: { amount: subtotal, currencyCode: currency }, totalAmount: { amount: subtotal, currencyCode: currency }, totalTaxAmount: null, totalDutyAmount: null },
    discountCodes: [],
    buyerIdentity: { countryCode: null, email: null, phone: null },
    attributes: [],
    note: cart.note,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

export function articleRecordToArticle(a: DbArticle): Article {
  const seo = (a.seo && typeof a.seo === 'object' ? a.seo : {}) as Record<string, unknown>;
  return {
    id: `${GID_PREFIX}/Article/${a.id}`,
    handle: a.handle,
    title: a.title,
    excerpt: a.excerpt,
    contentHtml: a.contentHtml,
    image: toImage(a.image),
    author: { name: a.author, bio: null, image: null },
    publishedAt: a.publishedAt.toISOString(),
    blog: { id: `${GID_PREFIX}/Blog/${a.blogId}`, handle: 'journal', title: 'Journal' },
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
  };
}

export function buildShop(settings: Setting[]): Shop {
  const get = (key: string, fallback = '') => settings.find((s) => s.key === key)?.value ?? fallback;
  return {
    name: get('shop.name', 'Style Statement by Shakthi'),
    description: get('shop.description', ''),
    brand: { logo: null, coverImage: null, shortDescription: get('shop.shortDescription', '') || null },
    primaryDomain: { url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', host: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/^https?:\/\//, '') },
    currencyCode: get('shop.currencyCode', 'INR'),
    countriesInShipping: ['IN', 'US', 'GB', 'AE', 'SG'],
    paymentSettings: { acceptedPaymentMethods: ['visa', 'master', 'american_express', 'paypal', 'unionpay'] },
    policies: {
      privacyPolicy: { id: 'gid://db/Policy/privacy', title: 'Privacy Policy', body: '', url: '/privacy-policy' },
      refundPolicy: { id: 'gid://db/Policy/refund', title: 'Refund Policy', body: '', url: '/refund-policy' },
      termsOfService: { id: 'gid://db/Policy/terms', title: 'Terms of Service', body: '', url: '/terms-of-service' },
      shippingPolicy: { id: 'gid://db/Policy/shipping', title: 'Shipping Policy', body: '', url: '/shipping-policy' },
    },
  };
}

export function buildMenus(collections: DbCollection[]): Menu[] {
  const shopItems: MenuItem[] = collections
    .filter((c) => c.handle !== 'all')
    .slice(0, 5)
    .map((c) => ({ id: `gid://db/MenuItem/${c.handle}`, title: c.title, url: `/collections/${c.handle}`, resourceType: 'COLLECTION' }));
  return [
    {
      id: 'gid://db/Menu/main-menu',
      handle: 'main-menu',
      title: 'Main Menu',
      items: [
        { id: 'gid://db/MenuItem/shop', title: 'Shop', url: '/collections', resourceType: 'COLLECTION', items: shopItems },
        {
          id: 'gid://db/MenuItem/explore',
          title: 'Explore',
          url: '/journal',
          resourceType: 'LINK',
          items: [
            { id: 'gid://db/MenuItem/journal', title: 'Journal', url: '/journal', resourceType: 'LINK' },
            { id: 'gid://db/MenuItem/about', title: 'Our Story', url: '/about', resourceType: 'LINK' },
            { id: 'gid://db/MenuItem/contact', title: 'Contact', url: '/contact', resourceType: 'LINK' },
          ],
        },
      ],
    },
  ];
}
```

- [x] **Step 3: Rewrite `src/lib/shopify.ts` (server-only data layer)**

Replace the entire file content with:

```ts
import { prisma } from './prisma';
import type {
  Product,
  ProductConnection,
  Collection,
  CollectionConnection,
  Menu,
  Shop,
  Article,
  ArticleConnection,
  Blog,
} from '@/types/shopify';
import {
  productRecordToProduct,
  collectionRecordToCollection,
  articleRecordToArticle,
  buildShop,
  buildMenus,
  parseAfter,
} from './db-mappers';

function sortOrder(sortKey?: string, reverse = false) {
  const dir = reverse ? 'desc' : 'asc';
  switch (sortKey) {
    case 'TITLE_ASC':
      return { title: dir } as const;
    case 'TITLE_DESC':
      return { title: dir } as const;
    case 'PRICE_ASC':
      return { price: dir } as const;
    case 'PRICE_DESC':
      return { price: dir } as const;
    case 'CREATED_DESC':
      return { createdAt: dir } as const;
    default:
      return { createdAt: 'desc' as const };
  }
}

function matchesQuery(p: Product, query: string): boolean {
  const q = query.toLowerCase();
  return (
    p.title.toLowerCase().includes(q) ||
    p.productType.toLowerCase().includes(q) ||
    p.vendor.toLowerCase().includes(q) ||
    p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export async function fetchProducts(
  first = 12,
  after?: string,
  sortKey?: string,
  reverse = false,
  query?: string
): Promise<ProductConnection> {
  const skip = parseAfter(after);
  const rows = await prisma.product.findMany({ orderBy: sortOrder(sortKey, reverse), take: skip + first + 1 });
  let products = rows.map(productRecordToProduct);
  if (query) products = products.filter((p) => matchesQuery(p, query));
  const hasNextPage = products.length > skip + first;
  products = products.slice(skip, skip + first);

  return {
    edges: products.slice(0, first).map((node) => ({ node, cursor: node.id })),
    pageInfo: {
      hasNextPage,
      hasPreviousPage: skip > 0,
      startCursor: products.length > 0 ? products[0].id : null,
      endCursor: products.length > 0 ? products[products.length - 1].id : null,
    },
  };
}

export async function fetchProduct(handle: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { handle } });
  return row ? productRecordToProduct(row) : null;
}

export async function fetchProductRecommendations(productId: string): Promise<Product[]> {
  const id = Number(productId.split('/').pop());
  const rows = await prisma.product.findMany({ where: { id: { not: id } }, orderBy: { createdAt: 'desc' }, take: 4 });
  return rows.map(productRecordToProduct);
}

export async function fetchCollections(first = 20, after?: string): Promise<CollectionConnection> {
  const skip = parseAfter(after);
  const rows = await prisma.collection.findMany({ orderBy: { title: 'asc' }, skip, take: first + 1 });
  const hasNextPage = rows.length > first;
  const pageRows = rows.slice(0, first);
  return {
    edges: pageRows.map((node) => ({ node: collectionRecordToCollection(node, []), cursor: node.id.toString() })),
    pageInfo: { hasNextPage, hasPreviousPage: skip > 0 },
  };
}

export async function fetchCollection(handle: string, first = 12, after?: string): Promise<Collection | null> {
  const skip = parseAfter(after);

  if (handle === 'all') {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, skip, take: first + 1 });
    const hasNextPage = rows.length > first;
    const products = rows.slice(0, first).map(productRecordToProduct);
    return {
      id: 'gid://db/Collection/all',
      handle: 'all',
      title: 'All Jewelry',
      description: 'Every piece in our collection.',
      descriptionHtml: '',
      image: null,
      seo: { title: 'All Jewelry', description: 'Every piece in our collection.' },
      updatedAt: new Date().toISOString(),
      products: { edges: products.map((node) => ({ node, cursor: node.id })), pageInfo: { hasNextPage, hasPreviousPage: skip > 0, startCursor: null, endCursor: null } },
    };
  }

  if (handle === 'bestsellers') {
    const rows = await prisma.product.findMany({ where: { compareAtPrice: { not: null } }, orderBy: { createdAt: 'desc' }, skip, take: first + 1 });
    const hasNextPage = rows.length > first;
    const products = rows.slice(0, first).map(productRecordToProduct);
    return {
      id: 'gid://db/Collection/bestsellers',
      handle: 'bestsellers',
      title: 'Bestsellers',
      description: 'The pieces our collectors love most.',
      descriptionHtml: '',
      image: null,
      seo: { title: 'Bestsellers', description: 'The pieces our collectors love most.' },
      updatedAt: new Date().toISOString(),
      products: { edges: products.map((node) => ({ node, cursor: node.id })), pageInfo: { hasNextPage, hasPreviousPage: skip > 0, startCursor: null, endCursor: null } },
    };
  }

  const collection = await prisma.collection.findUnique({
    where: { handle },
    include: { items: { include: { product: true }, orderBy: { position: 'asc' } } },
  });
  if (!collection) return null;

  const allProducts = collection.items.map((item) => item.product);
  const paginated = allProducts.slice(skip, skip + first);
  const hasNextPage = allProducts.length > skip + first;
  const products = paginated.map(productRecordToProduct);
  return collectionRecordToCollection(collection, products);
}

export async function fetchMenu(handle: string): Promise<Menu | null> {
  const collections = await prisma.collection.findMany({ orderBy: { title: 'asc' } });
  return buildMenus(collections).find((m) => m.handle === handle) || null;
}

export async function fetchMenus(): Promise<Menu[]> {
  const collections = await prisma.collection.findMany({ orderBy: { title: 'asc' } });
  return buildMenus(collections);
}

export async function fetchShop(): Promise<Shop> {
  const settings = await prisma.setting.findMany();
  return buildShop(settings);
}

export async function fetchBlogs(first = 10): Promise<Array<{ id: string; handle: string; title: string }>> {
  const rows = await prisma.blog.findMany({ take: first });
  return rows.map((b) => ({ id: `${b.id}`, handle: b.handle, title: b.title }));
}

export async function fetchArticles(blogHandle: string, first = 10, after?: string): Promise<ArticleConnection> {
  const skip = parseAfter(after);
  const blog = await prisma.blog.findUnique({ where: { handle: blogHandle } });
  if (!blog) return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } };
  const rows = await prisma.article.findMany({ where: { blogId: blog.id }, orderBy: { publishedAt: 'desc' }, skip, take: first + 1 });
  const hasNextPage = rows.length > first;
  const edges = rows.slice(0, first).map((node) => ({ node: articleRecordToArticle(node), cursor: node.id.toString() }));
  return { edges, pageInfo: { hasNextPage, hasPreviousPage: skip > 0 } };
}

export async function fetchArticle(blogHandle: string, articleHandle: string): Promise<Article | null> {
  const blog = await prisma.blog.findUnique({ where: { handle: blogHandle } });
  if (!blog) return null;
  const row = await prisma.article.findUnique({ where: { blogId_handle: { blogId: blog.id, handle: articleHandle } } });
  return row ? articleRecordToArticle(row) : null;
}
```

Note: the previous `createCart`/`addToCart`/etc. exports move to `src/lib/cart-api.ts` in Task 4 — do not define them here.

- [x] **Step 4: Verify server pages compile against the new layer**

Run: `npm run type-check`
Expected: errors in `src/context/CartContext.tsx` (imports missing cart functions from shopify.ts) are expected and resolved in Task 4. Confirm no other pages error.

- [x] **Step 5: Run the dev server and smoke test storefront**

Run: `npm run dev` then open `http://localhost:3000`
Expected: home page shows the 12 seeded products (from MySQL), collections page lists collections, `/collections/gold` shows gold items, `/journal` lists articles, `/about` renders. Refresh the DB rows in DBeaver and re-open the page to confirm data comes from MySQL.

- [x] **Step 6: Commit**

```bash
git add src/lib/db-mappers.ts src/lib/shopify.ts src/types/admin.ts
git commit -m "feat: back storefront data layer with Prisma/MySQL"
```

---

### Task 4: Cart client API + cart API routes

**Files:**
- Create: `src/lib/cart-api.ts`
- Create: `src/app/api/cart/route.ts`
- Create: `src/app/api/cart/items/route.ts`
- Create: `src/app/api/cart/note/route.ts`
- Modify: `src/context/CartContext.tsx:12`

**Interfaces:**
- Consumes: `cartRecordToCart`, `gidToId` (Task 3); `prisma` (Task 1); `Cart`, `CartCreateInput`, `CartLineUpdateInput` types (unchanged).
- Produces (all exported from `@/lib/cart-api`, client-safe):
  - `createCart(input?: CartCreateInput): Promise<Cart>`
  - `fetchCart(cartId: string): Promise<Cart>`
  - `addToCart(cartId: string, lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>): Promise<Cart>`
  - `updateCartLine(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart>`
  - `removeFromCart(cartId: string, lineIds: string[]): Promise<Cart>`
  - `updateCartNote(cartId: string, note: string): Promise<Cart>`

- [x] **Step 1: Create `src/lib/cart-api.ts`**

```ts
import type { Cart, CartCreateInput, CartLineUpdateInput } from '@/types/shopify';

async function request(url: string, init?: RequestInit): Promise<Cart> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  return res.json();
}

export function createCart(input: CartCreateInput = {}): Promise<Cart> {
  return request('/api/cart', { method: 'POST', body: JSON.stringify(input) });
}

export async function fetchCart(cartId: string): Promise<Cart> {
  const res = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`);
  if (!res.ok) return Promise.reject(new Error('Cart not found'));
  return res.json();
}

export function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Promise<Cart> {
  return request('/api/cart/items', { method: 'POST', body: JSON.stringify({ cartId, lines }) });
}

export function updateCartLine(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
  return request('/api/cart/items', { method: 'PATCH', body: JSON.stringify({ cartId, lines }) });
}

export function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  return request('/api/cart/items', { method: 'DELETE', body: JSON.stringify({ cartId, lineIds }) });
}

export function updateCartNote(cartId: string, note: string): Promise<Cart> {
  return request('/api/cart/note', { method: 'POST', body: JSON.stringify({ cartId, note }) });
}
```

- [x] **Step 2: Update `src/context/CartContext.tsx` import**

Replace line 12:
```ts
import { createCart, fetchCart, addToCart as addToCartApi, updateCartLine as updateCartLineApi, removeFromCart as removeFromCartApi, updateCartNote as updateCartNoteApi } from '@/lib/cart-api';
```

- [x] **Step 3: Create `src/app/api/cart/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';
import type { Cart } from '@/types/shopify';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { lines?: Array<{ merchandiseId: string; quantity: number }> };
  const cart = await prisma.cart.create({ data: { token: crypto.randomUUID() } });
  if (Array.isArray(body.lines)) {
    for (const line of body.lines) {
      const productId = gidToId(line.merchandiseId);
      if (productId == null) continue;
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: Math.max(1, line.quantity) } });
    }
  }
  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: true } } } });
  return NextResponse.json(cartRecordToCart(full!, full!.items));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get('cartId');
  if (!cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });
  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  return NextResponse.json(cartRecordToCart(cart, cart.items));
}
```

- [x] **Step 4: Create `src/app/api/cart/items/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';

async function getCart(cartId: string) {
  const id = gidToId(cartId);
  if (id == null) return null;
  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  return cart ? { cart, id } : null;
}

function cartJson(cart: NonNullable<Awaited<ReturnType<typeof getCart>>>['cart']) {
  return NextResponse.json(cartRecordToCart(cart, cart.items));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lines?: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }> };
  if (!body.cartId || !Array.isArray(body.lines)) return NextResponse.json({ error: 'cartId and lines are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { cart, id } = found;

  for (const line of body.lines) {
    const productId = gidToId(line.merchandiseId);
    if (productId == null) continue;
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: id, productId } },
      update: { quantity: { increment: Math.max(1, line.quantity) } },
      create: { cartId: id, productId, quantity: Math.max(1, line.quantity) },
    });
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  return cartJson(updated!);
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lines?: Array<{ id: string; quantity: number }> };
  if (!body.cartId || !Array.isArray(body.lines)) return NextResponse.json({ error: 'cartId and lines are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { id } = found;

  for (const line of body.lines) {
    const itemId = gidToId(line.id);
    if (itemId == null) continue;
    if (line.quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: line.quantity } }).catch(() => {});
    }
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  return cartJson(updated!);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; lineIds?: string[] };
  if (!body.cartId || !Array.isArray(body.lineIds)) return NextResponse.json({ error: 'cartId and lineIds are required' }, { status: 400 });
  const found = await getCart(body.cartId);
  if (!found) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const { id } = found;

  for (const lineId of body.lineIds) {
    const itemId = gidToId(lineId);
    if (itemId == null) continue;
    await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
  }
  const updated = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  return cartJson(updated!);
}
```

- [x] **Step 5: Create `src/app/api/cart/note/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartRecordToCart, gidToId } from '@/lib/db-mappers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string; note?: string };
  if (!body.cartId || typeof body.note !== 'string') return NextResponse.json({ error: 'cartId and note are required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });
  const updated = await prisma.cart.update({ where: { id }, data: { note: body.note }, include: { items: { include: { product: true } } } });
  return NextResponse.json(cartRecordToCart(updated, updated.items));
}
```

- [x] **Step 6: Verify type-check**

Run: `npm run type-check`
Expected: no errors (CartContext now resolves cart functions).

- [x] **Step 7: Curl smoke tests (dev server running)**

Run:
```bash
curl -s -X POST http://localhost:3000/api/cart | tee /tmp/cart.json
CART_ID=$(python3 -c "import json;print(json.load(open('/tmp/cart.json'))['id'])")
PRODUCT_VID=$(curl -s http://localhost:3000/api/cart -o /dev/null -w '%{http_code}')
```
Then add a known variant id. With the seed, product `solitaire-pendant` has variant id `gid://db/ProductVariant/1`. Run:
```bash
curl -s -X POST http://localhost:3000/api/cart/items -H 'Content-Type: application/json' -d "{\"cartId\":\"$CART_ID\",\"lines\":[{\"merchandiseId\":\"gid://db/ProductVariant/1\",\"quantity\":2}]}"
curl -s "http://localhost:3000/api/cart?cartId=$CART_ID"
curl -s -X PATCH http://localhost:3000/api/cart/items -H 'Content-Type: application/json' -d "{\"cartId\":\"$CART_ID\",\"lines\":[{\"id\":\"gid://db/CartLine/1\",\"quantity\":5}]}"
curl -s -X DELETE http://localhost:3000/api/cart/items -H 'Content-Type: application/json' -d "{\"cartId\":\"$CART_ID\",\"lineIds\":[\"gid://db/CartLine/1\"]}"
```
Expected: cart JSON with correct quantity changes; `totalQuantity` reflects line totals.

- [x] **Step 8: Browser check**

Open `http://localhost:3000`, add the Solitaire Pendant to the cart, open the cart drawer. Expected: item shows with correct price/quantity; refreshing keeps the cart (server-stored via token in localStorage `sss_cart_id`).

- [x] **Step 9: Commit**

```bash
git add src/lib/cart-api.ts src/app/api/cart src/context/CartContext.tsx
git commit -m "feat: add DB-backed cart API routes"
```

---

### Task 5: Checkout API + CheckoutCapture rewire

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Modify: `src/components/cart/CheckoutCapture.tsx`

**Interfaces:**
- Consumes: `gidToId` (Task 3), `prisma` (Task 1).
- Produces: `POST /api/checkout` — body `{ cartId: string }`; returns `{ ok: true, order: StoredOrder }`. Creates `Order` + `OrderItem` rows, decrements product inventory, deletes the cart.

- [x] **Step 1: Create `src/app/api/checkout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string };
  if (!body.cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });

  const cart = await prisma.cart.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const lines = cart.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  const subtotal = lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const currency = lines[0].product.currencyCode || 'INR';

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: '',
        status: 'Processing',
        subtotal,
        total: subtotal,
        currencyCode: currency,
        paymentMethod: 'COD',
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            title: l.product.title,
            handle: l.product.handle,
            price: Number(l.product.price),
            quantity: l.quantity,
            image: l.product.featuredImage,
          })),
        },
      },
      include: { items: true },
    });
    await tx.order.update({ where: { id: created.id }, data: { orderNumber: `#${1000 + created.id}` } });

    for (const l of lines) {
      await tx.product.update({
        where: { id: l.productId },
        data: {
          totalInventory: Math.max(0, l.product.totalInventory - l.quantity),
          availableForSale: Math.max(0, l.product.totalInventory - l.quantity) > 0,
        },
      });
    }

    await tx.cart.delete({ where: { id } });
    return created;
  });

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      orderNumber: `#${1000 + order.id}`,
      name: 'Walk-in Checkout',
      email: '',
      createdAt: order.createdAt.toISOString(),
      total: Number(order.total),
      currencyCode: order.currencyCode,
      status: order.status,
      lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
    },
  });
}
```

- [x] **Step 2: Rewrite `src/components/cart/CheckoutCapture.tsx`**

Replace the file content with:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';

export function CheckoutCapture() {
  const { cart } = useCart();
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (!cart || hasCaptured.current) return;
    const hasItems = cart.lines.edges.some((line) => line.node.quantity > 0);
    if (!hasItems) return;
    hasCaptured.current = true;

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: cart.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Checkout failed');
        localStorage.removeItem('sss_cart_id');
      })
      .catch((err) => console.error('Checkout capture failed:', err));
  }, [cart]);

  return null;
}
```

- [x] **Step 3: Verify**

Run: `npm run type-check`
Expected: no errors.

Curl smoke test (dev server running):
```bash
curl -s -X POST http://localhost:3000/api/cart -H 'Content-Type: application/json' -d '{"lines":[{"merchandiseId":"gid://db/ProductVariant/1","quantity":1}]}' > /tmp/cart2.json
CART2=$(python3 -c "import json;print(json.load(open('/tmp/cart2.json'))['id'])")
curl -s -X POST http://localhost:3000/api/checkout -H 'Content-Type: application/json' -d "{\"cartId\":\"$CART2\"}"
```
Expected: response `{ ok: true, order: { orderNumber: "#1001", ... } }`. In DBeaver, `orders` has one row, `order_items` one row, and the Solitaire Pendant inventory dropped from 12 to 11.

- [x] **Step 4: Commit**

```bash
git add src/app/api/checkout/route.ts src/components/cart/CheckoutCapture.tsx
git commit -m "feat: add DB-backed COD checkout"
```

---

### Task 6: Database-backed admin auth

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/admin/AdminShell.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/login/page.tsx`
- Modify: `src/app/admin/layout.tsx` logout handler (now lives in AdminShell)

**Interfaces:**
- Consumes: `prisma` (Task 1), `User`/`Session` models.
- Produces:
  - `getSession(): Promise<{ email: string } | null>` (server-only, reads cookie + DB)
  - `createSession(email: string): Promise<string>`
  - `destroySession(): Promise<void>`
  - `login(password: string): Promise<{ email: string } | null>`
  - Cookie: `sss_admin_session`

- [x] **Step 1: Create `src/lib/auth.ts`**

```ts
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'sss_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function login(password: string): Promise<{ email: string } | null> {
  const user = await prisma.user.findFirst();
  if (!user) return null;
  const ok = await compare(password, user.passwordHash);
  return ok ? { email: user.email } : null;
}

export async function createSession(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({ data: { token, email, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });
  return token;
}

export async function getSession(): Promise<{ email: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return { email: session.email };
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.delete({ where: { token } }).catch(() => {});
}
```

- [x] **Step 2: Create `src/app/api/auth/login/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { login, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { password?: string };
  if (typeof body.password !== 'string' || !body.password) {
    return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
  }
  const session = await login(body.password);
  if (!session) {
    return NextResponse.json({ error: 'Invalid Store Owner Passcode. Please try again.' }, { status: 401 });
  }
  const token = await createSession(session.email);
  const response = NextResponse.json({ ok: true, email: session.email });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
```

- [x] **Step 3: Create `src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { destroySession, SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
```

- [x] **Step 4: Create `src/app/api/auth/me/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: session.email });
}
```

- [x] **Step 5: Create `src/app/admin/AdminShell.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, Package, LogOut, Eye, ShieldCheck, ShoppingBag, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Add Product', href: '/admin/products/new', icon: Plus },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminShell({ sessionEmail, children }: { sessionEmail: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!sessionEmail && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [sessionEmail, isLoginPage, router]);

  if (!sessionEmail && !isLoginPage) {
    return <div className="min-h-screen bg-cream-50" />;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 font-sans text-neutral-900">
      <header className="bg-neutral-950 text-cream-50 sticky top-0 z-50 border-b border-neutral-800">
        <div className="container h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="flex items-center gap-2.5 font-heading text-heading-sm text-cream-50">
              <ShieldCheck className="h-5 w-5 text-gold-400" />
              <span className="truncate">Store Console</span>
            </Link>
            <span className="badge-gold text-[10px] hidden sm:inline-block flex-shrink-0">Admin Mode</span>
          </div>
          <nav className="flex items-center gap-0.5 sm:gap-1 lg:px-0 px-1 -mx-1 overflow-x-auto" aria-label="Admin navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={isActive ? `${item.name} (current)` : item.name}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-md text-body-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive ? 'bg-gold-500 text-white' : 'text-cream-50/70 hover:text-cream-50 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-md text-body-sm font-medium text-cream-50/70 hover:text-cream-50 hover:bg-neutral-800 transition-colors"
              title="View live storefront in a new tab"
            >
              <Eye className="h-4 w-4" />
              <span>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 h-10 rounded-md text-body-sm font-medium text-cream-50/70 hover:text-red-400 hover:bg-neutral-800 transition-colors"
              title="Log out of admin portal"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-neutral-950 text-cream-50/50 py-6 border-t border-neutral-800 text-center text-caption">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Store Owner Management Suite. Confidential & Encrypted.</p>
        </div>
      </footer>
    </div>
  );
}
```

- [x] **Step 6: Replace `src/app/admin/layout.tsx`**

Replace the file content with:

```tsx
import AdminShell from './AdminShell';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return <AdminShell sessionEmail={session?.email ?? null}>{children}</AdminShell>;
}
```

- [x] **Step 7: Rewire `src/app/admin/login/page.tsx`**

Replace the `handleLogin` function (lines 18-39) with:

```tsx
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }
      router.push(fromUrl);
      router.refresh();
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
```
Remove the now-unused `process.env.NEXT_PUBLIC_ADMIN_PASSCODE` logic and the `document.cookie = 'sss_admin_session=authenticated; ...'` line.

- [x] **Step 8: Verify**

Run: `npm run type-check`
Expected: no errors.

Curl smoke tests (dev server running):
```bash
# Wrong passcode → 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"password":"wrong"}'
# Correct passcode → 200 + Set-Cookie
curl -s -i -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"password":"admin123"}' | tee /tmp/login.txt
# /api/auth/me with cookie → authenticated true
TOKEN=$(grep -i 'set-cookie' /tmp/login.txt | sed 's/.*sss_admin_session=\([^;]*\).*/\1/')
curl -s http://localhost:3000/api/auth/me -H "Cookie: sss_admin_session=$TOKEN"
# Logout
curl -s -X POST http://localhost:3000/api/auth/logout -H "Cookie: sss_admin_session=$TOKEN"
```
Expected: `401`, then `200` with cookie, then `{"authenticated":true,...}`, then logout works.

Browser check: visit `/admin` → redirected to `/admin/login`; enter `admin123` → lands on the dashboard; logout returns to login.

- [x] **Step 9: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/app/admin/layout.tsx src/app/admin/AdminShell.tsx src/app/admin/login/page.tsx
git commit -m "feat: database-backed admin auth with sessions"
```

---

### Task 7: Admin products + inventory APIs, rewire inventory page

**Files:**
- Create: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/products/[id]/route.ts`
- Create: `src/app/api/admin/inventory/[handle]/route.ts`
- Modify: `src/app/admin/inventory/page.tsx`

**Interfaces:**
- Consumes: `prisma` (Task 1), `productRecordToProduct`, `gidToId` (Task 3), `getSession` (Task 6), `CustomProductInput`/`InventoryUpdate` (Task 3).
- Produces:
  - `GET /api/admin/products?first=&after=&query=` → `ProductConnection`
  - `POST /api/admin/products` (body `CustomProductInput`) → mapped `Product`
  - `PATCH /api/admin/products/[id]` (body `InventoryUpdate`) → mapped `Product`
  - `DELETE /api/admin/products/[id]` → `{ ok: true }`
  - `PATCH /api/admin/inventory/[handle]` (body `InventoryUpdate`) → mapped `Product`

- [x] **Step 1: Create `src/app/api/admin/products/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { CustomProductInput } from '@/types/admin';

export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const first = Math.min(Number(searchParams.get('first')) || 12, 100);
  const after = Number(searchParams.get('after')) || 0;
  const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, skip: after, take: first + 1 });
  const hasNextPage = rows.length > first;
  const pageRows = rows.slice(0, first);
  return NextResponse.json({
    edges: pageRows.map((node) => ({ node: productRecordToProduct(node), cursor: node.id.toString() })),
    pageInfo: { hasNextPage, hasPreviousPage: after > 0, startCursor: pageRows[0]?.id.toString() ?? null, endCursor: pageRows.length > 0 ? pageRows[pageRows.length - 1].id.toString() : null },
  });
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
}

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await req.json().catch(() => ({})) as Partial<CustomProductInput>;
  if (!input.title || typeof input.price !== 'number') return NextResponse.json({ error: 'title and price are required' }, { status: 400 });

  const handle = input.handle || slugify(input.title);
  const images = Array.isArray(input.images) && input.images.length > 0 ? input.images : ['/placeholder.svg'];
  const price = input.price;

  const product = await prisma.product.create({
    data: {
      handle,
      title: input.title,
      description: input.description || '',
      descriptionHtml: `<p>${input.description || ''}</p>`,
      vendor: input.vendor || 'Style Statement by Shakthi Atelier',
      productType: input.productType || 'Jewelry',
      tags: input.tags || [],
      price,
      compareAtPrice: input.compareAtPrice ?? null,
      currencyCode: 'INR',
      totalInventory: input.totalInventory ?? 10,
      featuredImage: images[0],
      images,
      options: input.options && input.options.length > 0 ? input.options : [{ id: 'opt-0', name: 'Title', values: ['Default Title'] }],
      seo: { title: input.title, description: input.description || '' },
      publishedAt: new Date(),
      sku: `SSS-${handle.toUpperCase().replace(/-/g, '')}`,
    },
  });

  if (input.collectionHandle) {
    const collection = await prisma.collection.upsert({
      where: { handle: input.collectionHandle },
      update: {},
      create: { handle: input.collectionHandle, title: input.collectionHandle, description: '' },
    });
    await prisma.collectionItem.upsert({
      where: { collectionId_productId: { collectionId: collection.id, productId: product.id } },
      update: {},
      create: { collectionId: collection.id, productId: product.id, position: product.id },
    });
  }

  return NextResponse.json(productRecordToProduct(product), { status: 201 });
}
```

- [x] **Step 2: Create `src/app/api/admin/products/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, gidToId } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { InventoryUpdate } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as InventoryUpdate;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const totalInventory = body.totalInventory !== undefined ? Math.max(0, body.totalInventory) : existing.totalInventory;
  const updated = await prisma.product.update({
    where: { id },
    data: {
      totalInventory,
      availableForSale: body.availableForSale !== undefined ? body.availableForSale : totalInventory > 0,
      price: body.price !== undefined ? body.price : existing.price,
      compareAtPrice: body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    },
  });
  return NextResponse.json(productRecordToProduct(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  await prisma.product.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
```

- [x] **Step 3: Create `src/app/api/admin/inventory/[handle]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productRecordToProduct } from '@/lib/db-mappers';
import { getSession } from '@/lib/auth';
import type { InventoryUpdate } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { handle: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as InventoryUpdate;

  const existing = await prisma.product.findUnique({ where: { handle: params.handle } });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const totalInventory = body.totalInventory !== undefined ? Math.max(0, body.totalInventory) : existing.totalInventory;
  const updated = await prisma.product.update({
    where: { handle: params.handle },
    data: {
      totalInventory,
      availableForSale: body.availableForSale !== undefined ? body.availableForSale : totalInventory > 0,
      price: body.price !== undefined ? body.price : existing.price,
      compareAtPrice: body.compareAtPrice !== undefined ? body.compareAtPrice : existing.compareAtPrice,
    },
  });
  return NextResponse.json(productRecordToProduct(updated));
}
```

- [x] **Step 4: Rewire `src/app/admin/inventory/page.tsx`**

Replace imports (lines 3-10):
```tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, ExternalLink, Package, DollarSign, Plus, Minus, Layers, Pause, Play } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import type { Product } from '@/types/shopify';
import { OptimizedImage } from '@/components/ui/Image';
```

Replace `loadInventory` (lines 27-37):
```tsx
  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products?first=100');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setProducts(data.edges.map((e: { node: Product }) => e.node));
    } finally {
      setLoading(false);
    }
  };
```

Replace `handleQuantityChange`, `handleDirectQuantitySet`, `handlePriceSet`, `handleToggleStockAvailability` (lines 43-89) with API-calling versions:

```tsx
  const updateInventory = async (handle: string, body: { totalInventory?: number; price?: number; availableForSale?: boolean }) => {
    const res = await fetch(`/api/admin/inventory/${handle}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update inventory');
    return res.json() as Promise<Product>;
  };

  const handleQuantityChange = async (handle: string, delta: number) => {
    const target = products.find((p) => p.handle === handle);
    if (!target) return;
    const newQty = Math.max(0, (target.totalInventory ?? 0) + delta);
    const updated = await updateInventory(handle, { totalInventory: newQty });
    setProducts((prev) => prev.map((p) => (p.handle === handle ? updated : p)));
  };

  const handleDirectQuantitySet = async (handle: string, value: number) => {
    const newQty = Math.max(0, isNaN(value) ? 0 : value);
    const updated = await updateInventory(handle, { totalInventory: newQty });
    setProducts((prev) => prev.map((p) => (p.handle === handle ? updated : p)));
  };

  const handlePriceSet = async (handle: string, value: number) => {
    const newPrice = Math.max(0, isNaN(value) ? 0 : value);
    const updated = await updateInventory(handle, { price: newPrice });
    setProducts((prev) => prev.map((p) => (p.handle === handle ? updated : p)));
  };

  const handleToggleStockAvailability = async (handle: string, currentAvailable: boolean) => {
    const newAvailable = !currentAvailable;
    const target = products.find((p) => p.handle === handle);
    const newQty = newAvailable ? Math.max(1, target?.totalInventory || 5) : 0;
    const updated = await updateInventory(handle, { totalInventory: newQty, availableForSale: newAvailable });
    setProducts((prev) => prev.map((p) => (p.handle === handle ? updated : p)));
  };
```
Remove the `updateProductInventory`, `updateProductPrice`, `applyInventoryOverrides` imports and all calls to them.

- [x] **Step 5: Verify**

Run: `npm run type-check`
Expected: no errors. `src/lib/custom-products.ts` is no longer imported by this page.

Curl smoke test (login first to get a cookie):
```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"password":"admin123"}'
curl -s -b /tmp/cookies.txt "http://localhost:3000/api/admin/products?first=3"
curl -s -b /tmp/cookies.txt -X PATCH http://localhost:3000/api/admin/inventory/solitaire-pendant -H 'Content-Type: application/json' -d '{"totalInventory":3}'
curl -s http://localhost:3000/api/admin/products -o /dev/null -w '%{http_code}\n'
```
Expected: products JSON; inventory updated; unauthenticated call returns `401`.

Browser check: `/admin/inventory` shows products from MySQL; changing quantity updates the DB (verify in DBeaver / storefront PDP).

- [x] **Step 6: Commit**

```bash
git add src/app/api/admin/products src/app/api/admin/inventory src/app/admin/inventory/page.tsx
git commit -m "feat: DB-backed admin product and inventory APIs"
```

---

### Task 8: Rewire Add Product page

**Files:**
- Modify: `src/app/admin/products/new/page.tsx`

**Interfaces:**
- Consumes: `CustomProductInput` (Task 3), `POST /api/admin/products` (Task 7).
- Produces: creates a product in MySQL; redirects to `/admin` on success.

- [x] **Step 1: Replace the save call**

Replace import (line 7):
```tsx
import { saveCustomProduct, CustomProductInput } from '@/lib/custom-products';
```
with:
```tsx
import type { CustomProductInput } from '@/types/admin';
```

Replace `handleSubmit` body (lines 125-133) — the part that calls `saveCustomProduct`:
```tsx
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save product');
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } finally {
      setSaving(false);
    }
```

- [x] **Step 2: Verify**

Run: `npm run type-check`
Expected: no errors. Confirm nothing else in this file references `saveCustomProduct`.

- [x] **Step 3: Browser check**

Open `/admin/products/new`, fill the form, click Save. Expected: success state, redirect to `/admin`, and the new product appears on the storefront and in DBeaver `Product` table.

- [x] **Step 4: Commit**

```bash
git add src/app/admin/products/new/page.tsx
git commit -m "feat: create products via DB-backed admin API"
```

---

### Task 9: Admin settings API + rewire settings page

**Files:**
- Create: `src/app/api/admin/settings/route.ts`
- Modify: `src/app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: `prisma` (Task 1), `getSession` (Task 6), `StoreConfigRow`/`StoreAlerts` (Task 3).
- Produces:
  - `GET /api/admin/settings` → `{ config: StoreConfigRow[], alerts: StoreAlerts }`
  - `PATCH /api/admin/settings` (body `{ config: StoreConfigRow[], alerts: StoreAlerts }`) → same shape

- [x] **Step 1: Create `src/app/api/admin/settings/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { StoreConfigRow, StoreAlerts } from '@/types/admin';

const CONFIG_KEYS = ['store_name', 'store_email', 'currency', 'free_shipping_threshold', 'return_window'];

async function readPayload() {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...CONFIG_KEYS, 'low_stock_alerts', 'new_order_alerts'] } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const config: StoreConfigRow[] = [
    { key: 'store_name', label: 'Store Name', value: map.get('store_name') || 'Style Statement by Shakthi', hint: 'Shown in the storefront header and metadata' },
    { key: 'store_email', label: 'Store Email', value: map.get('store_email') || '', hint: 'Used for order notifications and contact form' },
    { key: 'currency', label: 'Currency', value: map.get('currency') || 'INR (₹)', hint: 'Currency for pricing and inventory valuation' },
    { key: 'free_shipping_threshold', label: 'Free Shipping Above', value: map.get('free_shipping_threshold') || '', hint: 'Complimentary shipping above this cart value' },
    { key: 'return_window', label: 'Return Window', value: map.get('return_window') || '14 days', hint: 'Return period shown on the PDP and checkout' },
  ];
  const alerts: StoreAlerts = { lowStock: map.get('low_stock_alerts') !== 'false', newOrder: map.get('new_order_alerts') !== 'false' };
  return { config, alerts };
}

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await readPayload());
}

export async function PATCH(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { config?: StoreConfigRow[]; alerts?: StoreAlerts };
  if (body.config && Array.isArray(body.config)) {
    for (const row of body.config) {
      if (!CONFIG_KEYS.includes(row.key)) continue;
      await prisma.setting.upsert({
        where: { key: row.key },
        update: { value: String(row.value), label: row.label, hint: row.hint },
        create: { key: row.key, value: String(row.value), label: row.label, hint: row.hint },
      });
    }
  }
  if (body.alerts) {
    await prisma.setting.upsert({ where: { key: 'low_stock_alerts' }, update: { value: String(body.alerts.lowStock) }, create: { key: 'low_stock_alerts', value: String(body.alerts.lowStock) } });
    await prisma.setting.upsert({ where: { key: 'new_order_alerts' }, update: { value: String(body.alerts.newOrder) }, create: { key: 'new_order_alerts', value: String(body.alerts.newOrder) } });
  }
  return NextResponse.json(await readPayload());
}
```

- [x] **Step 2: Rewire `src/app/admin/settings/page.tsx`**

Replace the `loadSettings` helper + `useEffect` (the localStorage loading block) with API loading:

```tsx
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SavedSettings | null) => {
        if (data) {
          setConfig(data.config);
          setAlerts(data.alerts);
        }
      })
      .catch(() => {});
  }, []);
```

Replace `handleSave` (the `localStorage.setItem` block) with:

```tsx
  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, alerts }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save store settings:', err);
    }
  };
```

Delete the `loadSettings` function, the `STORE_SETTINGS_KEY` constant, and the `SavedSettings` localStorage usage (keep the `SavedSettings` interface if still used by the new code — it matches `{ config, alerts }`). Remove the now-unused `localStorage` reference and the `import { Check } from 'lucide-react'` stays.

- [x] **Step 3: Verify**

Run: `npm run type-check`
Expected: no errors.

Curl smoke test (authenticated):
```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/admin/settings
curl -s -b /tmp/cookies.txt -X PATCH http://localhost:3000/api/admin/settings -H 'Content-Type: application/json' -d '{"config":[{"key":"return_window","label":"Return Window","value":"30 days","hint":"Return period shown on the PDP and checkout"}],"alerts":{"lowStock":false,"newOrder":true}}'
```
Expected: settings JSON; return_window value `30 days`; lowStock `false`.

Browser check: change a value, click Save Changes, reload — the change persists (from MySQL).

- [x] **Step 4: Commit**

```bash
git add src/app/api/admin/settings/route.ts src/app/admin/settings/page.tsx
git commit -m "feat: DB-backed admin settings API"
```

---

### Task 10: Admin orders API + rewire orders page

**Files:**
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/orders/[id]/route.ts`
- Modify: `src/app/admin/orders/page.tsx`

**Interfaces:**
- Consumes: `prisma` (Task 1), `getSession` (Task 6), `StoredOrder`/`StoredOrderItem` (Task 3).
- Produces:
  - `GET /api/admin/orders` → `StoredOrder[]`
  - `PATCH /api/admin/orders/[id]` (body `{ status: string }`) → `StoredOrder`

- [x] **Step 1: Create `src/app/api/admin/orders/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { StoredOrder } from '@/types/admin';

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
  const mapped: StoredOrder[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    name: o.customerName,
    email: o.customerEmail,
    createdAt: o.createdAt.toISOString(),
    total: Number(o.total),
    currencyCode: o.currencyCode,
    status: o.status,
    lineItems: o.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
  }));
  return NextResponse.json(mapped);
}
```

- [x] **Step 2: Create `src/app/api/admin/orders/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { StoredOrder } from '@/types/admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as { status?: string };
  if (typeof body.status !== 'string') return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const order = await prisma.order.update({ where: { id }, data: { status: body.status }, include: { items: true } }).catch(() => null);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    name: order.customerName,
    email: order.customerEmail,
    createdAt: order.createdAt.toISOString(),
    total: Number(order.total),
    currencyCode: order.currencyCode,
    status: order.status,
    lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
  } as StoredOrder);
}
```

- [x] **Step 3: Rewire `src/app/admin/orders/page.tsx`**

Replace the `StoredLineItem`/`StoredOrder` interfaces and `DEMO_ORDERS` (lines 9-64) with an import:
```tsx
import type { StoredOrder } from '@/types/admin';
```

Replace the `useEffect` data loading (lines 77-85):
```tsx
  useEffect(() => {
    fetch('/api/admin/orders')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StoredOrder[]) => setOrders(data))
      .catch(() => setOrders([]));
  }, []);
```

The rest of the page (filtering + rendering) works against `StoredOrder` unchanged.

- [x] **Step 4: Verify**

Run: `npm run type-check`
Expected: no errors.

Curl smoke test (authenticated):
```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/admin/orders
# After placing an order via /api/checkout:
curl -s -b /tmp/cookies.txt -X PATCH http://localhost:3000/api/admin/orders/1 -H 'Content-Type: application/json' -d '{"status":"Fulfilled"}'
```
Expected: orders list shows the checkout-created order; status updates.

Browser check: `/admin/orders` lists orders placed from checkout; no localStorage/demo orders.

- [x] **Step 5: Commit**

```bash
git add src/app/api/admin/orders src/app/admin/orders/page.tsx
git commit -m "feat: DB-backed admin orders API"
```

---

### Task 11: Cleanup mock/localStorage paths + full verification

**Files:**
- Delete: `src/lib/mock-data.ts`
- Delete: `src/lib/custom-products.ts`
- Modify: `.env.local`, `.env.example` (remove `NEXT_PUBLIC_USE_MOCK_DATA`; update comments)

- [x] **Step 1: Confirm no remaining imports**

Run:
```bash
rg -l "mock-data|custom-products|sss_orders|sss_mock_cart|sss_store_settings|NEXT_PUBLIC_USE_MOCK_DATA" src
```
Expected: no output (or only `.env.local`/`.env.example` which you update in Step 2). If anything in `src` still matches, remove/replace those usages first.

- [x] **Step 2: Update env files**

`.env.local` — remove the `NEXT_PUBLIC_USE_MOCK_DATA=true` line and the demo-mode comment block. `.env.example` — same; ensure `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` remain documented.

- [x] **Step 3: Delete legacy files**

```bash
git rm src/lib/mock-data.ts src/lib/custom-products.ts
```

- [x] **Step 4: Delete the legacy env comment**

If `src/app/checkout/page.tsx` still says "In this demo, the cart is stored locally in your browser", update that paragraph to reflect DB-backed checkout:
```
In the live store, your bag is carried to checkout and the order is stored in the database. Payment is captured as Cash on Delivery.
```

- [x] **Step 5: Full verification**

Run:
```bash
npm run type-check
npm run lint
npm run build
```
Expected: all three pass with no errors.

- [x] **Step 6: End-to-end smoke test (dev server running)**

1. `npm run dev`
2. Visit `/` — products load from MySQL.
3. Add `solitaire-pendant` to cart, open `/checkout` — an order is created; inventory drops.
4. Login to `/admin` with `admin123`.
5. `/admin/inventory` — change stock; `/admin/orders` — see the order; `/admin/settings` — change a value and reload.
6. `/admin/products/new` — create a product; it appears on the storefront.
7. Confirm in DBeaver: `orders`, `order_items`, `products` (inventory changed), `settings` (changed value) all updated.
8. Confirm logout works and unauthenticated `/admin` redirects to login.

- [x] **Step 7: Commit**

```bash
git add .env.local .env.example src/app/checkout/page.tsx
git commit -m "refactor: remove mock data and localStorage persistence paths"
```

---

## Self-Review Checklist

1. **Spec coverage:** products (T3/T7/T8), settings (T9), orders (T5/T10), inventory (T7), cart (T4), auth (T6), seed (T2), schema/migration (T1), setup steps (T1), deployment note (env `DATABASE_URL` swap + `prisma migrate deploy` documented in spec). ✓
2. **Placeholder scan:** no TBDs; every code step has concrete code. ✓
3. **Type consistency:** `cartRecordToCart`, `productRecordToProduct`, `gidToId`, `parseAfter`, `CustomProductInput`, `InventoryUpdate`, `StoredOrder`, `StoreConfigRow`, `StoreAlerts` defined once and reused consistently. CartContext imports from `@/lib/cart-api`; shopify.ts is server-only. ✓
4. **Session TTL / cookie names** consistent across auth tasks. ✓
