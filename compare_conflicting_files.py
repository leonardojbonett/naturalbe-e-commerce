#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara los cambios entre productos_mejorados.json y productos_corregidos_lote8_IDs735-765.json
"""

import json

# Cargar ambos archivos
with open('productos_mejorados.json', 'r', encoding='utf-8') as f:
    mejorados = json.load(f)

with open('productos_corregidos_lote8_IDs735-765.json', 'r', encoding='utf-8') as f:
    lote8 = json.load(f)

# Crear índices
mejorados_by_id = {str(p['id']): p for p in mejorados}
lote8_by_id = {str(p['id']): p for p in lote8}

print("🔍 Comparando archivos para IDs 735-765...\n")

conflicts = []

for product_id in lote8_by_id.keys():
    if product_id in mejorados_by_id:
        m_title = mejorados_by_id[product_id].get('seo_title_mejorado')
        m_desc = mejorados_by_id[product_id].get('seo_description_mejorado')
        
        l_title = lote8_by_id[product_id].get('seo_title_mejorado')
        l_desc = lote8_by_id[product_id].get('seo_description_mejorado')
        
        if m_title != l_title or m_desc != l_desc:
            conflicts.append(product_id)
            print(f"❌ ID {product_id}: DIFERENCIAS ENCONTRADAS")
            if m_title != l_title:
                m_t = str(m_title)[:50] if m_title else "None"
                l_t = str(l_title)[:50] if l_title else "None"
                print(f"   Título mejorados: {m_t}...")
                print(f"   Título lote8:     {l_t}...")
            if m_desc != l_desc:
                m_d = str(m_desc)[:80] if m_desc else "None"
                l_d = str(l_desc)[:80] if l_desc else "None"
                print(f"   Desc mejorados: {m_d}...")
                print(f"   Desc lote8:     {l_d}...")
            print()

print(f"\n📊 RESUMEN:")
print(f"   IDs con conflictos: {len(conflicts)}")
print(f"   IDs sin conflictos: {len(lote8_by_id) - len(conflicts)}")

if conflicts:
    print(f"\n⚠️  Recomendación: Decidir cuál fuente es la correcta para IDs {conflicts[0]}-{conflicts[-1]}")
    print(f"   Opción A: Usar 'productos_mejorados.json'")
    print(f"   Opción B: Usar 'productos_corregidos_lote8_IDs735-765.json'")
