# Variants + Inventory Ledger Design

**Date:** 2026-08-12
**Status:** Approved (design review complete, pending implementation plan)

## Goal

Turn the single-SKU product model into a real variant system and track stock as
a ledger, so the tool generalizes from jewellery to clothing (Size × Colour
matrices, per-SKU stock, barcodes) without a painful retrofit later.

The storefront UI is already variant-aware (Shopify-shaped `ProductVariant`,
`VariantSelector`, cart lines keyed by variant `merchandiseId`), but the DB
collapses everything to one product with a single `totalInventory` number and
one synthesized variant per product. This phase makes the data layer + admin
truly variant-first and replaces the plain stock number with an auditable
movement ledger.

## Scope (Phase 1)

1. **Variants** — `ProductVariant` model (option matrix, SKU, barcode, price
   override, stock, reorder point, soft-delete). Cart/order/checkout/admin all
   become variant-keyed.
2. **Inventory ledger** — `InventoryMovement` model (SALE / RESTOCK /
   ADJUSTMENT / RETURN / DAMAGE), single atomic `applyMovement()` writer,
   low-stock flags, movement history UI.

Out of scope (later phases): category attribute templates, CSV import/export,
multi-tenancy, roles/audit trail, currency/unit flexibility.

## Design Decisions (reviewed & agreed)

- **JSON-based arbitrary options**: `Product.options` JSON is the dimension
  source; each `ProductVariant.selectedOptions` is `[{ name, value }]`. Handles
  any matrix; matches the Shopify shape the storefront already consumes.
- **Approach A — full vertical slice**: schema + migration + variant-keyed
  cart/order/checkout + admin matrix editor + ledger UI + seed/tests in one
  implementation plan.
- **All five movement types**: SALE (checkout), RESTOCK (stock-in), ADJUSTMENT
  (count fix), RETURN, DAMAGE.
- **Per-variant reorder point**: `lowStockThreshold` column on the variant
  (default 5); in-app flag in admin inventory (no email yet).

## Data Model

### New model `ProductVariant`

```prisma
model ProductVariant {
  id                Int      @id @default(autoincrement())
  productId         Int
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  title             String                 // "Default Title" or "M / Red"
  sku               String?   @unique      // MySQL allows multiple NULLs
  barcode           String?   @unique
  price             Decimal  @db.Decimal(12, 2)   // price override (defaults to product price)
  compareAtPrice    Decimal? @db.Decimal(12, 2)
  currencyCode      String   @default("INR")
  stock             Int      @default(0)
  lowStockThreshold Int      @default(5)
  availableForSale  Boolean  @default(true)
  image             Json?
  selectedOptions   Json     @default("[]")  // [{name, value}, ...]
  deletedAt         DateTime?               // soft-delete / discontinue
  position          Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  cartItems         CartItem[]
  orderItems        OrderItem[]
  movements         InventoryMovement[]
}
```

### New model `InventoryMovement`

```prisma
model InventoryMovement {
  id        Int      @id @default(autoincrement())
  variantId Int
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  type      String   // SALE | RESTOCK | ADJUSTMENT | RETURN | DAMAGE
  quantity  Int      // signed: outflow negative, inflow positive
  note      String   @default("")
  reference String?  // order number (SALE/RETURN) or "admin" for manual entries
  createdAt DateTime @default(now())
}
```

### Existing model changes

- `CartItem`: add `variantId Int`; `variant` relation with `onDelete: Cascade`
  (cart lines are transient); unique constraint becomes
  `@@unique([cartId, variantId])`.
- `OrderItem`: add `variantId Int`; `variant` relation with
  `onDelete: Restrict` (order history must survive variant deletion).
- `Product`: add `deletedAt DateTime?` (archive replaces hard delete). Keep
  `totalInventory` + `availableForSale` as **denormalized aggregates** (sum of
  variant stock / any sellable variant), updated in the same transaction as any
  stock write. `price`/`compareAtPrice`/`sku` remain as base values copied to
  the first variant.

### Delete semantics

- Product delete → cascades to variants (with the product gone, its variants
  go too).
- Variant delete → **soft-delete only** (`deletedAt` + `availableForSale=false`).
  `onDelete: Restrict` on `OrderItem.variantId` blocks hard deletion anyway;
  hard delete of variants is removed from admin in favour of archive.

## Migration & Backfill (expand-contract)

Applied via Prisma migrations using `prisma migrate dev --create-only` to
generate SQL, then hand-editing the backfill in before applying (reviewable as
one migration).

**Step A — expand:**
1. Create `ProductVariant` + `InventoryMovement` tables (unique `sku`/`barcode`,
   FKs to `Product`).
2. Add `Product.deletedAt`.
3. Add nullable `variantId` to `CartItem` and `OrderItem` (FKs: `Cascade` for
   cart, `Restrict` for order items).

**Step B — backfill SQL:**

```sql
INSERT INTO ProductVariant
  (productId, title, price, compareAtPrice, currencyCode, sku, barcode,
   stock, lowStockThreshold, availableForSale, selectedOptions, position,
   createdAt, updatedAt)
SELECT id, 'Default Title', price, compareAtPrice, currencyCode, sku, NULL,
       totalInventory, 5, availableForSale, '[]', 0, NOW(), NOW()
FROM Product;

UPDATE CartItem  SET variantId = (SELECT id FROM ProductVariant v WHERE v.productId = CartItem.productId);
UPDATE OrderItem SET variantId = (SELECT id FROM ProductVariant v WHERE v.productId = OrderItem.productId);
```

**Step C — contract:**
- `ALTER COLUMN variantId SET NOT NULL` on both tables.
- Optional initial `InventoryMovement` RESTOCK rows per variant
  (`note = 'Initial stock from migration'`).

**Guarantees:** non-destructive (existing carts/orders/products preserved);
`Product.totalInventory`/`availableForSale` left intact as aggregates;
`Product.sku` kept as base. Rollback: on MySQL/InnoDB failure, drop DB and
re-run from last good migration + seed (dev only, no prod data).

## Data Layer, Mappers & Inventory Service

### `src/lib/db-mappers.ts`

- `variantForProduct` → `variantRecordToVariant`: maps
  `gid://db/ProductVariant/{id}`, `sku`, `barcode`, `selectedOptions`,
  `quantityAvailable: stock`, price/compare-at, image.
- `productRecordToProduct` loads real variants; derives `totalInventory =
  Σ stock`, `availableForSale = any variant available`, `priceRange` from
  variant min/max prices (fallback `Product.price`). `Product.options` JSON
  stays the dimension source; archived variants (`deletedAt != null`) excluded.
- `cartRecordToCart` maps each `CartItem` to its real variant for `merchandise`.

### `src/lib/shopify.ts`

All product/cart queries add `include: { variants: true }` and filter
`deletedAt: null` on product + variant.

### New `src/lib/inventory.ts` — `applyMovement()` (only writer of stock)

```ts
applyMovement({ variantId, type, quantity, note, reference }) // SALE|RESTOCK|ADJUSTMENT|RETURN|DAMAGE
```

Inside a `$transaction`:
1. Sign the quantity (SALE/DAMAGE negative; RESTOCK/RETURN positive;
   ADJUSTMENT as given).
2. Outflows (SALE, DAMAGE, and negative ADJUSTMENT): **guarded atomic
   decrement** — `updateMany({ where: { id, stock: { gte: qty } }, data:
   { stock: { decrement: qty } } })`; count 0 → throw "insufficient stock"
   (no oversell, no negative stock for any outflow type).
3. Inflows (RESTOCK, RETURN, positive ADJUSTMENT): atomic `increment`.
4. Write the `InventoryMovement` row.
5. Update `variant.availableForSale = stock > 0`.
6. Update `Product.totalInventory` via **atomic increment/decrement** by the
   signed quantity; recompute `Product.availableForSale` from a fresh count of
   sellable variants (stale-read risk under concurrent writes to the same
   product is acceptable at this scale; self-corrects on next movement).

Checkout and all admin stock actions call this one helper — no other code
touches `stock` directly.

## API Routes

- `POST /api/admin/products` — accepts a full variant matrix; creates product +
  variants + initial RESTOCK movements in one transaction.
- `PATCH /api/admin/variants/[id]` — edit SKU, barcode, price, compare-at,
  threshold (metadata only; stock goes through movements).
- `POST /api/admin/inventory/movements` — `{ variantId, type, quantity, note }`
  → `applyMovement()`.
- `GET /api/admin/variants/[id]/movements` — movement history.
- `PATCH /api/admin/inventory/[handle]` — **removed** in favour of the
  variant-level movements endpoint (the handle-based route is ambiguous for
  multi-variant products). Product-level stock display reads derived
  `Product.totalInventory`.
- `/api/cart/*` and `/api/checkout` — keyed by variant gid; checkout decrements
  via `applyMovement(..., 'SALE', reference = orderNumber)`.

All admin routes keep the existing `getSession()` guard (`401` unauthenticated).

## Admin UI

- **`/admin/products/new` — variant-matrix editor:** existing fields stay; new
  option-dimensions builder (add/remove Size/Colour/etc with values);
  auto-generated cartesian matrix grid; per-row cells for SKU, barcode, price
  (pre-filled from base), compare-at, stock, low-stock threshold, availability
  toggle; deletable rows; regenerate prunes orphans. Submit creates
  product + variants + initial RESTOCK movements in one transaction.
- **`/admin/inventory` — variant-level ledger:** products group with expandable
  variant rows (selectedOptions, SKU/barcode, stock, threshold); In stock / Low
  / Out badges; Restock, Adjust, Damage actions (qty + note); Edit dialog for
  variant metadata; History panel per variant listing movements.
- **`/admin` dashboard:** product rows show variant count + total stock;
  delete → archive (soft-delete confirm).
- **`/admin/orders`:** line items show the purchased variant (selectedOptions
  summary).

## Storefront Impact

Minimal — already variant-aware:
- PDP option selector renders when `product.options.length > 0`; single
  Default-variant products keep today's look.
- ProductCard/ProductGrid/collections/search/recommendations unchanged (read
  `variants.edges[0]` / `priceRange`, now from real variants).
- **Tweak:** extend the product/variant type to carry `lowStockThreshold` so
  `getVariantAvailability()` in `src/lib/utils.ts` respects the per-variant
  reorder point instead of a hardcoded threshold.
- Cart drawer already renders `merchandise.selectedOptions`.

## Seed & Tests

**Seed (`prisma/seed.ts`):**
- Existing 12 jewellery products keep single "Default Title" variants (proves
  backfill path).
- Add one Size × Colour matrix example to exercise real multi-variant data
  end-to-end.
- Each seeded variant gets an initial RESTOCK movement ("Initial stock").

**Tests (Vitest, existing harness):**
- Update checkout tests: variant stock decrement, SALE movement rows, product
  aggregate updates.
- New `applyMovement` unit tests: guarded oversell rejection, damage floor at 0,
  inflow increments, movement rows per type.
- Cart tests: variant-keyed add/update/remove/note.
- New admin tests: create product with variant matrix, PATCH variant metadata,
  movements endpoint auth + validation.

## Error Handling

- Insufficient stock at checkout or on SALE/DAMAGE → `400` with
  variant-specific message.
- Movement validation: type in enum, `quantity ≠ 0`, positive for inflows,
  variant exists and not archived.
- Archived variant added to cart → `400`/`404`.
- Duplicate SKU / barcode → `409` with the offending value.
- Auth: existing `getSession()` guard on all admin routes → `401`.
- Prisma errors mapped to consistent JSON errors; movement failures never leave
  a half-applied transaction.

## Out of Scope (later phases)

- Category-driven attribute templates (jewellery material/purity vs clothing
  fabric/size chart).
- Listing/multi-channel (channel status, CSV import/export, WhatsApp/IG catalog).
- Multi-tenancy (Store/Tenant scoping).
- Staff roles, full audit trail, currency/unit flexibility.
