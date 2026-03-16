#!/usr/bin/env python3
"""
Apply remaining SEO improvements for products 874, 877, 879, 880 (855-881)
"""

import json
import re
from pathlib import Path

producto_path = Path('./producto')

# Manually curated mapping for the 4 missing products
missing_improvements = {
    "874": {
        "filename": "bipro-classic-cookies-cream-3lb.html",
        "seo_title": "Bipro Classic Cookies & Cream Nutramerican 3 lb Whey | Natural Be",
        "seo_description": "Bipro Classic Cookies & Cream Nutramerican 3 lb. Proteína Whey sabor cookies and cream para recuperación muscular y ganancia. $234.990. Envío Colombia."
    },
    "877": {
        "filename": "gold-standard-protein-shake-325-ml.html",
        "seo_title": "Gold Standard Protein Shake ON 325 ml – Listo para Tomar | Natural Be",
        "seo_description": "Gold Standard Protein Shake Optimum 325 mL. RTD listo para beber con 20g proteína Whey. Bebida proteica conveniente post-entrenamiento. $25.000. Envío Colombia."
    },
    "879": {
        "filename": "bipro-classic-vainilla-3lb.html",
        "seo_title": "Bipro Classic Vainilla Nutramerican 3 lb – Mejor Precio/Kg | Natural Be",
        "seo_description": "Bipro Classic Vainilla Nutramerican 3 lb. Proteína Whey sabor vainilla de máxima pureza con el mejor precio por kilogramo. $234.990. Envío Colombia."
    },
    "880": {
        "filename": "bipro-classic-vainilla-5lb.html",
        "seo_title": "Bipro Classic Vainilla Nutramerican 5 lb Whey | Natural Be",
        "seo_description": "Bipro Classic Nutramerican 5 lb. Proteína Whey vainilla de alta pureza para uso prolongado con el mejor valor. Máxima duración. $724.000. Envío Colombia."
    }
}

changes_applied = 0
not_found = []

print("Applying remaining SEO improvements (874, 877, 879, 880)...\n")

for product_id, data in missing_improvements.items():
    filename = data['filename']
    target_file = producto_path / filename
    
    if not target_file.exists():
        # Try alternative search
        found = False
        for html_file in producto_path.glob('*.html'):
            if filename.replace('.html', '') in html_file.name.lower():
                target_file = html_file
                found = True
                break
        
        if not found:
            not_found.append(f"ID {product_id}: {filename}")
            print(f"❌ ID {product_id}: File not found - {filename}")
            continue
    
    try:
        # Read file
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update title
        seo_title = data.get('seo_title', '')
        if seo_title:
            content = re.sub(
                r'<title>[^<]+</title>',
                f'<title>{seo_title}</title>',
                content,
                count=1
            )
        
        # Update description
        seo_desc = data.get('seo_description', '')
        if seo_desc:
            content = re.sub(
                r'<meta name="description" content="[^"]*">',
                f'<meta name="description" content="{seo_desc}">',
                content,
                count=1
            )
        
        # Write if changed
        if content != original:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ ID {product_id}: {target_file.name}")
            changes_applied += 1
        else:
            print(f"⚠ ID {product_id}: No changes needed")
    
    except Exception as e:
        print(f"❌ ID {product_id}: Error - {str(e)[:40]}")
        not_found.append(f"ID {product_id}: {str(e)}")

print(f"\n{'='*60}")
print(f"✅ Changes applied to {changes_applied} missing products")

if not_found:
    print(f"\n❌ Not found ({len(not_found)}):")
    for item in not_found:
        print(f"  - {item}")
else:
    print("\n🎉 All 4 missing products updated successfully!")
