'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';

export function CheckoutCapture() {
  const { cart } = useCart();
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (!cart || hasCaptured.current) return;
    const lines = cart.lines.edges
      .map(({ node }) => node)
      .filter((line) => line.quantity > 0);

    if (lines.length === 0) return;
    hasCaptured.current = true;

    const order = {
      name: 'Walk-in Checkout',
      email: '',
      createdAt: new Date().toISOString(),
      total: Number(cart.cost.totalAmount.amount),
      currencyCode: cart.cost.totalAmount.currencyCode,
      status: 'Processing',
      lineItems: lines.map((line) => ({
        title: line.merchandise.title,
        image: line.merchandise.image?.url || '/placeholder.svg',
        quantity: line.quantity,
      })),
    };

    try {
      const raw = localStorage.getItem('sss_orders');
      const existing = raw ? JSON.parse(raw) : [];
      const alreadyCaptured = existing.some(
        (o: { createdAt: string }) => Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 60000
      );
      if (!alreadyCaptured) {
        localStorage.setItem('sss_orders', JSON.stringify([...existing, order]));
      }
    } catch {
      // Silently ignore storage failures (demo environment)
    }
  }, [cart]);

  return null;
}