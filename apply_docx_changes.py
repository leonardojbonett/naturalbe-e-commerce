#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica y aplica los cambios del DOCX extraído a productos_enriquecido.json
"""

import json
from pathlib import Path

# Cargar archivos
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

with open('mejoras_seo_ids_855_881_extracted.json', 'r', encoding='utf-8') as f:
    docx_data = json.load(f)

enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando cambios del DOCX...\n")

already_updated = 0
needs_update = 0
updates = []

for product in docx_data:
    product_id = str(product['id'])
    seo_title_mejorado = product.get('seo_title_mejorado')
    seo_description_mejorado = product.get('seo_description_mejorado')
    
    if product_id in enriched_by_id:
        enriched_product = enriched_by_id[product_id]
        
        title_match = enriched_product.get('seo_title') == seo_title_mejorado
        desc_match = enriched_product.get('seo_description') == seo_description_mejorado
        
        if title_match and desc_match:
            already_updated += 1
            print(f"✅ ID {product_id}: YA ACTUALIZADO")
        else:
            needs_update += 1
            print(f"❌ ID {product_id}: REQUIERE ACTUALIZACIÓN")
            updates.append({
                'id': product_id,
                'seo_title_mejorado': seo_title_mejorado,
                'seo_description_mejorado': seo_description_mejorado
            })

print(f"\n📊 RESUMEN:")
print(f"   ✅ Ya actualizados: {already_updated}")
print(f"   ❌ Requieren actualización: {needs_update}")

if updates:
    print(f"\n💾 Aplicando {len(updates)} actualizaciones...")
    
    for item in updates:
        enriched_by_id[item['id']]['seo_title'] = item['seo_title_mejorado']
        enriched_by_id[item['id']]['seo_description'] = item['seo_description_mejorado']
    
    with open(enriched_file, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(updates)} productos actualizados en productos_enriquecido.json")
else:
    print(f"\n✅ Todos los cambios del DOCX ya están aplicados")
