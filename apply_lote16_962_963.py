#!/usr/bin/env python3
"""
Apply SEO improvements from productos_corregidos_lote16_IDs962-963.json
"""

import json
import re
from pathlib import Path

# Load JSON data
with open('productos_corregidos_lote16_IDs962-963.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

producto_path = Path('./producto')

print(f"Processing {len(products)} products from JSON (IDs 962-963)...\n")

changes_applied = 0
already_updated = 0
not_found = []

for product in products:
    product_id = product.get('id', 'N/A')
    slug = product.get('slug', '')
    seo_title = product.get('seo_title_mejorado') or product.get('seo_title', '')
    seo_description = product.get('seo_description_mejorado') or product.get('seo_description', '')
    
    if not slug or not seo_title:
        continue
    
    # Build filename from slug
    filename = f"{slug}.html"
    target_file = producto_path / filename
    
    if not target_file.exists():
        not_found.append(f"ID {product_id}: {filename}")
        continue
    
    try:
        # Read file
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update title
        if seo_title:
            content = re.sub(
                r'<title>[^<]+</title>',
                f'<title>{seo_title}</title>',
                content,
                count=1
            )
        
        # Update description
        if seo_description:
            content = re.sub(
                r'<meta name="description" content="[^"]*">',
                f'<meta name="description" content="{seo_description}">',
                content,
                count=1
            )
        
        # Write if changed
        if content != original:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ ID {product_id}: {filename}")
            changes_applied += 1
        else:
            print(f"⚠ ID {product_id}: Already updated")
            already_updated += 1
    
    except Exception as e:
        print(f"❌ ID {product_id}: {str(e)[:40]}")
        not_found.append(f"ID {product_id}: Error")

print(f"\n{'='*60}")
print(f"✅ New changes applied: {changes_applied}")
print(f"⚠️  Already updated: {already_updated}")
print(f"📊 Total processed: {changes_applied + already_updated}/{len(products)}")

if not_found:
    print(f"\n❌ Not found ({len(not_found)}):")
    for item in not_found:
        print(f"  - {item}")
