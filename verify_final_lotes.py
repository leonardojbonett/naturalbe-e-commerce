#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica si los cambios de múltiples lotes están aplicados en productos_enriquecido.json
"""

import json
from pathlib import Path

# Archivos a verificar
files_to_check = [
    'productos_noveno_mejorados.json',
    'productos_mejorados.json',
    'productos_corregidos_lote8_IDs735-765.json'
]

# Cargar el archivo principal
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

# Crear índice por ID
enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando cambios de múltiples lotes...\n")

total_already_updated = 0
total_needs_update = 0
total_not_found = 0
all_needs_update = []

for file_name in files_to_check:
    file_path = Path(file_name)
    
    if not file_path.exists():
        print(f"❌ Archivo no encontrado: {file_name}\n")
        continue
    
    print(f"📄 Verificando: {file_name}")
    print("-" * 70)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        corrected = json.load(f)
    
    # Manejar diferentes formatos
    if isinstance(corrected, dict) and 'productos' in corrected:
        products = corrected['productos']
    elif isinstance(corrected, list):
        products = corrected
    else:
        print(f"❌ Formato desconocido en {file_name}\n")
        continue
    
    already_updated = []
    needs_update = []
    not_found = []
    
    for product in products:
        product_id = str(product.get('id'))
        seo_title_mejorado = product.get('seo_title_mejorado')
        seo_description_mejorado = product.get('seo_description_mejorado')
        
        if product_id in enriched_by_id:
            enriched_product = enriched_by_id[product_id]
            
            title_match = enriched_product.get('seo_title') == seo_title_mejorado
            desc_match = enriched_product.get('seo_description') == seo_description_mejorado
            
            if title_match and desc_match:
                already_updated.append(product_id)
            else:
                needs_update.append({
                    'id': product_id,
                    'nombre': product.get('nombre', 'N/A'),
                    'seo_title_mejorado': seo_title_mejorado,
                    'seo_description_mejorado': seo_description_mejorado
                })
                all_needs_update.append({
                    'id': product_id,
                    'nombre': product.get('nombre', 'N/A'),
                    'seo_title_mejorado': seo_title_mejorado,
                    'seo_description_mejorado': seo_description_mejorado
                })
        else:
            not_found.append(product_id)
    
    total_already_updated += len(already_updated)
    total_needs_update += len(needs_update)
    total_not_found += len(not_found)
    
    print(f"   ✅ Ya actualizados: {len(already_updated)}")
    print(f"   ❌ Requieren actualización: {len(needs_update)}")
    print(f"   ⚠️  No encontrados: {len(not_found)}")
    print()

print("\n" + "=" * 70)
print("📊 RESUMEN TOTAL:")
print(f"   ✅ Ya actualizados: {total_already_updated}")
print(f"   ❌ Requieren actualización: {total_needs_update}")
print(f"   ⚠️  No encontrados: {total_not_found}")

# Si hay cambios pendientes, aplicarlos
if all_needs_update:
    print(f"\n💾 Aplicando {len(all_needs_update)} actualizaciones...")
    
    for item in all_needs_update:
        enriched_by_id[item['id']]['seo_title'] = item['seo_title_mejorado']
        enriched_by_id[item['id']]['seo_description'] = item['seo_description_mejorado']
    
    with open(enriched_file, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(all_needs_update)} productos actualizados en {enriched_file}")
else:
    print(f"\n✅ Todos los cambios ya están aplicados en productos_enriquecido.json")
