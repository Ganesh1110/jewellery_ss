'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';

export function CheckoutCapture() {
  const { cart } = useCart();
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (!cart || hasCaptured.current) return;
    const hasItems = cart.lines.edges.some((line) => line.node.quantity > 0);
    if (!hasItems) return;
    hasCaptured.current = true;

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: cart.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Checkout failed');
        localStorage.removeItem('sss_cart_id');
      })
      .catch((err) => console.error('Checkout capture failed:', err));
  }, [cart]);

  return null;
}