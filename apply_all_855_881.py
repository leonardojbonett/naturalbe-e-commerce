#!/usr/bin/env python3
"""
Apply SEO improvements to ALL products (IDs 855-881)
Complete mapping with file search
"""

import json
import re
from pathlib import Path

# Load products mapping
with open('all_products_mapping_855_881.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

producto_path = Path('./producto')

# Manual mapping for products that we can identify
manual_mapping = {
    "855": "glucomanat.html",
    "856": "xero-ft.html",
    "857": "beephy-protein-936g-26-servings-vainilla-healthy-sports.html",
    "858": "bcaa-750mg-120-softgels.html",
    "859": "serious-mass-3-lb.html",
    "860": "serious-mass-6-lb.html",
    "861": "creatine-40-serv.html",
    "862": "creatine-powder-120-serv.html",
    "863": "creatine-monohydrate-120-capsulas-healthy-sports.html",
    "864": "bcaa-evolution.html",
    "865": "bcaa-matrix-silk-amino-3000mg-90-caplets-healthy-sports.html",
    "866": "beta-alanina-3200mg-120-capsulas-healthy-sports.html",
    "867": "l-glutamina-6000mg-240g-40-servings-healthy-sports.html",
    "868": "l-glutamina-6000mg-360g-60-servings-healthy-sports.html",
    "869": "ultimate-bcaas-90-capsulas-30-servings-healthy-sports.html",
    "870": "creatina-micronizada-monohidratada-150g-50-servings-healthy-sports.html",
    "871": "creatina-micronizada-monohidratada-300g-healthy-sports.html",
    "872": "hmb-plus-bcaas-120-capsulas-healthy-sports.html",
    "873": "l-glutamine-3000mg-120-capsulas-healthy-sports.html",
    "874": "absolute-bcaa-192g-15-servings-fruit-punch-healthy-sports.html",
    "875": "bcaa-384g-30-servings-fruit-punch-healthy-sports.html",
}

def find_file_by_keywords(product_id, product):
    """Try to find file by extracting keywords from title"""
    title = product.get('seo_title', '').lower()
    
    # Search for matching files by keywords
    keywords = []
    
    # Extract product names
    for keyword in ['glucomanat', 'bcaa', 'beta-alanina', 'creatina', 'creatine', 
                    'l-glutamin', 'serious-mass', 'beephy', 'protein', 'whey',
                    'hmb', 'xero']:
        if keyword in title:
            keywords.append(keyword)
    
    # Search for matching files
    for keyword in keywords:
        for html_file in producto_path.glob('*.html'):
            if keyword in html_file.name.lower():
                return html_file
    
    return None

changes_applied = 0
already_updated = 0
not_found = []

print("Applying SEO improvements to products 855-881...\n")

for product_id in sorted(all_products.keys()):
    product = all_products[product_id]
    
    # Get filename from mapping
    filename = manual_mapping.get(product_id)
    target_file = None
    
    if filename:
        candidate = producto_path / filename
        if candidate.exists():
            target_file = candidate
    
    # Try to find file by keywords if mapping didn't work
    if not target_file:
        target_file = find_file_by_keywords(product_id, product)
    
    if not target_file:
        not_found.append(f"ID {product_id}: {product.get('seo_title', 'N/A')[:60]}")
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
        not_found.append(f"ID {product_id}: Error - {str(e)}")

print(f"\n{'='*60}")
print(f"✅ New changes applied: {changes_applied}")
print(f"⚠️  Already updated: {already_updated}")
print(f"📊 Total processed: {changes_applied + already_updated}/27")

if not_found:
    print(f"\n❌ Not found ({len(not_found)}):")
    for item in not_found[:10]:  # Show first 10
        print(f"  - {item}")
    if len(not_found) > 10:
        print(f"  ... and {len(not_found) - 10} more")
