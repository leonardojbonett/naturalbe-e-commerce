import { createServer } from "node:http";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { z } from "zod";

const PORT = Number(process.env.ORDER_API_PORT || 8787);
const catalogPath = process.env.ORDER_CATALOG_PATH || path.join(process.cwd(), "public", "productos.json");
const logFilePath = process.env.ORDER_LOG_PATH || path.join(process.cwd(), ".tmp", "orders", "orders.jsonl");
const metricsLogFilePath =
  process.env.ORDER_METRICS_LOG_PATH || path.join(process.cwd(), ".tmp", "orders", "metrics.jsonl");
const defaultAllowedOrigins = [
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://app.naturalbe.com.co",
  "https://naturalbe.com.co"
];
const parsedAllowedOrigins = (process.env.ORDER_ALLOWED_ORIGINS || defaultAllowedOrigins.join(","))
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => Boolean(entry) && entry !== "*");
const allowedOrigins = parsedAllowedOrigins.length > 0 ? parsedAllowedOrigins : defaultAllowedOrigins;
const trustProxy = process.env.ORDER_TRUST_PROXY === "true";

const freeShippingThreshold = 100000;
const standardShippingFee = 15000;
const maxBodySizeBytes = 100 * 1024;
const rateWindowMs = 60_000;
const rateMax = 12;

const productSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string().optional(),
  precio: z.union([z.number(), z.string()]).optional(),
  precio_oferta: z.union([z.number(), z.string(), z.null()]).optional(),
  disponible: z.boolean().optional()
});

const createOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(3).max(80),
    phone: z
      .string()
      .transform((value) => value.replace(/\D+/g, ""))
      .pipe(z.string().regex(/^\d{10,12}$/)),
    city: z.string().trim().min(2).max(60),
    address: z.string().trim().min(6).max(140),
    deliveryNote: z.string().trim().max(240).optional().default(""),
    paymentMethod: z.enum(["contraentrega", "transferencia"])
  }),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(99)
      })
    )
    .min(1)
    .max(50)
});

const metricSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.number().finite(),
  tags: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
  at: z.string().optional(),
  path: z.string().optional(),
  href: z.string().optional()
});

let catalogCache = null;
const rateBucket = new Map();

function parseNumeric(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function getCatalog() {
  if (catalogCache) {
    return catalogCache;
  }

  const raw = await readFile(catalogPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Catalogo invalido");
  }

  catalogCache = parsed
    .map((item) => productSchema.safeParse(item))
    .filter((entry) => entry.success)
    .map((entry) => {
      const product = entry.data;
      const id = String(product.id);
      const basePrice = parseNumeric(product.precio) ?? 0;
      const offerPrice = parseNumeric(product.precio_oferta);
      const price = offerPrice ?? basePrice;

      return {
        id,
        name: product.nombre || `Producto ${id}`,
        price,
        isAvailable: product.disponible ?? true
      };
    })
    .filter((item) => item.isAvailable && item.price >= 0);

  return catalogCache;
}

function buildCheckoutMessage(order) {
  const lines = order.items.map((item) => `- ${item.name} x${item.quantity} ($${item.lineTotal.toLocaleString("es-CO")})`);
  const shippingLabel = order.shipping === 0 ? "Gratis" : `$${order.shipping.toLocaleString("es-CO")}`;

  return [
    `Hola, quiero finalizar el pedido ${order.orderId}:`,
    ...lines,
    "",
    `Subtotal: $${order.subtotal.toLocaleString("es-CO")}`,
    `Envio: ${shippingLabel}`,
    `Total: $${order.total.toLocaleString("es-CO")}`,
    "",
    "Datos del cliente:",
    `Nombre: ${order.customer.fullName}`,
    `Telefono: ${order.customer.phone}`,
    `Ciudad: ${order.customer.city}`,
    `Direccion: ${order.customer.address}`,
    `Preferencia de pago: ${order.customer.paymentMethod}`,
    `Notas: ${order.customer.deliveryNote || "Sin notas"}`
  ].join("\n");
}

function getShipping(subtotal) {
  if (subtotal >= freeShippingThreshold) {
    return 0;
  }

  return standardShippingFee;
}

function getClientIp(request) {
  if (trustProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
  }

  return request.socket.remoteAddress || "unknown";
}

function rateKey(ip, scope) {
  return `${scope}:${ip}`;
}

function isRateLimited(ip, scope) {
  const now = Date.now();
  const key = rateKey(ip, scope);
  const item = rateBucket.get(key);

  if (!item || now > item.resetAt) {
    rateBucket.set(key, { count: 1, resetAt: now + rateWindowMs });
    return false;
  }

  if (item.count >= rateMax) {
    return true;
  }

  item.count += 1;
  rateBucket.set(key, item);
  return false;
}

function corsOriginFor(requestOrigin) {
  if (!requestOrigin) {
    return "";
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : "";
}

function isOriginAllowed(requestOrigin) {
  if (!requestOrigin) {
    return true;
  }

  return allowedOrigins.includes(requestOrigin);
}

function writeJson(response, statusCode, payload, requestOrigin = "") {
  const allowedOrigin = corsOriginFor(requestOrigin);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodySizeBytes) {
        reject(new Error("Payload demasiado grande"));
        request.destroy();
        return;
      }
      data += chunk.toString("utf8");
    });

    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("JSON invalido"));
      }
    });

    request.on("error", reject);
  });
}

async function appendOrderLog(order) {
  const folder = path.dirname(logFilePath);
  await mkdir(folder, { recursive: true });
  await appendFile(logFilePath, `${JSON.stringify(order)}\n`, "utf8");
}

async function appendMetricLog(metric) {
  const folder = path.dirname(metricsLogFilePath);
  await mkdir(folder, { recursive: true });
  await appendFile(metricsLogFilePath, `${JSON.stringify(metric)}\n`, "utf8");
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const position = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function round(value) {
  return Number(value.toFixed(2));
}

function computeStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);

  return {
    count: sorted.length,
    avg: round(sum / sorted.length),
    min: round(sorted[0]),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1])
  };
}

async function readMetrics() {
  try {
    const raw = await readFile(metricsLogFilePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((item) => item && typeof item.name === "string" && Number.isFinite(item.value));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function filterMetrics(metrics, query) {
  const name = query.get("metric");
  const release = query.get("release");
  const from = query.get("from");
  const to = query.get("to");

  const fromTs = from ? Date.parse(from) : null;
  const toTs = to ? Date.parse(to) : null;

  return metrics.filter((metric) => {
    if (name && metric.name !== name) {
      return false;
    }

    if (release && String(metric.tags?.release ?? "") !== release) {
      return false;
    }

    const metricAt = metric.at ? Date.parse(metric.at) : null;
    if (fromTs !== null && Number.isFinite(fromTs) && metricAt !== null && metricAt < fromTs) {
      return false;
    }

    if (toTs !== null && Number.isFinite(toTs) && metricAt !== null && metricAt > toTs) {
      return false;
    }

    return true;
  });
}

function buildSummary(metrics) {
  const byName = new Map();

  for (const metric of metrics) {
    const list = byName.get(metric.name) ?? [];
    list.push(Number(metric.value));
    byName.set(metric.name, list);
  }

  return Array.from(byName.entries())
    .map(([name, values]) => ({
      name,
      ...computeStats(values)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSummaryByDay(metrics) {
  const byDayMetric = new Map();

  for (const metric of metrics) {
    const day = typeof metric.at === "string" && metric.at.length >= 10
      ? metric.at.slice(0, 10)
      : "unknown";
    const key = `${day}::${metric.name}`;
    const list = byDayMetric.get(key) ?? { day, name: metric.name, values: [] };
    list.values.push(Number(metric.value));
    byDayMetric.set(key, list);
  }

  return Array.from(byDayMetric.values())
    .map((entry) => ({
      day: entry.day,
      name: entry.name,
      ...computeStats(entry.values)
    }))
    .sort((a, b) => (a.day === b.day ? a.name.localeCompare(b.name) : a.day.localeCompare(b.day)));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const requestOrigin = request.headers.origin || "";

  if (
    request.method === "OPTIONS" &&
    (url.pathname === "/api/orders" || url.pathname === "/api/metrics" || url.pathname === "/api/metrics/summary")
  ) {
    writeJson(response, 204, {}, requestOrigin);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/metrics/summary") {
    if (!isOriginAllowed(requestOrigin)) {
      writeJson(response, 403, { error: "Origin no permitido" }, requestOrigin);
      return;
    }

    try {
      const metrics = await readMetrics();
      const filtered = filterMetrics(metrics, url.searchParams);
      const groupBy = url.searchParams.get("groupBy");
      const summary = groupBy === "day" ? buildSummaryByDay(filtered) : buildSummary(filtered);

      writeJson(
        response,
        200,
        {
          totalRecords: filtered.length,
          groupBy: groupBy === "day" ? "day" : "metric",
          metrics: summary
        },
        requestOrigin
      );
    } catch (error) {
      writeJson(response, 500, { error: error instanceof Error ? error.message : "Error interno" }, requestOrigin);
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/metrics") {
    if (!isOriginAllowed(requestOrigin)) {
      writeJson(response, 403, { error: "Origin no permitido" }, requestOrigin);
      return;
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip, "metrics")) {
      writeJson(response, 429, { error: "Demasiadas metricas. Intenta de nuevo en un minuto." }, requestOrigin);
      return;
    }

    try {
      const body = await readJsonBody(request);
      const parsed = metricSchema.safeParse(body);

      if (!parsed.success) {
        writeJson(response, 400, { error: "Metric invalida" }, requestOrigin);
        return;
      }

      await appendMetricLog({
        ...parsed.data,
        serverAt: new Date().toISOString(),
        sourceIp: getClientIp(request)
      });
      writeJson(response, 202, { ok: true }, requestOrigin);
    } catch (error) {
      writeJson(response, 500, { error: error instanceof Error ? error.message : "Error interno" }, requestOrigin);
    }
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/api/orders") {
    writeJson(response, 404, { error: "Not found" }, requestOrigin);
    return;
  }

  if (!isOriginAllowed(requestOrigin)) {
    writeJson(response, 403, { error: "Origin no permitido" }, requestOrigin);
    return;
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip, "orders")) {
    writeJson(response, 429, { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." }, requestOrigin);
    return;
  }

  try {
    const body = await readJsonBody(request);
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      writeJson(response, 400, { error: "Payload invalido", details: parsed.error.flatten().fieldErrors }, requestOrigin);
      return;
    }

    const catalog = await getCatalog();
    const byId = new Map(catalog.map((item) => [item.id, item]));

    const missing = parsed.data.items.filter((item) => !byId.has(item.id)).map((item) => item.id);
    if (missing.length > 0) {
      writeJson(response, 400, { error: "Productos no validos", productIds: missing }, requestOrigin);
      return;
    }

    const orderItems = parsed.data.items.map((item) => {
      const product = byId.get(item.id);
      const unitPrice = product.price;
      return {
        id: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;
    const orderId = `NB-${Date.now().toString(36).toUpperCase()}`;

    const order = {
      orderId,
      createdAt: new Date().toISOString(),
      customer: parsed.data.customer,
      items: orderItems,
      subtotal,
      shipping,
      total,
      currency: "COP",
      sourceIp: ip
    };

    const whatsappMessage = buildCheckoutMessage(order);
    await appendOrderLog(order);

    writeJson(
      response,
      201,
      {
        orderId,
        subtotal,
        shipping,
        total,
        currency: "COP",
        items: orderItems,
        whatsappMessage
      },
      requestOrigin
    );
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Error interno" }, requestOrigin);
  }
});

server.listen(PORT, () => {
  console.log(`Order API listening on http://localhost:${PORT}`);
});
