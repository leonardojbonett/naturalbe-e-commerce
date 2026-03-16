#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificación detallada del Lote 8 (IDs 735-765)
"""

import json
from pathlib import Path

# Cargar ambos archivos
with open('productos_enriquecido.json', 'r', encoding='utf-8') as f:
    enriched = json.load(f)

with open('productos_corregidos_lote8_IDs735-765.json', 'r', encoding='utf-8') as f:
    lote8 = json.load(f)

enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando Lote 8 (IDs 735-765) en detalle...\n")

first_product = lote8[0]
product_id = str(first_product['id'])

print(f"ID {product_id}:")
print(f"Nombre: {first_product.get('nombre')}")
print(f"\nEn lote8:")
print(f"  seo_title_mejorado: {first_product.get('seo_title_mejorado')[:60]}")
print(f"  seo_description_mejorado: {first_product.get('seo_description_mejorado')[:60]}")

enriched_product = enriched_by_id[product_id]
print(f"\nEn productos_enriquecido:")
title = enriched_product.get('seo_title') or "None"
desc = enriched_product.get('seo_description') or "None"
print(f"  seo_title: {title[:60] if title != 'None' else 'None'}")
print(f"  seo_description: {desc[:60] if desc != 'None' else 'None'}")

print(f"\n¿Coinciden títulos? {enriched_product.get('seo_title') == first_product.get('seo_title_mejorado')}")
print(f"¿Coinciden descripciones? {enriched_product.get('seo_description') == first_product.get('seo_description_mejorado')}")
