#!/usr/bin/env python3
"""
Apply all SEO improvements from all_products_mapping.json to producto/*.html files
"""

import json
import re
from pathlib import Path

# Load products mapping
with open('all_products_mapping.json', 'r', encoding='utf-8') as f:
    all_products = json.load(f)

producto_path = Path('./producto')

# Manual mapping for products that might be hard to find
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
    "838": None,  # Will search by keywords
    "839": None,
    "840": "alcachofa-compuesta-100-capsulas.html",
    "841": "antax-360-ml.html",
    "842": None,
    "843": None,
    "844": None,
    "845": None,
    "846": None,
    "847": None,
    "848": None,
    "849": None,
    "850": None,
    "851": None,
    "852": None,
    "853": None,
    "854": None,
}

def find_file_by_title(product):
    """Try to find file by extracting key words from title"""
    title = product.get('seo_title', '').lower()
    
    # Extract key words
    keywords = []
    
    # Common patterns
    if 'panax ginseng' in title or 'ginseng' in title:
        keywords.extend(['ginseng', 'panax'])
    if 'valeriana' in title:
        keywords.append('valeriana')
    if 'pasiflora' in title or 'passif' in title:
        keywords.extend(['pasiflora', 'passif', 'passiflora'])
    if 'purveg' in title:
        keywords.append('purveg')
    if 'antax' in title:
        keywords.append('antax')
    if 'artritend' in title:
        keywords.append('artritend')
    if 'alcachofa' in title:
        keywords.append('alcachofa')
    if 'urifín' in title or 'urifin' in title or 'vira' in title:
        keywords.extend(['urifin', 'vira'])
    if 'bronquinat' in title:
        keywords.append('bronquinat')
    if 'sangre de drago' in title or 'sangre drago' in title:
        keywords.extend(['sangre', 'drago'])
    if 'caléndula' in title or 'calendula' in title:
        keywords.extend(['calendula', 'caléndula'])
    
    # Search for matching files
    for keyword in keywords:
        for html_file in producto_path.glob('*.html'):
            if keyword in html_file.name.lower():
                return html_file
    
    return None

changes_applied = 0
not_found = []

print("Applying SEO improvements...\n")

for product_id in sorted(all_products.keys()):
    product = all_products[product_id]
    
    # Find the file
    target_file = None
    
    if product_id in manual_mapping and manual_mapping[product_id]:
        candidate = producto_path / manual_mapping[product_id]
        if candidate.exists():
            target_file = candidate
    
    if not target_file:
        target_file = find_file_by_title(product)
    
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
            print(f"⚠ ID {product_id} ({target_file.name}): Already updated or no changes needed")
    
    except Exception as e:
        print(f"❌ ID {product_id}: Error - {str(e)[:50]}")

print(f"\n✅ Applied changes to {changes_applied} products\n")

if not_found:
    print(f"⚠️  {len(not_found)} products not found:")
    for item in not_found:
        print(f"  - {item}")
