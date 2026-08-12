/* Shopify Storefront API Types */

export interface MoneyV2 {
  amount: number;
  currencyCode: string;
}

export interface Image {
  id: string;
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

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

export interface ProductVariantConnection {
  edges: Array<{ node: ProductVariant }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  totalInventory: number;
  images: {
    edges: Array<{ node: Image }>;
    pageInfo: {
      hasNextPage: boolean;
    };
  };
  featuredImage: Image | null;
  options: ProductOption[];
  variants: ProductVariantConnection;
  priceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice: MoneyV2;
  };
  compareAtPriceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice: MoneyV2;
  } | null;
  seo: {
    title: string | null;
    description: string | null;
  };
  updatedAt: string;
  publishedAt: string | null;
}

export interface ProductConnection {
  edges: Array<{ node: Product; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image: Image | null;
  seo: {
    title: string | null;
    description: string | null;
  };
  updatedAt: string;
  products: ProductConnection;
}

export interface CollectionConnection {
  edges: Array<{ node: Collection; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: ProductVariant;
  cost: {
    totalAmount: MoneyV2;
    amountPerQuantity: MoneyV2;
  };
  attributes: Array<{ key: string; value: string }>;
  discounts: Array<{
    amount: MoneyV2;
    code: string | null;
  }>;
}

export interface CartLineConnection {
  edges: Array<{ node: CartLine }>;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLineConnection;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
    totalDutyAmount: MoneyV2 | null;
  };
  discountCodes: Array<{ code: string; applicable: boolean }>;
  buyerIdentity: {
    countryCode: string | null;
    email: string | null;
    phone: string | null;
  };
  attributes: Array<{ key: string; value: string }>;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartCreateInput {
  lines?: Array<{
    merchandiseId: string;
    quantity: number;
    attributes?: Array<{ key: string; value: string }>;
  }>;
  attributes?: Array<{ key: string; value: string }>;
  note?: string;
  buyerIdentity?: {
    countryCode: string;
    email?: string;
    phone?: string;
  };
}

export interface CartLineUpdateInput {
  id: string;
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  items?: MenuItem[];
  resourceType?: 'PRODUCT' | 'COLLECTION' | 'PAGE' | 'BLOG' | 'ARTICLE' | 'LINK';
  resourceId?: string;
}

export interface Menu {
  id: string;
  handle: string;
  title: string;
  items: MenuItem[];
}

export interface Page {
  id: string;
  handle: string;
  title: string;
  body: string;
  bodyHtml: string;
  seo: {
    title: string | null;
    description: string | null;
  };
}

export interface ShopPolicy {
  id: string;
  title: string;
  body: string;
  url: string;
}

export interface Shop {
  name: string;
  description: string | null;
  brand: {
    logo: Image | null;
    coverImage: Image | null;
    shortDescription: string | null;
  };
  primaryDomain: {
    url: string;
    host: string;
  };
  currencyCode: string;
  countriesInShipping: string[];
  paymentSettings: {
    acceptedPaymentMethods: string[];
  };
  policies: {
    privacyPolicy: ShopPolicy | null;
    refundPolicy: ShopPolicy | null;
    termsOfService: ShopPolicy | null;
    shippingPolicy: ShopPolicy | null;
  };
}

export interface Article {
  id: string;
  handle: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  image: Image | null;
  author: {
    name: string;
    bio: string | null;
    image: Image | null;
  };
  publishedAt: string;
  blog: {
    id: string;
    handle: string;
    title: string;
  };
  seo: {
    title: string | null;
    description: string | null;
  };
}

export interface ArticleConnection {
  edges: Array<{ node: Article; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface Blog {
  id: string;
  handle: string;
  title: string;
  articles: ArticleConnection;
}

/* App-specific types */
export interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ProductCardProps {
  product: Product;
  variant?: ProductVariant;
  priority?: boolean;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export interface HeaderProps {
  cartCount: number;
  onCartToggle: () => void;
}

export interface FooterProps {
  menus: Menu[];
  policies: Shop['policies'];
}

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}