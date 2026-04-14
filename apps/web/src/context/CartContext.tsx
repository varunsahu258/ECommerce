import { createContext, type ReactNode, useEffect, useState } from "react";
import type { Product } from "@ecommerce/shared";

export interface CartLine {
  productId: number;
  quantity: number;
  product: Product;
}

interface CartContextValue {
  items: CartLine[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const storageKey = "ecommerce.cart";

export const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setItems(JSON.parse(stored) as CartLine[]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.inventory)
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          quantity,
          product
        }
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(quantity, item.product.inventory))
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Number(items.reduce((sum, item) => sum + item.quantity * item.product.price, 0).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
