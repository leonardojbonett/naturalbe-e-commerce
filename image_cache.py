from __future__ import annotations

import hashlib
from pathlib import Path

try:
    from PIL import Image, UnidentifiedImageError
except ImportError:  # pragma: no cover
    Image = None
    UnidentifiedImageError = Exception


class ImageCache:
    def __init__(self, cache_dir: str | Path = "cache_images") -> None:
        self.base_dir = Path(cache_dir)
        self.fitted_dir = self.base_dir / "fitted"
        self.fitted_dir.mkdir(parents=True, exist_ok=True)

    def get_image_for_box(self, source_path: str | None, width_px: int, height_px: int) -> str | None:
        if not source_path:
            return None

        path = Path(source_path)
        if not path.exists() or not path.is_file():
            return None

        if Image is None:
            return str(path)

        return self._fit_contain(path, width_px=width_px, height_px=height_px)

    def _fit_contain(self, image_path: Path, width_px: int, height_px: int) -> str | None:
        if width_px <= 0 or height_px <= 0:
            return str(image_path)

        key = hashlib.sha1(f"contain:{image_path}:{width_px}x{height_px}".encode("utf-8")).hexdigest()
        out_path = self.fitted_dir / f"{key}.jpg"
        if out_path.exists() and out_path.stat().st_size > 0:
            return str(out_path)

        try:
            with Image.open(image_path) as img:
                image = img.convert("RGB")
                src_w, src_h = image.size
                if src_w == 0 or src_h == 0:
                    return str(image_path)

                scale = min(width_px / src_w, height_px / src_h)
                new_w = max(1, int(round(src_w * scale)))
                new_h = max(1, int(round(src_h * scale)))

                resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
                canvas = Image.new("RGB", (width_px, height_px), (255, 255, 255))
                left = (width_px - new_w) // 2
                top = (height_px - new_h) // 2
                canvas.paste(resized, (left, top))
                canvas.save(out_path, format="JPEG", quality=90, optimize=True)
                return str(out_path)
        except (UnidentifiedImageError, OSError, ValueError):
            return str(image_path)
