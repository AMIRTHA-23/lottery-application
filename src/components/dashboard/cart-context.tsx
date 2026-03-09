'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '@/lib/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('diamond-cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        } catch (e) {
          console.error('Failed to load cart from storage:', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes, but ONLY AFTER loading is complete
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('diamond-cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

  // Clean up expired items automatically (Jackpot rule: 15 mins before)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCart((prev) => {
        const filtered = prev.filter((item) => {
          try {
            const drawTime = new Date(item.eventDate);
            if (isNaN(drawTime.getTime())) return true; // Keep if date is invalid to be safe

            if (item.agency === 'Jackpot') {
              const limit = new Date(drawTime.getTime() - 15 * 60 * 1000);
              return now < limit;
            }
            return now < drawTime;
          } catch (e) {
            return true;
          }
        });
        // Only update state if something was actually filtered to avoid unnecessary saves
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
