# Style Statement by Shakthi (SSS) — Headless E-Commerce & Admin Suite

A full-stack, luxury e-commerce platform and administrative store console built for **Style Statement by Shakthi Atelier**. Built on **Next.js 14 (App Router)**, **Prisma ORM**, and **MySQL**, this project features a high-performance customer storefront alongside a rich store owner console for managing multi-variant product catalogs, inventory movements, customer orders, and store settings.

---

## ✨ Features & Modules

### 🛍️ Storefront (Customer Experience)
- **Next.js 14 App Router** — React Server Components (RSC), file-based routing, streaming SSR, and edge optimizations.
- **Brand Palette Theme (`#1e3932`)** — Deep emerald green signature brand theme across dark surfaces, header accents, and buttons.
- **Top Announcement Marquee Bar** — Admin-configurable top announcement banner with continuous scrolling ticker animation mode (`announcement_text`, `announcement_marquee`, `announcement_enabled`).
- **WhatsApp Concierge & Inquiries** — Floating WhatsApp concierge button and direct "Enquire on WhatsApp" action on Product Detail Pages with pre-filled product details.
- **Dynamic Catalog & Collections** — 10 products per page pagination, sorting (Price, Title, Newest), and smart collections (`/collections/all`, `/collections/bestsellers`, `/collections/new-arrivals`).
- **Sold Out Items Placed Last** — Automated product sorting that pushes out-of-stock / sold-out items (`availableForSale === false` or `totalInventory === 0`) to the very end of catalog grids.
- **Product Detail Pages (PDP)** — Multi-variant option selector (Material, Size, Length, Finish), real-time pricing and compare-at prices, live inventory stock indicators, GIA certification specs, product demo video player, and collapsible **Care & Handling Instructions** accordion (liquid contact precautions, storage, and cleaning guide).
- **Guest Checkout & Address Capture** — Unauthenticated guest browsing and checkout with full address entry fields (Name, Email, Phone, Street Address, City, State, Pincode) and an optional checkbox to auto-create a Customer account during checkout.
- **Variant-Aware Cart Drawer** — Database-backed shopping cart with live subtotal calculation, gift note input, free shipping progress bar, and a prominent **Login Offer Alert Banner** encouraging guest users to log in for exclusive member rewards.
- **Store Policies & Brand Pages** — Direct footer links to legal and store policy pages (Privacy Policy, Terms & Conditions, Shipping Policy, Return Policy, About Atelier, Contact).
- **SEO & Performance** — Metadata API, automated `sitemap.xml` and `robots.txt` routes, security headers, optimized Next.js image pipeline, and responsive Tailwind styling.

### 🛡️ Admin Console (`/admin`)
- **Authentication & Security** — Passcode protection, bcrypt-hashed credentials, DB-backed session management (`Session` table) with 7-day token cookies and Next.js middleware route guarding.
- **Product Catalog Management** — Publish and edit products with custom handles, descriptions, vendors, categories, tags, images, price ranges, compare-at prices, and custom option sets.
- **Variant Matrix Generator** — Automatically generate option combinations (e.g. Length × Finish) with automated SKU/barcode uniqueness validation.
- **Stock Control & Inventory Center (`/admin/inventory`)** — Real-time metrics (Total In Stock, Low Stock Warning, Out of Stock, Inventory Valuation). Perform restocks or manual stock adjustments with audit logs (`InventoryMovement`). Note: Damage write-off is hidden in current console.
- **Product & Variant Archiving / Restoration** — Archive items or specific variants from the active catalog. Restore single variants or entire products back to active inventory with a single click.
- **Order Management Console (`/admin/orders`)** — Search and filter orders by status (`All`, `Processing`, `Shipped`, `Fulfilled`) or customer query. Interactive **Order Management Modal** for inspecting customer details, line items, address, and changing fulfillment status with real-time DB persistence.
- **Store Settings (`/admin/settings`)** — Manage store details (Name, Email, WhatsApp Phone Number, Currency, Free Shipping threshold, Return Window), Top Announcement text & Marquee toggle, notification alert switches, and theme preference.

### 🎨 Theme & UI Alert System
- **Theme Engine (Light, Dark, System)** — Reactive `ThemeContext` supporting Light, Dark, and OS System preference (`prefers-color-scheme`) with `localStorage` persistence and custom dark mode surface palettes.
- **Luxury UI Alert Component ([`Alert.tsx`](file:///Users/ganeshjayaprakash/WorkSpace/Mine/jewellery_ss/src/components/ui/Alert.tsx))** — Reusable alert banner with 4 status tones (`success`, `error`, `warning`, `info`), icons, title/body layout, and dismiss buttons.
- **Custom Confirmation Modal ([`ConfirmModal.tsx`](file:///Users/ganeshjayaprakash/WorkSpace/Mine/jewellery_ss/src/components/ui/ConfirmModal.tsx))** — Animated modal dialog with backdrop blur, replacing native browser `confirm()` popups.
- **Global Toast System ([`ToastContext.tsx`](file:///Users/ganeshjayaprakash/WorkSpace/Mine/jewellery_ss/src/context/ToastContext.tsx))** — Floating status toasts with auto-dismissal and enter/exit animations.

---

## 🧰 Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org) (App Router, Server Actions, RSC)
- **Library**: [React 18.3](https://react.dev)
- **Database & ORM**: [Prisma ORM 5.22](https://www.prisma.io) + **MySQL 8+**
- **Authentication**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) + Cookie-based sessions
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com) + `clsx` + `tailwind-merge`
- **Icons**: [lucide-react](https://lucide.dev)
- **Testing**: [Vitest 2.1](https://vitest.dev) + `happy-dom`
- **Language**: [TypeScript 5.4](https://www.typescriptlang.org)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17+` (v20.x recommended)
- **MySQL**: `8.0+` running locally or accessible via network connection.

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

Example configuration (`.env.local`):

```dotenv
# MySQL Database Connection (Required)
DATABASE_URL="mysql://root:password@localhost:3306/jewellery_ss"

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

Apply the Prisma schema to set up your MySQL database:

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
| `Customer` | Registered storefront customer account for faster checkout. |
| `Session` | Database-backed admin login session tokens with 7-day expiration. |
| `Setting` | Key-value store configuration settings (Store Name, Email, WhatsApp Number, Currency, Shipping Threshold, Return Window, Announcement Text, Announcement Marquee, Alert Toggles). |
| `Collection` | Categorized product groupings (handle, title, description, image, SEO metadata). |
| `CollectionItem` | Join model mapping products to collections with position ordering. |
| `Product` | Main product catalog record (handle, title, description, vendor, type, tags, price, compareAtPrice, images, options, inventory summary). |
| `ProductVariant` | Individual product SKU variant (title, price, compareAtPrice, stock, lowStockThreshold, selectedOptions, SKU, barcode, archived status). |
| `InventoryMovement` | Inventory audit trail tracking restocks and manual stock adjustments. |
| `Order` | Placed customer orders (order number, status, customer name, email, phone, shipping address JSON, subtotal, shipping, total, payment method). |
| `OrderItem` | Snapshot of purchased line items inside an order. |
| `Cart` | Customer shopping cart identified by a unique session token. |
| `CartItem` | Line item in a cart linked to a specific `ProductVariant` and `Product`. |

---

## 🔌 API Route Reference (`src/app/api/`)

### Authentication
- `POST /api/auth/login` — Authenticate admin credentials and issue session token cookie.
- `POST /api/auth/logout` — Invalidate admin session cookie.
- `GET /api/auth/me` — Return current active admin session user.
- `GET /api/auth/customer/me` — Return current logged-in customer user.

### Storefront & Cart
- `GET /api/cart` — Retrieve active cart by token.
- `POST /api/cart` — Create a new shopping cart.
- `POST /api/cart/items` — Add a product variant line item to cart.
- `PATCH /api/cart/items` — Update line item quantity.
- `DELETE /api/cart/items` — Remove a line item from cart.
- `POST /api/cart/note` — Set cart order note.
- `POST /api/checkout` — Place an order with guest/customer address details, option to create account, deduct stock, and update variant availability.

### Admin Operations
- `GET /api/admin/products` — List active or archived products.
- `POST /api/admin/products` — Create a new product with variants.
- `PATCH /api/admin/products/[id]` — Update basic product fields.
- `DELETE /api/admin/products/[id]` — Archive a product and its child variants.
- `PATCH /api/admin/products/[id]/restore` — Restore an archived product and all of its variants.
- `PATCH /api/admin/variants/[id]` — Update variant SKU, barcode, price, stock, or threshold.
- `PATCH /api/admin/variants/[id]/restore` — Restore a single variant (and un-archive parent product if archived).
- `POST /api/admin/inventory/movements` — Record a restock or stock adjustment.
- `GET /api/admin/orders` — List customer orders.
- `PATCH /api/admin/orders/[id]` — Update order status (`Processing`, `Shipped`, `Fulfilled`).
- `GET /api/admin/settings` — Read store configuration settings.
- `PATCH /api/admin/settings` — Save updated store configurations, marquee text/settings, and notification switches.

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Start development server on port 3000. |
| `npm run build` | `next build` | Build production bundle. |
| `npm run start` | `next start` | Launch production server. |
| `npm run lint` | `next lint` | Run ESLint validation. |
| `npm run type-check` | `tsc --noEmit` | Run full TypeScript type check. |
| `npm run test` | `vitest run` | Run Vitest unit & integration test suite. |
| `npm run db:migrate` | `prisma migrate dev` | Apply Prisma schema migrations to MySQL. |
| `npm run db:seed` | `prisma db seed` | Seed database with initial catalog & settings. |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI data browser. |

---

## 📂 Project Structure

```
.
├── prisma/
│   ├── schema.prisma                  # Prisma ORM MySQL schema
│   ├── seed.ts                        # Seed script for products, variants & settings
│   └── migrations/                    # SQL migration history
├── public/                            # Favicons, static SVG icons, imagery
├── src/
│   ├── app/                           # Next.js App Router structure
│   │   ├── page.tsx                   # Storefront Homepage
│   │   ├── products/[handle]/         # Product Detail Page (PDP)
│   │   ├── collections/               # Collections Index & Detail Pages
│   │   ├── checkout/                  # Checkout & Confirmation
│   │   ├── admin/                     # Store Console Admin Portal
│   │   │   ├── page.tsx               # Admin Dashboard
│   │   │   ├── inventory/             # Stock Control & Movement History
│   │   │   ├── orders/                # Order Management Console & Status Modal
│   │   │   ├── products/new/          # Product Creator & Variant Matrix Generator
│   │   │   ├── settings/              # Store Configuration & Theme Settings
│   │   │   └── login/                 # Admin Passcode Authentication
│   │   ├── api/                       # REST Route Handlers (Auth, Cart, Checkout, Admin)
│   │   ├── layout.tsx                 # Root Layout with Theme & Toast Providers
│   │   └── globals.css                # Global CSS & Tailwind Dark Theme Overrides
│   ├── components/                    # Reusable React Components
│   │   ├── cart/                      # Cart Drawer, Guest Address & Line Item controls
│   │   ├── layout/                    # Storefront Header, Footer, Marquee Banner
│   │   ├── product/                   # ProductCard, ProductGrid, ProductGallery (Demo Video), Care Instructions
│   │   └── ui/                        # Alert, Button, ConfirmModal, Input, Image
│   ├── context/                       # Global Context Providers (Cart, Toast, Theme)
│   ├── lib/                           # Domain Services & Utilities
│   │   ├── prisma.ts                  # Prisma Client Instance
│   │   ├── auth.ts                    # Password Hashing & Session Cookie Helpers
│   │   ├── shopify.ts                 # Data Access Layer over Prisma
│   │   ├── db-mappers.ts              # Data Mappers (DB records -> UI models)
│   │   ├── variant-matrix.ts          # Matrix Generator for Product Variants
│   │   └── variant-uniqueness.ts      # SKU & Barcode Validation Helpers
│   └── types/                         # TypeScript Type Definitions (`shopify.ts`, `admin.ts`)
├── tests/                             # Vitest Integration Test Suites
├── next.config.js                     # Next.js Security & Optimization Config
├── tailwind.config.ts                 # Tailwind Design System & Dark Mode Config
└── vitest.config.ts                   # Vitest Test Environment Setup
```

---

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```

Test coverage includes API authentication, cart calculations, checkout stock deductions, middleware route guarding, and database mapping contracts.

---

## 📄 License

This repository is private and proprietary to **Style Statement by Shakthi**. All rights reserved.
