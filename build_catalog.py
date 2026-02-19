from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from data_loader import group_products_by_category, load_products
from image_cache import ImageCache
from pdf_layout import CatalogOptions, build_catalog_pdf


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generador de catalogo PDF para Natural Be")
    parser.add_argument("--input", required=True, help="Ruta del archivo de entrada (.json o .csv)")
    parser.add_argument("--output", default="catalogo.pdf", help="Ruta del PDF de salida")
    parser.add_argument("--columns", type=int, default=2, choices=[2, 3], help="Columnas de la grilla de productos")
    parser.add_argument("--currency", default="COP", help="Moneda para precios (por defecto: COP)")
    parser.add_argument("--include-categories", default="", help="Categorias a incluir, separadas por coma")
    parser.add_argument("--exclude-categories", default="", help="Categorias a excluir, separadas por coma")
    parser.add_argument("--sale-only", action="store_true", help="Mostrar solo productos en oferta")
    parser.add_argument("--cache", default="cache_images", help="Directorio local para cache de imagenes")
    parser.add_argument("--download-images", action="store_true", help="Resolver y descargar imagenes reales desde product_url")
    parser.add_argument("--workers", type=int, default=10, help="Hilos para descarga concurrente de imagenes")
    parser.add_argument("--report-missing", default="report_missing_images.csv", help="Reporte CSV de imagenes faltantes")
    parser.add_argument("--report-quality", default="report_image_quality.csv", help="Reporte CSV de calidad de imagenes")
    parser.add_argument("--report-resolution", default="report_image_resolution.csv", help="Reporte CSV de trazabilidad de resolucion")
    parser.add_argument("--image-overrides", default="", help="JSON de overrides por SKU/slug/url para imagen exacta")
    parser.add_argument("--quality-min-width", type=int, default=500, help="Ancho minimo de calidad para auditoria")
    parser.add_argument("--quality-min-height", type=int, default=500, help="Alto minimo de calidad para auditoria")
    parser.add_argument("--quality-min-kb", type=int, default=20, help="Peso minimo (KB) de calidad para auditoria")
    parser.add_argument(
        "--quality-max-aspect-ratio",
        type=float,
        default=2.8,
        help="Aspect ratio maximo permitido (max(w/h,h/w)) en auditoria",
    )
    parser.add_argument("--logo-path", default="", help="Ruta opcional del logo para portada")
    parser.add_argument("--title", default="Catalogo Natural Be", help="Titulo de portada")
    parser.add_argument("--subtitle", default="Vitaminas y suplementos", help="Subtitulo de portada")
    parser.add_argument("--brand", default="Natural Be", help="Nombre de marca para header/footer")
    parser.add_argument("--no-qr", action="store_true", help="Desactiva QR en tarjetas")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    include_categories = _csv_to_set(args.include_categories)
    exclude_categories = _csv_to_set(args.exclude_categories)

    try:
        result = load_products(
            input_path=args.input,
            include_categories=include_categories or None,
            exclude_categories=exclude_categories or None,
            sale_only=args.sale_only,
        )
    except Exception as exc:
        logging.error("No fue posible cargar productos: %s", exc)
        return 1

    if result.warnings:
        for warning in result.warnings:
            logging.warning(warning)

    if not result.products:
        logging.error("No hay productos validos despues de aplicar validaciones/filtros.")
        return 1

    if args.download_images:
        from fetch_images import ProductImageResolver

        resolver = ProductImageResolver(
            cache_dir=args.cache,
            max_workers=args.workers,
            quality_min_width=args.quality_min_width,
            quality_min_height=args.quality_min_height,
            quality_min_kb=args.quality_min_kb,
            quality_max_aspect_ratio=args.quality_max_aspect_ratio,
            overrides_path=args.image_overrides or None,
        )
        missing = resolver.resolve_all(
            result.products,
            report_path=args.report_missing,
            quality_report_path=args.report_quality,
            resolution_report_path=args.report_resolution,
            show_progress=True,
        )
        logging.info("Imagenes sin resolver: %s", len(missing))
        quality_review = sum(1 for row in resolver.quality_records if row.status != "ok")
        logging.info("Imagenes con observaciones de calidad: %s", quality_review)
    else:
        logging.info("Descarga de imagenes desactivada (--download-images no especificado).")

    grouped = group_products_by_category(result.products)
    image_cache = ImageCache(cache_dir=args.cache)

    options = CatalogOptions(
        columns=args.columns,
        currency=args.currency,
        title=args.title,
        subtitle=args.subtitle,
        brand_name=args.brand,
        logo_path=args.logo_path or None,
        include_qr=not args.no_qr,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        build_catalog_pdf(
            products_by_category=grouped,
            output_path=str(output_path),
            image_cache=image_cache,
            options=options,
        )
    except Exception as exc:
        logging.exception("Error generando PDF: %s", exc)
        return 1

    logging.info("Catalogo generado: %s", output_path.resolve())
    logging.info("Productos incluidos: %s", len(result.products))
    logging.info("Categorias incluidas: %s", len(grouped))
    return 0


def _csv_to_set(raw: str) -> set[str]:
    return {item.strip() for item in raw.split(",") if item.strip()}


if __name__ == "__main__":
    sys.exit(main())
