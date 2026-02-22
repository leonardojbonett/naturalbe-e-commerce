import { z } from "zod";

const envSchema = z.object({
  VITE_APP_ENV: z.string().default("development"),
  VITE_API_BASE_URL: z.string().url().default("https://app.naturalbe.com.co"),
  VITE_WA_NUMBER: z.string().min(7).default("573137212923"),
  VITE_PRODUCTS_PATH: z.string().default("/productos.json"),
  VITE_CATALOG_ASSETS_BASE_URL: z.string().url().default("https://naturalbe.com.co"),
  VITE_INSTAGRAM_FEED_PATH: z.string().default("/instagram-feed.json")
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `Configuracion de entorno invalida: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
  );
}

export const appEnv = {
  appEnv: parsed.data.VITE_APP_ENV,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  waNumber: parsed.data.VITE_WA_NUMBER,
  productsPath: parsed.data.VITE_PRODUCTS_PATH,
  catalogAssetsBaseUrl: parsed.data.VITE_CATALOG_ASSETS_BASE_URL,
  instagramFeedPath: parsed.data.VITE_INSTAGRAM_FEED_PATH
};
