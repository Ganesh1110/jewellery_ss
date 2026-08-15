export interface CustomProductInput {
  title: string;
  handle?: string;
  description: string;
  productType: string;
  vendor: string;
  price: number;
  compareAtPrice?: number;
  currencyCode?: string;
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

export interface VariantInput {
  title?: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  currencyCode?: string;
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
  variantTitle: string | null;
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