import { appEnv } from "../config/env";

type MetricTags = Record<string, string | number | boolean | null | undefined>;

const PDP_NAV_STORAGE_KEY = "nb_pdp_nav_v1";

type PendingNavigationMark = {
  slug: string;
  ts: number;
};

function normalizeTags(tags: MetricTags = {}) {
  const clean: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (value === null || value === undefined) {
      continue;
    }

    clean[key] = value;
  }

  return clean;
}

function getClientContextTags() {
  const connection = "connection" in navigator ? (navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  }).connection : undefined;

  return {
    deviceType: window.innerWidth < 700 ? "mobile" : "desktop",
    effectiveType: connection?.effectiveType ?? "unknown",
    saveData: connection?.saveData ?? false
  };
}

export function reportMetric(name: string, value: number, tags: MetricTags = {}) {
  if (!Number.isFinite(value)) {
    return;
  }

  const endpoint = appEnv.metricsPath?.trim();

  const payload = {
    name,
    value,
    tags: normalizeTags({
      release: appEnv.appRelease,
      env: appEnv.appEnv,
      ...getClientContextTags(),
      ...tags
    }),
    at: new Date().toISOString(),
    path: window.location.pathname,
    href: window.location.href
  };

  if (!endpoint) {
    if (appEnv.appEnv !== "production") {
      console.debug("[metric]", payload);
    }
    return;
  }

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // Fallback to fetch below.
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {
    // Silent by design: observability must not break UX.
  });
}

export function markProductNavigationStart(slug: string) {
  const data: PendingNavigationMark = {
    slug,
    ts: Date.now()
  };

  try {
    sessionStorage.setItem(PDP_NAV_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures.
  }
}

export function consumeProductNavigationStart(slug: string): number | null {
  try {
    const raw = sessionStorage.getItem(PDP_NAV_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    sessionStorage.removeItem(PDP_NAV_STORAGE_KEY);
    const parsed = JSON.parse(raw) as PendingNavigationMark;

    if (parsed.slug !== slug || !Number.isFinite(parsed.ts)) {
      return null;
    }

    const delta = Date.now() - parsed.ts;
    return delta >= 0 ? delta : null;
  } catch {
    return null;
  }
}
