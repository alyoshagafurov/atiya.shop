import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Product } from './api';

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
  qtyOf: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const STORAGE_KEY = 'atiya-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (p: Product, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === p.id);
      if (found) {
        return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { product: p, qty }];
    });

  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== id)
        : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    );

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id));
  const clear = () => setItems([]);
  const qtyOf = (id: string) => items.find((i) => i.product.id === id)?.qty ?? 0;

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.product.price, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total, qtyOf }}>
      {children}
    </CartContext.Provider>
  );
}
