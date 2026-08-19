import type { Cart, CartCreateInput, CartLineUpdateInput } from '@/types/shopify';

async function request(url: string, init?: RequestInit): Promise<Cart> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  return res.json();
}

export function createCart(input: CartCreateInput = {}): Promise<Cart> {
  return request('/api/cart', { method: 'POST', body: JSON.stringify(input) });
}

export async function fetchCart(cartId: string): Promise<Cart> {
  const res = await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`);
  if (!res.ok) return Promise.reject(new Error('Cart not found'));
  return res.json();
}

export function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Promise<Cart> {
  return request('/api/cart/items', { method: 'POST', body: JSON.stringify({ cartId, lines }) });
}

export function updateCartLine(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
  return request('/api/cart/items', { method: 'PATCH', body: JSON.stringify({ cartId, lines }) });
}

export function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  return request('/api/cart/items', { method: 'DELETE', body: JSON.stringify({ cartId, lineIds }) });
}

export function updateCartNote(cartId: string, note: string): Promise<Cart> {
  return request('/api/cart/note', { method: 'POST', body: JSON.stringify({ cartId, note }) });
}

export interface CheckoutOrderSuccess {
  ok: true;
  order: {
    orderNumber: string;
    name: string;
    email: string;
    createdAt: string;
    total: number;
    currencyCode: string;
    status: string;
    lineItems: Array<{ title: string; image: string; quantity: number }>;
  };
}
export interface CheckoutOrderError {
  ok: false;
  error: string;
}
export type CheckoutOrderResult = CheckoutOrderSuccess | CheckoutOrderError;

export interface CheckoutInput {
  cartId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: { addressLine?: string; city?: string; state?: string; pincode?: string };
  createAccount?: boolean;
  password?: string;
}

export async function checkoutOrder(input: string | CheckoutInput): Promise<CheckoutOrderResult> {
  const payload = typeof input === 'string' ? { cartId: input } : input;
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error || 'Checkout failed' };
  }

  const data: CheckoutOrderSuccess = await res.json();
  localStorage.removeItem('sss_cart_id');
  return data;
}