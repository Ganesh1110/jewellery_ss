'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { Cart, CartCreateInput } from '@/types/shopify';
import { createCart, fetchCart, addToCart as addToCartApi, updateCartLine as updateCartLineApi, removeFromCart as removeFromCartApi, updateCartNote as updateCartNoteApi } from '@/lib/shopify';

const CART_ID_KEY = 'sss_cart_id';

interface CartContextType {
  cart: Cart | null;
  isCartOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (merchandiseId: string, quantity: number, attributes?: Array<{ key: string; value: string }>) => Promise<void>;
  updateQuantity: (lineId: string, merchandiseId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  updateNote: (note: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  totalQuantity: number;
  subtotal: number;
  currencyCode: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize cart on mount
  useEffect(() => {
    const initCart = async () => {
      let cartId = localStorage.getItem(CART_ID_KEY);
      
      if (cartId) {
        try {
          const existingCart = await fetchCart(cartId);
          if (existingCart) {
            setCart(existingCart);
            setInitialized(true);
            return;
          }
        } catch {
          // Cart not found, create new one
          localStorage.removeItem(CART_ID_KEY);
        }
      }
      
      // Create new cart
      try {
        const newCart = await createCart();
        if (newCart) {
          localStorage.setItem(CART_ID_KEY, newCart.id);
          setCart(newCart);
        }
      } catch (err) {
        setError('Failed to initialize cart');
      } finally {
        setInitialized(true);
      }
    };

    initCart();
  }, []);

  const refreshCart = useCallback(async () => {
    const cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) return;
    
    try {
      const updatedCart = await fetchCart(cartId);
      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch (err) {
      console.error('Failed to refresh cart:', err);
    }
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback(
    async (merchandiseId: string, quantity: number, attributes?: Array<{ key: string; value: string }>) => {
      if (!cart) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const updatedCart = await addToCartApi(cart.id, [
          { merchandiseId, quantity, attributes },
        ]);
        if (updatedCart) {
          setCart(updatedCart);
          setIsCartOpen(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!cart) return;
      setIsLoading(true);
      setError(null);

      try {
        const updatedCart = await removeFromCartApi(cart.id, [lineId]);
        if (updatedCart) {
          setCart(updatedCart);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove item');
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const updateQuantity = useCallback(
    async (lineId: string, merchandiseId: string, quantity: number) => {
      if (!cart) return;
      if (quantity < 1) {
        await removeLine(lineId);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedCart = await updateCartLineApi(cart.id, [
          { id: lineId, merchandiseId, quantity },
        ]);
        if (updatedCart) {
          setCart(updatedCart);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update cart');
      } finally {
        setIsLoading(false);
      }
    },
    [cart, removeLine]
  );

  const updateNote = useCallback(
    async (note: string) => {
      if (!cart) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const updatedCart = await updateCartNoteApi(cart.id, note);
        if (updatedCart) {
          setCart(updatedCart);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update note');
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const totalQuantity = cart?.totalQuantity || 0;
  const subtotal = cart?.cost.subtotalAmount.amount || 0;
  const currencyCode = cart?.cost.subtotalAmount.currencyCode || 'USD';

  const value: CartContextType = {
    cart,
    isCartOpen,
    isLoading,
    error,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    updateQuantity,
    removeLine,
    updateNote,
    refreshCart,
    totalQuantity,
    subtotal,
    currencyCode,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}