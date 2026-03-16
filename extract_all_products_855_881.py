#!/usr/bin/env python3
"""
Extract all product improvements from docx_structured_855_881.json
for IDs 855-881
"""

import json
import re

# Load structured DOCX data
with open('docx_structured_855_881.json', 'r', encoding='utf-8') as f:
    docx_data = json.load(f)

# Initialize products dict
all_products = {}

# Process each table (skip first which is the legend/issues)
for table_idx, table in enumerate(docx_data['table_data'][1:], start=855):
    
    product_id = str(table_idx)
    
    # Extract ID from first row
    if table and table[0]:
        id_match = re.search(r'ID (\d+)', table[0][0])
        if id_match:
            product_id = id_match.group(1)
        else:
            continue
    
    product = {'id': product_id}
    
    # Parse each row
    for row_idx, row in enumerate(table):
        if not row or len(row) < 2:
            continue
        
        antes_cell = row[0]
        despues_cell = row[1] if len(row) > 1 else ""
        
        # Extract seo_title
        if 'seo_title' in antes_cell:
            title = despues_cell.replace('seo_title\n', '').strip()
            product['seo_title'] = title
        
        # Extract seo_description
        elif 'seo_description' in antes_cell:
            desc = despues_cell.replace('seo_description_mejorado\n', '').strip()
            product['seo_description'] = desc
        
        # Extract beneficios_bullet AFTER
        elif 'beneficios_bullet' in antes_cell and 'DESPUÉS' in antes_cell:
            bullets_text = despues_cell
            bullets = [b.strip() for b in bullets_text.split('\n') if b.strip() and not b.strip().startswith('beneficios')]
            if bullets:
                product['beneficios'] = bullets
        
        # Extract tags AFTER  
        elif 'tags' in antes_cell and 'DESPUÉS' in antes_cell:
            tags_text = despues_cell.replace('tags (DESPUÉS)\n', '')
            # Clean tags
            tags = re.findall(r'"([^"]+)"', tags_text)
            if tags:
                product['tags'] = tags
    
    if 'seo_title' in product and 'seo_description' in product:
        all_products[product_id] = product

# Save to JSON
with open('all_products_mapping_855_881.json', 'w', encoding='utf-8') as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

print(f"Extracted data for {len(all_products)} products (855-881)")
print("\nProduct IDs extracted:")
print(", ".join(sorted(all_products.keys())))

# Show sample
if all_products:
    first_id = sorted(all_products.keys())[0]
    print(f"\nSample (ID {first_id}):")
    print(json.dumps(all_products[first_id], ensure_ascii=False, indent=2)[:300])
