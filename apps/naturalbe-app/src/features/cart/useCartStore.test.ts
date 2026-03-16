import { beforeEach, describe, expect, it } from "vitest";
import type { CatalogProduct } from "../catalog/types";
import { useCartStore } from "./useCartStore";

const sampleProduct: CatalogProduct = {
  id: "p-1",
  slug: "producto-1",
  name: "Producto 1",
  brand: "Natural Be",
  category: "Suplementos",
  price: 25000,
  offerPrice: null,
  imageUrl: "https://naturalbe.com.co/static/img/test.webp",
  shortDescription: "Descripcion corta",
  description: "Descripcion larga",
  badge: null,
  featured: false,
  isAvailable: true
};

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("normaliza cantidades invalidas al agregar y limita el maximo por item", () => {
    useCartStore.getState().addProduct(sampleProduct, -10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);

    useCartStore.getState().setQuantity(sampleProduct.id, 999);
    expect(useCartStore.getState().items[0]?.quantity).toBe(99);
  });

  it("elimina el item cuando setQuantity recibe valor invalido", () => {
    useCartStore.getState().addProduct(sampleProduct, 2);
    expect(useCartStore.getState().items).toHaveLength(1);

    useCartStore.getState().setQuantity(sampleProduct.id, NaN);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("no agrega productos con datos invalidos", () => {
    const malformedProduct = {
      ...sampleProduct,
      name: "   ",
      price: Number.NaN
    } as CatalogProduct;

    useCartStore.getState().addProduct(malformedProduct, 1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
