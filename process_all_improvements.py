#!/usr/bin/env python3
"""
Complete SEO improvement processor for all Funat products (IDs 824-854)
Extracts data from docx_structured.json and applies to HTML files
"""

import json
import re
from pathlib import Path

# Map producto filenames from HTML files 
file_mapping = {
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
}

# Load the structured DOCX data
with open('docx_structured.json', 'r', encoding='utf-8') as f:
    docx_data = json.load(f)

def extract_field_from_table(table_data, field_name):
    """Extract ANTES and DESPUÉS for a field from table data"""
    for i, row in enumerate(table_data):
        if row and row[0] and field_name in row[0]:
            # This is the field row
            if i + 1 < len(table_data):
                next_row = table_data[i + 1]
                if len(next_row) >= 2:
                    antes = row[0].replace(f'{field_name}\n', '').strip() if len(row) > 0 else ''
                    if '\n' in antes:
                        antes = antes.split('\n')[-1]
                    despues = row[1].replace(f'{field_name}\n', '').strip() if len(row) > 1 else ''
                    if '\n' in despues:
                        despues = despues.split('\n')[-1]
                    return {'antes': antes, 'despues': despues}
    return None

def parse_table(table_data):
    """Parse a single product table"""
    product = {}
    
    for row in table_data:
        if not row or not row[0]:
            continue
        
        cell = row[0]
        
        if 'seo_title\n' in cell:
            despues = row[1] if len(row) > 1 else ''
            if 'seo_title\n' in despues:
                despues = despues.replace('seo_title\n', '').strip()
            product['seo_title'] = despues
        
        elif 'seo_description' in cell:
            despues = row[1] if len(row) > 1 else ''
            if 'mejorado\n' in despues:
                despues = despues.split('mejorado\n')[-1].strip()
            product['seo_description'] = despues
        
        elif 'beneficios_bullet' in cell and 'DESPUÉS' in row[0]:
            despues_text = row[1] if len(row) > 1 else ''
            # Parse bullets
            bullets = []
            for line in despues_text.split('\n'):
                if line.strip() and not line.strip().startswith('beneficios'):
                    bullets.append(line.strip())
            if bullets:
                product['bullets'] = bullets
    
    return product

def find_best_match_file(product_id, filename):
    """Find the actual filename"""
    base_path = Path('./producto')
    
    # Try exact match first
    if filename and (base_path / filename).exists():
        return base_path / filename
    
    # Try alternative patterns
    alt_patterns = [
        filename.replace('.html', ''),
        filename.lower(),
        filename.replace('-', '').lower(),
    ]
    
    for pattern in alt_patterns:
        for file in base_path.glob('*.html'):
            if pattern in file.name.lower():
                return file
    
    return None

# Process all tables
print("Processing DOCX...")
products_processed = 0

for table_idx, table in enumerate(docx_data['table_data'][1:], 1):  # Skip first table (issues table)
    if table_idx > len(file_mapping):
        break
    
    product_id = str(823 + table_idx)  # 824-854
    
    product_data = parse_table(table)
    
    if not product_data or 'seo_title' not in product_data:
        print(f"⚠ ID {product_id}: Could not parse table")
        continue
    
    # Find the file
    filename = file_mapping.get(product_id)
    product_path = find_best_match_file(product_id, filename)
    
    if not product_path:
        print(f"❌ ID {product_id}: File not found (looking for: {filename})")
        continue
    
    try:
        with open(product_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update SEO title in <title> tag
        if 'seo_title' in product_data:
            content = re.sub(
                r'<title>[^<]+</title>',
                f'<title>{product_data["seo_title"]}</title>',
                content,
                count=1
            )
        
        # Update meta description
        if 'seo_description' in product_data:
            content = re.sub(
                r'<meta name="description" content="[^"]+">',
                f'<meta name="description" content="{product_data["seo_description"]}">',
                content,
                count=1
            )
        
        if content != original:
            with open(product_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ ID {product_id}: {product_path.name}")
            products_processed += 1
        else:
            print(f"⚠ ID {product_id}: No changes needed or file format different")
    
    except Exception as e:
        print(f"❌ ID {product_id}: Error - {str(e)}")

print(f"\n✅ Successfully processed {products_processed} products")
