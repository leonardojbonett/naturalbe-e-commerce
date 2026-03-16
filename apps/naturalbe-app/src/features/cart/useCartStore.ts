import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogProduct } from "../catalog/types";

const MAX_CART_ITEM_QUANTITY = 99;

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

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = Math.trunc(value);

  if (normalized <= 0) {
    return 0;
  }

  return Math.min(normalized, MAX_CART_ITEM_QUANTITY);
}

function sanitizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Partial<CartItem>;
      const id = typeof data.id === "string" ? data.id.trim() : "";
      const slug = typeof data.slug === "string" ? data.slug.trim() : "";
      const name = typeof data.name === "string" ? data.name.trim() : "";
      const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
      const price = typeof data.price === "number" && Number.isFinite(data.price) ? data.price : -1;
      const quantity = normalizeQuantity(typeof data.quantity === "number" ? data.quantity : 0);

      if (!id || !slug || !name || !imageUrl || price < 0 || quantity <= 0) {
        return null;
      }

      return { id, slug, name, imageUrl, price, quantity };
    })
    .filter((item): item is CartItem => item !== null);
}

function toSafeCartItem(product: CatalogProduct, quantity: number): CartItem | null {
  const id = typeof product.id === "string" ? product.id.trim() : "";
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  const normalizedQuantity = normalizeQuantity(quantity);
  const price = Number.isFinite(product.price) ? Math.max(0, Math.trunc(product.price)) : -1;

  if (!id || !slug || !name || !imageUrl || normalizedQuantity <= 0 || price < 0) {
    return null;
  }

  return {
    id,
    slug,
    name,
    imageUrl,
    price,
    quantity: normalizedQuantity
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addProduct: (product, quantity = 1) =>
        set((state) => {
          const incomingQuantity = normalizeQuantity(quantity) || 1;
          const safeItem = toSafeCartItem(product, incomingQuantity);

          if (!safeItem) {
            return state;
          }

          const index = state.items.findIndex((item) => item.id === safeItem.id);

          if (index < 0) {
            return {
              items: [
                ...state.items,
                safeItem
              ]
            };
          }

          const updated = [...state.items];
          const nextQuantity = normalizeQuantity(updated[index].quantity + incomingQuantity);

          if (nextQuantity <= 0) {
            return {
              items: state.items.filter((item) => item.id !== safeItem.id)
            };
          }

          updated[index] = {
            ...updated[index],
            quantity: nextQuantity
          };

          return { items: updated };
        }),
      removeProduct: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId)
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: (() => {
            const nextQuantity = normalizeQuantity(quantity);

            if (nextQuantity <= 0) {
              return state.items.filter((item) => item.id !== productId);
            }

            return state.items.map((item) =>
              item.id === productId ? { ...item, quantity: nextQuantity } : item
            );
          })()
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: "naturalbe-app-cart",
      merge: (persistedState, currentState) => {
        const persistedItems = (persistedState as { items?: unknown } | null)?.items;
        return {
          ...currentState,
          items: sanitizeCartItems(persistedItems)
        };
      }
    }
  )
);

export function selectCartItemsCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function selectCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}
