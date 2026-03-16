#!/usr/bin/env python3
"""
Apply ID 880 - likely Gold Standard Whey 5lb
"""

import re
from pathlib import Path

producto_path = Path('./producto')

product_data = {
    "seo_title": "Gold Standard 100% Whey Protein Nutramerican 5 lb | Natural Be",
    "seo_description": "Gold Standard 100% Whey Protein Nutramerican 5 lb. Proteína Whey de máxima pureza para uso prolongado. Mejor valor. $724.000. Envío Colombia.",
}

# Try different filename candidates
candidates = [
    "gold-standard-100-whey-protein-5lb.html",
    "bipro-classic-vainilla-5-lb.html",
]

target_file = None
for candidate in candidates:
    path = producto_path / candidate
    if path.exists():
        target_file = path
        break

# Try glob search if not found
if not target_file:
    for html_file in producto_path.glob('*5*lb*.html'):
        if 'gold-standard' in html_file.name.lower() or 'bipro' in html_file.name.lower():
            target_file = html_file
            break

if not target_file:
    print("❌ ID 880: Could not find suitable 5lb file")
    print("Candidates checked:")
    for c in candidates:
        print(f"  - {c}")
else:
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update title
        content = re.sub(
            r'<title>[^<]+</title>',
            f'<title>{product_data["seo_title"]}</title>',
            content,
            count=1
        )
        
        # Update description
        content = re.sub(
            r'<meta name="description" content="[^"]*">',
            f'<meta name="description" content="{product_data["seo_description"]}">',
            content,
            count=1
        )
        
        if content != original:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ ID 880: {target_file.name}")
        else:
            print(f"⚠ ID 880: Already updated or no changes needed")
    
    except Exception as e:
        print(f"❌ ID 880: Error - {str(e)}")
