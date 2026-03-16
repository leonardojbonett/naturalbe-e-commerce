import { beforeEach, describe, expect, it } from "vitest";
import { applySeoMeta } from "./meta";

describe("applySeoMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  it("writes canonical, og, twitter, hreflang and robots tags", () => {
    applySeoMeta({
      title: "Producto X | Natural Be",
      description: "Descripcion corta del producto X",
      url: "https://naturalbe.com.co/producto/producto-x",
      image: "https://naturalbe.com.co/static/img/producto-x.jpg",
      type: "product",
      indexable: true
    });

    const canonical = document.head.querySelector('link[rel="canonical"]');
    const altEsCo = document.head.querySelector('link[rel="alternate"][hreflang="es-CO"]');
    const altEs = document.head.querySelector('link[rel="alternate"][hreflang="es"]');
    const altDefault = document.head.querySelector(
      'link[rel="alternate"][hreflang="x-default"]'
    );
    const robots = document.head.querySelector('meta[name="robots"]');
    const ogType = document.head.querySelector('meta[property="og:type"]');
    const twitterCard = document.head.querySelector('meta[name="twitter:card"]');

    expect(document.title).toBe("Producto X | Natural Be");
    expect(canonical).toHaveAttribute("href", "https://naturalbe.com.co/producto/producto-x");
    expect(altEsCo).toHaveAttribute("href", "https://naturalbe.com.co/producto/producto-x");
    expect(altEs).toHaveAttribute("href", "https://naturalbe.com.co/producto/producto-x");
    expect(altDefault).toHaveAttribute("href", "https://naturalbe.com.co/producto/producto-x");
    expect(robots).toHaveAttribute(
      "content",
      "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
    );
    expect(ogType).toHaveAttribute("content", "product");
    expect(twitterCard).toHaveAttribute("content", "summary_large_image");
  });
});
