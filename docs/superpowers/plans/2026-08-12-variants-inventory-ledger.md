# Variants + Inventory Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real `ProductVariant` rows (option matrix, SKU, barcode, price override, stock, reorder point, soft-delete) and an auditable `InventoryMovement` ledger, making cart/order/checkout/admin variant-keyed so the tool generalizes to clothing (Size × Colour) without a later retrofit.

**Architecture:** `Product` keeps `price`/`compareAtPrice` as base fields plus denormalized `totalInventory`/`availableForSale` aggregates; each `ProductVariant` owns per-unit SKU/barcode/price/stock. All stock changes funnel through one `applyMovement()` helper (guarded atomic decrements, ledger rows, aggregate updates) inside a `$transaction`. Existing storefront is already variant-aware, so mappers returning real variants light it up with no component changes. Admin gets a variant-matrix editor, variant-level inventory/ledger UI, and archive/restore.

**Tech Stack:** Next.js 14.2, Prisma 5 + `@prisma/client` (MySQL 8, local `sss_ecommerce` dev DB), Vitest (node env, happy-dom), bcryptjs.

> **Testing note (from existing harness):** The local MySQL user `sss` cannot create databases. Tests run against the seeded `sss_ecommerce` dev DB and are row-hermetic: every seed uses `test-*` / `@test.*` identifiers tracked in a `TestScope` and `cleanupScoped()` deletes them FK-safe in `afterAll`. Never seed or assert against real product rows. `vitest.config.ts` points `DATABASE_URL` at the dev DB for the test subprocess.

## Global Constraints

- MySQL schema via Prisma; migrations generated with `prisma migrate dev --create-only`, backfill hand-edited in, then applied.
- TypeScript strict; `npm run type-check` (`tsc --noEmit`) and `npm run lint` must pass at every commit. `tsconfig` includes `tests/**`, so test files are type-checked too.
- `npm test` (= `vitest run`) green, hermetic rows only.
- **No DB-level unique on `sku`/`barcode`** — uniqueness is app-layer, scoped to `deletedAt: null` (Option A).
- **Soft-delete everywhere in admin**: variants archived via `deletedAt` (+ `availableForSale=false`); products archived via `deletedAt`. No hard deletes.
- All stock writes go through `applyMovement()`; no other code may touch `ProductVariant.stock` or `Product.totalInventory` directly.
- Outflows (SALE, DAMAGE, negative ADJUSTMENT) are guarded — no negative stock, no oversell.
- `ProductVariant.product` → `onDelete: Cascade`; `OrderItem.variant` → `onDelete: Restrict`; `CartItem.variant` → `onDelete: Cascade`.
- Money stays `Decimal(12,2)`; JSON columns (`selectedOptions`, `options`, `image`) remain `Json`.

---

### Task 1: Prisma schema + migration + backfill + seed

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_variants_inventory_ledger/migration.sql` (via `--create-only`, hand-edited)
- Modify: `prisma/seed.ts`
- Modify: `tests/helpers/seed.ts` (remove `Product.sku` usage so type-check stays green)

**Interfaces:**
- Consumes: current schema (Product/CartItem/OrderItem as-is).
- Produces: `ProductVariant` + `InventoryMovement` Prisma models; `CartItem.variantId`, `OrderItem.variantId`, `Product.deletedAt`; `Product.sku` removed. Seed creates one Default variant per product + initial RESTOCK movements.

- [x] **Step 1: Update `prisma/schema.prisma`**

Add the two new models and wire the relations:

```prisma
model ProductVariant {
  id                Int      @id @default(autoincrement())
  productId         Int
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  title             String
  sku               String?
  barcode           String?
  price             Decimal  @db.Decimal(12, 2)
  compareAtPrice    Decimal? @db.Decimal(12, 2)
  currencyCode      String   @default("INR")
  stock             Int      @default(0)
  lowStockThreshold Int      @default(5)
  availableForSale  Boolean  @default(true)
  image             Json?
  selectedOptions   Json     @default("[]")
  deletedAt         DateTime?
  position          Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  cartItems         CartItem[]
  orderItems        OrderItem[]
  movements         InventoryMovement[]
}

model InventoryMovement {
  id        Int            @id @default(autoincrement())
  variantId Int
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  type      String
  quantity  Int
  note      String         @default("")
  reference String?
  createdAt DateTime       @default(now())
}
```

`Product`: add `deletedAt DateTime?`, add `variants ProductVariant[]`, and **remove** the `sku String?` line.

`CartItem`: add `variantId Int` + relation (`onDelete: Cascade`); change unique to `@@unique([cartId, variantId])`.

`OrderItem`: add `variantId Int` + relation (**`onDelete: Restrict`**).

- [x] **Step 2: Generate the migration**

```bash
npx prisma migrate dev --create-only --name variants_inventory_ledger
```

Expected: a new folder `prisma/migrations/<timestamp>_variants_inventory_ledger/migration.sql` containing CREATE TABLE for `ProductVariant`/`InventoryMovement`, `ALTER Product` (ADD `deletedAt`, DROP COLUMN `sku`), and `ALTER CartItem`/`OrderItem` (ADD COLUMN `variantId`, ADD CONSTRAINT FK). Do NOT apply yet.

- [x] **Step 3: Hand-edit the migration SQL for the backfill**

Prisma will generate `ADD COLUMN variantId ... NOT NULL`, which fails on the existing rows. Edit `migration.sql` so the order is: tables → backfill → contract:

1. In the `ALTER TABLE CartItem` and `ALTER TABLE OrderItem` statements, change the added `variantId` column to **`NULL`** and **remove the FK `ADD CONSTRAINT` line** from those statements (re-add below).
2. If `DROP COLUMN \`sku\`` on `Product` is generated before the backfill, move it to the **very end** of the file.
3. After all `CREATE TABLE`/`ALTER ... ADD COLUMN` statements, add:

```sql
-- Backfill: one Default variant per product
INSERT INTO `ProductVariant`
  (`productId`, `title`, `price`, `compareAtPrice`, `currencyCode`, `sku`, `barcode`,
   `stock`, `lowStockThreshold`, `availableForSale`, `selectedOptions`, `position`,
   `createdAt`, `updatedAt`)
SELECT `id`, 'Default Title', `price`, `compareAtPrice`, `currencyCode`, `sku`, NULL,
       `totalInventory`, 5, `availableForSale`, '[]', 0, NOW(3), NOW(3)
FROM `Product`;

-- Point existing rows at their product's default variant
UPDATE `CartItem` SET `variantId` =
  (SELECT `id` FROM `ProductVariant` v WHERE v.`productId` = `CartItem`.`productId`);
UPDATE `OrderItem` SET `variantId` =
  (SELECT `id` FROM `ProductVariant` v WHERE v.`productId` = `OrderItem`.`productId`);
```

4. Append the contract at the end:

```sql
ALTER TABLE `CartItem` MODIFY `variantId` INT NOT NULL;
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_variantId_fkey`
  FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `OrderItem` MODIFY `variantId` INT NOT NULL;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey`
  FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

(Check the exact column types/FK names against the generated SQL — MySQL may emit `INTEGER`.)

- [x] **Step 4: Apply the migration and regenerate the client**

```bash
npx prisma migrate dev
```

Expected: migration applies; existing products now each have a Default variant; cart/order rows point at their default variant; `prisma generate` runs. If a step fails, drop the DB and re-run migrations + seed (dev only).

- [x] **Step 5: Update `prisma/seed.ts` to create variants + movements**

Add a helper and call it inside the product loop; **remove `sku` from the product create/update `data`** (fields at lines ~148/167):

```ts
const VARIANT_DEFAULT_STOCK = 25;

async function upsertVariants(
  productId: number,
  skuBase: string,
  specs: Array<{ title: string; price: number; selectedOptions: Array<{ name: string; value: string }>; stock?: number }>
) {
  await prisma.productVariant.deleteMany({ where: { productId } });
  for (const s of specs) {
    const v = await prisma.productVariant.create({
      data: {
        productId,
        title: s.title,
        sku: `${skuBase}-${s.title.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`,
        price: s.price,
        currencyCode: CURRENCY,
        stock: s.stock ?? VARIANT_DEFAULT_STOCK,
        selectedOptions: JSON.stringify(s.selectedOptions),
        availableForSale: (s.stock ?? VARIANT_DEFAULT_STOCK) > 0,
      },
    });
    await prisma.inventoryMovement.create({
      data: { variantId: v.id, type: 'RESTOCK', quantity: v.stock, note: 'Initial stock', reference: 'seed' },
    });
  }
}
```

After the product `upsert` in the loop, call:

```ts
await upsertVariants(product.id, spec.handle, [
  { title: spec.material, price: spec.price, selectedOptions: [{ name: 'Material', value: spec.material }] },
]);
```

`product.options` for the default path stays `[{ name: 'Material', values: [spec.material] }]` (already in seed).

Add one matrix example — append to `products` array a new spec with a `variants` field, extend `ProductSeed` with `variants?: Array<{ title: string; price: number; selectedOptions: Array<{ name: string; value: string }>; stock?: number }>`, set its `options` to `[{ name: 'Length', values: ['16"', '18"'] }, { name: 'Finish', values: ['Yellow Gold', 'Rose Gold'] }]`, and in the loop branch: if `spec.variants` exists, call `upsertVariants` with it instead of the default Material variant.

- [x] **Step 6: Update `tests/helpers/seed.ts` (keep type-check green)**

Remove `sku: 'SSS-...'` from `seedProduct`'s create data. The variant-based seeding happens in Task 2.

- [x] **Step 7: Verify + commit**

```bash
npm run db:migrate && npm run db:seed && npm run type-check
```

Expected: migration no-op, seed succeeds, type-check green. Then:

```bash
git add prisma/ && git commit -m "feat(schema): add ProductVariant + InventoryMovement with backfill migration and seeded variants"
```

---

### Task 2: Data layer — mappers, shopify reads, types, availability

**Files:**
- Modify: `src/types/shopify.ts`
- Modify: `src/lib/db-mappers.ts`
- Modify: `src/lib/shopify.ts`
- Modify: `src/lib/utils.ts`
- Modify: `tests/helpers/seed.ts` (variant-aware seeding)
- Create: `tests/api/db-mappers.test.ts`
- Test: `tests/api/db-mappers.test.ts`

**Interfaces:**
- Consumes: Task 1 schema (real `ProductVariant` rows).
- Produces:
  - `variantRecordToVariant(v: DbProductVariant): ProductVariant`
  - `productRecordToProduct(p: DbProduct & { variants?: DbProductVariant[] }): Product`
  - `cartRecordToCart(cart, items: Array<DbCartItem & { variant: DbProductVariant & { product: DbProduct } }>): Cart`
  - `ProductVariant` type gains `barcode: string | null` and `lowStockThreshold: number`.
  - `getVariantAvailability` respects `lowStockThreshold`.

- [x] **Step 1: Write the failing test** — `tests/api/db-mappers.test.ts`

```ts
import { prisma } from '@/lib/prisma';
import { productRecordToProduct, cartRecordToCart, variantRecordToVariant } from '@/lib/db-mappers';
import { seedProduct, seedVariant, seedCartWithItem, cleanupScoped, TestScope } from '../helpers/seed';

describe('db-mappers with real variants', () => {
  const scope: TestScope = {
    userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [],
  };

  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('maps a product with two variants (price range, stock sum, availability)', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await seedVariant(scope, productId, { sku: 'V2', price: 150, stock: 3 });
    const row = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    const product = productRecordToProduct(row!);

    expect(product.variants.edges).toHaveLength(2);
    expect(product.totalInventory).toBe(13); // 10 (default) + 3
    expect(product.availableForSale).toBe(true);
    expect(product.priceRange.minVariantPrice.amount).toBe(100);
    expect(product.priceRange.maxVariantPrice.amount).toBe(150);
    expect(product.variants.edges[1].node.sku).toBe('V2');
    expect(product.variants.edges[1].node.lowStockThreshold).toBe(5);
  });

  it('excludes archived variants and drops totalInventory/availability when none sellable', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await prisma.productVariant.updateMany({ where: { productId }, data: { deletedAt: new Date(), availableForSale: false } });
    const row = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    const product = productRecordToProduct(row!);
    expect(product.variants.edges).toHaveLength(0);
    expect(product.totalInventory).toBe(0);
    expect(product.availableForSale).toBe(false);
    expect(product.priceRange.minVariantPrice.amount).toBe(100); // base fallback
  });

  it('maps cart items to real variant merchandise', async () => {
    const productId = await seedProduct(scope, { price: 100 });
    await seedCartWithItem(scope, productId, 2);
    const cart = await prisma.cart.findUnique({ where: { id: scope.cartId }, include: { items: { include: { variant: { include: { product: true } } } } } });
    const mapped = cartRecordToCart(cart!, cart!.items);
    expect(mapped.lines.edges[0].node.merchandise.title).toBe('Default Title');
    expect(mapped.lines.edges[0].node.merchandise.quantityAvailable).toBe(10);
    expect(mapped.lines.edges[0].node.cost.totalAmount.amount).toBe(200);
  });
});
```

`seedProduct`/`seedVariant`/`seedCartWithItem` from the updated helper (Step 2) create a Default variant automatically. `seedVariant` returns the new variant id and pushes it onto `scope.variantIds`.

- [x] **Step 2: Update `tests/helpers/seed.ts`**

Add `variantIds: number[]` to `TestScope` (and to every existing `TestScope` literal in the API tests — `tests/api/auth.test.ts:17`, `tests/api/checkout-route.test.ts:15`, `tests/api/checkout-order.test.ts` has no scope). Add to `cleanupScoped` (orderItems→orders first, cartItems by cartId, then products cascade variants/movements — existing cleanup already handles order/cart; verify `product.deleteMany` still works now that `ProductVariant` cascades and `InventoryMovement` cascades from variant; `OrderItem.variant` is Restrict but orderItems are deleted with the order first). Rewrite:

```ts
export async function seedProduct(scope: TestScope, overrides: { price?: number; stock?: number } = {}): Promise<number> {
  const handle = `test-${nextId()}`;
  const price = overrides.price ?? 12500;
  const stock = overrides.stock ?? 10;
  const product = await prisma.product.create({
    data: {
      handle, title: `Test Product ${handle}`, description: 'A test product for the harness.',
      descriptionHtml: '<p>A test product.</p>', productType: 'Ring', price, currencyCode: 'INR',
      totalInventory: stock, availableForSale: stock > 0,
      featuredImage: JSON.stringify({ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 1200, height: 1500 }),
      images: JSON.stringify([{ id: `gid://db/MediaImage/${handle}`, url: 'https://via.placeholder.com/400x500', altText: null, width: 400, height: 500 }]),
      options: JSON.stringify([{ id: `gid://db/ProductOption/${handle}`, name: 'Title', values: ['Default Title'] }]),
      tags: ['test'], seo: JSON.stringify({ title: 'Test', description: 'test' }), publishedAt: new Date(),
    },
  });
  scope.productIds.push(product.id);
  await seedVariant(scope, product.id, { sku: `SSS-${handle.toUpperCase().replace(/-/g, '')}`, price, stock, selectedOptions: [] });
  return product.id;
}

export async function seedVariant(scope: TestScope, productId: number, overrides: {
  sku?: string; price?: number; stock?: number; selectedOptions?: Array<{ name: string; value: string }>; lowStockThreshold?: number;
} = {}): Promise<number> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('missing product');
  const v = await prisma.productVariant.create({
    data: {
      productId, title: overrides.selectedOptions?.length ? overrides.selectedOptions.map((o) => o.value).join(' / ') : 'Default Title',
      sku: overrides.sku ?? `V-${nextId()}`, price: overrides.price ?? Number(product.price),
      currencyCode: product.currencyCode, stock: overrides.stock ?? 10,
      lowStockThreshold: overrides.lowStockThreshold ?? 5,
      selectedOptions: JSON.stringify(overrides.selectedOptions ?? []),
      availableForSale: (overrides.stock ?? 10) > 0,
    },
  });
  scope.variantIds.push(v.id);
  return v.id;
}

export async function seedCartWithItem(scope: TestScope, productId: number, quantity: number, variantId?: number): Promise<{ cartId: string; cartRowId: number }> {
  const cart = await prisma.cart.create({ data: { token: `cart-test-${nextId()}` } });
  scope.cartId = cart.id;
  scope.cartGid = `gid://db/Cart/${cart.id}`;
  const variant = variantId ?? (await prisma.productVariant.findFirstOrThrow({ where: { productId } })).id;
  await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variant, quantity } });
  return { cartId: `gid://db/Cart/${cart.id}`, cartRowId: cart.id };
}
```

Remove `totalInventory`/`availableForSale`/`sku` from `seedProduct` data accordingly. Update the two existing `TestScope` literals in `auth.test.ts` and `checkout-route.test.ts` to include `variantIds: []`.

- [x] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/api/db-mappers.test.ts`
Expected: FAIL — `variantRecordToVariant` / `seedVariant` not defined; type-check fails.

- [x] **Step 4: Implement `src/types/shopify.ts`, `src/lib/db-mappers.ts`, `src/lib/shopify.ts`, `src/lib/utils.ts`**

`src/types/shopify.ts` — extend `ProductVariant`:

```ts
export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: SelectedOption[];
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  image: Image | null;
  sku: string | null;
  barcode: string | null;
  lowStockThreshold: number;
}
```

`src/lib/db-mappers.ts` — replace `variantForProduct` with real mapping; rework `productRecordToProduct` and `cartRecordToCart`:

```ts
import type { DbProduct, DbProductVariant, DbCart, DbCartItem, DbArticle, Setting } from '@prisma/client'; // adjust alias

export function variantRecordToVariant(v: DbProductVariant): ProductVariant {
  const price = Number(v.price);
  const compare = v.compareAtPrice != null ? Number(v.compareAtPrice) : null;
  const selectedOptions = (Array.isArray(v.selectedOptions) ? v.selectedOptions : []) as SelectedOption[];
  return {
    id: `${GID_PREFIX}/ProductVariant/${v.id}`,
    title: v.title,
    availableForSale: v.availableForSale,
    quantityAvailable: v.stock,
    selectedOptions,
    price: { amount: price, currencyCode: v.currencyCode },
    compareAtPrice: compare != null ? { amount: compare, currencyCode: v.currencyCode } : null,
    image: toImage(v.image),
    sku: v.sku,
    barcode: v.barcode,
    lowStockThreshold: v.lowStockThreshold,
  };
}

export function productRecordToProduct(p: DbProduct & { variants?: DbProductVariant[] }): Product {
  const variants = (p.variants ?? []).filter((v) => !v.deletedAt);
  const edges = variants.map((node) => ({ node: variantRecordToVariant(node) }));
  const prices = variants.map((v) => Number(v.price));
  const min = prices.length ? Math.min(...prices) : Number(p.price);
  const max = prices.length ? Math.max(...prices) : Number(p.price);
  const totalInventory = variants.reduce((s, v) => s + v.stock, 0);
  const currency = variants[0]?.currencyCode || p.currencyCode;
  // keep the existing images/options/seo mapping, then:
  return {
    id: `${GID_PREFIX}/Product/${p.id}`, handle: p.handle, title: p.title,
    description: p.description, descriptionHtml: p.descriptionHtml, vendor: p.vendor,
    productType: p.productType, tags: (Array.isArray(p.tags) ? p.tags : []) as string[],
    availableForSale: variants.some((v) => v.availableForSale && v.stock > 0),
    totalInventory,
    images: { edges: images.map((node) => ({ node })), pageInfo: { hasNextPage: false } },
    featuredImage: toImage(p.featuredImage),
    options: (Array.isArray(p.options) ? p.options : []) as ProductOption[],
    variants: { edges, pageInfo: { hasNextPage: false, hasPreviousPage: false } },
    priceRange: { minVariantPrice: { amount: min, currencyCode: currency }, maxVariantPrice: { amount: max, currencyCode: currency } },
    compareAtPriceRange: null,
    seo: { title: (seo.title as string) ?? null, description: (seo.description as string) ?? null },
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  };
}
```

`cartRecordToCart` signature change (merchandise = `variantRecordToVariant(item.variant)`, cost from `item.variant.price`):

```ts
export function cartRecordToCart(cart: DbCart, items: Array<DbCartItem & { variant: DbProductVariant & { product: DbProduct } }>): Cart {
  const edges = items
    .filter((item) => item.quantity > 0)
    .map((item): { node: CartLine } => {
      const merchandise = variantRecordToVariant(item.variant);
      const amount = Number(item.variant.price) * item.quantity;
      return {
        node: {
          id: `${GID_PREFIX}/CartLine/${item.id}`,
          quantity: item.quantity,
          merchandise,
          cost: { totalAmount: { amount, currencyCode: merchandise.price.currencyCode }, amountPerQuantity: { amount: Number(item.variant.price), currencyCode: merchandise.price.currencyCode } },
          attributes: [], discounts: [],
        },
      };
    });
  // subtotal/totalQuantity/note/createdAt/updatedAt as before
}
```

`src/lib/shopify.ts` — add a filtered variants include to every product fetch and filter archived products:

```ts
const variantsInclude = { variants: { where: { deletedAt: null }, orderBy: { position: 'asc' as const } } };
```

- `fetchProducts`: `where: { deletedAt: null }` + `include: variantsInclude`.
- `fetchProduct`: `include: variantsInclude`.
- `fetchProductRecommendations`: add `where: { id: { not: id }, deletedAt: null }` + `include: variantsInclude`.
- `fetchCollection`: add `deletedAt: null` on the product where; nested `include: { items: { include: { product: { include: variantsInclude } } } }`.
- `fetchCollection('all')` / `('bestsellers')`: `where` gains `deletedAt: null`, `include: variantsInclude`.

`src/lib/utils.ts` — use the variant threshold:

```ts
export function getVariantAvailability(variant: { availableForSale: boolean; quantityAvailable: number | null; lowStockThreshold?: number }): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'; message: string;
} {
  if (!variant.availableForSale) return { status: 'out_of_stock', message: 'Sold out' };
  const threshold = variant.lowStockThreshold ?? 5;
  if (variant.quantityAvailable !== null && variant.quantityAvailable <= threshold) {
    return { status: 'low_stock', message: `Only ${variant.quantityAvailable} left` };
  }
  return { status: 'in_stock', message: 'In stock' };
}
```

- [x] **Step 5: Run the test to verify it passes**

Run: `npm test -- tests/api/db-mappers.test.ts`
Expected: PASS.

- [x] **Step 6: Full check + commit**

```bash
npm run type-check && npm test
```

Then commit:

```bash
git add src/types/shopify.ts src/lib/db-mappers.ts src/lib/shopify.ts src/lib/utils.ts tests/
git commit -m "feat(data): map real variants through mappers; variant-aware reads and availability"
```

---

### Task 3: Inventory ledger service `applyMovement`

**Files:**
- Create: `src/lib/inventory.ts`
- Create: `tests/api/inventory.test.ts`
- Test: `tests/api/inventory.test.ts`

**Interfaces:**
- Consumes: Task 1 schema.
- Produces:
  - `export type MovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE'`
  - `export class InsufficientStockError extends Error`
  - `export async function applyMovement(input: { variantId: number; type: MovementType; quantity: number; note?: string; reference?: string }, tx?: Prisma.TransactionClient): Promise<void>`

- [x] **Step 1: Write the failing test** — `tests/api/inventory.test.ts`

```ts
import { prisma } from '@/lib/prisma';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';
import { seedProduct, seedVariant, cleanupScoped, TestScope } from '../helpers/seed';

describe('applyMovement (inventory ledger)', () => {
  const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };
  let variantId = 0;
  let productId = 0;

  beforeAll(async () => { productId = await seedProduct(scope, { stock: 3 }); variantId = scope.variantIds[0]; });
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  const variant = async () => prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });

  it('restock increments stock, writes movement, updates product aggregate', async () => {
    await applyMovement({ variantId, type: 'RESTOCK', quantity: 5, note: 'Supplier batch', reference: 'PO-1' });
    expect((await variant()).stock).toBe(8);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(Number(product.totalInventory)).toBe(8);
    const m = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId, type: 'RESTOCK' }, orderBy: { createdAt: 'desc' } });
    expect(m.quantity).toBe(5);
    expect(m.note).toBe('Supplier batch');
    expect(m.reference).toBe('PO-1');
  });

  it('sale decrements and writes a negative SALE movement', async () => {
    await applyMovement({ variantId, type: 'SALE', quantity: 2, reference: '#1001' });
    expect((await variant()).stock).toBe(6);
    const m = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId, type: 'SALE' }, orderBy: { createdAt: 'desc' } });
    expect(m.quantity).toBe(-2);
    expect(m.reference).toBe('#1001');
  });

  it('guards oversell: rejects SALE beyond stock with InsufficientStockError and no movement row', async () => {
    const before = (await variant()).stock;
    const beforeCount = await prisma.inventoryMovement.count();
    await expect(applyMovement({ variantId, type: 'SALE', quantity: before + 1 })).rejects.toBeInstanceOf(InsufficientStockError);
    expect((await variant()).stock).toBe(before);
    expect(await prisma.inventoryMovement.count()).toBe(beforeCount);
  });

  it('sets availableForSale false when stock hits zero and true again on restock', async () => {
    const v = await variant();
    const qty = v.stock;
    await applyMovement({ variantId, type: 'SALE', quantity: qty });
    expect((await variant()).availableForSale).toBe(false);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.availableForSale).toBe(false);
    await applyMovement({ variantId, type: 'RESTOCK', quantity: 1 });
    expect((await variant()).availableForSale).toBe(true);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).availableForSale).toBe(true);
  });

  it('rejects movements on archived variants', async () => {
    const pid = await seedProduct(scope, { stock: 2 });
    const vid = scope.variantIds.at(-1)!;
    await prisma.productVariant.update({ where: { id: vid }, data: { deletedAt: new Date() } });
    await expect(applyMovement({ variantId: vid, type: 'RESTOCK', quantity: 1 })).rejects.toThrow(/archived/);
    await prisma.product.deleteMany({ where: { id: pid } }); // removes scope row
  });

  it('rejects zero or non-integer quantity', async () => {
    await expect(applyMovement({ variantId, type: 'RESTOCK', quantity: 0 })).rejects.toThrow(/non-zero integer/);
    await expect(applyMovement({ variantId, type: 'RESTOCK', quantity: 1.5 })).rejects.toThrow(/non-zero integer/);
  });
});
```

Remove the placeholder "guards oversell" test (replace with the guarded-sale test below it).

- [x] **Step 2: Run to verify it fails**

Run: `npm test -- tests/api/inventory.test.ts`
Expected: FAIL — `applyMovement` not exported.

- [x] **Step 3: Implement `src/lib/inventory.ts`**

```ts
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export type MovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE';

const MOVEMENT_TYPES: MovementType[] = ['SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE'];
const OUTFLOW_TYPES: MovementType[] = ['SALE', 'DAMAGE'];

export class InsufficientStockError extends Error {
  constructor(message = 'Insufficient stock') { super(message); }
}

export async function applyMovement(
  input: { variantId: number; type: MovementType; quantity: number; note?: string; reference?: string },
  txClient?: Prisma.TransactionClient
): Promise<void> {
  const tx = txClient ?? prisma;
  const { variantId, type, quantity, note = '', reference } = input;

  if (!MOVEMENT_TYPES.includes(type)) throw new Error('Invalid movement type');
  if (!Number.isInteger(quantity) || quantity === 0) throw new Error('quantity must be a non-zero integer');

  const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error('Variant not found');
  if (variant.deletedAt) throw new Error('Variant is archived');

  const signed = OUTFLOW_TYPES.includes(type)
    ? -Math.abs(quantity)
    : type === 'ADJUSTMENT'
      ? quantity
      : Math.abs(quantity);

  if (signed < 0) {
    const res = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: Math.abs(signed) } },
      data: { stock: { decrement: Math.abs(signed) } },
    });
    if (res.count === 0) throw new InsufficientStockError(`Insufficient stock for ${type}`);
  } else {
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: signed } } });
  }

  const updated = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!updated) throw new Error('Variant not found after update');
  const available = updated.stock > 0;
  await tx.productVariant.update({ where: { id: variantId }, data: { availableForSale: available } });

  await tx.inventoryMovement.create({ data: { variantId, type, quantity: signed, note, reference } });

  await tx.product.update({ where: { id: updated.productId }, data: { totalInventory: { increment: signed } } });
  const sellable = await tx.productVariant.count({
    where: { productId: updated.productId, deletedAt: null, availableForSale: true },
  });
  await tx.product.update({ where: { id: updated.productId }, data: { availableForSale: sellable > 0 } });
}
```

- [x] **Step 4: Run to verify it passes**

Run: `npm test -- tests/api/inventory.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/inventory.ts tests/api/inventory.test.ts
git commit -m "feat(inventory): applyMovement ledger service with guarded atomic stock writes"
```

---

### Task 4: Cart + checkout become variant-keyed

**Files:**
- Modify: `src/app/api/cart/route.ts`
- Modify: `src/app/api/cart/items/route.ts`
- Modify: `src/app/api/cart/note/route.ts`
- Modify: `src/app/api/checkout/route.ts`
- Modify: `tests/api/checkout-route.test.ts`
- Create: `tests/api/cart.test.ts`
- Test: `tests/api/cart.test.ts`, `tests/api/checkout-route.test.ts`

**Interfaces:**
- Consumes: `applyMovement`, `variantRecordToVariant`, `cartRecordToCart` (variant-keyed), updated `seedCartWithItem`.
- Produces: cart lines keyed by variant `merchandiseId`; checkout decrements variant stock via `applyMovement('SALE', reference=orderNumber)` and stores `variantId` on `OrderItem`.

- [x] **Step 1: Write failing tests**

`tests/api/cart.test.ts`:

```ts
import { POST as createCart } from '@/app/api/cart/route';
import { POST as addItems, PATCH as updateItems, DELETE as removeItems } from '@/app/api/cart/items/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { seedProduct, seedVariant, cleanupScoped, TestScope } from '../helpers/seed';

function makeReq(path: string, body: unknown) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('variant-keyed cart', () => {
  const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('creates a cart with variant lines and merges duplicate variants', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds[0];
    const v2 = await seedVariant(scope, pid, { sku: 'V2', price: 150, selectedOptions: [{ name: 'Colour', value: 'Rose' }] });

    const res = await createCart(makeReq('/api/cart', { lines: [
      { merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 2 },
      { merchandiseId: `gid://db/ProductVariant/${v2}`, quantity: 1 },
    ] }));
    expect(res.status).toBe(200);
    const cart = await res.json();
    const cartId = cart.id;

    const added = await addItems(makeReq('/api/cart/items', { cartId, lines: [{ merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 3 }] }));
    const body = await added.json();
    expect(body.lines.edges).toHaveLength(2);
    const merged = body.lines.edges.find((e: { node: { merchandise: { sku: string } } }) => e.node.merchandise.sku === `SSS-${(await prisma.product.findUnique({ where: { id: pid } }))!.handle.toUpperCase().replace(/-/g, '')}`);
    expect(merged.node.quantity).toBe(5);
    expect(body.lines.edges.find((e: { node: { merchandise: { sku: string } } }) => e.node.merchandise.sku === 'V2').node.merchandise.selectedOptions[0].value).toBe('Rose');
  });

  it('updates and removes variant lines', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds[0];
    const res = await createCart(makeReq('/api/cart', { lines: [{ merchandiseId: `gid://db/ProductVariant/${v1}`, quantity: 2 }] }));
    const cartId = (await res.json()).id;
    const cartIdNum = gidToId(cartId)!;

    const patched = await updateItems(makeReq('/api/cart/items', {
      cartId,
      lines: [{ id: `gid://db/CartLine/${(await prisma.cartItem.findFirstOrThrow({ where: { cartId: cartIdNum } })).id}`, quantity: 4 }],
    }));
    expect((await patched.json()).lines.edges[0].node.quantity).toBe(4);

    const removed = await removeItems(makeReq('/api/cart/items', {
      cartId,
      lineIds: [`gid://db/CartLine/${(await prisma.cartItem.findFirstOrThrow({ where: { cartId: cartIdNum } })).id}`],
    }));
    expect((await removed.json()).lines.edges).toHaveLength(0);
  });
});
```

Update `tests/api/checkout-route.test.ts`:
- Add `variantIds: []` to the scope literal.
- Assert order item has `variantId`, variant stock decremented, and a SALE movement exists:

```ts
const order = await prisma.order.findUnique({ where: { orderNumber: body.order.orderNumber }, include: { items: true } });
expect(order!.items[0].variantId).toBe(scope.variantIds[0]);
const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: scope.variantIds[0] } });
expect(variant.stock).toBe(8);
const movement = await prisma.inventoryMovement.findFirstOrThrow({ where: { variantId: variant.id, type: 'SALE' } });
expect(movement.quantity).toBe(-2);
expect(movement.reference).toBe(body.order.orderNumber);
// product aggregate
const product = await prisma.product.findUnique({ where: { id: scope.productIds[0] } });
expect(Number(product!.totalInventory)).toBe(8);
```

- [x] **Step 2: Run to verify they fail**

Run: `npm test -- tests/api/cart.test.ts tests/api/checkout-route.test.ts`
Expected: FAIL — cart routes still key off `productId`, checkout still uses `product.totalInventory`.

- [x] **Step 3: Implement cart routes**

`src/app/api/cart/route.ts` — resolve variant gids:

```ts
async function resolveVariant(merchandiseId: string) {
  const id = gidToId(merchandiseId);
  if (id == null) return null;
  return prisma.productVariant.findUnique({ where: { id }, include: { product: true } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { lines?: Array<{ merchandiseId: string; quantity: number }> };
  const cart = await prisma.cart.create({ data: { token: crypto.randomUUID() } });
  if (Array.isArray(body.lines)) {
    for (const line of body.lines) {
      const variant = await resolveVariant(line.merchandiseId);
      if (!variant || variant.deletedAt || !variant.availableForSale) continue;
      await prisma.cartItem.create({ data: { cartId: cart.id, productId: variant.productId, variantId: variant.id, quantity: Math.max(1, line.quantity) } });
    }
  }
  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { variant: { include: { product: true } } } } } });
  return NextResponse.json(cartRecordToCart(full!, full!.items));
}
```

`GET` — same include; `cartRecordToCart(full, full.items)`.

`src/app/api/cart/items/route.ts` — all three handlers: resolve variant; `CartItem` upsert keyed on `variantId`; include variant+product:

```ts
const itemsInclude = { items: { include: { variant: { include: { product: true } } } } };
```

`POST`: `where: { cartId_variantId: { cartId: id, variantId } }`, `update: { quantity: { increment: ... } }`, `create: { cartId: id, productId: variant.productId, variantId, quantity }`.
`PATCH` / `DELETE`: unchanged except they operate on the `itemsInclude` cart fetch and line ids resolve to `CartItem` ids (unchanged).

`src/app/api/cart/note/route.ts` — update the cart fetch to use `itemsInclude` (it currently returns `cartRecordToCart(cart, cart.items)`; read the file and add the same include).

- [x] **Step 4: Implement checkout**

`src/app/api/checkout/route.ts` — full rewrite of the POST body:

```ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { gidToId } from '@/lib/db-mappers';
import { applyMovement, InsufficientStockError } from '@/lib/inventory';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { cartId?: string };
  if (!body.cartId) return NextResponse.json({ error: 'cartId is required' }, { status: 400 });
  const id = gidToId(body.cartId);
  if (id == null) return NextResponse.json({ error: 'Invalid cart id' }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
  const lines = cart.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const subtotal = lines.reduce((sum, l) => sum + Number(l.variant.price) * l.quantity, 0);
      const currency = lines[0].variant.currencyCode || 'INR';

      const created = await tx.order.create({
        data: {
          orderNumber: '', status: 'Processing', subtotal, total: subtotal, currencyCode: currency,
          paymentMethod: 'COD',
          items: {
            create: lines.map((l) => ({
              product: { connect: { id: l.variant.productId } },
              variant: { connect: { id: l.variant.id } },
              title: l.variant.title,
              handle: l.variant.product.handle,
              price: Number(l.variant.price),
              quantity: l.quantity,
              image: (l.variant.image as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            })),
          },
        },
        include: { items: true },
      });

      const orderNumber = `#${1000 + created.id}`;
      await tx.order.update({ where: { id: created.id }, data: { orderNumber } });

      for (const l of lines) {
        await applyMovement({ variantId: l.variant.id, type: 'SALE', quantity: l.quantity, reference: orderNumber }, tx);
      }

      await tx.cart.delete({ where: { id } });
      return created;
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id, orderNumber: `#${1000 + order.id}`, name: 'Walk-in Checkout', email: '',
        createdAt: order.createdAt.toISOString(), total: Number(order.total), currencyCode: order.currencyCode,
        status: order.status,
        lineItems: order.items.map((i) => ({ title: i.title, image: (i.image as { url?: string } | null)?.url || '/placeholder.svg', quantity: i.quantity })),
      },
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/api/cart.test.ts tests/api/checkout-route.test.ts`
Expected: PASS.

- [x] **Step 6: Full check + commit**

```bash
npm run type-check && npm test
```

```bash
git add src/app/api/cart/ src/app/api/checkout/ tests/
git commit -m "feat(cart): variant-keyed cart and checkout with SALE ledger movements"
```

---

### Task 5: Admin variants / movements / restore APIs

**Files:**
- Modify: `src/types/admin.ts`
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Create: `src/app/api/admin/variants/[id]/route.ts`
- Create: `src/app/api/admin/variants/[id]/restore/route.ts`
- Create: `src/app/api/admin/variants/[id]/movements/route.ts`
- Create: `src/app/api/admin/inventory/movements/route.ts`
- Create: `src/lib/variant-uniqueness.ts`
- Create: `tests/api/admin-variants.test.ts`
- Test: `tests/api/admin-variants.test.ts`

**Interfaces:**
- Consumes: `applyMovement`, `variantRecordToVariant`, `movementRecordToMovement`.
- Produces (admin JSON contracts):
  - `POST /api/admin/products` accepts `{ ...CustomProductInput, variants?: VariantInput[] }`, creates product + variants + RESTOCK movements.
  - `PATCH /api/admin/variants/[id]` accepts `VariantUpdate`, returns mapped variant; archives when `archived: true`.
  - `PATCH /api/admin/variants/[id]/restore` clears `deletedAt`.
  - `POST /api/admin/inventory/movements` accepts `MovementInput` (RESTOCK/ADJUSTMENT/DAMAGE), returns `{ ok, variant }`.
  - `GET /api/admin/variants/[id]/movements` returns `InventoryMovementView[]`.
  - `DELETE /api/admin/products/[id]` archives (sets `deletedAt`), `GET /api/admin/products` filters archived and includes variants.

- [x] **Step 1: Write failing tests** — `tests/api/admin-variants.test.ts`

```ts
import { POST as createProduct, GET as listProducts } from '@/app/api/admin/products/route';
import { DELETE as deleteProduct } from '@/app/api/admin/products/[id]/route';
import { PATCH as patchVariantRoute } from '@/app/api/admin/variants/[id]/route';
import { PATCH as restoreRoute } from '@/app/api/admin/variants/[id]/restore/route';
import { GET as movementsGet } from '@/app/api/admin/variants/[id]/movements/route';
import { POST as movementsPost } from '@/app/api/admin/inventory/movements/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedProduct, createUnexpiringSession, cleanupScoped, TestScope } from '../helpers/seed';

const AUTH = 'admin@sss.com';
const scope: TestScope = { userEmail: '', productHandle: '', productIds: [], variantIds: [], cartId: 0, orderNumbers: [], sessionTokens: [] };

function req(path: string, method: string, body: unknown, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    body: method === 'GET' ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: `sss_admin_session=${cookie}` } : {}) },
  });
}

describe('admin variant + movement APIs', () => {
  beforeAll(async () => { await createUnexpiringSession(AUTH, scope); });
  afterAll(async () => { await cleanupScoped(scope); await prisma.$disconnect(); });

  it('rejects unauthenticated access (401)', async () => {
    expect((await createProduct(req('/api/admin/products', 'POST', {}, undefined))).status).toBe(401);
    expect((await movementsGet(req('/api/admin/variants/1/movements', 'GET', undefined, undefined))).status).toBe(401);
  });

  it('creates a product with a variant matrix + initial RESTOCK movements', async () => {
    const res = await createProduct(req('/api/admin/products', 'POST', {
      title: `Matrix ${Date.now()}`, price: 1000, vendor: 'Style Statement by Shakthi Atelier',
      images: ['/placeholder.svg'],
      options: [{ name: 'Size', values: ['S', 'M'] }],
      variants: [
        { title: 'S', sku: 'MAT-S', price: 1000, stock: 3, selectedOptions: [{ name: 'Size', value: 'S' }] },
        { title: 'M', sku: 'MAT-M', price: 1100, stock: 0, selectedOptions: [{ name: 'Size', value: 'M' }] },
      ],
    }, scope.sessionTokens[0]));
    expect(res.status).toBe(201);
    const product = await res.json();
    expect(product.variants.edges).toHaveLength(2);
    expect(product.totalInventory).toBe(3);

    const rows = await prisma.productVariant.findMany({ where: { productId: gidToId(product.id)!, }, include: { movements: true } });
    expect(rows).toHaveLength(2);
    const s = rows.find((r) => r.sku === 'MAT-S')!;
    expect(s.movements).toHaveLength(1);
    expect(s.movements[0].type).toBe('RESTOCK');
    expect(s.movements[0].quantity).toBe(3);
    expect(rows.find((r) => r.sku === 'MAT-M')!.movements).toHaveLength(0); // no movement for 0 stock
    scope.productIds.push(gidToId(product.id)!);
  });

  it('rejects duplicate SKU among non-archived variants (409)', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const vid = scope.variantIds[0];
    await prisma.productVariant.update({ where: { id: vid }, data: { sku: 'DUP-1' } });
    const res = await patchVariantRoute(req(`/api/admin/variants/${vid}`, 'PATCH', { sku: 'DUP-1' }, scope.sessionTokens[0]));
    expect(res.status).toBe(409);
  });

  it('allows SKU reuse once the original is archived', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const v1 = scope.variantIds.at(-1)!;
    await prisma.productVariant.update({ where: { id: v1 }, data: { sku: 'REUSE-1' } });
    await patchVariantRoute(req(`/api/admin/variants/${v1}`, 'PATCH', { archived: true }, scope.sessionTokens[0]));
    const v2 = await prisma.productVariant.create({
      data: { productId: pid, title: 'Reuse', sku: 'REUSE-1', price: 100, selectedOptions: '[]', stock: 1 },
    });
    scope.variantIds.push(v2.id);
    expect(v2.sku).toBe('REUSE-1');
  });

  it('restores an archived variant', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const vid = scope.variantIds.at(-1)!;
    await patchVariantRoute(req(`/api/admin/variants/${vid}`, 'PATCH', { archived: true }, scope.sessionTokens[0]));
    const res = await restoreRoute(req(`/api/admin/variants/${vid}/restore`, 'PATCH', {}, scope.sessionTokens[0]));
    expect(res.status).toBe(200);
    const row = await prisma.productVariant.findUnique({ where: { id: vid } });
    expect(row!.deletedAt).toBeNull();
  });

  it('records RESTOCK/DAMAGE movements via the movements endpoint', async () => {
    const pid = await seedProduct(scope, { price: 100, stock: 4 });
    const vid = scope.variantIds.at(-1)!;
    const restock = await movementsPost(req('/api/admin/inventory/movements', 'POST', { variantId: `gid://db/ProductVariant/${vid}`, type: 'RESTOCK', quantity: 5, note: 'stock in' }, scope.sessionTokens[0]));
    expect(restock.status).toBe(200);
    const damage = await movementsPost(req('/api/admin/inventory/movements', 'POST', { variantId: `gid://db/ProductVariant/${vid}`, type: 'DAMAGE', quantity: 2, note: 'broken' }, scope.sessionTokens[0]));
    expect(damage.status).toBe(200);
    const list = await movementsGet(req(`/api/admin/variants/${vid}/movements`, 'GET', undefined, scope.sessionTokens[0]));
    const rows = await list.json();
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe('DAMAGE');
    expect(rows[0].quantity).toBe(-2);
    const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: vid } });
    expect(v.stock).toBe(7); // 4 - 2 + 5
  });

  it('archives a product (soft delete) and hides it from the list', async () => {
    const pid = await seedProduct(scope, { price: 100 });
    const gid = `gid://db/Product/${pid}`;
    const del = await deleteProduct(req(`/api/admin/products/${gid}`, 'DELETE', {}, scope.sessionTokens[0]));
    expect(del.status).toBe(200);
    const row = await prisma.product.findUnique({ where: { id: pid } });
    expect(row!.deletedAt).not.toBeNull();
    const variants = await prisma.productVariant.findMany({ where: { productId: pid } });
    expect(variants.every((v) => v.deletedAt)).toBe(true);
    const list = await listProducts(req('/api/admin/products?first=100', 'GET', undefined, scope.sessionTokens[0]));
    const body = await list.json();
    const handles = body.edges.map((e: { node: { handle: string } }) => e.node.handle);
    expect(handles).not.toContain((await prisma.product.findUnique({ where: { id: pid } }))!.handle);
  });
});
```

(Import `gidToId` in the test. The `patchVariantRoute` on an archived variant's `archived: true` re-archive is fine.)

- [x] **Step 2: Run to verify they fail**

Run: `npm test -- tests/api/admin-variants.test.ts`
Expected: FAIL — routes missing.

- [x] **Step 3: Implement `src/types/admin.ts` additions**

```ts
export interface VariantInput {
  title?: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  selectedOptions?: Array<{ name: string; value: string }>;
}

export interface VariantUpdate {
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  lowStockThreshold?: number;
  archived?: boolean;
}

export interface MovementInput {
  variantId: string; // gid://db/ProductVariant/{id}
  type: 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE';
  quantity: number;
  note?: string;
}

export interface InventoryMovementView {
  id: number;
  variantId: number;
  type: string;
  quantity: number;
  note: string;
  reference: string | null;
  createdAt: string;
}

export interface StoredOrderLineItem {
  title: string;
  image: string;
  quantity: number;
  variantTitle: string | null;
}
```

Also replace `InventoryUpdate` usage in `products/[id]` with a slimmer shape (see Step 5) — leave `InventoryUpdate` exported but unused is fine; better: remove it and use inline.

- [x] **Step 4: Implement `src/lib/variant-uniqueness.ts`**

```ts
import type { Prisma, PrismaClient } from '@prisma/client';

// Structural client: works with both `prisma` (PrismaClient) and a
// `$transaction` client (TransactionClient).
type ClientLike = Pick<Prisma.TransactionClient, 'productVariant'>;

export class SkuConflictError extends Error {}
export class BarcodeConflictError extends Error {}

export async function assertSkuUnique(sku: string, excludeVariantId: number | null, tx: ClientLike): Promise<void> {
  const existing = await tx.productVariant.findFirst({
    where: { sku, deletedAt: null, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
  });
  if (existing) throw new SkuConflictError(`SKU already in use: ${sku}`);
}

export async function assertBarcodeUnique(barcode: string, excludeVariantId: number | null, tx: ClientLike): Promise<void> {
  const existing = await tx.productVariant.findFirst({
    where: { barcode, deletedAt: null, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
  });
  if (existing) throw new BarcodeConflictError(`Barcode already in use: ${barcode}`);
}
```

(Import `Prisma` and `PrismaClient` from `@prisma/client`; `ClientLike` accepts both the singleton and a transaction client.)

- [x] **Step 5: Implement admin routes**

`src/app/api/admin/products/route.ts`:

```ts
export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const first = Math.min(Number(searchParams.get('first')) || 12, 100);
  const after = Number(searchParams.get('after')) || 0;
  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }, skip: after, take: first + 1,
    include: { variants: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
  });
  const hasNextPage = rows.length > first;
  const pageRows = rows.slice(0, first);
  return NextResponse.json({
    edges: pageRows.map((node) => ({ node: productRecordToProduct(node), cursor: node.id.toString() })),
    pageInfo: { hasNextPage, hasPreviousPage: after > 0, startCursor: pageRows[0]?.id.toString() ?? null, endCursor: pageRows.length > 0 ? pageRows[pageRows.length - 1].id.toString() : null },
  });
}
```

`POST`: replace the body — accept `CustomProductInput & { variants?: VariantInput[] }`; build `variantSpecs = input.variants?.length ? input.variants : [{ title: 'Default Title', price: input.price, stock: input.totalInventory ?? 10 }]`; run uniqueness checks for every non-empty `sku`/`barcode` (pass `null` as exclude); then `prisma.$transaction`: create product (no `sku` in data; `options: input.options ?? []`; `totalInventory`/`availableForSale` set from computed sums), create each variant (`selectedOptions: JSON.stringify(v.selectedOptions ?? [])`, `lowStockThreshold: v.lowStockThreshold ?? 5`), write a RESTOCK movement when `stock > 0` (`reference: 'admin'`), upsert collection as today; finally re-fetch with `include: { variants: true }` and return `productRecordToProduct`. Catch `SkuConflictError`/`BarcodeConflictError` → `409`.

`src/app/api/admin/products/[id]/route.ts`:

- `PATCH`: change to accept `{ price?: number; compareAtPrice?: number | null }` only (no `totalInventory`/`availableForSale`). Update product base fields. Return `productRecordToProduct` with `include: { variants: true }`.
- `DELETE`: archive instead of hard delete:

```ts
await prisma.$transaction([
  prisma.product.update({ where: { id }, data: { deletedAt: new Date() } }),
  prisma.productVariant.updateMany({ where: { productId: id }, data: { deletedAt: new Date(), availableForSale: false } }),
]);
```

`src/app/api/admin/variants/[id]/route.ts`:

```ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const body = await req.json().catch(() => ({})) as VariantUpdate;

  try {
    if (body.sku !== undefined) await assertSkuUnique(body.sku || '', id, prisma);
    if (body.barcode !== undefined) await assertBarcodeUnique(body.barcode || '', id, prisma);
  } catch (e) {
    if (e instanceof SkuConflictError || e instanceof BarcodeConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }

  const updated = await prisma.productVariant.update({
    where: { id },
    data: {
      ...(body.sku !== undefined ? { sku: body.sku || null } : {}),
      ...(body.barcode !== undefined ? { barcode: body.barcode || null } : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.compareAtPrice !== undefined ? { compareAtPrice: body.compareAtPrice } : {}),
      ...(body.lowStockThreshold !== undefined ? { lowStockThreshold: body.lowStockThreshold } : {}),
      ...(body.archived !== undefined ? { deletedAt: body.archived ? new Date() : null, availableForSale: body.archived ? false : undefined } : {}),
    },
  });
  return NextResponse.json(variantRecordToVariant(updated));
}
```

`src/app/api/admin/variants/[id]/restore/route.ts`:

```ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const updated = await prisma.productVariant.update({ where: { id }, data: { deletedAt: null } });
  return NextResponse.json(variantRecordToVariant(updated));
}
```

`src/app/api/admin/variants/[id]/movements/route.ts`:

```ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = gidToId(params.id);
  if (id == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  const rows = await prisma.inventoryMovement.findMany({ where: { variantId: id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map(movementRecordToMovement));
}
```

`src/app/api/admin/inventory/movements/route.ts`:

```ts
export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as MovementInput;
  const variantId = gidToId(body.variantId);
  if (variantId == null) return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  if (!['RESTOCK', 'ADJUSTMENT', 'DAMAGE'].includes(body.type)) return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
  if (!Number.isInteger(body.quantity) || body.quantity === 0) return NextResponse.json({ error: 'quantity must be a non-zero integer' }, { status: 400 });

  try {
    await applyMovement({ variantId, type: body.type, quantity: body.quantity, note: body.note ?? '', reference: 'admin' });
  } catch (e) {
    if (e instanceof InsufficientStockError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  return NextResponse.json({ ok: true, variant: variant ? variantRecordToVariant(variant) : null });
}
```

Add `movementRecordToMovement` to `db-mappers.ts`:

```ts
export function movementRecordToMovement(m: DbInventoryMovement): InventoryMovementView {
  return { id: m.id, variantId: m.variantId, type: m.type, quantity: m.quantity, note: m.note, reference: m.reference, createdAt: m.createdAt.toISOString() };
}
```

- [x] **Step 6: Run tests to verify they pass**

Run: `npm test -- tests/api/admin-variants.test.ts`
Expected: PASS.

- [x] **Step 7: Full check + commit**

```bash
npm run type-check && npm test
```

```bash
git add src/types/admin.ts src/lib/db-mappers.ts src/lib/variant-uniqueness.ts src/app/api/admin/
git commit -m "feat(admin): variant matrix create, variant update/restore, movement ledger APIs"
```

---

### Task 6: Admin variant-matrix editor (new product form)

**Files:**
- Create: `src/lib/variant-matrix.ts`
- Modify: `src/app/admin/products/new/page.tsx`
- Create: `tests/api/variant-matrix.test.ts`
- Test: `tests/api/variant-matrix.test.ts`

**Interfaces:**
- Consumes: `POST /api/admin/products` variant-matrix contract (Task 5).
- Produces: `generateVariantMatrix(dimensions): VariantMatrixCell[]` (pure, unit-tested); the new-product form submits `{ ...CustomProductInput, variants }`.

- [x] **Step 1: Write failing test** — `tests/api/variant-matrix.test.ts`

```ts
import { generateVariantMatrix } from '@/lib/variant-matrix';

describe('generateVariantMatrix', () => {
  it('produces the full cartesian product with titles', () => {
    const cells = generateVariantMatrix([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Colour', values: ['Red', 'Blue'] },
    ]);
    expect(cells).toHaveLength(4);
    expect(cells.map((c) => c.title).sort()).toEqual(['Blue / M', 'Blue / S', 'M / Red', 'Red / S'].sort());
    expect(cells[0].selectedOptions).toEqual([{ name: 'Size', value: 'S' }, { name: 'Colour', value: 'Red' }]);
  });

  it('returns a single Default cell for no dimensions', () => {
    expect(generateVariantMatrix([])).toEqual([{ title: 'Default Title', selectedOptions: [] }]);
  });

  it('skips dimensions with no values', () => {
    expect(generateVariantMatrix([{ name: 'Size', values: [] }, { name: 'Colour', values: ['Red'] }])).toHaveLength(1);
  });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `npm test -- tests/api/variant-matrix.test.ts`
Expected: FAIL — module missing.

- [x] **Step 3: Implement `src/lib/variant-matrix.ts`**

```ts
export interface VariantDimension { name: string; values: string[] }
export interface VariantMatrixCell {
  title: string;
  selectedOptions: Array<{ name: string; value: string }>;
}

export function generateVariantMatrix(dimensions: VariantDimension[]): VariantMatrixCell[] {
  const nonEmpty = dimensions.filter((d) => d.name.trim() && d.values.some((v) => v.trim()));
  if (nonEmpty.length === 0) return [{ title: 'Default Title', selectedOptions: [] }];

  let combos: Array<Array<{ name: string; value: string }>> = [[]];
  for (const dim of nonEmpty) {
    const next: Array<Array<{ name: string; value: string }>> = [];
    for (const combo of combos) {
      for (const value of dim.values) {
        if (!value.trim()) continue;
        next.push([...combo, { name: dim.name, value }]);
      }
    }
    combos = next;
  }

  return combos.map((selectedOptions) => ({
    title: selectedOptions.map((o) => o.value).join(' / '),
    selectedOptions,
  }));
}
```

- [x] **Step 4: Run to verify it passes**

Run: `npm test -- tests/api/variant-matrix.test.ts`
Expected: PASS.

- [x] **Step 5: Rework `src/app/admin/products/new/page.tsx`**

Keep the existing product fields (title, handle, type, vendor, description, tags, images, base price/compare-at, collection). Add:

1. **Dimension builder state**: `const [dimensions, setDimensions] = useState<Array<{ name: string; values: string[] }>>([])`. UI: rows of "Option name" + comma/enter-separated values input + remove button; an "Add option" button appends a dimension.
2. **Matrix grid**: `const matrix = useMemo(() => generateVariantMatrix(dimensions), [dimensions])`. State `cells: Record<string, { sku: string; barcode: string; price: number; compareAtPrice: string; stock: number; lowStockThreshold: number; enabled: boolean }>` keyed by a stable cell id (index or title). On dimension change, `setCells` prunes to `matrix` length, filling defaults (price = base price, stock = 10, threshold = 5, enabled = true).
3. Replace the old single-stock fields with the grid: each row shows title, and inputs for SKU, barcode, price, compare-at, stock, low-stock threshold, and a disable/enable toggle. Default-variant row (title "Default Title") gets the same inputs.
4. **Submit**: build `variants = matrix.filter(cell.enabled).map((cell, i) => ({ title: cell.title, sku: cells[i].sku || undefined, barcode: cells[i].barcode || undefined, price: Number(cells[i].price) || basePrice, compareAtPrice: cells[i].compareAtPrice ? Number(cells[i].compareAtPrice) : undefined, stock: Number(cells[i].stock) || 0, lowStockThreshold: Number(cells[i].lowStockThreshold) || 5, selectedOptions: cell.selectedOptions }))`; POST the existing payload plus `variants`, and `options: dimensions.map((d) => ({ id: `opt-${d.name}`, name: d.name, values: d.values }))` (empty dimensions → omit so the API defaults to a single Default variant). On 409, surface `body.error`.
5. Remove the old `totalInventory` state field and its single-number input; keep the preview panel (update it to summarize `variants.length` variants).

- [x] **Step 6: Verify + commit**

```bash
npm run type-check && npm run build
```

```bash
git add src/lib/variant-matrix.ts src/app/admin/products/new/page.tsx tests/api/variant-matrix.test.ts
git commit -m "feat(admin): variant-matrix editor in the new-product form"
```

---

### Task 7: Admin inventory page — variant-level ledger UI

**Files:**
- Modify: `src/app/admin/inventory/page.tsx`
- Delete: `src/app/api/admin/inventory/[handle]/route.ts` (legacy product-level PATCH)
- Test: manual + existing suites

**Interfaces:**
- Consumes: `GET /api/admin/products` (now includes variants), `POST /api/admin/inventory/movements`, `PATCH /api/admin/variants/[id]`, `PATCH /api/admin/variants/[id]/restore`, `GET /api/admin/variants/[id]/movements`.
- Produces: variant-level inventory screen.

- [x] **Step 1: Delete the legacy route**

```bash
git rm "src/app/api/admin/inventory/[handle]/route.ts"
```

- [x] **Step 2: Rework `src/app/admin/inventory/page.tsx`**

Replace the product-level rows with variant-level rows, keeping the header, metrics cards, tabs, and search from the current file:

1. **State**: `products: Product[]` (unchanged load), plus `expanded: Set<string>` (product ids), `movementDialog: { variant: ProductVariant; product: Product } | null`, `editDialog: ...`, `historyFor: { variantId: string } | null`, `historyRows`, `toast: string | null`.
2. **Status helper**:

```ts
function variantStatus(v: { availableForSale: boolean; quantityAvailable: number | null; lowStockThreshold: number }) {
  if (!v.availableForSale || !v.quantityAvailable) return { label: 'Sold Out', tone: 'red' as const };
  if (v.quantityAvailable <= v.lowStockThreshold) return { label: `Low (${v.quantityAvailable})`, tone: 'amber' as const };
  return { label: `In Stock (${v.quantityAvailable})`, tone: 'emerald' as const };
}
```

3. **Metrics**: totalUnits = sum of product.totalInventory; lowStockCount = count of variants where `stock > 0 && stock <= lowStockThreshold`; outOfStock = variants with `stock === 0 || !availableForSale`; valuation = sum over variants of `price * stock`.
4. **Row rendering**: group by product (unchanged card layout), but under each product render a variant sub-table: SKU/barcode, selectedOptions title, price (editable via edit dialog, not inline stock math), stock badge from `variantStatus`, and per-variant actions:
   - **Restock** → opens `movementDialog` prefilled `type: 'RESTOCK'`.
   - **Adjust** → `movementDialog` prefilled `type: 'ADJUSTMENT'` (allow negative).
   - **Damage** → `movementDialog` prefilled `type: 'DAMAGE'`.
   - **History** → `GET /api/admin/variants/{gid}/movements`, renders a table (type, signed qty, note, reference, timestamp).
   - **Edit** → `editDialog` (SKU, barcode, price, compare-at, lowStockThreshold) → `PATCH /api/admin/variants/[id]`; then reload.
   - **Archive/Restore** → `PATCH .../variants/[id]` with `{ archived: true }` or the `/restore` route.
5. **Movement dialog submit** → `POST /api/admin/inventory/movements` with `{ variantId, type, quantity, note }`; on 400 show `error`; on success reload + toast.
6. **Archived section**: after the active list, render products/variants that have been archived — fetched via `GET /api/admin/products?archived=1` (the archived branch on the GET route is added in Step 3). Each archived row shows a **Restore** action. Remove the old inline price/quantity math handlers (`handleQuantityChange`/`handleDirectQuantitySet`/`handleToggleStockAvailability`) — stock changes go through the movement dialog.

- [x] **Step 3: Extend `GET /api/admin/products` for archived listing**

In `src/app/api/admin/products/route.ts` `GET`, branch on `archived`:

```ts
const archived = searchParams.get('archived') === '1';
const rows = await prisma.product.findMany({
  where: archived ? { deletedAt: { not: null } } : { deletedAt: null },
  orderBy: { createdAt: 'desc' }, skip: after, take: first + 1,
  include: { variants: { orderBy: { position: 'asc' } } }, // include archived variants too for restore UI
});
```

- [x] **Step 4: Verify + commit**

```bash
npm run type-check && npm run build && npm test
```

```bash
git add src/app/admin/inventory/page.tsx src/app/api/admin/products/route.ts
git commit -m "feat(admin): variant-level inventory ledger UI with restock/adjust/damage/history/archive"
```

---

### Task 8: Dashboard archive + variant summaries; orders variant display

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/admin/orders/page.tsx`
- Test: extend `tests/api/admin-variants.test.ts` (already covers archive in Task 5) + a small orders mapping test

**Interfaces:**
- Consumes: `DELETE /api/admin/products/[id]` (archive), variant-aware product list, `StoredOrderLineItem.variantTitle`.
- Produces: dashboard shows variant count + total stock and archives via DELETE; orders list shows variant title.

- [x] **Step 1: Dashboard (`src/app/admin/page.tsx`)**

- Product rows: replace the current "delete" confirm with "Archive" (same `handleDelete` → `DELETE /api/admin/products/{gid}`); after success, remove from local state.
- Under each product title show `{product.variants.edges.length} variant(s) · {product.totalInventory} units` (data already available since `GET /api/admin/products` now includes variants).

- [x] **Step 2: Orders API (`src/app/api/admin/orders/route.ts`)**

```ts
const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: { include: { variant: true } } } });
const mapped: StoredOrder[] = orders.map((o) => ({
  id: o.id, orderNumber: o.orderNumber, name: o.customerName, email: o.customerEmail,
  createdAt: o.createdAt.toISOString(), total: Number(o.total), currencyCode: o.currencyCode, status: o.status,
  lineItems: o.items.map((i) => ({
    title: i.title,
    image: (i.image as { url?: string } | null)?.url || '/placeholder.svg',
    quantity: i.quantity,
    variantTitle: i.variant?.title ?? null,
  })),
}));
```

- [x] **Step 3: Orders page (`src/app/admin/orders/page.tsx`)**

Where a line item title is rendered, append the variant when present: `{item.variantTitle && item.variantTitle !== 'Default Title' ? ` — ${item.variantTitle}` : ''}`. Update the `StoredOrder` lineItem type usage to include `variantTitle` (via `types/admin.ts`).

- [x] **Step 4: Add a small orders mapping test**

Append to `tests/api/admin-orders.test.ts` (create if missing): seed a product + variant, seed a cart with the variant, call checkout POST, then `GET /api/admin/orders` with a session and assert the line item `variantTitle` equals the variant title.

- [x] **Step 5: Verify + commit**

```bash
npm run type-check && npm test && npm run build
```

```bash
git add src/app/admin/page.tsx src/app/admin/orders/ src/app/api/admin/orders/ src/types/admin.ts tests/
git commit -m "feat(admin): dashboard archive + variant summaries; orders show purchased variant"
```

---

### Task 9: Full verification & smoke test

**Files:**
- None (verification only).

- [x] **Step 1: Fresh migrate + seed**

```bash
npm run db:migrate && npm run db:seed
```

Expected: clean apply; 13+ products each with variants; matrix product has 4 variants; every variant has a RESTOCK movement.

- [x] **Step 2: Static + test gates**

```bash
npm run type-check && npm run lint && npm test && npm run build
```

Expected: all green.

- [x] **Step 3: Manual smoke (admin + storefront)**

1. `npm run dev`; open `/admin/login`, sign in.
2. `/admin/products/new` — add Size + Finish dimensions, verify matrix generates, set a few SKUs/prices/stocks, submit; verify the PDP at `/products/{handle}` shows the variant selector and the price updates per variant.
3. `/admin/inventory` — restock a variant (+note), damage another, open History, archive a variant, restore it.
4. Storefront — add a specific variant to the cart, check the drawer shows the variant title, check out, verify the order confirmation and that admin `/admin/orders` shows the variant.
5. Confirm `sku`/`barcode` reuse: archive a variant with SKU `X`, then create a new variant with SKU `X` (succeeds).

- [x] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: final verification for variants + inventory ledger"
```

## Verification (before review gate)

- `npm run type-check` clean.
- `npm run lint` clean.
- `npm test` all green (hermetic rows only).
- `npm run build` clean.
- Fresh `npm run db:migrate && npm run db:seed` produces variants + movements.

## Out of scope (later phases)

- Category attribute templates, CSV import/export, multi-tenancy, roles/audit trail, currency/unit flexibility.
- Email low-stock alerts (in-app flag only this phase).
