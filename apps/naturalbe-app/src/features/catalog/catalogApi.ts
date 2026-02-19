import { z } from "zod";
import { http } from "../../core/api/http";
import { appEnv } from "../../core/config/env";
import { mockCatalogProducts } from "./mockProducts";
import type { CatalogProduct } from "./types";

const realProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional(),
  nombre: z.string().optional(),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  precio: z.union([z.number(), z.string()]).optional(),
  precio_oferta: z.union([z.number(), z.string(), z.null()]).optional(),
  imagen_principal: z.string().optional(),
  descripcion_corta: z.string().optional(),
  descripcion_larga: z.string().optional(),
  badge: z.string().optional(),
  disponible: z.boolean().optional()
});

const remoteProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.object({ name: z.string() })).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  offerPrice: z.union([z.number(), z.string(), z.null()]).optional(),
  imageUrl: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.object({ src: z.string().optional() })).optional(),
  shortDescription: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  badge: z.string().optional(),
  featured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  prices: z
    .object({
      price: z.string().optional(),
      currency_minor_unit: z.number().optional()
    })
    .optional()
});

let catalogCache: CatalogProduct[] | null = null;

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  return null;
}

function prettifyCategory(raw: string | undefined): string {
  if (!raw) {
    return "Suplementos";
  }

  const normalized = raw.replace(/[_-]+/g, " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function resolveImageUrl(raw: string | undefined): string {
  const fallback = "https://naturalbe.com.co/static/img/placeholder.webp";

  if (!raw) {
    return fallback;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${appEnv.catalogAssetsBaseUrl}${raw}`;
  }

  return `${appEnv.catalogAssetsBaseUrl}/${raw}`;
}

async function fetchCatalogRaw(path: string): Promise<unknown> {
  if (!/^https?:\/\//i.test(path)) {
    const direct = await fetch(path);

    if (direct.ok) {
      return await direct.json();
    }
  }

  return await http<unknown>(path);
}

function mapFromReal(product: z.infer<typeof realProductSchema>): CatalogProduct {
  const name = product.nombre ?? `Producto ${String(product.id)}`;
  const slug =
    product.slug ?? `${String(product.id)}-${name.toLowerCase().replace(/\s+/g, "-")}`;
  const basePrice = parseNumeric(product.precio) ?? 0;
  const discountedPrice = parseNumeric(product.precio_oferta);
  const finalPrice = discountedPrice ?? basePrice;

  return {
    id: String(product.id),
    slug,
    name,
    brand: product.marca ?? "Natural Be",
    category: prettifyCategory(product.categoria),
    price: finalPrice,
    offerPrice: discountedPrice !== null ? basePrice : null,
    imageUrl: resolveImageUrl(product.imagen_principal),
    shortDescription:
      product.descripcion_corta ?? "Suplemento Natural Be para rutina diaria de bienestar.",
    description:
      product.descripcion_larga ??
      product.descripcion_corta ??
      "Sin descripcion detallada disponible por ahora.",
    badge: product.badge ?? (discountedPrice !== null ? "Oferta" : null),
    featured: Boolean(product.badge) || discountedPrice !== null,
    isAvailable: product.disponible ?? true
  };
}

function parseRemotePrice(product: z.infer<typeof remoteProductSchema>): number {
  const direct = parseNumeric(product.price);

  if (direct !== null) {
    return direct;
  }

  if (product.prices?.price) {
    const raw = Number(product.prices.price);

    if (!Number.isNaN(raw)) {
      const divisor = product.prices.currency_minor_unit
        ? 10 ** product.prices.currency_minor_unit
        : 100;

      return raw / divisor;
    }
  }

  return 0;
}

function mapFromRemote(
  product: z.infer<typeof remoteProductSchema>,
  index: number
): CatalogProduct {
  const name = product.name ?? product.title ?? `Producto ${index + 1}`;
  const discountedPrice = parseNumeric(product.offerPrice);
  const basePrice = parseRemotePrice(product);

  return {
    id: String(product.id),
    slug: product.slug ?? `${String(product.id)}-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    brand: product.brand ?? "Natural Be",
    category: prettifyCategory(product.category ?? product.categories?.[0]?.name),
    price: discountedPrice ?? basePrice,
    offerPrice: discountedPrice !== null ? basePrice : null,
    imageUrl: resolveImageUrl(product.imageUrl ?? product.image ?? product.images?.[0]?.src),
    shortDescription:
      product.shortDescription ??
      product.short_description ??
      "Producto natural de alta rotacion en catalogo.",
    description:
      product.description ??
      product.shortDescription ??
      product.short_description ??
      "Sin descripcion detallada disponible por ahora.",
    badge: product.badge ?? null,
    featured: product.featured ?? (Boolean(product.badge) || discountedPrice !== null),
    isAvailable: product.isAvailable ?? true
  };
}

export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  if (catalogCache) {
    return catalogCache;
  }

  const candidates = [
    appEnv.productsPath,
    "/productos.json",
    "https://naturalbe.com.co/static/data/productos.json"
  ];

  for (const source of candidates) {
    try {
      const raw = await fetchCatalogRaw(source);
      if (Array.isArray(raw)) {
        const realMapped = raw
          .map((item) => realProductSchema.safeParse(item))
          .filter((result): result is { success: true; data: z.infer<typeof realProductSchema> } =>
            result.success
          )
          .map((result) => mapFromReal(result.data))
          .filter((product) => product.isAvailable);

        if (realMapped.length > 0) {
          catalogCache = realMapped;
          return catalogCache;
        }

        const remoteMapped = raw
          .map((item) => remoteProductSchema.safeParse(item))
          .filter(
            (result): result is { success: true; data: z.infer<typeof remoteProductSchema> } =>
              result.success
          )
          .map((result, index) => mapFromRemote(result.data, index))
          .filter((product) => product.isAvailable);

        if (remoteMapped.length > 0) {
          catalogCache = remoteMapped;
          return catalogCache;
        }
      }
    } catch {
      // Intentar siguiente origen.
    }
  }

  catalogCache = mockCatalogProducts;
  return catalogCache;
}

export async function fetchCatalogProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  const products = await fetchCatalogProducts();
  return products.find((product) => product.slug === slug) ?? null;
}
