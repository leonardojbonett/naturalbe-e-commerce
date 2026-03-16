#!/usr/bin/env python3
"""
Apply SEO improvements to ALL 31 Funat products (IDs 824-854)
Complete mapping with all found files
"""

import json
import re
from pathlib import Path

# Load products mapping
with open('all_products_mapping.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

producto_path = Path('./producto')

# Complete manual mapping for all 31 products
manual_mapping = {
    "824": "revitalnat-panax-ginseng-100-tabletas.html",
    "825": "valeriana-extracto-60ml.html",
    "826": "extracto-de-passiflora-60-ml.html",
    "827": "purveg-sachet-13-g.html",
    "828": "antax-calendula-masticable-10-tabletas.html",
    "829": "artritend-harpagofito-30-capsulas-blandas.html",
    "830": "alcachofa-extracto-60-ml.html",
    "831": "alcachofa-100-tabletas.html",
    "832": "urifin-vira-vira-extracto-60-ml.html",
    "833": "bronquinat-totumo-sin-azucar-240-ml.html",
    "834": "extracto-sangre-de-drago-60-ml.html",
    "835": "extracto-de-calendula-60-ml.html",
    "836": "antaxbid-240-ml.html",
    "837": "antax-170-ml.html",
    "838": "hepanat-silimarina-30-softgels.html",
    "839": "castano-de-indias-80-capsulas.html",
    "840": "alcachofa-compuesta-100-capsulas.html",
    "841": "antax-360-ml.html",
    "842": "fibrafrut-200-g.html",
    "843": "imuprobiotics.html",
    "844": "carnitrim-60-tabletas.html",
    "845": "macasource.html",
    "846": "vitasource-x-60caps.html",
    "847": "vitamina-d-magnesio-x60-caps.html",
    "848": "vitamina-e-1000-selenio-x-60-cap.html",
    "849": "colaming-caja-x-12-blister.html",
    "850": "colaming-blister-x-10-tabletas.html",
    "851": "colagmin-60-tabletas.html",
    "852": "biotina-900-mcg-d-pantenol-60-softgels.html",
    "853": "lecitina-de-soya-100-softgels.html",
    "854": "lecitina-de-soya-1200mg-100-softgels.html",  # Assuming this is the other variant
}

changes_applied = 0
already_updated = 0
errors = []

print("Applying SEO improvements to all 31 products...\n")

for product_id in sorted(all_products.keys()):
    product = all_products[product_id]
    
    # Get filename from mapping
    filename = manual_mapping.get(product_id)
    if not filename:
        print(f"❌ ID {product_id}: No filename mapping found")
        continue
    
    target_file = producto_path / filename
    
    if not target_file.exists():
        print(f"❌ ID {product_id}: File not found - {filename}")
        errors.append(f"ID {product_id}: {filename}")
        continue
    
    try:
        # Read file
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update title
        seo_title = product.get('seo_title', '')
        if seo_title:
            content = re.sub(
                r'<title>[^<]+</title>',
                f'<title>{seo_title}</title>',
                content,
                count=1
            )
        
        # Update description
        seo_desc = product.get('seo_description', '')
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
            print(f"⚠ ID {product_id}: Already updated")
            already_updated += 1
    
    except Exception as e:
        print(f"❌ ID {product_id}: {str(e)[:40]}")
        errors.append(f"ID {product_id}: {str(e)}")

print(f"\n{'='*60}")
print(f"✅ New changes applied: {changes_applied}")
print(f"⚠️  Already updated: {already_updated}")
print(f"📊 Total processed: {changes_applied + already_updated}/31")

if errors:
    print(f"\n❌ Errors ({len(errors)}):")
    for error in errors:
        print(f"  - {error}")
