import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appEnv } from "../../core/config/env";
import { __resetCatalogCacheForTests, fetchCatalogProducts } from "./catalogApi";

beforeEach(() => {
  __resetCatalogCacheForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  appEnv.allowMockCatalogFallback = true;
});

describe("fetchCatalogProducts", () => {
  it("falla en production cuando no hay origen real disponible", async () => {
    appEnv.allowMockCatalogFallback = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      })
    );

    await expect(fetchCatalogProducts()).rejects.toThrow(
      "No se pudo cargar el catalogo desde origenes reales."
    );
  });

  it("usa fallback mock en development cuando no hay origen real disponible", async () => {
    appEnv.allowMockCatalogFallback = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      })
    );

    const result = await fetchCatalogProducts();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.id).toBe("nb-1");
  });
});
