# Style Statement by Shakthi (SSS) — Headless E-Commerce & Admin Suite

A full-stack, luxury e-commerce platform and administrative store console built for **Style Statement by Shakthi Atelier**. Built on **Next.js 14 (App Router)**, **Prisma ORM**, and **PostgreSQL**, this project features a high-performance customer storefront alongside a rich store owner console for managing multi-variant product catalogs, inventory movements, customer orders, and store settings.

---

## ✨ Features & Modules

### 🛍️ Storefront (Customer Experience)
- **Next.js 14 App Router** — React Server Components (RSC), file-based routing, streaming SSR, and edge optimizations.
- **Brand Palette Theme (`#1e3932`)** — Deep emerald green signature brand theme across dark surfaces, header accents, and buttons.
- **Editable Homepage Hero** — Admin-configurable hero subtitle, title (supports inline `<i>` / `<em>` markup), and description, backed by an image `HeroSlider` carousel.
- **Top Announcement Marquee Bar** — Admin-configurable top announcement banner with continuous scrolling ticker animation mode (`announcement_text`, `announcement_marquee`, `announcement_enabled`).
- **Customer Accounts & Portal (`/account`)** — Sign up, sign in, and logout flows backed by DB sessions (`sss_customer_session`, 30-day TTL) with an account portal for order history, wishlist, and preferences. Optional auto-account creation during checkout.
- **Wishlist** — Client-side, localStorage-persisted wishlist (`WishlistContext`) with wishlist toggles on product cards and PDP, plus a dedicated wishlist tab in the account portal.
- **Global Product Search (`/search`)** — Full-text search across product title, vendor, type, and tags with a dedicated results page and empty-state guidance.
- **Dynamic Categories Menu** — `BrowseCategoriesMenu` fed by the `/api/categories` route, which groups catalog products by `productType` and derives subcategory/tag shortcuts and featured picks.
- **Multi-Currency Support** — 22 supported currencies (`src/lib/currencies.ts`) with a storefront currency selector; the selected currency is persisted to the `currency` setting and `shop.currencyCode`.
- **WhatsApp Concierge & Inquiries** — Floating WhatsApp concierge button and direct "Enquire on WhatsApp" action on Product Detail Pages with pre-filled product details.
- **Pincode Serviceability & Courier Delivery** — 6-digit Indian PIN validation with courier availability (DTDC / The Professional Couriers), zone-based delivery estimates, and an admin toggle to enable/disable the checker (`origin_pincode`, `pincode_check_enabled`, `dtdc_api_key`, `tpc_api_key`).
- **Delivery Speed Selection** — Standard vs. ⚡ Express Priority delivery option in the cart drawer, captured on the order address (`deliverySpeed`) and surfaced in the admin order modal.
- **Dynamic Catalog & Collections** — 10 products per page pagination, sorting (Price, Title, Newest), and smart collections (`/collections/all`, `/collections/bestsellers`, `/collections/new-arrivals`).
- **Sold Out Items Placed Last** — Automated product sorting that pushes out-of-stock / sold-out items (`availableForSale === false` or `totalInventory === 0`) to the very end of catalog grids.
- **Product Detail Pages (PDP)** — Multi-variant option selector (Material, Size, Length, Finish), real-time pricing and compare-at prices, live inventory stock indicators, GIA certification specs, product demo video player, and collapsible **Care & Handling Instructions** accordion (liquid contact precautions, storage, and cleaning guide).
- **Guest Checkout & Address Capture** — Unauthenticated guest browsing and checkout with full address entry fields (Name, Email, Phone, Street Address, City, State, Pincode) and an optional checkbox to auto-create a Customer account during checkout.
- **Variant-Aware Cart Drawer** — Database-backed shopping cart with live subtotal calculation, gift note input, free shipping progress bar, delivery speed picker, pincode check, and a prominent **Login Offer Alert Banner** encouraging guest users to log in for exclusive member rewards.
- **Marketing & Engagement** — Newsletter signup form, customer testimonials, contact form (`/contact`), and a cookie consent banner.
- **Store Policies & Brand Pages** — Direct footer links to legal and store policy pages (Privacy Policy `/privacy-policy`, Terms & Conditions `/terms-of-service`, Shipping Policy `/shipping-policy`, Refund/Return Policy `/refund-policy`, About Atelier `/about`, Contact `/contact`).
- **SEO & Performance** — Metadata API, automated `sitemap.xml` and `robots.txt` routes, security headers, optimized Next.js image pipeline, and responsive Tailwind styling.

### 🛡️ Admin Console (`/admin`)
- **Authentication & Security** — Passcode protection, bcrypt-hashed credentials, DB-backed session management (`Session` table) with 7-day token cookies and Next.js middleware route guarding (`sss_admin_session`, presence-gated redirect).
- **Product Catalog Management** — Publish and edit products with custom handles, descriptions, vendors, categories, tags, images, price ranges, compare-at prices, and custom option sets.
- **Variant Matrix Generator** — Automatically generate option combinations (e.g. Length × Finish) with automated SKU/barcode uniqueness validation and per-cell overrides.
- **Stock Control & Inventory Center (`/admin/inventory`)** — Real-time metrics (Total In Stock, Low Stock Warning, Out of Stock, Inventory Valuation). Perform restocks or manual stock adjustments with audit logs (`InventoryMovement`). Note: Damage write-off is hidden in current console.
- **Product & Variant Archiving / Restoration** — Archive items or specific variants from the active catalog. Restore single variants or entire products back to active inventory with a single click.
- **Order Management Console (`/admin/orders`)** — Search and filter orders by status (`All`, `Processing`, `Shipped`, `Fulfilled`) or customer query. Interactive **Order Management Modal** for inspecting customer details (name, email, phone), shipping address (with delivery speed), line items, and changing fulfillment status with real-time DB persistence.
- **Store Settings (`/admin/settings`)** — Manage store details (Name, Email, WhatsApp Phone Number, Currency, Free Shipping threshold, Return Window), Top Announcement text & Marquee toggle, **editable homepage hero content**, **courier & pincode serviceability settings** (origin pincode, checker toggle, DTDC / Professional Courier API tokens), notification alert switches, and theme preference.

### 🎨 Theme & UI Alert System
- **Theme Engine (Light, Dark, System)** — Reactive `ThemeContext` supporting Light, Dark, and OS System preference (`prefers-color-scheme`) with `localStorage` persistence and custom dark mode surface palettes.
- **Luxury UI Alert Component ([`Alert.tsx`](src/components/ui/Alert.tsx))** — Reusable alert banner with 4 status tones (`success`, `error`, `warning`, `info`), icons, title/body layout, and dismiss buttons.
- **Custom Confirmation Modal ([`ConfirmModal.tsx`](src/components/ui/ConfirmModal.tsx))** — Animated modal dialog with backdrop blur, replacing native browser `confirm()` popups.
- **Global Toast System ([`ToastContext.tsx`](src/context/ToastContext.tsx))** — Floating status toasts with auto-dismissal and enter/exit animations.

---

## 🧰 Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org) (App Router, Server Actions, RSC)
- **Library**: [React 18.3](https://react.dev)
- **Database & ORM**: [Prisma ORM 5.22](https://www.prisma.io) + **PostgreSQL** (Prisma Postgres / any Postgres 14+)
- **Authentication**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) + Cookie-based sessions (admin & customer)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com) + `clsx` + `tailwind-merge` + `@tailwindcss/typography`
- **Icons**: [lucide-react](https://lucide.dev)
- **Testing**: [Vitest 2.1](https://vitest.dev) + `happy-dom` (unit/integration) and [Playwright 1.62](https://playwright.dev) (E2E)
- **Language**: [TypeScript 5.4](https://www.typescriptlang.org)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17+` (v20.x recommended)
- **PostgreSQL**: `14+` running locally, or a hosted instance (e.g. [Prisma Postgres](https://www.prisma.io/postgres)).

### 1. Clone & Install Dependencies

```bash
npm install
```

> `postinstall` runs `prisma generate` automatically to build the Prisma Client.

### 2. Configure Environment Variables

Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

Example configuration (`.env.local`):

```dotenv
# PostgreSQL Database Connection (Required)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sss_ecommerce?schema=public"

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_CART_DRAWER_ENABLED=true

# Admin Credentials (Used by seed script)
ADMIN_EMAIL="admin@sss.com"
ADMIN_PASSWORD="admin123"

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=
```

### 3. Run Database Migrations

Apply the Prisma schema to set up your PostgreSQL database:

```bash
npm run db:migrate
```

### 4. Seed Initial Data

Populate default admin credentials, collections, products, variants, and store settings:

```bash
npm run db:seed
```

> **Default Admin Login**:
> - **Email**: `admin@sss.com`
> - **Password**: `admin123`

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront or [http://localhost:3000/admin](http://localhost:3000/admin) for the store owner console.

---

## 🗄️ Database Architecture (`prisma/schema.prisma`)

| Model | Description |
| :--- | :--- |
| `User` | Admin store owner account with email and bcrypt `passwordHash`. |
| `Customer` | Registered storefront customer account (name, email, bcrypt `passwordHash`). |
| `Session` | Database-backed login session tokens (admin & customer) with expiration. |
| `Setting` | Key-value store configuration settings (Store Name, Email, WhatsApp Number, Currency, Shipping Threshold, Return Window, Announcement Text/Marquee, Hero Content, Origin Pincode, Pincode Checker, Courier API Tokens, Alert Toggles). |
| `Collection` | Categorized product groupings (handle, title, description, image, SEO metadata). |
| `CollectionItem` | Join model mapping products to collections with position ordering. |
| `Product` | Main product catalog record (handle, title, description, vendor, type, tags, price, compareAtPrice, images, options, inventory summary). |
| `ProductVariant` | Individual product SKU variant (title, price, compareAtPrice, stock, lowStockThreshold, selectedOptions, SKU, barcode, archived status). |
| `InventoryMovement` | Inventory audit trail tracking sales, restocks, adjustments, and write-offs. |
| `Order` | Placed customer orders (order number, status, customer name, email, phone, shipping address JSON incl. delivery speed, subtotal, shipping, total, payment method, notes). |
| `OrderItem` | Snapshot of purchased line items inside an order. |
| `Cart` | Customer shopping cart identified by a unique session token. |
| `CartItem` | Line item in a cart linked to a specific `ProductVariant` and `Product`. |
| `Blog` | Blog container (handle, title) for editorial content. |
| `Article` | Blog article (handle, title, excerpt, rich `contentHtml`, image, author, `publishedAt`, SEO metadata). |

---

## 🔌 API Route Reference (`src/app/api/`)

### Authentication
- `POST /api/auth/login` — Authenticate admin credentials and issue session token cookie.
- `POST /api/auth/logout` — Invalidate admin session cookie.
- `GET /api/auth/me` — Return current active admin session user.
- `POST /api/auth/customer/signup` — Register a new customer account and issue a session.
- `POST /api/auth/customer/signin` — Authenticate a customer and issue a session.
- `POST /api/auth/customer/logout` — Invalidate the customer session cookie.
- `GET /api/auth/customer/me` — Return the current logged-in customer user.

### Storefront & Cart
- `GET /api/categories` — Group catalog products into `productType` categories with tag subcategories and featured picks.
- `GET /api/cart` — Retrieve active cart by token.
- `POST /api/cart` — Create a new shopping cart.
- `POST /api/cart/items` — Add a product variant line item to cart.
- `PATCH /api/cart/items` — Update line item quantity.
- `DELETE /api/cart/items` — Remove a line item from cart.
- `POST /api/cart/note` — Set cart order note.
- `GET /api/shipping/serviceability?pincode=######` — Check courier serviceability and estimate delivery for a 6-digit PIN.
- `POST /api/checkout` — Place an order with guest/customer address details, delivery speed, option to create account, deduct stock, and update variant availability.

### Admin Operations
- `GET /api/admin/products` — List active or archived products.
- `POST /api/admin/products` — Create a new product with variants.
- `PATCH /api/admin/products/[id]` — Update basic product fields.
- `DELETE /api/admin/products/[id]` — Archive a product and its child variants.
- `PATCH /api/admin/products/[id]/restore` — Restore an archived product and all of its variants.
- `PATCH /api/admin/variants/[id]` — Update variant SKU, barcode, price, stock, or threshold.
- `PATCH /api/admin/variants/[id]/restore` — Restore a single variant (and un-archive parent product if archived).
- `GET /api/admin/variants/[id]/movements` — Read the inventory movement ledger for a variant.
- `POST /api/admin/inventory/movements` — Record a restock or stock adjustment.
- `GET /api/admin/orders` — List customer orders (with phone and address).
- `PATCH /api/admin/orders/[id]` — Update order status (`Processing`, `Shipped`, `Fulfilled`).
- `GET /api/admin/settings` — Read store configuration settings and alert toggles.
- `PATCH /api/admin/settings` — Save updated store configurations, hero content, marquee/courier settings, and notification switches.

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Start development server on port 3000. |
| `npm run build` | `prisma generate && next build` | Generate Prisma Client and build production bundle. |
| `npm run start` | `next start` | Launch production server. |
| `npm run lint` | `next lint` | Run ESLint validation. |
| `npm run type-check` | `tsc --noEmit` | Run full TypeScript type check. |
| `npm run test` | `vitest run` | Run Vitest unit & integration test suite. |
| `npm run db:migrate` | `prisma migrate dev` | Apply Prisma schema migrations to PostgreSQL. |
| `npm run db:seed` | `prisma db seed` | Seed database with initial catalog & settings. |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI data browser. |

---

## 📂 Project Structure

```
.
├── prisma/
│   ├── schema.prisma                  # Prisma ORM PostgreSQL schema
│   ├── seed.ts                        # Seed script for products, variants & settings
│   └── migrations/                    # SQL migration history
├── public/                            # Favicons, static SVG icons, imagery
├── src/
│   ├── app/                           # Next.js App Router structure
│   │   ├── page.tsx                   # Storefront Homepage (hero, featured, testimonials)
│   │   ├── products/[handle]/         # Product Detail Page (PDP)
│   │   ├── collections/               # Collections Index & Detail Pages
│   │   ├── search/                    # Product Search Results
│   │   ├── account/                   # Customer Account Portal
│   │   ├── checkout/                  # Checkout & Confirmation
│   │   ├── contact/                   # Contact Form Page
│   │   ├── about/                     # About Atelier Page
│   │   ├── privacy-policy/            # Store Policy Pages
│   │   ├── terms-of-service/          # Store Policy Pages
│   │   ├── shipping-policy/           # Store Policy Pages
│   │   ├── refund-policy/             # Store Policy Pages
│   │   ├── admin/                     # Store Console Admin Portal
│   │   │   ├── page.tsx               # Admin Dashboard
│   │   │   ├── inventory/             # Stock Control & Movement History
│   │   │   ├── orders/                # Order Management Console & Status Modal
│   │   │   ├── products/new/          # Product Creator & Variant Matrix Generator
│   │   │   ├── settings/              # Store Config, Hero Content & Courier Settings
│   │   │   └── login/                 # Admin Passcode Authentication
│   │   ├── api/                       # REST Route Handlers (Auth, Cart, Checkout, Shipping, Admin)
│   │   ├── layout.tsx                 # Root Layout with Theme, Toast, Cart & Wishlist Providers
│   │   └── globals.css                # Global CSS & Tailwind Dark Theme Overrides
│   ├── components/                    # Reusable React Components
│   │   ├── account/                   # Customer Account Portal (orders, wishlist, settings)
│   │   ├── cart/                      # Cart Drawer, Guest Address & Line Item controls
│   │   ├── home/                      # HeroSlider, Testimonials, NewsletterForm
│   │   ├── layout/                    # Header, Footer, Marquee Banner, BrowseCategoriesMenu
│   │   ├── product/                   # ProductCard, ProductGrid, ProductDetail, SortDropdown
│   │   ├── contact/                   # ContactForm
│   │   └── ui/                        # Alert, Button, ConfirmModal, CookieConsent, Input, Image
│   ├── context/                       # Global Providers (Cart, Toast, Theme, Wishlist)
│   ├── lib/                           # Domain Services & Utilities
│   │   ├── prisma.ts                  # Prisma Client Instance
│   │   ├── auth.ts                    # Admin Password Hashing & Session Cookie Helpers
│   │   ├── customer-auth.ts           # Customer Signup/Signin & Session Helpers
│   │   ├── shopify.ts                 # Data Access Layer over Prisma
│   │   ├── db-mappers.ts              # Data Mappers (DB records -> UI models)
│   │   ├── inventory.ts               # Ledger-based Stock Movement Service
│   │   ├── cart-api.ts                # Cart API Client Helpers
│   │   ├── currencies.ts              # Supported Currencies & Formatting Helpers
│   │   ├── variant-matrix.ts          # Matrix Generator for Product Variants
│   │   ├── variant-uniqueness.ts      # SKU & Barcode Validation Helpers
│   │   └── utils.ts                   # Shared Utilities (cn, formatMoney)
│   ├── middleware.ts                  # Admin Route Guarding
│   └── types/                         # TypeScript Type Definitions (`shopify.ts`, `admin.ts`)
├── tests/                             # Vitest Integration Suites (`tests/api`) + E2E (`tests/e2e`)
├── next.config.js                     # Next.js Security & Optimization Config
├── playwright.config.ts               # Playwright E2E Configuration
├── tailwind.config.ts                 # Tailwind Design System & Dark Mode Config
└── vitest.config.ts                   # Vitest Test Environment Setup
```

---

## 🧪 Testing

### Unit & Integration (Vitest)

```bash
npm run test
```

Suites under `tests/api/` cover API authentication, customer auth, cart calculations, checkout stock deductions, inventory movements, order admin, variant admin, middleware route guarding, and database mapping contracts.

### End-to-End (Playwright)

Start the dev server, then run the browser suites under `tests/e2e/` (storefront, admin, and cross-cutting flows). Playwright is configured for Chromium with screenshots, traces, and HTML/JSON reports.

```bash
npx playwright test
```

---

## 📄 License

This repository is private and proprietary to **Style Statement by Shakthi**. All rights reserved.
