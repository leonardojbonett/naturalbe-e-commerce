from __future__ import annotations

import csv
import hashlib
import json
import logging
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from data_loader import Product

try:
    from PIL import Image, UnidentifiedImageError
except ImportError:  # pragma: no cover
    Image = None
    UnidentifiedImageError = Exception

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover
    tqdm = None


PLACEHOLDER_TOKENS = {
    "placeholder",
    "no-image",
    "noimage",
    "default",
    "spacer",
}

GENERIC_TOKENS = {
    "banner",
    "hero",
    "logo",
    "icon",
    "sprite",
    "avatar",
    "thumbnail",
    "thumb",
    "og-naturalbe",
}


@dataclass(slots=True)
class MissingImageRecord:
    sku: str
    product_url: str
    reason: str


@dataclass(slots=True)
class ImageQualityRecord:
    sku: str
    product_url: str
    image_path: str
    width: int
    height: int
    file_size_kb: float
    status: str
    issues: str


@dataclass(slots=True)
class ImageResolutionRecord:
    sku: str
    product_url: str
    status: str
    resolved_image_path: str


class ProductImageResolver:
    def __init__(
        self,
        cache_dir: str | Path = "cache_images",
        max_workers: int = 10,
        timeout: float = 15.0,
        retries: int = 3,
        backoff_sec: float = 0.8,
        min_bytes: int = 10_240,
        quality_min_width: int = 500,
        quality_min_height: int = 500,
        quality_min_kb: int = 20,
        quality_max_aspect_ratio: float = 2.8,
        project_root: str | Path = ".",
        overrides_path: str | Path | None = None,
    ) -> None:
        self.cache_dir = Path(cache_dir)
        self.max_workers = max(1, max_workers)
        self.timeout = timeout
        self.retries = retries
        self.backoff_sec = backoff_sec
        self.min_bytes = min_bytes
        self.quality_min_width = quality_min_width
        self.quality_min_height = quality_min_height
        self.quality_min_kb = quality_min_kb
        self.quality_max_aspect_ratio = quality_max_aspect_ratio
        self.project_root = Path(project_root).resolve()
        self.overrides = self._load_overrides(overrides_path)

        self.html_dir = self.cache_dir / "html"
        self.raw_dir = self.cache_dir / "raw"
        self.norm_dir = self.cache_dir / "normalized"
        self.html_dir.mkdir(parents=True, exist_ok=True)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.norm_dir.mkdir(parents=True, exist_ok=True)

        self._lock = threading.Lock()
        self._download_locks: dict[str, threading.Lock] = {}
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/123.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }
        )
        self.quality_records: list[ImageQualityRecord] = []
        self.resolution_records: list[ImageResolutionRecord] = []
        self.local_image_index = self._build_local_image_index()

    def resolve_all(
        self,
        products: Iterable[Product],
        report_path: str | Path = "report_missing_images.csv",
        quality_report_path: str | Path | None = "report_image_quality.csv",
        resolution_report_path: str | Path | None = "report_image_resolution.csv",
        show_progress: bool = True,
    ) -> list[MissingImageRecord]:
        product_list = list(products)
        missing_records: list[MissingImageRecord] = []
        quality_records: list[ImageQualityRecord] = []
        resolution_records: list[ImageResolutionRecord] = []

        iterator = self._progress_wrapper(product_list, show_progress=show_progress)
        futures = {}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            for product in iterator:
                futures[executor.submit(self._resolve_single, product)] = product

            completion = as_completed(futures)
            completion = self._progress_wrapper(completion, total=len(futures), show_progress=show_progress, desc="Descargando imagenes")
            for future in completion:
                product = futures[future]
                try:
                    resolved_path, reason = future.result()
                except Exception as exc:
                    resolved_path, reason = None, f"error inesperado: {exc}"

                product.resolved_image_path = resolved_path
                if not resolved_path:
                    missing_records.append(
                        MissingImageRecord(
                            sku=product.sku,
                            product_url=product.product_url,
                            reason=reason or "sin imagen valida",
                        )
                    )
                else:
                    quality_records.append(self._assess_quality(product, resolved_path))
                    resolution_records.append(
                        ImageResolutionRecord(
                            sku=product.sku,
                            product_url=product.product_url,
                            status=reason or "ok",
                            resolved_image_path=resolved_path,
                        )
                    )

        self._write_missing_report(report_path, missing_records)
        self.quality_records = quality_records
        self.resolution_records = resolution_records
        if quality_report_path:
            self._write_quality_report(quality_report_path, quality_records)
        if resolution_report_path:
            self._write_resolution_report(resolution_report_path, resolution_records)
        return missing_records

    def _resolve_single(self, product: Product) -> tuple[str | None, str]:
        sku_name = _safe_name(product.sku)
        direct_target = self.norm_dir / f"{sku_name}.jpg"
        if direct_target.exists() and direct_target.stat().st_size >= self.min_bytes:
            return str(direct_target), "cache_hit"

        override = self._find_override_image(product)
        if override:
            override_local = self._resolve_local_image_path(override)
            if override_local:
                normalized_override = self._normalize_image(override_local, target_path=direct_target)
                if normalized_override and Path(normalized_override).stat().st_size > 0:
                    return normalized_override, "override_local"
            normalized_override_url = _normalize_url(override, product.product_url)
            if normalized_override_url and not _looks_invalid_url(normalized_override_url):
                raw_path = self._download_image(normalized_override_url, referer=product.product_url)
                if raw_path:
                    normalized = self._normalize_image(raw_path, target_path=direct_target)
                    if normalized and Path(normalized).stat().st_size > 0:
                        return normalized, "override_url"

        local_path = self._resolve_local_image_path(product.image_url)
        if local_path is None:
            local_path = self._find_local_image_by_slug(product.slug)
        if local_path:
            normalized_local = self._normalize_image(local_path, target_path=direct_target)
            if normalized_local and Path(normalized_local).stat().st_size > 0:
                return normalized_local, "local_image"

        candidates = self._build_candidate_urls(product)
        if not candidates:
            return None, "no se encontraron candidatos de imagen"

        for candidate in candidates:
            if _looks_invalid_url(candidate):
                continue
            if _looks_generic_url(candidate):
                continue

            raw_path = self._download_image(candidate, referer=product.product_url)
            if not raw_path:
                continue

            normalized = self._normalize_image(raw_path, target_path=direct_target)
            if normalized:
                if Path(normalized).stat().st_size < self.min_bytes:
                    continue
                return normalized, "ok"

        fuzzy_local = self._find_fuzzy_local_image(product.slug, product.name)
        if fuzzy_local:
            normalized_fuzzy = self._normalize_image(fuzzy_local, target_path=direct_target)
            if normalized_fuzzy and Path(normalized_fuzzy).stat().st_size > 0:
                return normalized_fuzzy, "local_fuzzy"

        return None, "sin imagen valida tras fallbacks"

    def _build_candidate_urls(self, product: Product) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []

        def add(url: str | None) -> None:
            if not url:
                return
            normalized = _normalize_url(url, base_url=product.product_url)
            if not normalized:
                return
            if normalized in seen:
                return
            seen.add(normalized)
            ordered.append(normalized)

        # Prioriza imagen declarada en feed, luego scraping.
        add(product.image_url)

        html = self._fetch_html(product.product_url)
        soup = BeautifulSoup(html, "html.parser") if html else None

        # 1) OG image
        if soup:
            add(_meta_content(soup, attr_name="property", attr_value="og:image"))

        # 2) JSON-LD Product image
        if soup:
            for url in self._extract_jsonld_product_images(soup, product.product_url):
                add(url)

        # 3) Twitter image
        if soup:
            add(_meta_content(soup, attr_name="name", attr_value="twitter:image"))

        # 4) Selectores tipicos de imagen principal
        if soup:
            for url in self._extract_selector_images(soup, product.product_url):
                add(url)

        # 5) preload as=image
        if soup:
            for url in self._extract_preload_images(soup, product.product_url):
                add(url)
            for url in self._extract_broad_img_candidates(soup, product.product_url):
                add(url)

        if html:
            for url in self._extract_image_urls_from_text(html, product.product_url):
                add(url)

        return ordered

    def _fetch_html(self, product_url: str) -> str | None:
        key = hashlib.sha1(product_url.encode("utf-8")).hexdigest()
        cache_path = self.html_dir / f"{key}.html"
        if cache_path.exists() and cache_path.stat().st_size > 0:
            return cache_path.read_text(encoding="utf-8", errors="ignore")

        for attempt in range(1, self.retries + 1):
            try:
                resp = self.session.get(product_url, timeout=self.timeout)
                if resp.status_code >= 400:
                    raise requests.HTTPError(f"HTTP {resp.status_code}")
                text = resp.text
                if text:
                    cache_path.write_text(text, encoding="utf-8", errors="ignore")
                    return text
            except requests.RequestException:
                if attempt < self.retries:
                    time.sleep(self.backoff_sec * (2 ** (attempt - 1)))
                continue
        return None

    def _download_image(self, image_url: str, referer: str) -> Path | None:
        digest = hashlib.sha1(image_url.encode("utf-8")).hexdigest()
        ext = _extension_from_url(image_url)
        target = self.raw_dir / f"{digest}{ext}"

        if target.exists() and target.stat().st_size >= self.min_bytes:
            return target

        lock = self._get_lock(digest)
        with lock:
            if target.exists() and target.stat().st_size >= self.min_bytes:
                return target

            headers = {
                "Referer": referer,
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "User-Agent": self.session.headers["User-Agent"],
            }

            for attempt in range(1, self.retries + 1):
                try:
                    response = self.session.get(image_url, headers=headers, timeout=self.timeout, stream=True)
                    if response.status_code >= 400:
                        raise requests.HTTPError(f"HTTP {response.status_code}")

                    payload = response.content
                    if len(payload) < self.min_bytes:
                        raise ValueError("archivo menor a 10KB")

                    target.write_bytes(payload)
                    return target
                except Exception:
                    if attempt < self.retries:
                        time.sleep(self.backoff_sec * (2 ** (attempt - 1)))
                    continue
        return None

    def _normalize_image(self, raw_path: Path, target_path: Path) -> str | None:
        if Image is None:
            return str(raw_path)

        try:
            with Image.open(raw_path) as img:
                rgb = img.convert("RGB")
                rgb.save(target_path, format="JPEG", quality=90, optimize=True)
            return str(target_path)
        except (UnidentifiedImageError, OSError):
            return None

    def _extract_jsonld_product_images(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        found: list[str] = []

        for script in soup.select('script[type="application/ld+json"]'):
            raw_text = script.string or script.get_text(strip=True)
            if not raw_text:
                continue
            try:
                parsed = json.loads(raw_text)
            except json.JSONDecodeError:
                continue
            for image in _extract_product_images_from_jsonld(parsed):
                normalized = _normalize_url(image, base_url)
                if normalized:
                    found.append(normalized)
        return found

    def _extract_selector_images(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        selectors = [
            "img[itemprop='image']",
            "img.wp-post-image",
            ".woocommerce-product-gallery__image img",
            ".product-gallery img",
            ".product-image img",
            "article.product img",
            "main img",
        ]
        found: list[str] = []

        for selector in selectors:
            for img in soup.select(selector):
                url = (
                    img.get("data-src")
                    or img.get("data-large_image")
                    or img.get("data-original")
                    or img.get("src")
                )
                normalized = _normalize_url(url, base_url)
                if not normalized:
                    continue
                if _looks_generic_url(normalized):
                    continue
                found.append(normalized)

        return _dedupe_keep_order(found)

    def _extract_preload_images(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        found: list[str] = []
        for tag in soup.select('link[rel="preload"][as="image"]'):
            normalized = _normalize_url(tag.get("href"), base_url)
            if normalized:
                found.append(normalized)
        return _dedupe_keep_order(found)

    def _extract_broad_img_candidates(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        found: list[str] = []

        for source in soup.select("source[srcset]"):
            for candidate in _split_srcset(source.get("srcset", "")):
                normalized = _normalize_url(candidate, base_url)
                if normalized and not _looks_generic_url(normalized):
                    found.append(normalized)

        for img in soup.find_all("img"):
            for attr in ("data-large_image", "data-src", "data-original", "src", "data-lazy-src"):
                normalized = _normalize_url(img.get(attr), base_url)
                if normalized and not _looks_generic_url(normalized):
                    found.append(normalized)
            srcset = img.get("srcset")
            if srcset:
                for candidate in _split_srcset(srcset):
                    normalized = _normalize_url(candidate, base_url)
                    if normalized and not _looks_generic_url(normalized):
                        found.append(normalized)

        return _dedupe_keep_order(found)

    def _extract_image_urls_from_text(self, html: str, base_url: str) -> list[str]:
        pattern = re.compile(r"https?://[^\s\"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\"'<>]*)?", re.IGNORECASE)
        found: list[str] = []
        for match in pattern.findall(html):
            normalized = _normalize_url(match, base_url)
            if normalized and not _looks_generic_url(normalized):
                found.append(normalized)
        return _dedupe_keep_order(found)

    def _write_missing_report(self, path: str | Path, records: list[MissingImageRecord]) -> None:
        report = Path(path)
        report.parent.mkdir(parents=True, exist_ok=True)

        with report.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["sku", "product_url", "reason"])
            writer.writeheader()
            for item in records:
                writer.writerow({"sku": item.sku, "product_url": item.product_url, "reason": item.reason})

        logging.info("Reporte de imagenes faltantes: %s (%s casos)", report.resolve(), len(records))

    def _write_quality_report(self, path: str | Path, records: list[ImageQualityRecord]) -> None:
        report = Path(path)
        report.parent.mkdir(parents=True, exist_ok=True)

        with report.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=[
                    "sku",
                    "product_url",
                    "image_path",
                    "width",
                    "height",
                    "file_size_kb",
                    "status",
                    "issues",
                ],
            )
            writer.writeheader()
            for item in records:
                writer.writerow(
                    {
                        "sku": item.sku,
                        "product_url": item.product_url,
                        "image_path": item.image_path,
                        "width": item.width,
                        "height": item.height,
                        "file_size_kb": f"{item.file_size_kb:.1f}",
                        "status": item.status,
                        "issues": item.issues,
                    }
                )

        warnings_count = sum(1 for r in records if r.status != "ok")
        logging.info(
            "Reporte de calidad de imagenes: %s (%s con observaciones de %s)",
            report.resolve(),
            warnings_count,
            len(records),
        )

    def _write_resolution_report(self, path: str | Path, records: list[ImageResolutionRecord]) -> None:
        report = Path(path)
        report.parent.mkdir(parents=True, exist_ok=True)
        with report.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["sku", "product_url", "status", "resolved_image_path"])
            writer.writeheader()
            for row in records:
                writer.writerow(
                    {
                        "sku": row.sku,
                        "product_url": row.product_url,
                        "status": row.status,
                        "resolved_image_path": row.resolved_image_path,
                    }
                )
        logging.info("Reporte de resolucion de imagenes: %s", report.resolve())

    def _progress_wrapper(self, iterable, show_progress: bool, total: int | None = None, desc: str | None = None):
        if not show_progress or tqdm is None:
            return iterable
        return tqdm(iterable, total=total, desc=desc, ncols=95)

    def _get_lock(self, key: str) -> threading.Lock:
        with self._lock:
            if key not in self._download_locks:
                self._download_locks[key] = threading.Lock()
            return self._download_locks[key]

    def _assess_quality(self, product: Product, image_path: str) -> ImageQualityRecord:
        width = 0
        height = 0
        size_kb = 0.0
        issues: list[str] = []
        status = "ok"

        path = Path(image_path)
        if path.exists():
            size_kb = path.stat().st_size / 1024.0
            if size_kb < self.quality_min_kb:
                issues.append("small_file")

        if Image is not None and path.exists():
            try:
                with Image.open(path) as img:
                    width, height = img.size
            except Exception:
                issues.append("unreadable_image")
        else:
            issues.append("no_pillow")

        if width and width < self.quality_min_width:
            issues.append("low_width")
        if height and height < self.quality_min_height:
            issues.append("low_height")
        if width and height:
            ratio = max(width / height, height / width)
            if ratio > self.quality_max_aspect_ratio:
                issues.append("extreme_aspect_ratio")

        if issues:
            status = "review"

        return ImageQualityRecord(
            sku=product.sku,
            product_url=product.product_url,
            image_path=image_path,
            width=width,
            height=height,
            file_size_kb=size_kb,
            status=status,
            issues=";".join(issues),
        )

    def _build_local_image_index(self) -> list[Path]:
        base = self.project_root / "static" / "img"
        if not base.exists():
            return []
        files: list[Path] = []
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
            files.extend(base.rglob(ext))
        return files

    def _load_overrides(self, overrides_path: str | Path | None) -> dict[str, str]:
        if not overrides_path:
            return {}
        path = Path(overrides_path)
        if not path.exists() or not path.is_file():
            return {}
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}
        if not isinstance(payload, dict):
            return {}
        result: dict[str, str] = {}
        for k, v in payload.items():
            if not isinstance(k, str):
                continue
            if isinstance(v, str):
                result[k.strip()] = v.strip()
            elif isinstance(v, dict) and isinstance(v.get("image"), str):
                result[k.strip()] = v.get("image", "").strip()
        return result

    def _find_override_image(self, product: Product) -> str | None:
        keys = [product.sku, product.slug or "", product.product_url]
        for key in keys:
            if key and key in self.overrides:
                value = self.overrides[key]
                if value:
                    return value
        return None

    def _find_local_image_by_slug(self, slug: str | None) -> Path | None:
        if not self.local_image_index:
            return None
        if not slug:
            return None

        slug_norm = _norm_slug(slug)
        if not slug_norm:
            return None

        # Permite variantes de slug truncadas (ej: colageno-biotina-gomas -> colageno-biotina).
        parts = [p for p in slug.casefold().replace("_", "-").split("-") if p]
        variants = {slug_norm}
        if len(parts) >= 2:
            variants.add(_norm_slug("-".join(parts[:2])))
        if len(parts) >= 3:
            variants.add(_norm_slug("-".join(parts[:3])))

        candidates: list[tuple[int, Path]] = []
        for path in self.local_image_index:
            stem_norm = _norm_slug(path.stem)
            if not stem_norm:
                continue
            score = 0
            for var in variants:
                if not var:
                    continue
                if var == stem_norm:
                    score = max(score, 120)
                elif var in stem_norm:
                    score = max(score, 100)
                elif stem_norm in var and len(stem_norm) >= 10:
                    score = max(score, 80)
            if score == 0:
                continue
            if "main" in path.stem.casefold():
                score += 10
            candidates.append((score, path))

        if not candidates:
            return None
        best = max(candidates, key=lambda x: x[0])[1]
        return best

    def _find_fuzzy_local_image(self, slug: str | None, name: str) -> Path | None:
        if not self.local_image_index:
            return None

        wanted_tokens = set(_tokens((slug or "") + " " + name))
        if not wanted_tokens:
            return None

        candidates: list[tuple[int, Path]] = []
        for path in self.local_image_index:
            stem_tokens = set(_tokens(path.stem))
            overlap = len(wanted_tokens & stem_tokens)
            if overlap < 2:
                continue
            score = overlap * 10
            if "main" in path.stem.casefold():
                score += 8
            candidates.append((score, path))

        if not candidates:
            return None
        return max(candidates, key=lambda x: x[0])[1]

    def _resolve_local_image_path(self, image_ref: str | None) -> Path | None:
        if not image_ref:
            return None
        text = str(image_ref).strip()
        if not text:
            return None
        if _looks_invalid_url(text):
            return None

        if text.startswith(("http://", "https://", "//")):
            return None

        normalized = text.replace("\\", "/")
        if normalized.startswith("/"):
            normalized = normalized[1:]
        candidate = (self.project_root / normalized).resolve()

        try:
            candidate.relative_to(self.project_root)
        except ValueError:
            return None

        if not candidate.exists() or not candidate.is_file():
            return None
        return candidate


def _extract_product_images_from_jsonld(payload: object) -> list[str]:
    images: list[str] = []

    def visit(node: object) -> None:
        if isinstance(node, list):
            for item in node:
                visit(item)
            return

        if not isinstance(node, dict):
            return

        node_type = node.get("@type")
        is_product = False
        if isinstance(node_type, str):
            is_product = "product" in node_type.casefold()
        elif isinstance(node_type, list):
            is_product = any(isinstance(t, str) and "product" in t.casefold() for t in node_type)

        if is_product and "image" in node:
            images.extend(_image_field_to_list(node.get("image")))

        if "@graph" in node:
            visit(node.get("@graph"))

        for value in node.values():
            if isinstance(value, (dict, list)):
                visit(value)

    visit(payload)
    return _dedupe_keep_order([img for img in images if isinstance(img, str)])


def _image_field_to_list(value: object) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            out.extend(_image_field_to_list(item))
        return out
    if isinstance(value, dict):
        if "url" in value and isinstance(value["url"], str):
            return [value["url"]]
        if "@id" in value and isinstance(value["@id"], str):
            return [value["@id"]]
    return []


def _meta_content(soup: BeautifulSoup, attr_name: str, attr_value: str) -> str | None:
    tag = soup.find("meta", attrs={attr_name: attr_value})
    if not tag:
        return None
    content = tag.get("content")
    if not content:
        return None
    return str(content).strip()


def _normalize_url(url: str | None, base_url: str) -> str | None:
    if not url:
        return None
    clean = str(url).strip()
    if not clean:
        return None
    if clean.startswith("//"):
        clean = "https:" + clean
    joined = urljoin(base_url, clean)
    parsed = urlparse(joined)
    if parsed.scheme not in {"http", "https"}:
        return None
    return joined


def _extension_from_url(url: str) -> str:
    path = urlparse(url).path.lower()
    ext = Path(path).suffix
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}:
        return ext
    return ".img"


def _safe_name(value: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip())
    return safe.strip("-") or "item"


def _dedupe_keep_order(items: list[str]) -> list[str]:
    seen = set()
    out: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def _split_srcset(srcset: str) -> list[str]:
    out: list[str] = []
    for part in srcset.split(","):
        item = part.strip()
        if not item:
            continue
        out.append(item.split(" ")[0].strip())
    return out


def _norm_slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.casefold())


def _tokens(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.casefold()) if len(t) >= 3]


def _looks_invalid_url(url: str) -> bool:
    lowered = url.casefold()
    return any(token in lowered for token in PLACEHOLDER_TOKENS)


def _looks_generic_url(url: str) -> bool:
    lowered = url.casefold()
    if _looks_invalid_url(lowered):
        return True
    return any(token in lowered for token in GENERIC_TOKENS)


def run_fetch_images_cli() -> int:
    import argparse

    from data_loader import load_products

    parser = argparse.ArgumentParser(description="Resolver y descargar imagenes reales de productos")
    parser.add_argument("--input", required=True, help="Ruta a products.json/products.csv")
    parser.add_argument("--cache", default="cache_images", help="Directorio cache")
    parser.add_argument("--workers", type=int, default=10, help="Hilos concurrentes")
    parser.add_argument("--report", default="report_missing_images.csv", help="CSV de faltantes")
    parser.add_argument("--report-quality", default="report_image_quality.csv", help="CSV de calidad de imagenes")
    parser.add_argument("--report-resolution", default="report_image_resolution.csv", help="CSV de trazabilidad de resolucion")
    parser.add_argument("--overrides", default="", help="JSON con overrides de imagen por SKU/slug/url")
    parser.add_argument("--quality-min-width", type=int, default=500, help="Ancho minimo de calidad")
    parser.add_argument("--quality-min-height", type=int, default=500, help="Alto minimo de calidad")
    parser.add_argument("--quality-min-kb", type=int, default=20, help="Peso minimo en KB")
    parser.add_argument("--quality-max-aspect-ratio", type=float, default=2.8, help="Aspect ratio maximo permitido")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    result = load_products(args.input)
    resolver = ProductImageResolver(
        cache_dir=args.cache,
        max_workers=args.workers,
        quality_min_width=args.quality_min_width,
        quality_min_height=args.quality_min_height,
        quality_min_kb=args.quality_min_kb,
        quality_max_aspect_ratio=args.quality_max_aspect_ratio,
        overrides_path=args.overrides or None,
    )
    resolver.resolve_all(
        result.products,
        report_path=args.report,
        quality_report_path=args.report_quality,
        resolution_report_path=args.report_resolution,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(run_fetch_images_cli())
