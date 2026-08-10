# MySQL Database + API Design

**Date:** 2026-08-10
**Status:** Approved

## Goal

Turn the store from a mock/localStorage-backed demo into a fully dynamic,
database-driven store. All store data (products, collections, settings, orders,
inventory, admin auth) is stored in MySQL and served through APIs. The store
runs against the developer's local MySQL (managed via DBeaver) now, and can
switch to a hosted MySQL URL later via an environment variable.

## Current State

- Next.js 14 App Router storefront ("sss-ecommerce").
- Data currently comes from `src/lib/shopify.ts`, which returns bundled mock
  data (`src/lib/mock-data.ts`) because Shopify credentials are not configured
  (`NEXT_PUBLIC_USE_MOCK_DATA=true`, empty token).
- Admin features persist to browser `localStorage`:
  - Custom products / inventory overrides: `src/lib/custom-products.ts`
  - Orders: `sss_orders` in localStorage
  - Store settings: `sss_store_settings` in localStorage
- Admin auth is a client-side passcode comparison
  (`src/app/admin/login/page.tsx`).

## Architecture

**Approach A:** Prisma reads/writes MySQL. Existing data-layer function names
and types in `src/lib/shopify.ts` are preserved, but their implementations
query MySQL instead of Shopify/mock. Server components read the DB directly;
client-side operations (cart, checkout, admin) go through REST API routes.
Admin auth is database-backed via an httpOnly session cookie.

### Components

1. **Prisma + MySQL**
   - `src/lib/prisma.ts` — Prisma client singleton.
   - `schema.prisma` — MySQL schema (tables below).
   - Migration + seed workflow via `prisma migrate` and a seed script.
2. **Data access** — `src/lib/shopify.ts` reimplemented over Prisma.
   - Keep exported signatures/types: `fetchProducts`, `fetchProduct`,
     `fetchProductRecommendations`, `fetchCollections`, `fetchCollection`,
     `fetchCart`, `createCart`, `addToCart`, `updateCartLine`,
     `removeFromCart`, `updateCartNote`, `fetchMenu`, `fetchMenus`,
     `fetchShop`, `fetchBlogs`, `fetchArticles`, `fetchArticle`.
   - Server-side functions query MySQL directly.
   - Client-side cart functions become wrappers that call `/api/cart/*`.
3. **API routes** (all JSON, validated, consistent error handling)
   - Auth: `POST /api/auth/login`, `POST /api/auth/logout`,
     `GET /api/auth/me`.
   - Cart: `POST /api/cart`, `GET /api/cart`, `POST /api/cart/items`,
     `PATCH /api/cart/items`, `DELETE /api/cart/items`.
   - Checkout: `POST /api/checkout` (cart -> order, payment method "COD").
   - Admin (auth-protected): products CRUD at `/api/admin/products`
     (+ `/[id]`), `GET/PATCH /api/admin/settings`,
     `GET/PATCH /api/admin/inventory/[handle]`,
     `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]`.
4. **Auth**
   - `users` table; one seeded admin with bcrypt-hashed password.
   - Login verifies against DB, sets signed `httpOnly` session cookie.
   - Admin layout checks the session cookie server-side before rendering
     admin pages. Admin API routes require the session.

## Database Schema

```
users             id, email (unique), name, password_hash, created_at, updated_at
settings          key (unique), value, label, hint, updated_at
collections       id, handle (unique), title, description, description_html,
                  image (JSON), seo (JSON), updated_at, created_at
collection_items  collection_id (FK), product_id (FK), position
products          id, handle (unique), title, description, description_html,
                  vendor, product_type, tags (JSON), available_for_sale,
                  total_inventory, price, compare_at_price, currency_code, sku,
                  featured_image (JSON), images (JSON), options (JSON),
                  seo (JSON), published_at, updated_at, created_at
orders            id, number (unique), status, customer_name, customer_email,
                  customer_phone, address (JSON), subtotal, shipping, total,
                  currency_code, payment_method, notes, created_at, updated_at
order_items       id, order_id (FK), product_id (FK), title, handle, price,
                  quantity, image (JSON)
carts             id, token (unique), note, updated_at, created_at
cart_items        id, cart_id (FK), product_id (FK), variant_id, quantity,
                  title, handle, price, image (JSON)
blogs             id, handle (unique), title
articles          id, handle (unique), title, excerpt, content_html, image (JSON),
                  blog_id (FK), published_at
```

Notes:
- Money stored as DECIMAL; converted to/from `MoneyV2` in the data layer.
- `tags`, `images`, `options`, `seo`, `address` stored as JSON columns
  (MySQL `JSON` type).

## Data Flow

- Server pages (`/`, `/products`, `/collections`, `/about`, `/journal`,
  sitemap) call `src/lib/shopify.ts` functions which read MySQL via Prisma.
- `CartContext` (client) calls `/api/cart/*` routes.
- Admin pages call `/api/admin/*` routes; the admin layout validates the
  session cookie server-side.
- Checkout converts the stored cart into an `orders` + `order_items` row and
  decrements inventory.

## Error Handling

- API routes return JSON `{ error: string }` with appropriate status codes:
  - 400 malformed input
  - 401 unauthenticated / invalid credentials
  - 403 insufficient permission
  - 404 not found
  - 409 duplicate handle/email (Prisma unique constraint mapped)
- Prisma errors caught and mapped in a shared helper.

## Testing / Verification

- `npm run type-check` and `npm run lint` pass.
- Manual API smoke tests via `curl` (login, product CRUD, cart, checkout,
  settings, orders).
- `npm run build` passes.

## Setup Steps (developer)

1. `npm install @prisma/client bcryptjs` and
   `npm install -D prisma @types/bcryptjs`
2. Create the database in DBeaver / MySQL:
   `CREATE DATABASE sss_ecommerce CHARACTER SET utf8mb4;`
3. Add to `.env.local`:
   `DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/sss_ecommerce"`
4. `npx prisma migrate dev --name init`
5. Seed: `npm run db:seed` — seeds admin user, settings, collections, and
   products derived from the current mock catalog.
6. `npm run dev` — store reads/writes MySQL through the APIs.

## Out of Scope (this phase)

- Real payment gateway integration (Razorpay/Stripe) — checkout is COD.
- Customer accounts, wishlists, coupons.
- Migration of existing per-browser localStorage data (custom products,
  orders) into MySQL — browser data is per-device and not migrated.
- Hosted MySQL provisioning — switched later via `DATABASE_URL` +
  `prisma migrate deploy`.
