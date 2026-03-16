import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const siteOrigin = (process.env.SITE_ORIGIN || "https://naturalbe.com.co").replace(/\/+$/, "");
const productsPath = path.join(process.cwd(), "public", "productos.json");
const outputPath = path.join(process.cwd(), "public", "sitemap-app.xml");

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function resolveProductSlug(product) {
  if (typeof product?.slug === "string" && product.slug.trim().length > 0) {
    return product.slug.trim();
  }

  const nameCandidate =
    typeof product?.name === "string"
      ? product.name
      : typeof product?.nombre === "string"
        ? product.nombre
        : `producto-${String(product?.id ?? "")}`;
  const fallback = slugify(nameCandidate);
  return fallback.length > 0 ? fallback : null;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toUrlNode(url, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(url)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>"
  ].join("\n");
}

async function run() {
  let productsRaw = "[]";
  try {
    productsRaw = await readFile(productsPath, "utf8");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  let products = [];
  try {
    const parsed = JSON.parse(productsRaw);
    if (Array.isArray(parsed)) {
      products = parsed;
    }
  } catch {
    products = [];
  }

  const staticRoutes = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/carrito", changefreq: "weekly", priority: "0.6" },
    { path: "/checkout", changefreq: "weekly", priority: "0.6" }
  ];
  const productRoutes = Array.from(
    new Set(products.map(resolveProductSlug).filter((slug) => typeof slug === "string" && slug.length > 0))
  ).map((slug) => ({
    path: `/producto/${slug}`,
    changefreq: "weekly",
    priority: "0.8"
  }));

  const now = new Date().toISOString();
  const nodes = [...staticRoutes, ...productRoutes].map((route) =>
    toUrlNode(`${siteOrigin}${route.path}`, now, route.changefreq, route.priority)
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...nodes,
    "</urlset>",
    ""
  ].join("\n");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, "utf8");
  console.log(`App sitemap written to ${outputPath} with ${nodes.length} urls`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
