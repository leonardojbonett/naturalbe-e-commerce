#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica si los cambios de productos_corregidos_IDs_1-20.json están aplicados
en productos_enriquecido.json
"""

import json
from pathlib import Path

# Cargar ambos archivos
corrected_file = Path('productos_corregidos_IDs_1-20.json')
enriched_file = Path('productos_enriquecido.json')

with open(corrected_file, 'r', encoding='utf-8') as f:
    corrected = json.load(f)

with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

# Crear índices por ID
enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando cambios de IDs 1-20...\n")

missing_updates = []
already_updated = []
needs_update = []

for product in corrected:
    product_id = str(product['id'])
    seo_title_mejorado = product.get('seo_title_mejorado')
    seo_description_mejorado = product.get('seo_description_mejorado')
    
    if product_id in enriched_by_id:
        enriched_product = enriched_by_id[product_id]
        
        title_match = enriched_product.get('seo_title') == seo_title_mejorado
        desc_match = enriched_product.get('seo_description') == seo_description_mejorado
        
        if title_match and desc_match:
            already_updated.append(product_id)
            print(f"✅ ID {product_id}: {product['nombre']} - YA ACTUALIZADO")
        else:
            needs_update.append({
                'id': product_id,
                'nombre': product['nombre'],
                'seo_title_mejorado': seo_title_mejorado,
                'seo_description_mejorado': seo_description_mejorado
            })
            print(f"❌ ID {product_id}: {product['nombre']} - REQUIERE ACTUALIZACIÓN")
    else:
        missing_updates.append(product_id)
        print(f"⚠️  ID {product_id}: {product['nombre']} - NO ENCONTRADO")

print(f"\n📊 RESUMEN:")
print(f"   ✅ Ya actualizados: {len(already_updated)}")
print(f"   ❌ Requieren actualización: {len(needs_update)}")
print(f"   ⚠️  No encontrados: {len(missing_updates)}")

# Si hay cambios pendientes, aplicarlos
if needs_update:
    print(f"\n💾 Aplicando {len(needs_update)} actualizaciones...")
    
    for item in needs_update:
        enriched_by_id[item['id']]['seo_title'] = item['seo_title_mejorado']
        enriched_by_id[item['id']]['seo_description'] = item['seo_description_mejorado']
    
    with open(enriched_file, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(needs_update)} productos actualizados en {enriched_file}")
else:
    print("\n✅ Todos los cambios ya están aplicados en productos_enriquecido.json")
