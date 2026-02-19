import type { CatalogProduct } from "./types";

const seedProducts: Omit<
  CatalogProduct,
  "brand" | "offerPrice" | "badge" | "isAvailable"
>[] = [
  {
    id: "nb-1",
    slug: "serum-vitamina-c",
    name: "Serum Vitamina C",
    category: "Skincare",
    price: 89900,
    imageUrl:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Ilumina y unifica tono en rutina AM.",
    description:
      "Con antioxidantes estables para ayudar a mejorar luminosidad y apariencia de manchas en uso diario.",
    featured: true
  },
  {
    id: "nb-2",
    slug: "crema-hidratante-botanica",
    name: "Crema Hidratante Botanica",
    category: "Skincare",
    price: 75900,
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Textura ligera, hidratacion prolongada.",
    description:
      "Formula con aloe vera y acido hialuronico para fortalecer la barrera de la piel sin sensacion grasosa.",
    featured: false
  },
  {
    id: "nb-3",
    slug: "shampoo-reparador-natural",
    name: "Shampoo Reparador Natural",
    category: "Cabello",
    price: 52900,
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Limpieza suave para cabello danado.",
    description:
      "Limpia sin sulfatos agresivos y ayuda a reducir quiebre con proteinas vegetales.",
    featured: true
  },
  {
    id: "nb-4",
    slug: "acondicionador-nutritivo",
    name: "Acondicionador Nutritivo",
    category: "Cabello",
    price: 49900,
    imageUrl:
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Suavidad y brillo sin peso.",
    description:
      "Ideal para desenredar, sellar cuticula y controlar frizz en climas humedos.",
    featured: false
  }
];

export const mockCatalogProducts: CatalogProduct[] = seedProducts.map((product) => ({
  ...product,
  brand: "Natural Be",
  offerPrice: null,
  badge: product.featured ? "Destacado" : null,
  isAvailable: true
}));
