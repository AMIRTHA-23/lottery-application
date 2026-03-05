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
      setCart((prev) => prev.filter((item) => {
        const drawTime = new Date(item.eventDate);
        if (item.agency === 'Jackpot') {
          // Can buy up to 15 mins after lot time for some, 
          // but usually restricted 15 mins before for fairness.
          // Applying logic: remove if draw is less than 15 mins away.
          const limit = new Date(drawTime.getTime() - 15 * 60 * 1000);
          return now < limit;
        }
        return now < drawTime;
      }));
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
