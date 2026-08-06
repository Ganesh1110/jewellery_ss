# SSS E-Commerce — Shopify Storefront (Next.js)

A lightning-fast, SEO-friendly headless e-commerce storefront for a jewellery brand, built on **Next.js 14 (App Router)** and the **Shopify Storefront API**. It ships with a full cart experience, collections, product detail pages, journal/blog, and store policies — everything driven by Shopify's headless GraphQL API.

---

## ✨ Features

- **Next.js 14 App Router** — file-based routing, streaming, server components.
- **Headless Shopify Storefront API** — all product, collection, cart, blog, and shop data via `graphql-request`.
- **Built-in Cart System** — create cart, add/update/remove lines, apply notes & buyer identity, checkout via Shopify `checkoutUrl`.
- **Collections & Catalog** — paginated product grids with cursor-based pagination, sorting, search.
- **Product Detail Pages** — variants, options, price (incl. compare-at), inventory, recommendations.
- **Journal / Blog** — blog list and article pages with SEO metadata.
- **Shop Policies** — privacy, refund, terms, shipping pulled directly from Shopify.
- **Mock Data Layer** — run the entire storefront with zero configuration using built-in demo data.
- **SEO & Performance** — metadata API, `robots.ts` / `sitemap.ts`, typed Tailwind styling.
- **Tailwind CSS** with `clsx` + `tailwind-merge` for clean, composable UI.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17+ (or 20.x recommended)
- **npm** (or your package manager of choice)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your Shopify credentials:

```bash
cp .env.example .env.local
```

```dotenv
# Shopify Storefront API Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your-storefront-access-token
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION=2024-04

# Cart & Checkout
NEXT_PUBLIC_CART_DRAWER_ENABLED=true

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

> **No Shopify store?** Leave the env vars empty (or unset) and the app automatically falls back to the **mock data layer** — you can build and preview the full UI without a backend.

<details>
<summary><strong>How to get Storefront API credentials</strong></summary>

1. Log in to your **Shopify admin**.
2. Go to **Settings → Apps and sales channels → Develop apps → Create an app**.
3. Enable the **Storefront API** scopes under the app configuration.
4. Generate a **Storefront access token** and copy your store domain.
5. Paste both into `.env.local` (`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` and `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`).

</details>

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script             | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the development server                  |
| `npm run build`    | Create a production build                     |
| `npm run start`    | Start the production server                   |
| `npm run lint`     | Run ESLint                                    |
| `npm run typecheck`| Run the TypeScript type checker (`tsc --noEmit`) |

---

## 🗂️ Project Structure

```
.
├── public/                    # Static assets (favicons, SVGs, images)
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Home / landing page
│   │   ├── products/[handle]/ # Product detail page
│   │   ├── collections/       # Collections index
│   │   ├── collections/[handle]/ # Collection detail with products
│   │   ├── journal/           # Blog list & article pages
│   │   ├── search/            # Search results
│   │   ├── checkout/          # Checkout redirect page
│   │   ├── account/           # Account page
│   │   ├── about/ contact/    # Static pages
│   │   └── *-policy/          # Policy pages (privacy, terms, shipping, refund)
│   ├── components/            # Reusable UI components
│   │   ├── cart/              # CartDrawer & cart UI
│   │   ├── layout/            # Header, Footer, PolicyPage
│   │   ├── product/           # ProductCard, ProductGrid, ProductDetail
│   │   └── ui/                # Button, Image, Input primitives
│   ├── context/               # CartContext (global cart state)
│   ├── lib/                   # shopify.ts (API client), mock-data.ts, utils.ts
│   └── types/                 # Shopify + app TypeScript definitions
├── .env.example               # Example environment variables
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

---

## 🔌 Shopify Integration

All Shopify communication lives in [`src/lib/shopify.ts`](src/lib/shopify.ts) and is fully typed in [`src/types/shopify.ts`](src/types/shopify.ts).

The client auto-detects whether to hit the live Storefront API or fall back to mock data via `shouldUseMockData()`:

```ts
export function shouldUseMockData(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !isShopifyConfigured();
}
```

### Available data functions

| Function                     | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `fetchProducts`              | Products (cursor pagination + sorting)   |
| `fetchProduct(handle)`       | Single product by handle                 |
| `fetchProductRecommendations`| Recommended products                    |
| `fetchCollections()`         | All collections                          |
| `fetchCollection(handle)`    | Collection + its products                |
| `fetchCart(cartId)`          | Fetch a cart by ID                       |
| `createCart(input)`          | Create a new cart                        |
| `addToCart` / `updateCartLine` / `removeFromCart` | Cart line operations |
| `updateCartNote`             | Set cart order note                      |
| `fetchMenus()` / `fetchMenu()`| Navigation menus                         |
| `fetchShop()`                | Store / brand / policies data            |
| `fetchBlogs()` / `fetchArticles()` / `fetchArticle()` | Journal content |
| `updateCartAttributes`, `updateCartBuyerIdentity` | Cart metadata        |

> Global cart state is managed by the [`CartContext`](src/context/CartContext.tsx) provider, which integrates with the UI cart drawer.

---

## 🛍️ How the Cart & Checkout Works

1. Product detail pages let users pick options/variants and **add to cart** (`addToCart`).
2. The cart is stored in context and rendered in the **Cart Drawer**.
3. Users update quantities, remove lines, or add an order note (`updateCartNote`).
4. The **Shopify checkout** URL (`cart.checkoutUrl`) from a created cart powers `checkout/` — checkout happens on Shopify's hosted secure checkout.

---

## 🧰 Tech Stack

- [Next.js 14](https://nextjs.org) — App Router, RSC
- [React 18](https://react.dev)
- [@shopify/hydrogen-react](https://www.npmjs.com/package/@shopify/hydrogen-react)
- [graphql-request](https://www.npmjs.com/package/graphql-request) — typed GraphQL client
- [Tailwind CSS](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) — icons
- [TypeScript](https://www.typescriptlang.org)

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please keep code clean, typed, and linted (`npm run lint` / `npm run type-check`).

---

## 📄 License

This project is private / licensed for the SSS jewellery business. Contact the repository owner for permission before redistribution.

---

*Built for headless e-commerce. Powered by Shopify Storefront API + the modern Next.js App Router.*