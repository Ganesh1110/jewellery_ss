'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@/types/shopify';
import { useToast } from '@/context/ToastContext';

interface WishlistContextType {
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'sss_jewellery_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
      } catch (e) {
        console.error('Failed to save wishlist:', e);
      }
    }
  }, [wishlist, initialized]);

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      showToast(`Removed "${product.title}" from your wishlist`, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`Saved "${product.title}" to your wishlist`, 'success');
    }
  };

  const removeFromWishlist = (productId: string) => {
    const item = wishlist.find((i) => i.id === productId);
    setWishlist((prev) => prev.filter((i) => i.id !== productId));
    if (item) {
      showToast(`Removed "${item.title}" from your wishlist`, 'info');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
