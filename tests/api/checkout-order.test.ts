import type { CheckoutOrderSuccess, CheckoutOrderError } from '@/lib/cart-api';
import { checkoutOrder } from '@/lib/cart-api';

const orderResponse = {
  ok: true,
  order: {
    orderNumber: '#1042',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    createdAt: '2024-06-01T12:00:00.000Z',
    total: 25000,
    currencyCode: 'INR',
    status: 'Processing',
    lineItems: [
      { title: 'The Solitaire Pendant', image: 'https://via.placeholder.com/400x500', quantity: 1 },
    ],
  },
};

describe('checkoutOrder (explicit checkout wiring)', () => {
  const originalFetch = global.fetch;
  const store: Record<string, string | null> = {};
  const localStorageStub = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };

  beforeEach(() => {
    (globalThis as any).localStorage = localStorageStub;
    localStorageStub.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete (globalThis as any).localStorage;
  });

  it('posts to /api/checkout, clears the cart token, and returns the order', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => orderResponse,
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    localStorageStub.setItem('sss_cart_id', 'gid://db/Cart/5');

    const result = await checkoutOrder('gid://db/Cart/5') as CheckoutOrderSuccess;

    expect(result.ok).toBe(true);
    expect(result.order.orderNumber).toBe('#1042');
    expect(result.order.status).toBe('Processing');
    expect(localStorageStub.getItem('sss_cart_id')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: 'gid://db/Cart/5' }),
    });
  });

  it('returns a typed error when the route responds non-OK', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Cart not found' }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
    localStorageStub.setItem('sss_cart_id', 'gid://db/Cart/9');

    const result = await checkoutOrder('gid://db/Cart/9') as CheckoutOrderError;

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Cart not found');
    // cart token must remain intact so the user can fix the issue and retry
    expect(localStorageStub.getItem('sss_cart_id')).toBe('gid://db/Cart/9');
  });
});
