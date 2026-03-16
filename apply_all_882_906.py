#!/usr/bin/env python3
"""
Apply SEO improvements to ALL products (IDs 882-906)
"""

import json
import re
from pathlib import Path

# Load products mapping
with open('all_products_mapping_882_906.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

producto_path = Path('./producto')

# Manual mapping - deduced from product names/patterns
manual_mapping = {
    "882": "gold-standard-100-isolate-3-lb.html",
    "883": "gold-standard-100-isolate-5-lb.html",
    "884": "gold-standard-100-whey-protein-4-lb.html",
    "885": "gold-standard-100-whey-protein-5lb.html",
    "886": "gold-standard-100-whey-naturally-flavored-2-lb.html",
    "887": "gold-standard-100-whey-naturally-flavored-4-lb.html",
    "888": "platinum-hydrowhey.html",
    "889": "whey-gourmet-series-2-lb.html",
    "890": "elite-max-whey-pro-545-gr.html",
    "891": "essential-amin-o-energy-30-serv.html",
    "892": "essential-amin-o-energy-fruit-punch.html",
    "893": "essential-amin-o-energy-hydration-30-serv.html",
    "894": "pure-hydrolyzed-5-2-lb.html",
    "895": "iso-hidrolizada-vainilla-908gr.html",
    "896": "bcaa-192g-15-servings-fruit-punch-healthy-sports.html",
    "897": "batido-verde.html",
    "898": "fusion-vegan-protein-sin-soya.html",
    "899": "vegan-protein-blend-700-g.html",
    "900": "funat-plus-whey-protein-x-3-1-lb.html",
    "901": "whey-protein-hardcore-chocolate-2-lb.html",
    "902": "whey-protein-hardcore-5lb-vainilla-funat.html",
    "903": "gold-standard-100-casein.html",
    "904": "gluta-max-350-g.html",
    "905": "argi-max-350-g.html",
    "906": "max-power-1000-g-mix-de-frutas.html",
}

def find_file_by_keywords(product_id, product):
    """Try to find file by extracting keywords from title"""
    title = product.get('seo_title', '').lower()
    
    # Search for matching files by keywords
    keywords = []
    
    for keyword in ['isolate', 'whey', 'platinum', 'hydrowhey', 'gourmet', 'elite',
                    'amin-o', 'hydrolyzed', 'iso-hi', 'vegan', 'hardcore', 'casein',
                    'gluta', 'argi', 'power', 'max', 'funat', 'green', 'batido']:
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

print("Applying SEO improvements to products 882-906...\n")

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
        not_found.append(f"ID {product_id}: Error")

print(f"\n{'='*60}")
print(f"✅ New changes applied: {changes_applied}")
print(f"⚠️  Already updated: {already_updated}")
print(f"📊 Total processed: {changes_applied + already_updated}/25")

if not_found:
    print(f"\n❌ Not found ({len(not_found)}):")
    for item in not_found:
        print(f"  - {item}")
