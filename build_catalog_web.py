from __future__ import annotations

import argparse
import datetime as dt
import html
from pathlib import Path

from data_loader import group_products_by_category, load_products


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generador de catalogo web estatico")
    parser.add_argument("--input", required=True, help="Ruta a products.json/products.csv")
    parser.add_argument("--output", default="catalogo/index.html", help="Ruta de salida HTML")
    parser.add_argument("--title", default="Catalogo Natural Be", help="Titulo de portada")
    parser.add_argument("--subtitle", default="Vitaminas y suplementos", help="Subtitulo")
    parser.add_argument("--brand", default="Natural Be", help="Marca")
    parser.add_argument("--include-categories", default="", help="Categorias a incluir separadas por coma")
    parser.add_argument("--exclude-categories", default="", help="Categorias a excluir separadas por coma")
    parser.add_argument("--sale-only", action="store_true", help="Solo productos en oferta")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    include_categories = _csv_to_set(args.include_categories)
    exclude_categories = _csv_to_set(args.exclude_categories)

    result = load_products(
        input_path=args.input,
        include_categories=include_categories or None,
        exclude_categories=exclude_categories or None,
        sale_only=args.sale_only,
    )

    grouped = group_products_by_category(result.products)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    doc = _build_html(
        grouped,
        title=args.title,
        subtitle=args.subtitle,
        brand=args.brand,
    )
    output.write_text(doc, encoding="utf-8")
    print(f"Catalogo web generado: {output.resolve()}")
    print(f"Productos: {len(result.products)} | Categorias: {len(grouped)}")
    return 0


def _build_html(grouped: dict[str, list], title: str, subtitle: str, brand: str) -> str:
    date_text = dt.date.today().strftime("%d/%m/%Y")
    nav_links = "".join(
        f'<a href="#{_slug(cat)}">{html.escape(cat)}</a>' for cat in grouped.keys()
    )

    sections = []
    for category, products in grouped.items():
        cards = []
        for p in products:
            image_src = _pick_image_src(p.image_url)
            benefit_1 = html.escape((p.short_benefits[0] if p.short_benefits else "Apoyo nutricional diario")[:80])
            benefit_2 = html.escape((p.short_benefits[1] if len(p.short_benefits) > 1 else "Suplemento de uso diario")[:80])
            price = _fmt_money(p.price_cop)
            if p.has_sale:
                sale = _fmt_money(p.sale_price_cop)
                price_html = f'<div class="price"><span class="sale">{sale}</span><span class="old">{price}</span></div>'
            else:
                price_html = f'<div class="price"><span class="normal">{price}</span></div>'

            cards.append(
                f'''
                <article class="card">
                  <img src="{html.escape(image_src)}" alt="{html.escape(p.name)}" loading="lazy" onerror="this.src='/static/img/placeholder.webp'">
                  <h3>{html.escape(p.name)}</h3>
                  <p class="meta">{html.escape(p.brand)} · {html.escape(p.presentation)}</p>
                  <ul>
                    <li>{benefit_1}</li>
                    <li>{benefit_2}</li>
                  </ul>
                  {price_html}
                  <div class="actions">
                    <a class="btn" target="_blank" href="{html.escape(p.product_url)}">Ver producto</a>
                    <a class="btn wa" target="_blank" href="https://wa.me/?text={html.escape(p.name)}%20{html.escape(p.product_url)}">WhatsApp</a>
                  </div>
                </article>
                '''
            )

        sections.append(
            f'''
            <section id="{_slug(category)}" class="category">
              <h2>{html.escape(category)}</h2>
              <div class="grid">{''.join(cards)}</div>
            </section>
            '''
        )

    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>
:root{{--bg:#f5f8f6;--paper:#fff;--ink:#102018;--muted:#4f6459;--line:#d5e1db;--green:#1b7a44;}}
*{{box-sizing:border-box}}body{{margin:0;font-family:Segoe UI,Arial,sans-serif;background:var(--bg);color:var(--ink)}}
.top{{position:sticky;top:0;z-index:10;background:#ffffffde;backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}}
.top strong{{font-size:14px}}.top nav{{display:flex;gap:8px;flex-wrap:wrap}}.top a{{text-decoration:none;color:var(--muted);font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:#fff}}
.hero{{padding:34px 16px 20px;max-width:1200px;margin:0 auto}}.hero h1{{margin:0 0 4px;font-size:34px}}.hero p{{margin:0;color:var(--muted)}}
.wrap{{max-width:1200px;margin:0 auto;padding:0 16px 40px}}
.category{{margin-top:24px}}.category h2{{margin:0 0 10px;font-size:24px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
.card{{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}}
.card img{{width:100%;height:190px;object-fit:contain;background:#fff;border:1px solid #edf2ee;border-radius:10px}}
.card h3{{margin:0;font-size:16px;line-height:1.25;min-height:40px}}
.meta{{margin:0;color:var(--muted);font-size:13px}}
ul{{margin:0;padding-left:18px;color:#2d3f35;font-size:13px;min-height:50px}}
.price{{display:flex;align-items:center;gap:8px}}.sale{{color:var(--green);font-weight:700}}.old{{color:#6b6b6b;text-decoration:line-through}}.normal{{font-weight:700}}
.actions{{display:flex;gap:8px;margin-top:auto}}.btn{{flex:1;text-align:center;text-decoration:none;padding:8px 10px;border-radius:8px;border:1px solid var(--line);color:var(--ink);font-weight:600;font-size:13px}}
.btn.wa{{background:#e9f7ef;border-color:#c8e7d4}}
footer{{padding:24px 16px 34px;color:var(--muted);text-align:center;font-size:13px}}
</style>
</head>
<body>
<header class="top"><strong>{html.escape(brand)}</strong><nav>{nav_links}</nav></header>
<section class="hero"><h1>{html.escape(title)}</h1><p>{html.escape(subtitle)} · {date_text}</p></section>
<main class="wrap">{''.join(sections)}</main>
<footer>Suplemento dietario. No es un medicamento.</footer>
</body></html>'''


def _pick_image_src(value: str | None) -> str:
    if not value:
        return "/static/img/placeholder.webp"
    text = str(value).strip()
    if not text or "placeholder" in text.casefold():
        return "/static/img/placeholder.webp"
    if text.startswith("http://") or text.startswith("https://") or text.startswith("/"):
        return text
    return "/" + text.replace("\\", "/").lstrip("/")


def _fmt_money(value: int | None) -> str:
    if value is None:
        return "-"
    return f"${value:,.0f}".replace(",", ".")


def _csv_to_set(raw: str) -> set[str]:
    return {item.strip() for item in raw.split(",") if item.strip()}


def _slug(text: str) -> str:
    out = []
    for ch in text.lower().strip():
        if ch.isalnum():
            out.append(ch)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-") or "cat"


if __name__ == "__main__":
    raise SystemExit(main())
