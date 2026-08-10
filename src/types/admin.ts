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