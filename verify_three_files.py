#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica si los cambios de 3 archivos están aplicados en productos_enriquecido.json
"""

import json
from pathlib import Path
try:
    from docx import Document
    docx_available = True
except ImportError:
    docx_available = False

# Archivos a verificar
files_to_check = [
    'productos_11_mejorados.json',
    'productos_decimo_mejorados.json',
    'mejoras_seo_ids_855_881.docx'
]

# Cargar archivo principal
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

enriched_by_id = {str(p['id']): p for p in enriched}

print("🔍 Verificando cambios de 3 archivos...\n")

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
                # Asumir que es un dict con IDs como claves
                products = list(data.values()) if isinstance(data, dict) else []
        except Exception as e:
            print(f"   ❌ Error al leer JSON: {str(e)}\n")
            continue
    
    elif file_name.endswith('.docx'):
        if not docx_available:
            print(f"   ⚠️  python-docx no disponible, saltando archivo DOCX\n")
            continue
        
        try:
            doc = Document(file_path)
            print(f"   📋 Extrayendo data del DOCX...")
            
            # Buscar tabla
            for table in doc.tables:
                # Procesar filas de tabla
                for row in table.rows[1:]:  # Saltar encabezado
                    cells = [cell.text.strip() for cell in row.cells]
                    if len(cells) >= 2:
                        try:
                            product_id = cells[0].strip()
                            if product_id and product_id.replace(' ', '').isdigit():
                                products.append({
                                    'id': product_id.split()[0],  # Tomar solo el número
                                    'seo_title_mejorado': cells[1] if len(cells) > 1 else None,
                                    'seo_description_mejorado': cells[2] if len(cells) > 2 else None,
                                })
                        except:
                            pass
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
