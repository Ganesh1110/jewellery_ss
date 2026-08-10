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