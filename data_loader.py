from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse


DEFAULT_BRAND = "Natural Be"
DEFAULT_CATEGORY = "General"
DEFAULT_AVAILABILITY = "unknown"


@dataclass(slots=True)
class Product:
    sku: str
    name: str
    brand: str
    category: str
    price_cop: int
    sale_price_cop: int | None
    availability: str
    short_benefits: list[str]
    presentation: str
    image_url: str | None
    product_url: str
    resolved_image_path: str | None = None
    slug: str | None = None

    @property
    def has_sale(self) -> bool:
        return self.sale_price_cop is not None and self.sale_price_cop < self.price_cop


@dataclass(slots=True)
class LoadResult:
    products: list[Product]
    warnings: list[str]


def load_products(
    input_path: str | Path,
    include_categories: set[str] | None = None,
    exclude_categories: set[str] | None = None,
    sale_only: bool = False,
) -> LoadResult:
    path = Path(input_path)
    rows = _read_rows(path)

    warnings: list[str] = []
    products: list[Product] = []

    for index, raw in enumerate(rows, start=1):
        product, product_warnings = _normalize_product(raw, index=index)
        warnings.extend(product_warnings)
        if product is None:
            continue
        products.append(product)

    products = _apply_filters(
        products,
        include_categories=include_categories,
        exclude_categories=exclude_categories,
        sale_only=sale_only,
    )
    products = _sort_products(products)
    return LoadResult(products=products, warnings=warnings)


def group_products_by_category(products: Iterable[Product]) -> dict[str, list[Product]]:
    grouped: dict[str, list[Product]] = {}
    for product in products:
        grouped.setdefault(product.category, []).append(product)
    return dict(sorted(grouped.items(), key=lambda item: item[0].casefold()))


def _read_rows(path: Path) -> list[dict[str, object]]:
    if not path.exists():
        raise FileNotFoundError(f"No se encontro el archivo de entrada: {path}")

    if path.suffix.lower() == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError("El JSON de productos debe ser un arreglo de objetos.")
        return [row for row in payload if isinstance(row, dict)]

    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            return [dict(row) for row in reader]

    raise ValueError("Formato no soportado. Usa .json o .csv")


def _normalize_product(raw: dict[str, object], index: int) -> tuple[Product | None, list[str]]:
    warnings: list[str] = []

    sku = (
        _as_str(raw.get("sku"))
        or _as_str(raw.get("product_id"))
        or _as_str(raw.get("id"))
        or f"NO-SKU-{index:04d}"
    )
    name = _as_str(raw.get("name")) or _as_str(raw.get("nombre")) or _as_str(raw.get("title"))

    price_value = raw.get("price_cop", raw.get("price", raw.get("precio")))
    price_cop = _to_int(price_value)

    product_url = _as_str(raw.get("product_url", raw.get("url", raw.get("link"))))

    if not name:
        warnings.append(f"[{sku}] Producto omitido: falta campo critico 'name'.")
    if price_cop is None:
        warnings.append(f"[{sku}] Producto omitido: falta campo critico 'price_cop'.")
    if not product_url:
        warnings.append(f"[{sku}] Producto omitido: falta campo critico 'product_url'.")

    if not name or price_cop is None or not product_url:
        return None, warnings

    brand = _as_str(raw.get("brand")) or _as_str(raw.get("marca")) or DEFAULT_BRAND
    category = (
        _as_str(raw.get("category"))
        or _as_str(raw.get("categoria"))
        or _as_str(raw.get("subcategoria"))
        or DEFAULT_CATEGORY
    )
    availability = _to_availability(raw)
    presentation = (
        _as_str(raw.get("presentation"))
        or _as_str(raw.get("presentacion"))
        or _as_str(raw.get("presentacion_unidades"))
        or "Presentacion no especificada"
    )
    image_url = (
        _as_str(raw.get("image_url", raw.get("image")))
        or _as_str(raw.get("imagen_principal"))
        or _as_str(raw.get("imagen_principal_webp"))
    )

    sale_price = _to_int(raw.get("sale_price_cop", raw.get("sale_price", raw.get("precio_oferta"))))
    if sale_price is not None and sale_price >= price_cop:
        sale_price = None

    short_benefits = (
        _to_benefits(raw.get("short_benefits"))
        or _to_benefits(raw.get("beneficios_bullet"))
        or _to_benefits(raw.get("descripcion_corta"))
    )
    if not short_benefits:
        short_benefits = ["Apoyo nutricional diario", "Suplemento de uso diario"]

    product = Product(
        sku=sku,
        name=name,
        brand=brand,
        category=category,
        price_cop=price_cop,
        sale_price_cop=sale_price,
        availability=availability,
        short_benefits=short_benefits,
        presentation=presentation,
        image_url=image_url,
        product_url=product_url,
        slug=_product_slug(raw, product_url),
    )
    return product, warnings


def _apply_filters(
    products: list[Product],
    include_categories: set[str] | None,
    exclude_categories: set[str] | None,
    sale_only: bool,
) -> list[Product]:
    include_norm = {c.casefold() for c in include_categories or set()}
    exclude_norm = {c.casefold() for c in exclude_categories or set()}

    filtered: list[Product] = []
    for product in products:
        category_norm = product.category.casefold()
        if include_norm and category_norm not in include_norm:
            continue
        if exclude_norm and category_norm in exclude_norm:
            continue
        if sale_only and not product.has_sale:
            continue
        filtered.append(product)
    return filtered


def _sort_products(products: list[Product]) -> list[Product]:
    def availability_rank(value: str) -> int:
        if value == "in_stock":
            return 0
        if value == "limited":
            return 1
        if value in {"out_of_stock", "unavailable"}:
            return 2
        return 3

    return sorted(
        products,
        key=lambda p: (p.category.casefold(), availability_rank(p.availability), p.name.casefold()),
    )


def _to_benefits(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item.strip() for item in value if _as_str(item)]
    text = _as_str(value)
    if not text:
        return []
    if "|" in text:
        parts = text.split("|")
    elif ";" in text:
        parts = text.split(";")
    else:
        parts = text.split(",")
    return [part.strip() for part in parts if part.strip()]


def _as_str(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_int(value: object) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(round(value))

    text = str(value).strip().replace("$", "")
    text = text.replace("COP", "").replace("cop", "")
    text = text.replace(".", "").replace(",", "")

    if not text:
        return None
    if text.isdigit() or (text.startswith("-") and text[1:].isdigit()):
        return int(text)
    return None


def _to_availability(raw: dict[str, object]) -> str:
    if raw.get("availability") is not None:
        value = _as_str(raw.get("availability"))
        if value:
            return value.lower()

    disponible = raw.get("disponible")
    if isinstance(disponible, bool):
        return "in_stock" if disponible else "out_of_stock"

    text = _as_str(disponible)
    if text:
        lower = text.casefold()
        if lower in {"true", "1", "si", "yes", "in_stock", "available"}:
            return "in_stock"
        if lower in {"false", "0", "no", "out_of_stock", "unavailable"}:
            return "out_of_stock"

    return DEFAULT_AVAILABILITY


def _product_slug(raw: dict[str, object], product_url: str) -> str | None:
    slug = _as_str(raw.get("slug"))
    if slug:
        return slug
    parsed = urlparse(product_url)
    path = parsed.path.strip("/")
    if not path:
        return None
    last = path.split("/")[-1]
    if last.endswith(".html"):
        last = last[:-5]
    return last or None
