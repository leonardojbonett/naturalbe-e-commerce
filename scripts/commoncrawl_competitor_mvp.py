#!/usr/bin/env python3
"""
MVP de inteligencia competitiva con Common Crawl.

Objetivo:
- Tomar una lista de dominios competidores.
- Encontrar URLs HTML recientes en el índice de Common Crawl.
- Descargar una muestra de páginas desde WARC (byte ranges).
- Extraer title, H1, H2, términos frecuentes y dominios externos enlazados.
- Exportar resultados a CSV para backlog SEO.

Ejemplo:
python scripts/commoncrawl_competitor_mvp.py ^
  --domains "example.com,another.com" ^
  --fetch-pages-per-domain 6 ^
  --out-dir reports/commoncrawl-mvp
"""

from __future__ import annotations

import argparse
import csv
import gzip
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

COLLINFO_URL = "https://index.commoncrawl.org/collinfo.json"
INDEX_URL_TEMPLATE = "https://index.commoncrawl.org/{index_id}-index"
DATA_BASE_URL = "https://data.commoncrawl.org/"
REQUEST_TIMEOUT = 40

# Stopwords reducidas para SEO en esp/en; se pueden ampliar según necesidad.
STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "your",
    "you",
    "para",
    "con",
    "por",
    "del",
    "las",
    "los",
    "una",
    "uno",
    "como",
    "sobre",
    "desde",
    "hasta",
    "más",
    "mas",
    "sus",
    "sin",
    "vitaminas",
    "suplementos",
    "natural",
    "be",
    "shop",
    "store",
    "home",
    "inicio",
    "comprar",
    "tienda",
    "producto",
    "productos",
}

TOKEN_RE = re.compile(r"[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]{3,}")


@dataclass
class CdxRecord:
    domain: str
    url: str
    timestamp: str
    filename: str
    offset: int
    length: int
    status: str
    mime: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="MVP Common Crawl para análisis competitivo SEO.")
    parser.add_argument("--domains", default="", help="Dominios separados por coma.")
    parser.add_argument("--domains-file", default="", help="Archivo .txt con un dominio por línea.")
    parser.add_argument("--index-id", default="", help="ID de índice (ej: CC-MAIN-2026-05).")
    parser.add_argument(
        "--fallback-indexes",
        type=int,
        default=4,
        help="Cuántos índices recientes probar automáticamente si no hay resultados en el más nuevo.",
    )
    parser.add_argument(
        "--index-pages-per-domain",
        type=int,
        default=2,
        help="Cuántas páginas de resultados CDX leer por dominio (cada página trae múltiples URLs).",
    )
    parser.add_argument(
        "--fetch-pages-per-domain",
        type=int,
        default=8,
        help="Máximo de URLs a descargar y analizar por dominio.",
    )
    parser.add_argument(
        "--top-keywords-per-page",
        type=int,
        default=12,
        help="Número de keywords frecuentes a guardar por página.",
    )
    parser.add_argument(
        "--out-dir",
        default="reports/commoncrawl-mvp",
        help="Directorio base de salida.",
    )
    return parser.parse_args()


def clean_domain(value: str) -> str:
    raw = value.strip().lower()
    if not raw:
        return ""
    if "://" in raw:
        raw = urlparse(raw).netloc
    raw = raw.strip("/")
    if raw.startswith("www."):
        raw = raw[4:]
    return raw


def load_domains(args: argparse.Namespace) -> List[str]:
    domains: List[str] = []
    if args.domains:
        domains.extend(clean_domain(d) for d in args.domains.split(","))
    if args.domains_file:
        file_path = Path(args.domains_file)
        if not file_path.exists():
            raise FileNotFoundError(f"No existe el archivo de dominios: {file_path}")
        for line in file_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            domains.append(clean_domain(line))
    unique = sorted({d for d in domains if d})
    if not unique:
        raise ValueError("Debes indicar dominios con --domains o --domains-file.")
    return unique


def choose_index_ids(session: requests.Session, explicit: str = "", fallback_indexes: int = 4) -> List[str]:
    if explicit:
        return [explicit]
    try:
        response = session.get(COLLINFO_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        collections = response.json()
    except requests.RequestException:
        # Fallback de emergencia si collinfo falla.
        baseline = [
            "CC-MAIN-2026-04",
            "CC-MAIN-2025-51",
            "CC-MAIN-2025-47",
            "CC-MAIN-2025-43",
            "CC-MAIN-2025-38",
            "CC-MAIN-2025-33",
        ]
        return baseline[: max(1, fallback_indexes)]
    if not isinstance(collections, list) or not collections:
        raise RuntimeError("No fue posible leer collinfo de Common Crawl.")
    # Orden lexicográfico del ID suele corresponder a más reciente para CC-MAIN-YYYY-NN.
    index_ids = sorted((c.get("id", "") for c in collections if c.get("id", "").startswith("CC-MAIN-")), reverse=True)
    if not index_ids:
        raise RuntimeError("No se encontraron índices CC-MAIN en collinfo.")
    count = max(1, fallback_indexes)
    return index_ids[:count]


def query_cdx_records(
    session: requests.Session,
    index_id: str,
    domain: str,
    max_pages: int,
    max_records: int,
) -> List[CdxRecord]:
    endpoint = INDEX_URL_TEMPLATE.format(index_id=index_id)
    records: List[CdxRecord] = []
    seen_urls: Set[str] = set()

    per_page_limit = max(max_records * 6, 50)
    for page in range(max_pages):
        params = {
            "url": f"*.{domain}/*",
            "output": "json",
            "page": page,
            "limit": per_page_limit,
        }
        try:
            resp = session.get(endpoint, params=params, timeout=REQUEST_TIMEOUT)
        except requests.RequestException:
            break
        # Algunos dominios no tendrán resultados; endpoint puede devolver 404/empty.
        if resp.status_code in (404, 429, 500, 502, 503, 504):
            break
        if not resp.text.strip():
            break
        resp.raise_for_status()

        lines = [ln for ln in resp.text.splitlines() if ln.strip()]
        if not lines:
            break

        for line in lines:
            item = json.loads(line)
            url = item.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            try:
                status = str(item.get("status", ""))
                mime = str(item.get("mime", "") or item.get("mime-detected", ""))
                if status != "200":
                    continue
                if "html" not in mime.lower():
                    continue
                rec = CdxRecord(
                    domain=domain,
                    url=url,
                    timestamp=item.get("timestamp", ""),
                    filename=item["filename"],
                    offset=int(item["offset"]),
                    length=int(item["length"]),
                    status=status,
                    mime=mime,
                )
            except (KeyError, ValueError):
                continue
            records.append(rec)
            if len(records) >= max_records:
                return records
    return records


def _split_warc_payload(raw: bytes) -> bytes:
    # WARC headers + HTTP headers + body.
    first = raw.find(b"\r\n\r\n")
    if first == -1:
        return b""
    second = raw.find(b"\r\n\r\n", first + 4)
    if second == -1:
        return b""
    return raw[second + 4 :]


def fetch_html_from_warc_record(session: requests.Session, record: CdxRecord) -> Optional[str]:
    warc_url = DATA_BASE_URL + record.filename
    start = record.offset
    end = record.offset + record.length - 1
    headers = {"Range": f"bytes={start}-{end}"}
    try:
        resp = session.get(warc_url, headers=headers, timeout=REQUEST_TIMEOUT)
    except requests.RequestException:
        return None
    if resp.status_code not in (200, 206):
        return None

    blob = resp.content
    try:
        decompressed = gzip.decompress(blob)
    except OSError:
        return None

    payload = _split_warc_payload(decompressed)
    if not payload:
        return None

    # Intentos de decodificación comunes.
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            text = payload.decode(enc, errors="ignore")
            if text:
                return text
        except UnicodeDecodeError:
            continue
    return None


def registered_domain(hostname: str) -> str:
    host = (hostname or "").lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return host


def tokenize(text: str) -> List[str]:
    found = TOKEN_RE.findall(text.lower())
    return [t for t in found if t not in STOPWORDS and not t.isdigit()]


def analyze_html(domain: str, page_url: str, html: str, top_keywords: int) -> Dict[str, object]:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    h1_list = [h.get_text(" ", strip=True) for h in soup.select("h1")]
    h2_list = [h.get_text(" ", strip=True) for h in soup.select("h2")]

    meta_desc_tag = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    meta_desc = (meta_desc_tag.get("content") or "").strip() if meta_desc_tag else ""

    text_for_terms = " ".join([title, meta_desc, " ".join(h1_list), " ".join(h2_list)])
    keywords_counter = Counter(tokenize(text_for_terms))
    top_terms = keywords_counter.most_common(top_keywords)

    outbound_domains: Counter[str] = Counter()
    for a in soup.find_all("a", href=True):
        href = a.get("href", "").strip()
        if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        abs_url = urljoin(page_url, href)
        host = urlparse(abs_url).netloc
        if not host:
            continue
        ext_domain = registered_domain(host)
        if not ext_domain:
            continue
        # Excluye enlaces internos del dominio competidor.
        if ext_domain.endswith(domain):
            continue
        outbound_domains[ext_domain] += 1

    return {
        "domain": domain,
        "url": page_url,
        "title": title,
        "h1": h1_list[:3],
        "h2": h2_list[:6],
        "top_terms": top_terms,
        "outbound_domains": outbound_domains,
    }


def ensure_out_dir(base_dir: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = Path(base_dir) / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir


def write_pages_csv(path: Path, rows: Sequence[Dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["domain", "url", "title", "h1", "h2", "top_terms", "outbound_domains"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "domain": row["domain"],
                    "url": row["url"],
                    "title": row["title"],
                    "h1": json.dumps(row["h1"], ensure_ascii=False),
                    "h2": json.dumps(row["h2"], ensure_ascii=False),
                    "top_terms": json.dumps(row["top_terms"], ensure_ascii=False),
                    "outbound_domains": json.dumps(row["outbound_domains"], ensure_ascii=False),
                }
            )


def write_keywords_csv(path: Path, rows: Sequence[Dict[str, object]]) -> None:
    domain_keywords: Dict[str, Counter[str]] = defaultdict(Counter)
    for row in rows:
        domain = str(row["domain"])
        for token, count in row["top_terms"]:
            domain_keywords[domain][token] += int(count)

    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["domain", "keyword", "score"])
        writer.writeheader()
        for domain in sorted(domain_keywords):
            for keyword, score in domain_keywords[domain].most_common(40):
                writer.writerow({"domain": domain, "keyword": keyword, "score": score})


def write_backlinks_csv(path: Path, rows: Sequence[Dict[str, object]]) -> None:
    counter: Counter[Tuple[str, str]] = Counter()
    for row in rows:
        domain = str(row["domain"])
        outbound: Counter[str] = row["outbound_domains"]
        for linked_domain, hits in outbound.items():
            counter[(domain, linked_domain)] += int(hits)

    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["domain", "linked_domain", "count"])
        writer.writeheader()
        for (domain, linked_domain), count in counter.most_common():
            writer.writerow({"domain": domain, "linked_domain": linked_domain, "count": count})


def write_summary_csv(
    path: Path,
    domains: Sequence[str],
    records_by_domain: Dict[str, List[CdxRecord]],
    pages_rows: Sequence[Dict[str, object]],
    index_used_by_domain: Dict[str, str],
) -> None:
    pages_by_domain = Counter(str(r["domain"]) for r in pages_rows)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "domain",
                "index_id_used",
                "cdx_records_found",
                "pages_analyzed",
            ],
        )
        writer.writeheader()
        for domain in domains:
            writer.writerow(
                {
                    "domain": domain,
                    "index_id_used": index_used_by_domain.get(domain, ""),
                    "cdx_records_found": len(records_by_domain.get(domain, [])),
                    "pages_analyzed": pages_by_domain.get(domain, 0),
                }
            )


def main() -> None:
    args = parse_args()
    domains = load_domains(args)
    run_dir = ensure_out_dir(args.out_dir)

    session = requests.Session()
    session.headers.update({"User-Agent": "naturalbe-commoncrawl-mvp/1.0"})
    retry = Retry(
        total=4,
        backoff_factor=0.7,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    candidate_index_ids = choose_index_ids(session, args.index_id, args.fallback_indexes)
    print(f"[INFO] Indices candidatos: {', '.join(candidate_index_ids)}")
    print(f"[INFO] Dominios: {', '.join(domains)}")

    records_by_domain: Dict[str, List[CdxRecord]] = {}
    index_used_by_domain: Dict[str, str] = {}
    for domain in domains:
        records: List[CdxRecord] = []
        used_index = ""
        for index_id in candidate_index_ids:
            records = query_cdx_records(
                session=session,
                index_id=index_id,
                domain=domain,
                max_pages=args.index_pages_per_domain,
                max_records=args.fetch_pages_per_domain,
            )
            if records:
                used_index = index_id
                break
        records_by_domain[domain] = records
        index_used_by_domain[domain] = used_index
        idx_label = used_index if used_index else "sin-match"
        print(f"[INFO] {domain}: {len(records)} URLs CDX seleccionadas (index={idx_label})")

    rows: List[Dict[str, object]] = []
    for domain in domains:
        records = records_by_domain.get(domain, [])
        for rec in records:
            html = fetch_html_from_warc_record(session, rec)
            if not html:
                continue
            result = analyze_html(domain=domain, page_url=rec.url, html=html, top_keywords=args.top_keywords_per_page)
            rows.append(result)

    pages_csv = run_dir / "pages.csv"
    keywords_csv = run_dir / "keywords.csv"
    backlinks_csv = run_dir / "backlinks.csv"
    summary_csv = run_dir / "summary.csv"
    metadata_json = run_dir / "run_metadata.json"

    write_pages_csv(pages_csv, rows)
    write_keywords_csv(keywords_csv, rows)
    write_backlinks_csv(backlinks_csv, rows)
    write_summary_csv(summary_csv, domains, records_by_domain, rows, index_used_by_domain)

    metadata = {
        "generated_at": datetime.now().isoformat(),
        "index_candidates": candidate_index_ids,
        "index_used_by_domain": index_used_by_domain,
        "domains": domains,
        "index_pages_per_domain": args.index_pages_per_domain,
        "fetch_pages_per_domain": args.fetch_pages_per_domain,
        "pages_analyzed_total": len(rows),
        "output_dir": str(run_dir),
    }
    metadata_json.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print("[DONE] Reportes generados:")
    print(f"  - {summary_csv}")
    print(f"  - {pages_csv}")
    print(f"  - {keywords_csv}")
    print(f"  - {backlinks_csv}")
    print(f"  - {metadata_json}")


if __name__ == "__main__":
    main()
