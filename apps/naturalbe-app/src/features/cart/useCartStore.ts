import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogProduct } from "../catalog/types";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addProduct: (product: CatalogProduct, quantity?: number) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addProduct: (product, quantity = 1) =>
        set((state) => {
          const index = state.items.findIndex((item) => item.id === product.id);

          if (index < 0) {
            return {
              items: [
                ...state.items,
                {
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.imageUrl,
                  quantity
                }
              ]
            };
          }

          const updated = [...state.items];
          updated[index] = {
            ...updated[index],
            quantity: updated[index].quantity + quantity
          };

          return { items: updated };
        }),
      removeProduct: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId)
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== productId)
              : state.items.map((item) =>
                  item.id === productId ? { ...item, quantity } : item
                )
        })),
      clearCart: () => set({ items: [] })
    }),
    { name: "naturalbe-app-cart" }
  )
);

export function selectCartItemsCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function selectCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}
