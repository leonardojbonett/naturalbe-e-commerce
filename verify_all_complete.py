#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificación COMPLETA de todos los archivos de correcciones
contra productos_enriquecido.json
"""

import json
from pathlib import Path

# Lista de TODOS los archivos de correcciones
files_to_check = [
    'productos_corregidos_IDs_1-20.json',
    'productos_corregidos_lote2_IDs21_505-518_601-605 (1).json',
    'productos_corregidos_lote3_IDs606-627 (1).json',
    'productos_corregidos_lote4_IDs628-654.json',
    'productos_corregidos_lote5_IDs655-675.json',
    'productos_corregidos_lote6_IDs676-702.json',
    'productos_corregidos_lote7_IDs703-734.json',
    'productos_corregidos_lote8_IDs735-765.json',
    'productos_noveno_mejorados.json',
    'productos_mejorados.json'
]

# Cargar archivo principal
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

enriched_by_id = {str(p['id']): p for p in enriched}

print("=" * 80)
print("📋 VERIFICACIÓN COMPLETA DE TODAS LAS CORRECCIONES")
print("=" * 80)
print()

grand_total_updated = 0
grand_total_pending = 0
all_stats = []

for file_name in files_to_check:
    file_path = Path(file_name)
    
    if not file_path.exists():
        print(f"❌ {file_name}")
        print(f"   ❗ Archivo no encontrado\n")
        continue
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            corrected = json.load(f)
    except Exception as e:
        print(f"❌ {file_name}")
        print(f"   ❗ Error al leer: {str(e)}\n")
        continue
    
    # Manejar diferentes formatos
    if isinstance(corrected, dict) and 'productos' in corrected:
        products = corrected['productos']
    elif isinstance(corrected, list):
        products = corrected
    else:
        print(f"❌ {file_name}")
        print(f"   ❗ Formato desconocido\n")
        continue
    
    already_updated = 0
    needs_update = 0
    
    for product in products:
        product_id = str(product.get('id'))
        seo_title_mejorado = product.get('seo_title_mejorado')
        seo_description_mejorado = product.get('seo_description_mejorado')
        
        if product_id in enriched_by_id:
            enriched_product = enriched_by_id[product_id]
            
            title_match = enriched_product.get('seo_title') == seo_title_mejorado
            desc_match = enriched_product.get('seo_description') == seo_description_mejorado
            
            if title_match and desc_match:
                already_updated += 1
            else:
                needs_update += 1
    
    grand_total_updated += already_updated
    grand_total_pending += needs_update
    
    status = "✅" if needs_update == 0 else "⚠️"
    print(f"{status} {file_name}")
    print(f"   ✅ Actualizados: {already_updated}")
    if needs_update > 0:
        print(f"   ❌ Pendientes: {needs_update}")
    print()
    
    all_stats.append({
        'file': file_name,
        'total': already_updated + needs_update,
        'updated': already_updated,
        'pending': needs_update
    })

print("=" * 80)
print("📊 RESUMEN FINAL")
print("=" * 80)
total_files = len([s for s in all_stats if s['total'] > 0])
print(f"Archivos procesados: {total_files}")
print(f"Total productos verificados: {sum(s['total'] for s in all_stats)}")
print(f"Total actualizados: {grand_total_updated}")
print(f"Total pendientes: {grand_total_pending}")
print()

if grand_total_pending == 0:
    print("✅ ¡TODOS LOS CAMBIOS ESTÁN APLICADOS EN productos_enriquecido.json!")
else:
    print(f"⚠️  Quedan {grand_total_pending} productos por sincronizar")

print()
print("Detalles por archivo:")
print("-" * 80)
for stat in all_stats:
    if stat['total'] > 0:
        status = "✅" if stat['pending'] == 0 else "⚠️"
        print(f"{status} {stat['file']}: {stat['updated']}/{stat['total']}")
