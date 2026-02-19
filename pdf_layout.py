from __future__ import annotations

import datetime as dt
import re
from dataclasses import dataclass, replace
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    NextPageTemplate,
    PageBreak,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

from data_loader import Product
from image_cache import ImageCache
from qr_utils import build_qr_drawing, make_short_url_label


@dataclass(slots=True)
class CatalogOptions:
    columns: int = 2
    currency: str = "COP"
    title: str = "Catalogo Natural Be"
    subtitle: str = "Vitaminas y suplementos"
    brand_name: str = "Natural Be"
    disclaimer: str = "Suplemento dietario. No es un medicamento."
    date_text: str = ""
    logo_path: str | None = None
    include_qr: bool = True


class CatalogDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, options: CatalogOptions, **kwargs) -> None:
        self.options = options
        super().__init__(filename, pagesize=A4, **kwargs)

        header_h = 11 * mm
        footer_h = 13 * mm

        cover_frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="cover_frame",
        )
        body_frame = Frame(
            self.leftMargin,
            self.bottomMargin + footer_h,
            self.width,
            self.height - header_h - footer_h,
            id="body_frame",
        )

        self.addPageTemplates(
            [
                self._make_template("Cover", cover_frame, with_chrome=False),
                self._make_template("Body", body_frame, with_chrome=True),
            ]
        )

    def _make_template(self, template_id: str, frame: Frame, with_chrome: bool):
        def _draw(canvas, doc):
            if with_chrome:
                self._draw_header_footer(canvas, doc)

        from reportlab.platypus import PageTemplate

        return PageTemplate(id=template_id, frames=[frame], onPage=_draw)

    def _draw_header_footer(self, canvas, doc) -> None:
        canvas.saveState()

        top_y = A4[1] - self.topMargin + 4 * mm
        bottom_y = self.bottomMargin - 4 * mm

        canvas.setStrokeColor(colors.HexColor("#DCE3DF"))
        canvas.setLineWidth(0.6)
        canvas.line(self.leftMargin, A4[1] - self.topMargin + 1.5 * mm, A4[0] - self.rightMargin, A4[1] - self.topMargin + 1.5 * mm)
        canvas.line(self.leftMargin, self.bottomMargin + 8 * mm, A4[0] - self.rightMargin, self.bottomMargin + 8 * mm)

        canvas.setFillColor(colors.HexColor("#1D2B24"))
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(self.leftMargin, top_y, self.options.brand_name)

        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(A4[0] - self.rightMargin, top_y, f"Pagina {doc.page}")

        canvas.setFillColor(colors.HexColor("#3A4D42"))
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(A4[0] / 2, bottom_y, self.options.disclaimer)
        canvas.restoreState()

    def afterFlowable(self, flowable) -> None:
        if isinstance(flowable, Paragraph) and flowable.style.name == "CategoryHeading":
            text = flowable.getPlainText()
            self.notify("TOCEntry", (0, text, self.page))
            key = "cat-" + re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, 0, False)


def build_catalog_pdf(
    products_by_category: dict[str, list[Product]],
    output_path: str,
    image_cache: ImageCache,
    options: CatalogOptions,
) -> None:
    date_text = options.date_text or dt.date.today().strftime("%d/%m/%Y")
    options = replace(options, date_text=date_text)

    styles = _build_styles()
    toc = _build_toc(styles)

    doc = CatalogDocTemplate(
        output_path,
        options=options,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=options.title,
        author=options.brand_name,
    )

    story = []
    story.extend(_build_cover_page(styles, options))
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())

    story.append(Paragraph("Indice por categorias", styles["SectionTitle"]))
    story.append(Spacer(1, 5 * mm))
    story.append(toc)
    story.append(PageBreak())

    categories = list(products_by_category.items())
    for idx, (category, products) in enumerate(categories):
        story.append(Paragraph(category, styles["CategoryHeading"]))
        story.append(Spacer(1, 4 * mm))
        story.append(_build_product_grid(products, doc.width, options.columns, image_cache, styles, options))
        if idx < len(categories) - 1:
            story.append(PageBreak())

    doc.multiBuild(story)


def _build_cover_page(styles: StyleSheet1, options: CatalogOptions):
    logo = _build_logo_flowable(options.logo_path, width=56 * mm, height=28 * mm)
    cover_block = Table(
        [
            [logo],
            [Paragraph(options.title, styles["CoverTitle"])],
            [Paragraph(options.subtitle, styles["CoverSubtitle"])],
            [Paragraph(f"Fecha: {options.date_text}", styles["CoverDate"])],
        ],
        colWidths=[170 * mm],
    )
    cover_block.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    return [
        Spacer(1, 34 * mm),
        cover_block,
        Spacer(1, 30 * mm),
        Paragraph("Portafolio profesional para clientes y distribuidores", styles["CoverTagline"]),
    ]


def _build_product_grid(
    products: list[Product],
    content_width: float,
    columns: int,
    image_cache: ImageCache,
    styles: StyleSheet1,
    options: CatalogOptions,
):
    columns = 3 if columns >= 3 else 2
    gap = 5 * mm
    card_height = 95 * mm
    card_width = (content_width - gap * (columns - 1)) / columns

    cards = [
        _build_product_card(
            product=p,
            card_width=card_width,
            card_height=card_height,
            image_cache=image_cache,
            styles=styles,
            options=options,
        )
        for p in products
    ]

    rows = []
    for start in range(0, len(cards), columns):
        row = cards[start : start + columns]
        if len(row) < columns:
            row.extend([Spacer(card_width, card_height)] * (columns - len(row)))
        rows.append(row)

    table = Table(rows, colWidths=[card_width] * columns, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), gap),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def _build_product_card(
    product: Product,
    card_width: float,
    card_height: float,
    image_cache: ImageCache,
    styles: StyleSheet1,
    options: CatalogOptions,
):
    img_w = card_width - 8 * mm
    img_h = 36 * mm
    image_path = image_cache.get_image_for_box(
        product.resolved_image_path or product.image_url,
        width_px=max(120, int(img_w * 2)),
        height_px=max(120, int(img_h * 2)),
    )

    if image_path and Path(image_path).exists():
        image_flowable = RLImage(image_path, width=img_w, height=img_h)
    else:
        image_flowable = _build_placeholder_image(width=img_w, height=img_h)

    benefits = product.short_benefits[:2]
    while len(benefits) < 2:
        benefits.append("Beneficio nutricional")

    if product.has_sale:
        price_html = (
            f"<font color='#13693C'><b>{_format_money(product.sale_price_cop, options.currency)}</b></font> "
            f"<font color='#6A6A6A'><strike>{_format_money(product.price_cop, options.currency)}</strike></font>"
        )
    else:
        price_html = f"<font color='#1D2B24'><b>{_format_money(product.price_cop, options.currency)}</b></font>"

    content = [
        image_flowable,
        Spacer(1, 2.5 * mm),
        Paragraph(_truncate_text(product.name, 62), styles["CardTitle"]),
        Paragraph(_truncate_text(product.brand, 30), styles["CardMeta"]),
        Paragraph(_truncate_text(product.presentation, 32), styles["CardMeta"]),
        Spacer(1, 1 * mm),
        Paragraph("- " + _truncate_text(benefits[0], 52), styles["CardBullet"]),
        Paragraph("- " + _truncate_text(benefits[1], 52), styles["CardBullet"]),
        Spacer(1, 2 * mm),
        Paragraph(price_html, styles["CardPrice"]),
        Spacer(1, 1.5 * mm),
    ]

    if options.include_qr:
        qr_size = 16 * mm
        qr_drawing = build_qr_drawing(product.product_url, size=qr_size)
        link_data = Table(
            [[qr_drawing, Paragraph(_truncate_text(make_short_url_label(product.product_url), 40), styles["CardLink"]) ]],
            colWidths=[qr_size, card_width - qr_size - 11 * mm],
        )
        link_data.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        content.append(link_data)
    else:
        content.append(Paragraph(_truncate_text(make_short_url_label(product.product_url), 44), styles["CardLink"]))

    from reportlab.platypus import KeepInFrame

    card_inner = KeepInFrame(
        maxWidth=card_width - 6 * mm,
        maxHeight=card_height - 6 * mm,
        content=content,
        mergeSpace=True,
        mode="shrink",
    )

    card = Table([[card_inner]], colWidths=[card_width], rowHeights=[card_height])
    card.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#D6E0DA")),
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return card


def _build_logo_flowable(logo_path: str | None, width: float, height: float):
    if logo_path:
        path = Path(logo_path)
        if path.exists() and path.is_file():
            try:
                ImageReader(str(path))
                return RLImage(str(path), width=width, height=height)
            except Exception:
                pass

    from reportlab.graphics.shapes import Drawing, Rect, String

    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, strokeColor=colors.HexColor("#1D2B24"), fillColor=colors.HexColor("#ECF3EE"), strokeWidth=1))
    drawing.add(String(width / 2, height / 2 - 4, "NATURAL BE", textAnchor="middle", fontName="Helvetica-Bold", fontSize=12, fillColor=colors.HexColor("#1D2B24")))
    return drawing


def _build_placeholder_image(width: float, height: float):
    from reportlab.graphics.shapes import Drawing, Rect, String

    drawing = Drawing(width, height)
    drawing.add(Rect(0, 0, width, height, strokeColor=colors.HexColor("#CFD9D2"), fillColor=colors.HexColor("#F4F7F5"), strokeWidth=0.7))
    drawing.add(String(width / 2, height / 2 - 4, "Imagen no disponible", textAnchor="middle", fontName="Helvetica", fontSize=8, fillColor=colors.HexColor("#7A857F")))
    return drawing


def _build_toc(styles: StyleSheet1) -> TableOfContents:
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "TOCLevel1",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            leftIndent=0,
            firstLineIndent=0,
            spaceBefore=2,
            textColor=colors.HexColor("#22362C"),
        )
    ]
    return toc


def _build_styles() -> StyleSheet1:
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=34,
            leading=38,
            alignment=1,
            textColor=colors.HexColor("#16251E"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "CoverSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=15,
            leading=19,
            alignment=1,
            textColor=colors.HexColor("#2D4337"),
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            "CoverDate",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=12,
            alignment=1,
            textColor=colors.HexColor("#51665A"),
        )
    )
    styles.add(
        ParagraphStyle(
            "CoverTagline",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=11,
            alignment=1,
            textColor=colors.HexColor("#4D6156"),
        )
    )
    styles.add(
        ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#16251E"),
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "CategoryHeading",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1D2B24"),
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            "CardTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=12,
            textColor=colors.HexColor("#1B1F1D"),
            spaceAfter=1,
        )
    )
    styles.add(
        ParagraphStyle(
            "CardMeta",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#4A574F"),
        )
    )
    styles.add(
        ParagraphStyle(
            "CardBullet",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            textColor=colors.HexColor("#24312A"),
        )
    )
    styles.add(
        ParagraphStyle(
            "CardPrice",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=12,
        )
    )
    styles.add(
        ParagraphStyle(
            "CardLink",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.4,
            leading=9,
            textColor=colors.HexColor("#2F473A"),
        )
    )
    return styles


def _format_money(amount: int | None, currency: str) -> str:
    if amount is None:
        return "-"
    if currency.upper() == "COP":
        return f"${amount:,.0f}".replace(",", ".")
    return f"{currency.upper()} {amount:,.2f}"


def _truncate_text(text: str, max_len: int) -> str:
    value = " ".join(str(text).split())
    if len(value) <= max_len:
        return value
    return value[: max_len - 3].rstrip() + "..."
