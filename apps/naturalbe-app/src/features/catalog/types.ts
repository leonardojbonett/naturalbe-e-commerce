export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  offerPrice: number | null;
  imageUrl: string;
  shortDescription: string;
  description: string;
  badge: string | null;
  featured: boolean;
  isAvailable: boolean;
};

export type CatalogSort = "featured" | "price-asc" | "price-desc";
