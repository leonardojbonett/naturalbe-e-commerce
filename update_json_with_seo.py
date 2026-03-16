#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Actualiza productos_enriquecido.json con los títulos y descripciones SEO mejorados
de los 6 lotes de optimización (IDs 824-963)
"""

import json
from pathlib import Path

# Archivos de origen con los mejoras
SOURCE_FILES = [
    'all_products_mapping.json',  # IDs 824-854
    'all_products_mapping_855_881.json',  # IDs 855-881
    'all_products_mapping_882_906.json',  # IDs 882-906
    'productos_corregidos_lote14_IDs907-931.json',  # IDs 907-931
    'productos_corregidos_lote15_IDs932-961.json',  # IDs 932-961
    'productos_corregidos_lote16_IDs962-963.json',  # IDs 962-963
]

# Cargar el archivo principal
enriched_file = Path('productos_enriquecido.json')
with open(enriched_file, 'r', encoding='utf-8') as f:
    enriched = json.load(f)

# Crear un índice por ID para acceso rápido
enriched_by_id = {str(p['id']): p for p in enriched}

print("📦 Cargando mejoras de SEO...")
updates_count = 0

# Procesar cada archivo de mejoras
for source_file in SOURCE_FILES:
    source_path = Path(source_file)
    
    if not source_path.exists():
        print(f"⚠️  Archivo no encontrado: {source_file}")
        continue
    
    print(f"\n📄 Procesando: {source_file}")
    
    with open(source_path, 'r', encoding='utf-8') as f:
        source_data = json.load(f)
    
    # Procesar según el formato del archivo
    if isinstance(source_data, dict) and 'productos' in source_data:
        # Formato: {"productos": [...]}
        products = source_data['productos']
        is_list = True
    elif isinstance(source_data, dict) and all(k.isdigit() for k in list(source_data.keys())[:10]):
        # Formato: {"824": {...}, "825": {...}, ...}
        products = source_data.values()
        is_list = False
    elif isinstance(source_data, list):
        # Formato: [...]
        products = source_data
        is_list = True
    else:
        # Intentar como diccionario por ID de todas formas
        if isinstance(source_data, dict):
            products = source_data.values()
            is_list = False
        else:
            print(f"❌ Formato desconocido en {source_file}")
            continue
    
    for product in products:
        if isinstance(product, dict):
            product_id = str(product.get('id'))
        else:
            continue
        
        if product_id in enriched_by_id:
            target = enriched_by_id[product_id]
            
            # Actualizar SEO title (buscar '_mejorado' o versión simple)
            if 'seo_title_mejorado' in product:
                target['seo_title'] = product['seo_title_mejorado']
                updates_count += 1
            elif 'seo_title' in product:
                target['seo_title'] = product['seo_title']
                updates_count += 1
            
            # Actualizar SEO description (buscar '_mejorado' o versión simple)
            if 'seo_description_mejorado' in product:
                target['seo_description'] = product['seo_description_mejorado']
            elif 'seo_description' in product:
                target['seo_description'] = product['seo_description']
        else:
            print(f"⚠️  ID {product_id} no encontrado en productos_enriquecido.json")

# Si no se encontraron actualizaciones con IDs, intentar con slugs
if updates_count == 0:
    print("\n🔄 Intentando actualizar por slug...")
    enriched_by_slug = {p['slug']: p for p in enriched}
    
    for source_file in SOURCE_FILES:
        source_path = Path(source_file)
        
        if not source_path.exists():
            continue
        
        with open(source_path, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
        
        if isinstance(source_data, dict) and 'productos' in source_data:
            products = source_data['productos']
        elif isinstance(source_data, list):
            products = source_data
        else:
            continue
        
        for product in products:
            slug = product.get('slug')
            
            if slug and slug in enriched_by_slug:
                target = enriched_by_slug[slug]
                
                if 'seo_title_mejorado' in product:
                    target['seo_title'] = product['seo_title_mejorado']
                    updates_count += 1
                
                if 'seo_description_mejorado' in product:
                    target['seo_description'] = product['seo_description_mejorado']

# Guardar el archivo actualizado
print(f"\n💾 Guardando {updates_count} actualizaciones...")
with open(enriched_file, 'w', encoding='utf-8') as f:
    json.dump(enriched, f, ensure_ascii=False, indent=2)

print(f"✅ Archivo actualizado: {enriched_file}")
print(f"📊 Total de productos actualizados: {updates_count}")
