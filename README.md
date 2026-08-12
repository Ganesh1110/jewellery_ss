# SSS E-Commerce — Style Statement by Shakthi (Next.js)

A full-stack headless e-commerce storefront **and admin panel** for a jewellery brand, built on **Next.js 14 (App Router)**, **Prisma** and **MySQL**. The storefront ships with a complete catalog, cart, checkout, journal/blog, and store policies — and the included admin dashboard lets the store owner manage products, inventory, orders, and store settings without touching code.

---

## ✨ Features

### Storefront
- **Next.js 14 App Router** — file-based routing, React Server Components, streaming.
- **Catalog & Collections** — cursor-paginated product grids, sorting, search, "All Jewelry" and "Bestsellers" smart collections.
- **Product Detail Pages** — description, price (incl. compare-at), materials/options, tags, inventory status, and product recommendations.
- **Cart Drawer** — add/update/remove lines, quantities, and order notes with a persistent, DB-backed cart.
- **Checkout** — DB-backed order creation with **Cash on Delivery**, automatic inventory decrement, and an order confirmation screen.
- **Journal / Blog** — blog list and article pages with rich content and SEO metadata.
- **Shop Policies** — privacy, refund, terms, and shipping policy pages.
- **Account, About, Contact** — static + storefront pages.
- **SEO & Performance** — metadata API, `robots.ts` / `sitemap.ts`, security headers, optimized images, typed Tailwind styling.

### Admin Panel (`/admin`)
- **Authentication** — password login with bcrypt-hashed credentials, DB-backed session cookies (7-day expiry), and middleware-gated routes.
- **Dashboard** — product list with quick actions and delete.
- **Products** — create new products (title, handle, price, compare-at, type, vendor, tags, images, inventory, options) via the admin API.
- **Inventory** — search/filter by title or SKU, adjust price / compare-at price, and bump or reduce stock with availability updates.
- **Orders** — view placed orders with line items and status.
- **Settings** — edit store configuration (name, email, currency, free-shipping threshold, return window, alerts) stored in the database.

---

## 🧰 Tech Stack

- [Next.js 14.2](https://nextjs.org) — App Router, RSC
- [React 18](https://react.dev)
- [Prisma ORM 5](https://www.prisma.io) + **MySQL**
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing
- [Tailwind CSS](https://tailwindcss.com) with `clsx` + `tailwind-merge`
- [lucide-react](https://lucide.dev) — icons
- [Vitest](https://vitest.dev) + happy-dom — unit/integration tests
- [TypeScript](https://www.typescriptlang.org)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17+ (20.x recommended)
- **MySQL** 8+ running locally (the app connects via `DATABASE_URL`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your database credentials:

```bash
cp .env.example .env.local
```

```dotenv
# MySQL Database (required)
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/sss_ecommerce"

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cart & Checkout
NEXT_PUBLIC_CART_DRAWER_ENABLED=true

# Admin (defaults used by the seed script)
ADMIN_EMAIL="admin@sss.com"
ADMIN_PASSWORD="admin123"

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

### 3. Create the database and run migrations

Create the database (or point `DATABASE_URL` at an existing one), then apply the Prisma schema:

```bash
npm run db:migrate
```

### 4. Seed demo data

Seeds an admin user, 12 products, 5 collections, 4 journal articles, and store settings:

```bash
npm run db:seed
```

> **Admin login:** email `admin@sss.com` / password `admin123` by default (overridable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin panel lives at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 📜 Available Scripts

| Script               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Start the development server                      |
| `npm run build`      | Create a production build                         |
| `npm run start`      | Start the production server                       |
| `npm run lint`       | Run ESLint                                        |
| `npm run type-check` | Run the TypeScript type checker (`tsc --noEmit`)  |
| `npm run test`       | Run the Vitest test suite                         |
| `npm run db:migrate` | Run Prisma migrations (`prisma migrate dev`)      |
| `npm run db:seed`    | Seed the database (`prisma db seed`)              |
| `npm run db:studio`  | Open the Prisma Studio data browser               |

---

## 🗂️ Project Structure

```
.
├── prisma/
│   ├── schema.prisma           # Database schema (MySQL)
│   ├── seed.ts                 # Demo catalog, admin user, settings
│   └── migrations/             # Prisma migration history
├── public/                     # Static assets (favicons, SVGs, images)
├── src/
│   ├── app/                    # Next.js App Router pages & routes
│   │   ├── page.tsx            # Home / landing page
│   │   ├── products/[handle]/  # Product detail page
│   │   ├── collections/        # Collections index & detail pages
│   │   ├── journal/            # Blog list & article pages
│   │   ├── search/             # Search results
│   │   ├── checkout/           # Checkout & order confirmation
│   │   ├── account/            # Account page
│   │   ├── admin/              # Admin panel (dashboard, products, inventory, orders, settings, login)
│   │   ├── about/ contact/     # Static pages
│   │   ├── *-policy/           # Policy pages (privacy, terms, shipping, refund)
│   │   ├── api/                # Route handlers (auth, cart, checkout, admin)
│   │   ├── robots.ts sitemap.ts# SEO routes
│   │   └── error.tsx not-found.tsx
│   ├── components/             # Reusable UI components
│   │   ├── cart/               # CartDrawer & cart UI
│   │   ├── layout/             # Header, Footer, navigation
│   │   ├── product/            # ProductCard, ProductGrid, ProductDetail
│   │   ├── home/ account/ contact/  # Feature-specific components
│   │   └── ui/                 # Button, Image, Input primitives
│   ├── context/                # CartContext (global cart state)
│   ├── hooks/                  # Shared React hooks
│   ├── lib/                    # Core application layer
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # Login, sessions, session cookie helpers
│   │   ├── shopify.ts          # Data access functions (Shopify-shaped API over the DB)
│   │   ├── db-mappers.ts       # DB records → Shopify-shaped TypeScript models
│   │   ├── cart-api.ts         # Client-side cart API helpers
│   │   └── utils.ts            # Shared utilities
│   ├── middleware.ts           # /admin route protection
│   └── types/                  # shopify.ts & admin.ts TypeScript definitions
├── tests/                      # Vitest test suite (api, helpers, setup)
├── .env.example                # Example environment variables
├── next.config.js              # Next.js configuration (security headers, images)
├── tailwind.config.ts          # Tailwind CSS configuration
└── vitest.config.ts            # Vitest configuration
```

---

## 🗄️ Database (Prisma + MySQL)

The schema (`prisma/schema.prisma`) models the entire commerce domain:

| Model              | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `User`             | Admin credentials (email + bcrypt password hash) |
| `Session`          | Auth sessions (token, email, expiry)           |
| `Setting`          | Key/value store settings for the storefront    |
| `Collection`       | Product collections                            |
| `CollectionItem`   | Join table linking products to collections     |
| `Product`          | Catalog products (price, inventory, images, options, tags) |
| `Order`            | Placed orders (subtotal, total, COD, status)   |
| `OrderItem`        | Line items within an order                     |
| `Cart`             | Persistent carts keyed by a unique token       |
| `CartItem`         | Cart line items                                |
| `Blog` / `Article` | Journal content                                |

Product, collection, image, and SEO data is stored as JSON columns and mapped into a **Shopify-shaped object graph** by `src/lib/db-mappers.ts` (IDs are exposed as `gid://db/...`). This keeps the storefront components cleanly separated from the storage layer.

### Seed data (`prisma/seed.ts`)

- **Admin user** — `admin@sss.com` / `admin123` (bcrypt hashed).
- **12 products** — pendants, rings, earrings, bracelets, necklaces priced in INR.
- **5 collections** — New Arrivals, Gold Collection, Diamonds, Gemstones, Bridal.
- **4 journal articles** — diamond buying guide, gold care, pearl story, jewelry layering.
- **Store settings** — name, email, currency, free-shipping threshold, return window, alert toggles.

---

## 🔌 Architecture

### Data access layer (`src/lib/shopify.ts`)

All storefront reads go through a single typed data-access module that mirrors the shape of the old Shopify Storefront API client:

| Function                     | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `fetchProducts`              | Products (cursor pagination + sorting + query) |
| `fetchProduct(handle)`       | Single product by handle                 |
| `fetchProductRecommendations`| Recommended products                     |
| `fetchCollections()`         | All collections                          |
| `fetchCollection(handle)`    | Collection + its products (incl. `all` / `bestsellers`) |
| `fetchMenus()` / `fetchMenu()` | Navigation menus                       |
| `fetchShop()`                | Store / brand / settings / policies      |
| `fetchBlogs()` / `fetchArticles()` / `fetchArticle()` | Journal content |

### API routes (`src/app/api/`)

| Route                         | Methods              | Purpose                                    |
| ----------------------------- | -------------------- | ------------------------------------------ |
| `/api/auth/login`             | POST                 | Admin login (bcrypt check + session cookie) |
| `/api/auth/logout`            | POST                 | Destroy admin session                      |
| `/api/auth/me`                | GET                  | Current admin session                      |
| `/api/cart`                   | POST / GET           | Create / fetch a cart by ID                |
| `/api/cart/items`             | POST / PATCH / DELETE | Add, update, or remove cart lines          |
| `/api/cart/note`              | POST                 | Set cart order note                        |
| `/api/checkout`               | POST                 | Convert cart → order (COD, decrement stock) |
| `/api/admin/products`         | GET / POST           | List / create products                     |
| `/api/admin/products/[id]`    | PATCH / DELETE       | Update / delete a product                  |
| `/api/admin/orders`           | GET                  | List orders                                |
| `/api/admin/orders/[id]`      | PATCH / DELETE       | Update / delete an order                   |
| `/api/admin/inventory/[handle]` | PATCH               | Update price / stock / availability        |
| `/api/admin/settings`         | GET / PATCH          | Read / update store settings               |

### Authentication

Admin auth lives in `src/lib/auth.ts`:
- Passwords are hashed with **bcrypt** (seed generates the hash at 10 rounds).
- Successful login issues a random 64-char token stored in a `sss_admin_session` cookie backed by a `Session` row with a **7-day expiry**.
- `src/middleware.ts` redirects any unauthenticated `/admin` request (except `/admin/login`) to the login page, preserving the `?from=` return path. The authoritative session check (DB lookup + expiry) runs server-side in `getSession()`.

---

## 🛍️ How Cart, Checkout & Orders Work

1. Product detail pages let users add items to the cart; the cart is persisted in the DB and managed by `CartContext`, rendered in the **Cart Drawer** (`src/components/cart/CartDrawer.tsx`).
2. Users can change quantities, remove lines, and add an order note.
3. At checkout, `/api/checkout` creates an `Order` (status `Processing`, payment **COD**), decrements product inventory, marks products unavailable when stock hits zero, and clears the cart.
4. The user is shown an **order confirmation** with the order number, totals, and line items.

---

## 🧪 Testing

Tests run with [Vitest](https://vitest.dev) against a local seeded MySQL database. Tests only touch data scoped to `test-<uuid>` / `@test.*` identifiers and clean up after themselves.

```bash
npm run test
```

Current suites (`tests/api/`):
- `auth.test.ts` — login, session creation, and logout.
- `checkout-order.test.ts` — cart → order conversion, stock decrement, order numbers.
- `checkout-route.test.ts` — checkout API validation and error paths.
- `middleware.test.ts` — `/admin` route protection and redirects.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please keep code clean, typed, and linted (`npm run lint` / `npm run type-check`), and add tests for new API behaviour.

---

## 📄 License

This project is private / licensed for the SSS jewellery business. Contact the repository owner for permission before redistribution.

---

*Built for headless e-commerce. Powered by Next.js App Router + Prisma & MySQL.*
