#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrae correctamente datos del DOCX: mejoras_seo_ids_855_881.docx
Estructura: Cada tabla tiene ANTES (col 0) y DESPUÉS (col 1)
- Fila 2: seo_title
- Fila 3: seo_description_mejorado
"""

from docx import Document
from pathlib import Path
import json
import re

docx_path = Path('mejoras_seo_ids_855_881.docx')
doc = Document(docx_path)

products = []

print("🔍 Extrayendo datos del DOCX...\n")

for table_idx, table in enumerate(doc.tables[1:]):  # Saltar tabla 1 (encabezado)
    # Extraer ID del encabezado de la tabla
    header_text = table.rows[0].cells[0].text.strip()
    
    # Buscar patrón "ID XXX"
    id_match = re.search(r'ID\s+(\d+)', header_text)
    if not id_match:
        continue
    
    product_id = id_match.group(1)
    
    # Extraer seo_title_mejorado (fila 2, columna 1 - DESPUÉS)
    if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
        seo_title_cell = table.rows[2].cells[1].text.strip()
        # Remover el prefijo "seo_title"
        seo_title_mejorado = seo_title_cell.replace('seo_title', '').strip()
    else:
        seo_title_mejorado = None
    
    # Extraer seo_description_mejorado (fila 3, columna 1 - DESPUÉS)
    if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
        seo_desc_cell = table.rows[3].cells[1].text.strip()
        # Remover el prefijo "seo_description_mejorado"
        seo_description_mejorado = seo_desc_cell.replace('seo_description_mejorado', '').strip()
    else:
        seo_description_mejorado = None
    
    products.append({
        'id': product_id,
        'seo_title_mejorado': seo_title_mejorado,
        'seo_description_mejorado': seo_description_mejorado
    })
    
    print(f"✅ ID {product_id}:")
    print(f"   Title: {seo_title_mejorado[:60] if seo_title_mejorado else 'None'}...")
    print(f"   Desc: {seo_description_mejorado[:60] if seo_description_mejorado else 'None'}...")
    print()

print(f"\n📊 Total extraído: {len(products)} productos\n")

if products:
    # Guardar a JSON
    output_file = Path('mejoras_seo_ids_855_881_extracted.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Datos guardados en: {output_file}")
    
    # Mostrar IDs extraídos
    ids = [p['id'] for p in products]
    print(f"   IDs: {ids[0]} a {ids[-1]} ({len(ids)} productos)")
