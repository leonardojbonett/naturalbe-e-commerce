#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplicar cambios del Lote 8 (IDs 735-765) a productos_enriquecido.json
"""

import json
from pathlib import Path

# Cargar archivos
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

with open('productos_corregidos_lote8_IDs735-765.json', 'r', encoding='utf-8') as f:
    lote8 = json.load(f)

# Crear índice
enriched_by_id = {str(p['id']): p for p in enriched}

print("💾 Aplicando cambios del Lote 8 (IDs 735-765)...\n")

updated_count = 0

for product in lote8:
    product_id = str(product['id'])
    seo_title_mejorado = product.get('seo_title_mejorado')
    seo_description_mejorado = product.get('seo_description_mejorado')
    
    if product_id in enriched_by_id:
        enriched_by_id[product_id]['seo_title'] = seo_title_mejorado
        enriched_by_id[product_id]['seo_description'] = seo_description_mejorado
        updated_count += 1
        print(f"✅ ID {product_id}: {product.get('nombre')[:50]}")

# Guardar cambios
with open(enriched_file, 'w', encoding='utf-8') as f:
    json.dump(enriched, f, ensure_ascii=False, indent=2)

print(f"\n✅ {updated_count} productos actualizados en productos_enriquecido.json")
