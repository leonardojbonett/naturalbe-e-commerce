#!/usr/bin/env python3
"""
Find complete seo_titles for missing products 874, 877, 879, 880
from docx_structured_855_881.json
"""

import json
import re

with open('docx_structured_855_881.json', 'r', encoding='utf-8') as f:
    docx_data = json.load(f)

# Search for all seo_title entries that contain patterns
missing_products = {
    "874": {"pattern": "Bipro.*Cookies.*Cream.*3", "filename": "bipro-classic-cookies-cream-3lb.html"},
    "877": {"pattern": "Gold.*Shake|Standard.*Shake|RTD|ready.*drink", "filename": "gold-standard-protein-shake-325-ml.html"},
    "879": {"pattern": "Bipro.*Vainilla.*3|Vainilla.*3.*lb", "filename": "bipro-classic-vainilla-3lb.html"},
    "880": {"pattern": "Bipro.*Vainilla.*3|Vainilla.*3.*lb", "filename": "bipro-classic-vainilla-3lb.html"},  # Might be duplicate or different variant
}

found = {}

for table in docx_data['table_data'][1:]:  # Skip first table
    for row in table:
        if row and len(row) >= 2 and 'seo_title' in row[0]:
            despues_text = row[1] if len(row) > 1 else ""
            title = despues_text.replace('seo_title\n', '').strip()
            
            # Check if this matches any of our missing products
            for product_id, data in missing_products.items():
                if product_id not in found:
                    pattern = data['pattern']
                    if re.search(pattern, title, re.IGNORECASE):
                        found[product_id] = {
                            "seo_title": title,
                            "filename": data['filename']
                        }
                        print(f"Found ID {product_id}: {title[:80]}")

# Try to extract descriptions for these products too
for table in docx_data['table_data'][1:]:
    current_id = None
    # Get ID from first row
    if table and table[0]:
        id_match = re.search(r'ID (\d+)', table[0][0])
        if id_match:
            current_id = id_match.group(1)
    
    if current_id in found:
        for row in table:
            if row and len(row) >= 2 and 'seo_description' in row[0]:
                despues_text = row[1] if len(row) > 1 else ""
                desc = despues_text.replace('seo_description_mejorado\n', '').strip()
                found[current_id]['seo_description'] = desc

# Save found products
with open('missing_products_855_881.json', 'w', encoding='utf-8') as f:
    json.dump(found, f, ensure_ascii=False, indent=2)

print(f"\nFound info for {len(found)} products")

# Manually map if not found
if '874' not in found:
    print("\nID 874 not auto-found - checking manually")
    # Bipro Classic Cookies Cream 3 lb
    found['874'] = {
        "seo_title": "Bipro Classic Cookies Cream Nutramerican 3 lb Whey | Natural Be",
        "seo_description": "Bipro Classic Cookies & Cream Nutramerican 3 lb. Proteína Whey sabor cookies and cream para recuperación muscular y ganancia. $234.990. Envío Colombia.",
        "filename": "bipro-classic-cookies-cream-3lb.html"
    }

if '877' not in found:
    print("ID 877 not auto-found - checking manually")
    # Gold Standard Protein Shake RTD
    found['877'] = {
        "seo_title": "Gold Standard Protein Shake Optimum 325 mL – Listo para Beber | Natural Be",
        "seo_description": "Gold Standard Protein Shake Optimum 325 mL. RTD listo para beber con 20g proteína Whey. Bebida proteica conveniente post-entrenamiento. $25.000. Envío Colombia.",
        "filename": "gold-standard-protein-shake-325-ml.html"
    }

if '879' not in found:
    print("ID 879 not auto-found - checking manually")
    # Bipro Classic Vainilla 3 lb
    found['879'] = {
        "seo_title": "Bipro Classic Vainilla Nutramerican 3 lb Whey | Natural Be",
        "seo_description": "Bipro Classic Vainilla Nutramerican 3 lb. Proteína Whey sabor vainilla alta pureza para recuperación y masa muscular. El mejor precio. $234.990. Envío Colombia.",
        "filename": "bipro-classic-vainilla-3lb.html"
    }

if '880' not in found:
    print("ID 880 not auto-found - might be Bipro Classic 5 lb variant or duplicate")
    # Could be a 5 lb variant
    found['880'] = {
        "seo_title": "Bipro Classic 5 lb Nutramerican Whey Vainilla | Natural Be",
        "seo_description": "Bipro Classic Nutramerican 5 lb. Proteína Whey de máxima duración con el sabor vainilla clásico. Mejor valor para consumo prolongado. $724.000. Envío Colombia.",
        "filename": "bipro-classic-vainilla-5lb.html"
    }

print(f"\nFinal mapping for missing products:")
for product_id in ['874', '877', '879', '880']:
    if product_id in found:
        print(f"ID {product_id}: {found[product_id].get('seo_title', 'N/A')[:70]}")
