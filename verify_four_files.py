#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica si los cambios de 4 archivos están aplicados en productos_enriquecido.json
Incluye extracción de DOCX
"""

import json
from pathlib import Path
from docx import Document
import re

# Archivos a verificar
files_to_check = [
    'productos_corregidos_lote15_IDs932-961.json',
    'productos_corregidos_lote14_IDs907-931.json',
    'mejoras_seo_ids_882_906.docx',
    'productos_corregidos_lote16_IDs962-963.json'
]

# Cargar archivo principal
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando cambios de 4 archivos...\n")

total_already_updated = 0
total_needs_update = 0
all_needs_update = []

for file_name in files_to_check:
    file_path = Path(file_name)
    
    if not file_path.exists():
        print(f"❌ {file_name} - NO ENCONTRADO\n")
        continue
    
    print(f"📄 Verificando: {file_name}")
    print("-" * 70)
    
    products = []
    
    # Procesar según formato
    if file_name.endswith('.json'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                products = data
            elif isinstance(data, dict) and 'productos' in data:
                products = data['productos']
            else:
                products = list(data.values()) if isinstance(data, dict) else []
        except Exception as e:
            print(f"   ❌ Error al leer JSON: {str(e)}\n")
            continue
    
    elif file_name.endswith('.docx'):
        try:
            doc = Document(file_path)
            print(f"   📋 Extrayendo data del DOCX...")
            
            # Procesar tablas (similar a mejoras_seo_ids_855_881.docx)
            for table in doc.tables[1:]:  # Saltar tabla de encabezado
                header_text = table.rows[0].cells[0].text.strip()
                
                # Extraer ID del encabezado
                id_match = re.search(r'ID\s+(\d+)', header_text)
                if not id_match:
                    continue
                
                product_id = id_match.group(1)
                
                # Fila 2: seo_title (columna 1 - DESPUÉS)
                seo_title_mejorado = None
                if len(table.rows) > 2 and len(table.rows[2].cells) > 1:
                    seo_title_cell = table.rows[2].cells[1].text.strip()
                    seo_title_mejorado = seo_title_cell.replace('seo_title', '').strip()
                
                # Fila 3: seo_description_mejorado (columna 1 - DESPUÉS)
                seo_description_mejorado = None
                if len(table.rows) > 3 and len(table.rows[3].cells) > 1:
                    seo_desc_cell = table.rows[3].cells[1].text.strip()
                    seo_description_mejorado = seo_desc_cell.replace('seo_description_mejorado', '').strip()
                
                products.append({
                    'id': product_id,
                    'seo_title_mejorado': seo_title_mejorado,
                    'seo_description_mejorado': seo_description_mejorado
                })
            
            print(f"   ✅ Extracción exitosa: {len(products)} productos")
        except Exception as e:
            print(f"   ❌ Error al procesar DOCX: {str(e)}\n")
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
                all_needs_update.append({
                    'id': product_id,
                    'nombre': product.get('nombre', 'N/A'),
                    'seo_title_mejorado': seo_title_mejorado,
                    'seo_description_mejorado': seo_description_mejorado
                })
    
    total_already_updated += already_updated
    total_needs_update += needs_update
    
    print(f"   ✅ Ya actualizados: {already_updated}")
    if needs_update > 0:
        print(f"   ❌ Requieren actualización: {needs_update}")
    elif products:
        print(f"   Total verificado: {len(products)}")
    print()

print("\n" + "=" * 70)
print("📊 RESUMEN TOTAL:")
print(f"   ✅ Ya actualizados: {total_already_updated}")
print(f"   ❌ Requieren actualización: {total_needs_update}")

# Si hay cambios pendientes, aplicarlos
if all_needs_update:
    print(f"\n💾 Aplicando {len(all_needs_update)} actualizaciones...")
    
    for item in all_needs_update:
        if item['id'] in enriched_by_id:
            enriched_by_id[item['id']]['seo_title'] = item['seo_title_mejorado']
            enriched_by_id[item['id']]['seo_description'] = item['seo_description_mejorado']
    
    with open(enriched_file, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(all_needs_update)} productos actualizados en {enriched_file}")
else:
    print(f"\n✅ Todos los cambios ya están aplicados en productos_enriquecido.json")
