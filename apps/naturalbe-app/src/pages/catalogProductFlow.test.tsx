import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogPage } from "./CatalogPage";
import { ProductPage } from "./ProductPage";
import { useCatalogFiltersStore } from "../features/catalog/useCatalogFiltersStore";

const mockProducts = [
  {
    id: "p1",
    slug: "vitamina-c-1000",
    name: "Vitamina C 1000",
    brand: "Natural Be",
    category: "Vitaminas",
    price: 40000,
    offerPrice: null,
    imageUrl: "https://example.com/p1.webp",
    shortDescription: "Descripcion corta 1",
    description: "Descripcion larga 1",
    badge: null,
    featured: true,
    isAvailable: true
  },
  {
    id: "p2",
    slug: "vitamina-d3",
    name: "Vitamina D3",
    brand: "Natural Be",
    category: "Vitaminas",
    price: 50000,
    offerPrice: null,
    imageUrl: "https://example.com/p2.webp",
    shortDescription: "Descripcion corta 2",
    description: "Descripcion larga 2",
    badge: null,
    featured: false,
    isAvailable: true
  }
];

vi.mock("../features/catalog/catalogApi", () => ({
  fetchCatalogProducts: vi.fn(async () => mockProducts),
  fetchCatalogProductBySlug: vi.fn(async (slug: string) =>
    mockProducts.find((product) => product.slug === slug) ?? null
  ),
  prefetchCatalogProductBySlug: vi.fn()
}));

vi.mock("../features/social/components/InstagramFeed", () => ({
  InstagramFeed: () => null
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-probe">{`${location.pathname}${location.search}`}</output>;
}

describe("catalog-product flow", () => {
  beforeEach(() => {
    useCatalogFiltersStore.getState().reset();
    window.sessionStorage.clear();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    window.scrollTo = vi.fn();
  });

  it("keeps catalog query params when returning from product page", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/?category=Vitaminas&page=2"]}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    );

    const productLinks = await screen.findAllByRole("link", {
      name: "Ver detalle de Vitamina C 1000"
    });
    await user.click(productLinks[0]);
    await screen.findByRole("heading", { name: "Vitamina C 1000" });

    await user.click(screen.getByRole("link", { name: "Volver al catalogo" }));

    await waitFor(() => {
      expect(screen.getByTestId("location-probe")).toHaveTextContent(
        "/?category=Vitaminas&page=2"
      );
    });
  });

  it("restores saved scroll position when coming back to catalog", async () => {
    window.sessionStorage.setItem("catalog:scroll:path", "/?category=Vitaminas&page=2");
    window.sessionStorage.setItem("catalog:scroll:y", "640");
    window.sessionStorage.setItem("catalog:scroll:pending", "1");
    window.sessionStorage.setItem("catalog:scroll:at", String(Date.now()));

    render(
      <MemoryRouter initialEntries={["/?category=Vitaminas&page=2"]}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(window.sessionStorage.getItem("catalog:scroll:pending")).toBeNull();
    });

    await waitFor(() => {
      const calls = (window.scrollTo as unknown as { mock: { calls: Array<[ScrollToOptions]> } }).mock
        .calls;
      expect(calls.some((call) => call[0]?.top === 640)).toBe(true);
    });
  });
});
