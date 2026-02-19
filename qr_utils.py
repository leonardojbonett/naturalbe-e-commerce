from __future__ import annotations

from urllib.parse import urlparse

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing


def build_qr_drawing(url: str, size: float = 58.0) -> Drawing:
    widget = qr.QrCodeWidget(url)
    bounds = widget.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]

    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(widget)
    return drawing


def make_short_url_label(url: str, max_len: int = 38) -> str:
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")
    path = parsed.path.rstrip("/")
    if not path:
        text = domain
    else:
        short_path = path
        if len(short_path) > 22:
            short_path = short_path[:22].rstrip("-/") + "..."
        text = f"{domain}{short_path}"

    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."
