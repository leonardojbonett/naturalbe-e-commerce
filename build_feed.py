#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build Google Merchant Center feed from productos.json with enrichment.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BASE_DIR / "productos.json"
FALLBACK_INPUT = BASE_DIR / "static" / "data" / "productos.json"
OUTPUT_JSON = BASE_DIR / "productos_enriquecido.json"
OUTPUT_XML = BASE_DIR / "feed-google.xml"

G_NS = "http://base.google.com/ns/1.0"


def load_products() -> List[Dict[str, Any]]:
    if DEFAULT_INPUT.exists():
        input_path = DEFAULT_INPUT
    elif FALLBACK_INPUT.exists():
        input_path = FALLBACK_INPUT
    else:
        raise FileNotFoundError(
            f"No se encontró productos.json en {DEFAULT_INPUT} ni en {FALLBACK_INPUT}"
        )
    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("El JSON de entrada debe ser un array de productos.")
    print(f"Usando input: {input_path}")
    return data


def collapse_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def remove_brand_prefix(name: str, brand: Optional[str]) -> str:
    if not brand:
        return name
    pattern = re.compile(rf"^{re.escape(brand)}[\s\-–:]+", re.IGNORECASE)
    return pattern.sub("", name).strip()


def strip_redundancies(name: str) -> str:
    # Remove common redundancy tokens like "serv", "serv.", "servicios"
    name = re.sub(r"\bserv(?:\.|icios)?\b", "", name, flags=re.IGNORECASE)
    name = re.sub(r"\s+-\s+", " ", name)
    return collapse_spaces(name)


def remove_presentation_tokens(name: str) -> str:
    # Remove common presentation tokens (lb, serv, cápsulas, g, kg, ml)
    patterns = [
        r"\b\d+\s*lb\b",
        r"\b\d+\s*serv\b",
        r"\b\d+\s*capsulas\b",
        r"\b\d+\s*cápsulas\b",
        r"\b\d+\s*gr?\b",
        r"\b\d+\s*kg\b",
        r"\b\d+\s*ml\b",
    ]
    for p in patterns:
        name = re.sub(p, "", name, flags=re.IGNORECASE)
    return collapse_spaces(name)


def normalize_name_base(nombre: str, marca: Optional[str]) -> str:
    base = remove_brand_prefix(nombre, marca)
    base = strip_redundancies(base)
    base = remove_presentation_tokens(base)
    return collapse_spaces(base)


PRESENTACION_TOKENS = [
    "0.5 lb",
    "1 lb",
    "2 lb",
    "3 lb",
    "4 lb",
    "5 lb",
    "6 lb",
    "10 lb",
    "12 lb",
    "20 lb",
    "22 serv",
    "30 serv",
    "40 serv",
    "60 serv",
    "65 serv",
    "90 serv",
    "100 serv",
    "120 serv",
    "150 serv",
    "200 serv",
    "250 g",
    "300 g",
    "400 g",
    "500 g",
    "750 g",
    "1 kg",
    "2 kg",
    "3 kg",
    "10 ml",
    "30 ml",
    "60 ml",
    "120 ml",
    "180 ml",
    "30 caps",
    "60 caps",
    "90 caps",
    "120 caps",
    "180 caps",
    "30 cápsulas",
    "60 cápsulas",
    "90 cápsulas",
    "120 cápsulas",
    "180 cápsulas",
    "30 tabletas",
    "60 tabletas",
    "90 tabletas",
    "120 tabletas",
]


def find_presentacion_normalizada(nombre: str, presentacion: Optional[str]) -> Optional[str]:
    haystack = f"{nombre} {presentacion or ''}".lower()
    # Prefer longest tokens first to avoid partial matches (e.g., "12 lb" vs "2 lb")
    for token in sorted(PRESENTACION_TOKENS, key=len, reverse=True):
        if re.search(rf"\\b{re.escape(token)}\\b", haystack):
            return token
    # Fallback regex capture common patterns
    match = re.search(
        r"\b(\d+(?:[.,]\d+)?)\s*(lb|kg|g|ml|capsulas|cápsulas|caps|tabletas|tabs|serv)\b",
        haystack,
    )
    if match:
        qty = match.group(1).replace(",", ".")
        unit = match.group(2)
        unit_map = {
            "capsulas": "caps",
            "cápsulas": "caps",
            "tabs": "tabletas",
        }
        unit = unit_map.get(unit, unit)
        return f"{qty} {unit}".strip()
    return None


def detect_tipo_producto(nombre: str, tags: List[str]) -> str:
    haystack = " ".join([nombre] + tags).lower()
    if re.search(r"\b(whey|prote[ií]na)\b", haystack):
        return "Proteína Whey"
    if re.search(r"\b(creatine|creatina)\b", haystack):
        return "Creatina"
    if re.search(r"\b(amino|aminoac[ií]dos)\b", haystack):
        return "Aminoácidos"
    return "Suplemento"


FLAVOR_MAP = {
    "vainilla": "Vainilla",
    "vanilla": "Vainilla",
    "chocolate": "Chocolate",
    "fresa": "Fresa",
    "strawberry": "Fresa",
    "cookies": "Cookies & Cream",
    "cream": "Cookies & Cream",
    "galleta": "Cookies & Cream",
    "banana": "Banano",
    "banano": "Banano",
    "berry": "Frutos rojos",
    "frutos": "Frutos rojos",
    "mango": "Mango",
    "limon": "Limón",
    "limón": "Limón",
    "orange": "Naranja",
    "naranja": "Naranja",
    "uva": "Uva",
    "grape": "Uva",
    "caramelo": "Caramelo",
    "caramel": "Caramelo",
    "mocha": "Mocha",
    "cafe": "Café",
    "café": "Café",
    "coffee": "Café",
    "mani": "Maní",
    "maní": "Maní",
    "peanut": "Maní",
    "coco": "Coco",
    "coconut": "Coco",
    "menta": "Menta",
    "mint": "Menta",
    "sin sabor": "Sin sabor",
    "unflavored": "Sin sabor",
    "natural": "Natural",
}


def detect_flavor(nombre: str, slug: str) -> Optional[str]:
    haystack = f"{nombre} {slug}".lower()
    for key, value in FLAVOR_MAP.items():
        if key in haystack:
            return value
    return None


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[áàäâ]", "a", text)
    text = re.sub(r"[éèëê]", "e", text)
    text = re.sub(r"[íìïî]", "i", text)
    text = re.sub(r"[óòöô]", "o", text)
    text = re.sub(r"[úùüû]", "u", text)
    text = re.sub(r"ñ", "n", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def strip_flavor_tokens(text: str) -> str:
    for key in FLAVOR_MAP.keys():
        text = re.sub(rf"\b{re.escape(key)}\b", "", text, flags=re.IGNORECASE)
    return collapse_spaces(text)


def core_key(nombre: str, marca: Optional[str], slug: str, tipo: str) -> str:
    base = normalize_name_base(nombre, marca)
    base = remove_presentation_tokens(base)
    base = remove_brand_prefix(base, marca)
    base = strip_redundancies(base)
    base = strip_flavor_tokens(base)
    if base:
        return slugify(f"{marca or ''} {base} {tipo}".strip())
    return slugify(f"{marca or ''} {slug or nombre} {tipo}".strip())


def tipo_beneficio(tipo: str) -> str:
    if tipo == "Proteína Whey":
        return "Apoya la recuperación muscular y el aporte de proteína diario."
    if tipo == "Creatina":
        return "Apoya el rendimiento en ejercicios de alta intensidad y fuerza."
    if tipo == "Aminoácidos":
        return "Apoya la ingesta de aminoácidos, energía o hidratación según tu rutina."
    return "Apoya tu nutrición deportiva y hábitos diarios."


def build_description(
    nombre_base: str,
    marca: Optional[str],
    tipo: str,
    beneficios_bullet: List[str],
    dosis_recomendada: Optional[str],
    presentacion: Optional[str],
) -> str:
    marca_txt = f" de {marca}" if marca else ""
    line1 = f"{nombre_base}{marca_txt}. {tipo_beneficio(tipo)}"
    bullets: List[str] = []
    for b in beneficios_bullet:
        clean = collapse_spaces(b.replace("\n", " "))
        if clean:
            bullets.append(clean)
    if dosis_recomendada:
        bullets.append(f"Uso sugerido: {collapse_spaces(dosis_recomendada)}")
    if presentacion:
        bullets.append(f"Presentación: {collapse_spaces(presentacion)}")
    bullets.append("Compra online con envío en Colombia.")
    # Ensure 3–5 bullets
    bullets = bullets[:5]
    if len(bullets) < 3:
        bullets.append("Ideal para complementar una rutina activa.")
    legal = "Este producto no sustituye una alimentación balanceada."

    parts = [line1, ""]
    parts.extend([f"- {b}" for b in bullets])
    parts.append("")
    parts.append(legal)
    description = "\n".join(parts).strip()
    return description[:4000]


def build_seo_description(tipo: str) -> str:
    base = f"{tipo} para tu rutina diaria. Compra online y recibe en Colombia."
    return trim_to_length(base, 160)


def trim_to_length(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    cutoff = text.rfind(" ", 0, max_len)
    if cutoff == -1:
        return text[:max_len]
    return text[:cutoff].rstrip()


def google_category_for(tipo: str) -> str:
    return "Food, Beverages & Tobacco > Food Items > Sports & Energy Nutrition"


def format_price(value: Any) -> Optional[str]:
    try:
        val = float(value)
    except (TypeError, ValueError):
        return None
    if val <= 0:
        return None
    if abs(val - int(val)) < 1e-6:
        return f"{int(val)} COP"
    return f"{val:.2f} COP"


def ensure_absolute_url(link: Optional[str], base_link: Optional[str]) -> Optional[str]:
    if not link:
        return None
    if link.startswith("http://") or link.startswith("https://"):
        return link
    if base_link and base_link.startswith("http"):
        # Use domain from base_link
        match = re.match(r"^(https?://[^/]+)", base_link)
        if match:
            return match.group(1) + link
    return link


@dataclass
class Enriched:
    product: Dict[str, Any]
    core_key: str
    presentacion_normalizada: Optional[str]
    tipo_producto: str
    flavor: Optional[str]


def enrich_products(products: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    enriched_meta: List[Enriched] = []
    for p in products:
        nombre = str(p.get("nombre", "")).strip()
        marca = p.get("marca")
        slug = str(p.get("slug", "")).strip()
        tags = p.get("tags") or []
        if not isinstance(tags, list):
            tags = [str(tags)]

        presentacion_norm = find_presentacion_normalizada(nombre, p.get("presentacion"))
        tipo = detect_tipo_producto(nombre, tags)
        flavor = detect_flavor(nombre, slug)
        ckey = core_key(nombre, marca, slug, tipo)

        enriched_meta.append(
            Enriched(
                product=p,
                core_key=ckey,
                presentacion_normalizada=presentacion_norm,
                tipo_producto=tipo,
                flavor=flavor,
            )
        )

    core_counts: Dict[str, int] = {}
    for e in enriched_meta:
        core_counts[e.core_key] = core_counts.get(e.core_key, 0) + 1

    enriched_products: List[Dict[str, Any]] = []
    stats = {
        "total": 0,
        "gtin": 0,
        "no_identifiers": 0,
        "grouped": 0,
    }

    for e in enriched_meta:
        p = dict(e.product)
        stats["total"] += 1

        nombre = str(p.get("nombre", "")).strip()
        marca = p.get("marca")
        tags = p.get("tags") or []
        if not isinstance(tags, list):
            tags = [str(tags)]

        nombre_base = normalize_name_base(nombre, marca)
        presentacion_norm = e.presentacion_normalizada
        tipo = e.tipo_producto

        title_parts = [marca, nombre_base, presentacion_norm]
        title = collapse_spaces(" ".join([t for t in title_parts if t]))
        titulo_google = f"{title} \u2013 {tipo}"

        descripcion_google = build_description(
            nombre_base=nombre_base or nombre,
            marca=marca,
            tipo=tipo,
            beneficios_bullet=p.get("beneficios_bullet") or [],
            dosis_recomendada=p.get("dosis_recomendada"),
            presentacion=p.get("presentacion"),
        )

        # Regla actual: no enviar GTIN/MPN, y marcar identifier_exists = "no"
        gtin = None
        mpn = None
        identifier_exists = "no"
        stats["no_identifiers"] += 1

        item_group_id = e.core_key if core_counts.get(e.core_key, 0) > 1 else None
        if item_group_id:
            stats["grouped"] += 1

        variant_attributes = {
            "size": presentacion_norm,
            "flavor": e.flavor,
        }

        seo_title_mejorado = f"{titulo_google} | Natural Be"
        seo_description_mejorado = build_seo_description(tipo)

        google_product_category = google_category_for(tipo)
        product_type = p.get("subcategoria") or p.get("categoria") or "suplementos"

        p.update(
            {
                "titulo_google": titulo_google,
                "descripcion_google": descripcion_google,
                "gtin": gtin,
                "mpn": mpn,
                "identifier_exists": identifier_exists,
                "item_group_id": item_group_id,
                "variant_attributes": variant_attributes,
                "seo_title_mejorado": seo_title_mejorado,
                "seo_description_mejorado": seo_description_mejorado,
                "google_product_category": google_product_category,
                "product_type": product_type,
                "presentacion_normalizada": presentacion_norm,
                "tipo_producto_normalizado": tipo,
            }
        )

        enriched_products.append(p)

    return enriched_products, stats


def build_feed(products: List[Dict[str, Any]]) -> ET.ElementTree:
    ET.register_namespace("g", G_NS)
    rss = ET.Element("rss", attrib={"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "Natural Be - Productos"
    ET.SubElement(channel, "link").text = "https://naturalbe.com.co"
    ET.SubElement(channel, "description").text = "Feed de productos para Google Merchant Center"

    for p in products:
        item = ET.SubElement(channel, "item")
        product_id = p.get("product_id") or p.get("id") or p.get("slug")
        title = p.get("titulo_google")
        description = p.get("descripcion_google")
        link = p.get("link")
        image_link = ensure_absolute_url(p.get("imagen_principal"), link)
        availability = "in stock" if p.get("disponible") and (p.get("quantity", 1) or 0) > 0 else "out of stock"
        price = format_price(p.get("precio"))
        sale_price = format_price(p.get("precio_oferta"))
        brand = p.get("marca")
        google_category = p.get("google_product_category")

        def add_g(tag: str, text: Optional[str]) -> None:
            if text is None:
                return
            if isinstance(text, str) and text.strip() == "":
                return
            ET.SubElement(item, f"{{{G_NS}}}{tag}").text = str(text)

        add_g("id", product_id)
        add_g("title", title)
        add_g("description", description)
        add_g("link", link)
        add_g("image_link", image_link)
        add_g("availability", availability)
        if price:
            add_g("price", price)
        if sale_price and price and sale_price != price:
            # Only include sale_price if lower than price
            try:
                if float(str(sale_price).split()[0]) < float(str(price).split()[0]):
                    add_g("sale_price", sale_price)
            except ValueError:
                pass
        add_g("brand", brand)
        add_g("condition", "new")
        add_g("google_product_category", google_category)
        add_g("product_type", p.get("product_type"))

        if p.get("item_group_id"):
            add_g("item_group_id", p.get("item_group_id"))
        # Regla actual: siempre sin identificadores
        add_g("identifier_exists", "no")

    return ET.ElementTree(rss)


def validate_required(products: List[Dict[str, Any]]) -> List[str]:
    errors = []
    for p in products:
        required = {
            "id": p.get("product_id") or p.get("id") or p.get("slug"),
            "title": p.get("titulo_google"),
            "description": p.get("descripcion_google"),
            "link": p.get("link"),
            "image_link": p.get("imagen_principal"),
            "price": p.get("precio"),
            "availability": p.get("disponible"),
        }
        missing = [k for k, v in required.items() if v in (None, "", [])]
        if missing:
            pid = p.get("product_id") or p.get("id") or p.get("slug") or "UNKNOWN"
            errors.append(f"{pid}: faltan {', '.join(missing)}")
    return errors


def main() -> None:
    products = load_products()
    enriched_products, stats = enrich_products(products)

    errors = validate_required(enriched_products)
    if errors:
        print("Validación: productos con campos faltantes:")
        for err in errors:
            print(f"- {err}")

    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(enriched_products, f, ensure_ascii=False, indent=2)

    feed_tree = build_feed(enriched_products)
    feed_tree.write(OUTPUT_XML, encoding="utf-8", xml_declaration=True)

    print("Resumen:")
    print(f"- # productos totales: {stats['total']}")
    print(f"- # con gtin: {stats['gtin']}")
    print(f"- # sin identifiers: {stats['no_identifiers']}")
    print(f"- # agrupados con item_group_id: {stats['grouped']}")


if __name__ == "__main__":
    main()

# README (cómo ejecutar)
# 1) Ejecuta: python build_feed.py
# 2) Salidas:
#    - productos_enriquecido.json
#    - feed-google.xml
